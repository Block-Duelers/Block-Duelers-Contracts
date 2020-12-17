pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../Interfaces/IToken.sol";

contract Token is ERC20("Block Duelers", "DUEL"), Ownable, ReentrancyGuard, AccessControl{
  using SafeMath for uint256;

  uint public  INITIAL_SUPPLY = 12000e18;

  address public duelersAddress;
  address public NFTAddress;

  constructor() public {
        duelersAddress = msg.sender;
        _mint(msg.sender, INITIAL_SUPPLY);
  }

  function setNFTAddress(address _address) public onlyOwner {
    NFTAddress = _address;
  }

  mapping(address => uint256) private duelersBalance;
  mapping(address => uint256) public lastUpdateTime;
  mapping(address => uint256) public points;

  event Staked(address indexed user, uint256 amount);
  event Withdrawn(address indexed user, uint256 amount);

  modifier updateReward(address account) {
    if (account != address(0)) {
      points[account] = earned(account);
      lastUpdateTime[account] = block.timestamp;
    }
    _;
  }

  function _balanceOf(address account) public view returns (uint256) {
    return duelersBalance[account];
  }

  /*
  The block.timestamp environment variable is used to determine a control flow decision. 
  Note that the values of variables like coinbase, gaslimit, block number and timestamp are predictable and can be manipulated by a malicious miner. 
  Also keep in mind that attackers know hashes of earlier blocks. 
  Don't use any of those environment variables as sources of randomness and be aware that use of these variables introduces a certain level of trust into miners.
  https://swcregistry.io/docs/SWC-116
  
  AUDITOR NOTE: It appers that intent of this function is to add incremental rewards over time.
    Thus this vulnerability is not relly applicable to this function.
  */
  function earned(address account) public view returns (uint256) {
    uint256 blockTime = block.timestamp;
    return points[account].add(blockTime.sub(lastUpdateTime[account]).mul(1e18).div(5760).mul(balanceOf(account).div(1e18)));
  }

  /*
  An external message call to an address specified by the caller is executed.
  Note that the callee account might contain arbitrary code and could re-enter any function within this contract. 
  Reentering the contract in an intermediate state may lead to unexpected behaviour. 
  Make sure that no state modifications are executed after this call and/or reentrancy guards are in place.
  https://swcregistry.io/docs/SWC-107
  
  AUDITOR NOTE: Fix implmented, and vulnerable code commented out.
  */
  function stake(uint256 amount) public updateReward(_msgSender()) nonReentrant {
    require(amount.add(balanceOf(_msgSender())) >= 2e18, "Cannot stake less than 2 DUELERS");
    require(amount.add(balanceOf(_msgSender())) <= 10e18, "Cannot stake more than 10 DUELERS");
    duelersBalance[_msgSender()] = duelersBalance[_msgSender()].add(amount);
    IERC20(duelersAddress).transferFrom(_msgSender(), address(this), amount);
    emit Staked(_msgSender(), amount);
  }

  function withdraw(uint256 amount) public updateReward(_msgSender()) nonReentrant {
    require(amount > 0, "Cannot withdraw 0");
    require(amount <= balanceOf(_msgSender()), "Cannot withdraw more than balance");
    IERC20(duelersAddress).transfer(_msgSender(), amount);
    duelersBalance[_msgSender()] = duelersBalance[_msgSender()].sub(amount);
    emit Withdrawn(_msgSender(), amount);
  }

  function exit() external {
    withdraw(balanceOf(_msgSender()));
  }

  mapping(uint256 => uint256) public redeemCost;
  
  function setRedeemCost(uint256 _id, uint256 _cost) public onlyOwner {
    redeemCost[_id] = _cost;
  }

    
  function redeem(uint256 _id) public updateReward(_msgSender()) nonReentrant {
    uint256 price = redeemCost[_id];
    require(price > 0, "Card not found");
    require(points[_msgSender()] >= price, "Not enough points to redeem");
    IToken(NFTAddress).mint(_msgSender(), _id, 1);
    points[_msgSender()] = points[_msgSender()].sub(price);
  }
}

