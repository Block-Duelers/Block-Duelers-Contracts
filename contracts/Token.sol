// SPDX-License-Identifier: MIT

pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Token is ERC20("Block Duelers", "BDT"), Ownable, AccessControl {
    using SafeMath for uint256;

    bytes32 private constant SETTER_ROLE = keccak256("SETTER_ROLE");

    uint256 public _totalSupply = 50000e18; //50,000

    modifier onlySetter() {
        require(hasRole(SETTER_ROLE, _msgSender()), "Caller is not a setter");
        _;
    }

    constructor() public {
        _setupRole(SETTER_ROLE, msg.sender);

        _mint(msg.sender, _totalSupply);
    }

    function getSetterRole() external pure returns (bytes32) {
        return SETTER_ROLE;
    }

    function getBalance(address account) public view {
        balanceOf(account);
    }

    function transferTo(address to, uint256 amount) public {
        transfer(to, amount);
    }
}