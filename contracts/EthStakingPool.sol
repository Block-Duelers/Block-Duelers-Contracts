// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "./lib/SafeMath.sol";
import "./lib/IERC20.sol";
import "./lib/Context.sol";
import "./lib/ReentrancyGuard.sol";
import "./lib/Ownable.sol";

contract EthStakingPool is ReentrancyGuard, Context, Ownable {
  using SafeMath for uint256;

  constructor(address _rewardToken, address payable _feeAddress, uint256 _feeRate, uint256 _returnRate) {
    REWARD_TOKEN = IERC20(_rewardToken);
    feeAddress = _feeAddress;
    feeRate = _feeRate;
    returnRate = _returnRate;
    isFrozen = false;
  }

  IERC20 private REWARD_TOKEN;

  address payable private feeAddress;
  uint256 private feeRate;
  uint256 private returnRate;
  bool private isFrozen;
  uint256 private frozenTimestamp;

  uint256 public totalStaked = 0;

  mapping(address => uint256) private stakedBalance;
  mapping(address => uint256) public lastUpdateTime;
  mapping(address => uint256) public reward;

  event Staked(address indexed user, uint256 amount);
  event Unstake(address indexed user, uint256 amount);
  event Redeem(address indexed user, uint256 amount);

  modifier updateReward(address account) {
    if (account != address(0)) {
      reward[account] = earned(account);
      lastUpdateTime[account] = block.timestamp;
    }
    _;
  }

  function getFeeAddress() public view returns (address) {
    return feeAddress;
  }

  function setFeeAddress(address payable _feeAddress) public onlyOwner nonReentrant {
    feeAddress = _feeAddress;
  }

  function getFeeRate() public view returns (uint256) {
    return feeRate;
  }

  function setFeeRate(uint256 _feeRate) public onlyOwner nonReentrant {
    require(_feeRate > 1e3, "Fee rate too small");
    feeRate = _feeRate;
  }

  function getReturnRate()  public view returns(uint256) {
    return returnRate;
  }

  function setReturnRate(uint256 _returnRate) public onlyOwner nonReentrant {
    require(_returnRate > 1e3, "Return rate too small");
    returnRate = _returnRate;
  }

  function balanceOf(address account) public view returns (uint256) {
    return stakedBalance[account];
  }

  function manualUpdate(address account) public nonReentrant {
    if (account != address(0)) {
      reward[account] = earned(account);
      lastUpdateTime[account] = block.timestamp;
    }
  }

  function earned(address account) public view returns (uint256) {
    uint256 blockTime = block.timestamp;
    if (isFrozen) {
      blockTime = frozenTimestamp;
    }
    uint256 timeDiff = blockTime.sub(lastUpdateTime[account]);
    uint256 staked = balanceOf(account);
    uint256 earnedAmount = computeEarned(timeDiff, staked);

    return reward[account].add(earnedAmount);
  }
  function computeEarned(uint256 timeDiff, uint256 staked) private view returns(uint256) {
    return timeDiff.mul(1e18).div(86400).mul(staked).div(1e18).mul(returnRate).div(1e18);
  }

  function stake() public payable updateReward(_msgSender()) nonReentrant {
    uint256 amount = msg.value;
    require(amount >= 100, "Too small stake");
    require(!isFrozen, "Contract is frozen");
    uint256 fee = amount.mul(feeRate).div(1e18);
    uint256 stakeAmount = amount.sub(fee);
    stakedBalance[_msgSender()] = stakedBalance[_msgSender()].add(stakeAmount);
    totalStaked = totalStaked.add(stakeAmount);
    _safeTransfer(feeAddress, fee);
    emit Staked(_msgSender(), stakeAmount);
  }

  function withdraw(uint256 amount) public updateReward(_msgSender()) nonReentrant {
    require(amount > 0, "Cannot withdraw 0");
    require(amount <= balanceOf(_msgSender()), "Cannot withdraw more than balance");
    stakedBalance[_msgSender()] = stakedBalance[_msgSender()].sub(amount);
    totalStaked = totalStaked.sub(amount);
    _safeTransfer(_msgSender(), amount);
    emit Unstake(_msgSender(), amount);
  }

  function exit() external {
    withdraw(balanceOf(_msgSender()));
  }
    
  function redeem() public updateReward(_msgSender()) nonReentrant {
    require(reward[_msgSender()] > 0, "Nothing to redeem");
    uint256 amount = reward[_msgSender()];
    reward[_msgSender()] = 0;
    REWARD_TOKEN.mint(_msgSender(), amount);
    emit Redeem(_msgSender(), amount);
  }

  function _safeTransfer(address payable to, uint256 amount) internal {
    uint256 balance;
    balance = address(this).balance;
    if (amount > balance) {
        amount = balance;
    }
    Address.sendValue(to, amount);
  }
}