// SPDX-License-Identifier: MIT

pragma solidity 0.7.3;

import "./lib/Context.sol";
import "./lib/SafeMath.sol";
import "./lib/Ownable.sol";
import "./lib/IERC20.sol";
import "./lib/IERC1155.sol";
import "./lib/ReentrancyGuard.sol";

contract NFTBattle is Context, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeMath for IERC20;

    constructor(
        address dcToken,
        address bdtToken,
        address nftToken,
        address _feeAddress,
        uint256 _battleDCPrice,
        uint256 _battleBDTPrice
    ) {
        DC_TOKEN = IERC20(dcToken);
        BDT_TOKEN = IERC20(bdtToken);
        NFT_TOKEN = IERC1155(nftToken);

        feeAddress = _feeAddress;

        battleDCPrice = _battleDCPrice;
        battleBDTPrice = _battleBDTPrice;
    }

    event StartBattle(
        uint256 indexed battleId,
        address addr1,
        uint256 nft1,
        address addr2,
        uint256 nft2
    );

    event FinishBattle(
        uint256 indexed battleId,
        address addr1,
        uint256 nft1,
        address addr2,
        uint256 nft2,
        uint32 winner
    );

    uint256 public battleDCPrice;
    uint256 public battleBDTPrice;
    address public feeAddress;
    address public authAddress;
    IERC20 private DC_TOKEN;
    IERC20 private BDT_TOKEN;
    IERC1155 private NFT_TOKEN;
    uint256 public totalBattles;

    // uint256[] battleIds;

    struct Battle {
        uint256 id;
        address addr1;
        uint256 nft1;
        address addr2;
        uint256 nft2;
        uint32 winner;
        bool isFinished;
    }

    mapping(uint256 => Battle) public battles;

    function startBattle(
        uint256 nft1,
        address _addr2,
        uint256 nft2
    ) public nonReentrant {
        require(
            NFT_TOKEN.balanceOf(_msgSender(), nft1) > 0,
            "Attacker does not own NFT"
        );
        require(
            NFT_TOKEN.balanceOf(_addr2, nft2) > 0,
            "Defender does not own NFT"
        );

        uint256 costBDT = battleBDTPrice.mul(1e14);
        uint256 costDC = battleDCPrice.mul(1e14);
        BDT_TOKEN.transferFrom(_msgSender(), feeAddress, costBDT);
        DC_TOKEN.transferFrom(_msgSender(), address(this), costDC);
        DC_TOKEN.transfer(feeAddress, costDC);

        totalBattles = totalBattles.add(1);
        Battle storage battle = battles[totalBattles];

        battle.id = totalBattles;
        battle.addr1 = _msgSender();
        battle.nft1 = nft1;
        battle.addr2 = _addr2;
        battle.nft2 = nft2;

        emit StartBattle(totalBattles, _msgSender(), nft1, _addr2, nft2);
    }

    function getCurrentBattleId(address _address)
        public
        view
        returns (uint256)
    {
        for (uint256 i = totalBattles; i > 0; i--) {
            if (battles[i].addr1 == _address) {
                require(
                    battles[i].isFinished == false,
                    "Most recent user battle concluded"
                );
                return (battles[i].id);
            }
        }
    }

    function finalizeBattle(uint256 battleId, address winnerAddr) public onlyOwner nonReentrant {
        Battle storage battle = battles[battleId];

        require(battle.id == battleId, "Invalid battle id");
        if (battle.isFinished) {
            return;
        }
        // require(!battle.isFinished, "battle already finalized");

        uint32 winner = winnerAddr == battle.addr1 ? 1 : 2;
        battle.winner = winner;
        battle.isFinished = true;

        emit FinishBattle(battle.id, battle.addr1, battle.nft1, battle.addr2, battle.nft2, battle.winner);
    }

    function setFeeAddress(address _address) public onlyOwner nonReentrant {
        feeAddress = _address;
    }

    // setting price of 1 = .0001 token
    function setDCPrice(uint256 price) public onlyOwner nonReentrant {
        battleDCPrice = price;
    }

    function setBDTPrice(uint256 price) public onlyOwner nonReentrant {
        battleBDTPrice = price;
    }
}
