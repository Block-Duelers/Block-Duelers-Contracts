
const truffleAssert = require('truffle-assertions');

const BDT = artifacts.require("BDT")
const DuelersCredit = artifacts.require("DuelersCredit")
const BlockDuelersNFT = artifacts.require("BlockDuelersNFT");
const NFTSale = artifacts.require("NFTSale");
const helper = require("./helpers/truffleTestHelpers");

const { ethers } = require("ethers");

contract("NFTSale", accounts => {
  let duelersCredit, bdt, nft, nftSale, pool;
  beforeEach( async () => {
    duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC");
    bdt = await BDT.new();
    nft = await BlockDuelersNFT.new();
    nftSale = await NFTSale.new(duelersCredit.address, bdt.address, nft.address, accounts[9], accounts[8], 1, 2, 100);
    await duelersCredit.addMinter(accounts[0]);
    await duelersCredit.addToWhitelist(nftSale.address);
    await duelersCredit.mint(accounts[1], "100000000000000000000")
    await duelersCredit.mint(accounts[2], "100000000000000000000")
    await bdt.transfer(accounts[1], "100000000000000000000")
    await bdt.transfer(accounts[2], "100000000000000000000")
    await duelersCredit.approve(nftSale.address, "100000000000000000000", {from: accounts[1]})
    await bdt.approve(nftSale.address, "100000000000000000000", {from: accounts[1]})
    await duelersCredit.approve(nftSale.address, "100000000000000000000", {from: accounts[2]})
    await bdt.approve(nftSale.address, "100000000000000000000", {from: accounts[2]})
    await nft.setMinter(nftSale.address, true);
  })
  const redeem = async (account, id, amount, saleId)  => {
    const hash = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(
        ["address", "uint256", "uint256", "uint256"],
        [account, id, amount, saleId]
      )
    )
    const provider = new ethers.providers.Web3Provider(web3.currentProvider);
    const signer = provider.getSigner(accounts[8])
    let signature = await signer.signMessage(ethers.utils.arrayify(hash))
    const {v, s, r} = ethers.utils.splitSignature(signature);

    await nftSale.redeemERC1155(id, amount, saleId, v, r, s, {from: account})
  }
  const redeemBulk = async (account, id, amount, saleId)  =>  {
    const hash = web3.utils.keccak256(
      web3.eth.abi.encodeParameters(
        ["address", "uint256[]", "uint256[]", "uint256[]"],
        [account, id, amount, saleId]
      )
    )
    const provider = new ethers.providers.Web3Provider(web3.currentProvider);
    const signer = provider.getSigner(accounts[8])
    let signature = await signer.signMessage(ethers.utils.arrayify(hash))
    const {v, s, r} = ethers.utils.splitSignature(signature);

    await nftSale.redeemBulkERC1155(id, amount, saleId, v, r, s, {from: account})
  }

  it("redeem works", async () => {
    await nftSale.buyNFT(1, {from: accounts[1]});
    assert.equal((await duelersCredit.balanceOf(accounts[1])), "99000000000000000000");
    assert.equal((await bdt.balanceOf(accounts[1])),"98000000000000000000")
    assert.equal((await bdt.balanceOf(accounts[9])), "2000000000000000000")

    await redeem(accounts[1], 2, 3, 1);
    assert.equal((await nft.balanceOf(accounts[1], 2)).toNumber(), 3);
  });
  it("redeem bulk works", async () => {
    await nftSale.buyNFT(3, {from: accounts[1]});
    assert.equal((await duelersCredit.balanceOf(accounts[1])), "97000000000000000000");
    assert.equal((await bdt.balanceOf(accounts[1])),"94000000000000000000")
    assert.equal((await bdt.balanceOf(accounts[9])), "6000000000000000000")

    await redeemBulk(accounts[1], [2, 3], [4, 5], [1, 2, 3]);
    assert.equal((await nft.balanceOf(accounts[1], 2)), 4);
    assert.equal((await nft.balanceOf(accounts[1], 3)), 5);
  })
  it("redeem works only once", async () => {
    await nftSale.buyNFT(2, {from: accounts[1]});

    await redeem(accounts[1], 2, 3, 1);
    assert.equal((await nft.balanceOf(accounts[1], 2)).toNumber(), 3);
    await truffleAssert.fails(redeem(accounts[1], 2, 3, 1));
    assert.equal((await nft.balanceOf(accounts[1], 2)).toNumber(), 3);
    await truffleAssert.passes(redeem(accounts[1], 2, 3, 2));
    assert.equal((await nft.balanceOf(accounts[1], 2)).toNumber(), 6);
  });

  it("burns dc tokens accordingly", async() => {
    await nftSale.setBurnRate(10);
    await nftSale.buyNFT(1, {from: accounts[1]});
    assert.equal((await duelersCredit.balanceOf(accounts[1])), "99000000000000000000");
    assert.equal((await bdt.balanceOf(accounts[1])),"98000000000000000000")
    assert.equal((await bdt.balanceOf(accounts[9])), "2000000000000000000")
    assert.equal((await duelersCredit.balanceOf(accounts[9])), "900000000000000000")
  });

  it("getPendingPurchases works", async() => {
    await nftSale.buyNFT(2, {from: accounts[1]});
    let pendingPurhsases = await nftSale.getPendingPurchases(accounts[1]);
    assert.sameMembers(pendingPurhsases.map(v => v.toNumber()), [1, 2]);
    await redeem(accounts[1], 1, 1, 1);
    pendingPurhsases = await nftSale.getPendingPurchases(accounts[1]);
    assert.sameMembers(pendingPurhsases.map(v => v.toNumber()), [2]);
    await redeem(accounts[1], 1, 1, 2);
    pendingPurhsases = await nftSale.getPendingPurchases(accounts[1]);
    assert.sameMembers(pendingPurhsases.map(v => v.toNumber()), []);
  });

  it("getPendingPurchases works for redeemBulk", async() => {
    await nftSale.buyNFT(2, {from: accounts[1]});
    let pendingPurhsases = await nftSale.getPendingPurchases(accounts[1]);
    assert.sameMembers(pendingPurhsases.map(v => v.toNumber()), [1, 2]);
    await redeemBulk(accounts[1], [1], [1], [1,2]);
    pendingPurhsases = await nftSale.getPendingPurchases(accounts[1]);
    assert.sameMembers(pendingPurhsases.map(v => v.toNumber()), []);
  });
})
