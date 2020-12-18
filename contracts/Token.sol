// SPDX-License-Identifier: MIT

pragma solidity ^0.6.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Interfaces/IToken.sol";

contract Token is ERC20("Block Duelers", "BDT"), Ownable, AccessControl{
    using SafeMath for uint256;

    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 private constant SETTER_ROLE = keccak256("SETTER_ROLE");

    uint public _totalSupply = 50000e18; //50,000

    //event Burn(address indexed from, uint256 value);
    //event Transfer(address indexed from, address indexed to, uint tokens);
    //event Mint(address indexed _address, uint _reward);

    mapping(address => uint256) private balances;

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "Caller is not a minter");
        _;
    }

    modifier onlySetter() {
        require(hasRole(SETTER_ROLE, _msgSender()), "Caller is not a setter");
        _;
    }

    constructor(
        //address _setter
    ) public {
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(SETTER_ROLE, msg.sender);
    
        _mint(msg.sender, _totalSupply);
    }

    function getMinterRole() external pure returns (bytes32) {
        return MINTER_ROLE;
    }

    function getSetterRole() external pure returns (bytes32) {
        return SETTER_ROLE;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyMinter {
        _burn(from, amount);
    }
}
