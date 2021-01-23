

const truffleAssert = require('truffle-assertions');

const BDT = artifacts.require("BDT")
const DuelersCredit = artifacts.require("DuelersCredit")
const BlockDuelersNFT = artifacts.require("BlockDuelersNFT");
const NFTSale = artifacts.require("NFTSale");
const helper = require("./helpers/truffleTestHelpers");

const { ethers } = require("ethers");

contract("BlockDuelersNft", accounts => {
  let duelersCredit, bdt, nft, nftSale, pool;
  beforeEach( async () => {
    nft = await BlockDuelersNFT.new();
    await nft.setMinter(accounts[0], true);
  })
  it("getFullBalance works on mint", async () => {
    await nft.mint(accounts[1], 1, 2);
    await nft.mint(accounts[1], 3, 4);

    let ids, balances, result;
    result = await nft.getFullBalance(accounts[1]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());

    assert.sameMembers(ids, [1, 3]);
    assert.sameMembers(balances, [2, 4]);
  })
  it("getFullBalance works on tranfer", async () => {
    await nft.mint(accounts[1], 1, 2);
    await nft.mint(accounts[1], 3, 4);
     let ids, balances, result;

    await nft.safeTransferFrom(accounts[1], accounts[2], 1, 1, [], {from: accounts[1]});
    result = await nft.getFullBalance(accounts[1]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [1, 3]);
    assert.sameMembers(balances, [1, 4]);

    result = await nft.getFullBalance(accounts[2]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [1]);
    assert.sameMembers(balances, [1]);
    await nft.safeTransferFrom(accounts[1], accounts[2], 1, 1, [], {from: accounts[1]});

    result = await nft.getFullBalance(accounts[1]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [3]);
    assert.sameMembers(balances, [4]);

    result = await nft.getFullBalance(accounts[2]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [1]);
    assert.sameMembers(balances, [2]);

    await nft.safeTransferFrom(accounts[1], accounts[2], 3, 4, [], {from: accounts[1]});
    result = await nft.getFullBalance(accounts[1]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, []);
    assert.sameMembers(balances, []);
  })

  it("getFullBalance works on tranfer batch", async () => {
    await nft.mint(accounts[1], 1, 2);
    await nft.mint(accounts[1], 3, 4);
     let ids, balances, result;

    await nft.safeBatchTransferFrom(accounts[1], accounts[2], [1, 3], [1, 1], [], {from: accounts[1]});
    result = await nft.getFullBalance(accounts[1]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [1, 3]);
    assert.sameMembers(balances, [1, 3]);

    result = await nft.getFullBalance(accounts[2]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [1, 3]);
    assert.sameMembers(balances, [1, 1]);
    await nft.safeBatchTransferFrom(accounts[1], accounts[2], [1, 3], [1, 1], [], {from: accounts[1]});

    result = await nft.getFullBalance(accounts[1]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [3]);
    assert.sameMembers(balances, [2]);

    result = await nft.getFullBalance(accounts[2]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [1, 3]);
    assert.sameMembers(balances, [2, 2]);

  })

  it("getFullBalance works on burn", async () => {
    await nft.mint(accounts[1], 1, 2);
    await nft.mint(accounts[1], 3, 4);
     let ids, balances, result;

    await nft.burn(1, 1, {from: accounts[1]})
    result = await nft.getFullBalance(accounts[1]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [1, 3]);
    assert.sameMembers(balances, [1, 4]);

    await nft.burn(1, 1, {from: accounts[1]})

    result = await nft.getFullBalance(accounts[1]);
    ids = result['0'].map(v => v.toNumber());
    balances = result['1'].map(v => v.toNumber());
    assert.sameMembers(ids, [3]);
    assert.sameMembers(balances, [4]);
  })
})