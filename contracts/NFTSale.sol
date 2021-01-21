// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "./lib/Context.sol";
import "./lib/SafeMath.sol";
import "./lib/Ownable.sol";
import "./lib/IERC20.sol";
import "./lib/IERC1155.sol";
import "./lib/ReentrancyGuard.sol";

contract NFTSale is Context, Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    constructor (address dcToken, address bdtToken, address nftToken, address _feeAddress, address _authAddress, uint256 _nftDCPrice, uint256 _nftBDTPrice, uint256 _dcBurnRate) {
        DC_TOKEN = IERC20(dcToken);
        BDT_TOKEN = IERC20(bdtToken);
        NFT_TOKEN = IERC1155(nftToken);
    
        feeAddress = _feeAddress;
        authAddress = _authAddress;

        nftDCPrice = _nftDCPrice;
        nftBDTPrice = _nftBDTPrice;
        setBurnRate(_dcBurnRate);
    }

    event Buy(uint256 indexed buyId, address account);

    uint256 public nftDCPrice;
    uint256 public nftBDTPrice;
    uint256 public dcBurnRate;
    address public feeAddress;
    address public authAddress;
    IERC20 private DC_TOKEN;
    IERC20 private BDT_TOKEN;
    IERC1155 private NFT_TOKEN;


    uint256 public totalBought;
    mapping(uint256 => address) public sales;
    mapping(address => uint256[]) public pendingPurchases;

    function buyNFT(uint256 amount) public nonReentrant {
        require(amount > 0, "Must select an amount of tokens");
        for (uint256 i = 1; i <= amount; i++) {
            sales[totalBought.add(i)] = _msgSender();
            pendingPurchases[_msgSender()].push(totalBought.add(i));
            emit Buy(totalBought.add(i), _msgSender());
        }
        totalBought = totalBought.add(amount);
        uint256 costBDT = nftBDTPrice.mul(amount).mul(1e18);
        uint256 costDC = nftDCPrice.mul(amount).mul(1e18);
        uint256 dcBurned = costDC.mul(dcBurnRate).div(1e2);
        uint256 dcFee = costDC.sub(dcBurned);
        BDT_TOKEN.transferFrom(_msgSender(), feeAddress, costBDT);
        DC_TOKEN.transferFrom(_msgSender(), address(this), costDC);
        DC_TOKEN.transfer(feeAddress, dcFee);
        DC_TOKEN.burn(dcBurned);
    }

    function redeemERC1155(uint256 id, uint256 amount, uint256 saleId, uint8 v, bytes32 r, bytes32 s) public nonReentrant {
      require(sales[saleId] == _msgSender(), "Invalid bet");
      bytes32 hash = keccak256(abi.encode(_msgSender(), id, amount, saleId));
      bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
      address signer = ecrecover(messageHash, v, r, s);
      require(signer == authAddress, "Invalid signature");
      sales[saleId] = address(0);
      clearPendingPurchase(_msgSender(), saleId);
      NFT_TOKEN.mint(_msgSender(), id, amount);
    }
    
    function redeemBulkERC1155(uint256[] calldata id, uint256[] calldata amount, uint256[] calldata saleId, uint8 v, bytes32 r, bytes32 s) public nonReentrant {
      bytes32 hash = keccak256(abi.encode(_msgSender(), id, amount, saleId));
      bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
      address signer = ecrecover(messageHash, v, r, s);
      require(signer == authAddress, "Invalid signature");
      require(id.length == amount.length, "Invalid id and amount length");

      for (uint256 i = 0; i < saleId.length; i++) {
          require(sales[saleId[i]] == _msgSender(), "Invalid sale id");
          sales[saleId[i]] = address(0);
      }

      clearPendingPurchases(_msgSender(), saleId);
  
      for (uint256 i = 0; i < id.length; i++) {
        NFT_TOKEN.mint(_msgSender(), id[i], amount[i]);
      }
    }

    function getPendingPurchases(address _address) public view returns(uint256[] memory) {
      uint256[] memory purchases = new uint256[](pendingPurchases[_address].length);
      for (uint256 i = 0; i < pendingPurchases[_address].length; i++) {
        purchases[i] = pendingPurchases[_address][i];
      }
      return purchases;
    }

    function clearPendingPurchase(address _address, uint256 purchase) internal {
      uint256[] memory purchases = new uint256[](1);
      purchases[0] = purchase;
      clearPendingPurchases(_address, purchases);
    }
    
    function clearPendingPurchases(address _address, uint256[] memory purchases) internal {
      uint256[] storage data = pendingPurchases[_address];
      for (uint256 i = 0; i < purchases.length; i++) {
        for (uint256 j = 0; j < data.length; j++) { 
          if (purchases[i] == data[j]) {
            data[j] = data[data.length - 1];
            data.pop();
            break;
          }
        }
      }
    }

    function setFeeAddress(address _address) public onlyOwner nonReentrant {
        feeAddress = _address;
    }

    function setAuthAddress(address _address) public onlyOwner nonReentrant {
        authAddress = _address;
    }

    function setDCPrice(uint256 price) public onlyOwner nonReentrant {
      nftDCPrice = price;
    }

    function setBDTPrice(uint256 price) public onlyOwner nonReentrant {
      nftBDTPrice = price;
    }

    function setBurnRate(uint256 rate) public onlyOwner nonReentrant {
      require(rate >= 0 && rate <= 100, "Burn rate must be between 0 and 100");
      dcBurnRate = rate;
    }

}