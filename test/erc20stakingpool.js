
const truffleAssert = require('truffle-assertions');

const DuelersCredit = artifacts.require("DuelersCredit")
const ERC20StakingPool = artifacts.require("ERC20StakingPool")
const helper = require("./helpers/truffleTestHelpers");

pry = require('pry')


contract("ERC20StakingPool", accounts => {
  let duelersCredit, stakeCoin, pool;
  beforeEach( async () => {
    duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    stakeCoin = await DuelersCredit.new("StakeCoin", "stake")
    pool = await ERC20StakingPool.new(stakeCoin.address, duelersCredit.address, accounts[3], 0, "100000000000000000");
    await duelersCredit.addMinter(pool.address);
    await stakeCoin.addMinter(accounts[0])
    await stakeCoin.mint(accounts[1], 1000);
    await stakeCoin.mint(accounts[2], 1000);
  })
  it("works", async () => {
    assert.equal((await stakeCoin.balanceOf.call(accounts[1])).toNumber(), 1000);
    await (stakeCoin.approve(pool.address, 100, { from: accounts[1] }));
    await pool.stake(100, {from: accounts[1] });

    await (stakeCoin.approve(pool.address, 200, { from: accounts[2] }));
    await pool.stake(200, {from: accounts[2] });

    assert.equal((await stakeCoin.balanceOf.call(accounts[1])).toNumber(), 900);
    await helper.advanceTimeAndBlock(60 * 60 * 24);
    assert.equal((await pool.earned.call(accounts[1])), 10);
    assert.equal((await pool.earned.call(accounts[2])), 20);

    await pool.redeem({from: accounts[1]});
    await helper.advanceTimeAndBlock(60 * 60 * 24);
    assert.equal((await pool.earned.call(accounts[1])), 10);
    await pool.redeem({from: accounts[2]});

    assert.equal((await duelersCredit.balanceOf.call(accounts[1])).toNumber(), 10);
    assert.equal((await duelersCredit.balanceOf.call(accounts[2])).toNumber(), 40);
  })

  it("correctly calculates earnings with withdraws", async () => {
    assert.equal((await stakeCoin.balanceOf.call(accounts[1])).toNumber(), 1000);
    await (stakeCoin.approve(pool.address, 200, { from: accounts[1] }));
    await pool.stake(200, {from: accounts[1] });

    await helper.advanceTimeAndBlock(60 * 60 * 24);
    assert.equal((await pool.earned.call(accounts[1])), 20);

    await pool.withdraw(100, {from: accounts[1]});
    await helper.advanceTimeAndBlock(60 * 60 * 24);
    assert.equal((await pool.earned.call(accounts[1])), 30);
  })

  it("correctly calculates staking fee", async () => {
    assert.equal((await stakeCoin.balanceOf.call(accounts[1])).toNumber(), 1000);
    await pool.setFeeRate("100000000000000000", { from: accounts[0] });
    await (stakeCoin.approve(pool.address, 200, { from: accounts[1] }));
    await pool.stake(110, {from: accounts[1] });
    assert.equal((await pool.balanceOf.call(accounts[1])).toNumber(), 99);
    assert.equal((await pool.totalStaked.call()).toNumber(), 99);
    assert.equal((await stakeCoin.balanceOf.call(accounts[3])).toNumber(), 11);
  })
  
  it("correctly adjust returnRate", async () => {
    await (stakeCoin.approve(pool.address, 200, { from: accounts[1] }));
    await pool.stake(100, {from: accounts[1] });
    await helper.advanceTimeAndBlock(60 * 60 * 24);
    await pool.setReturnRate("200000000000000000")
    await helper.advanceTimeAndBlock(60 * 60 * 24);
    assert.equal((await pool.earned.call(accounts[1])).toNumber(), 30);
    await pool.withdraw( 50, {from : accounts[1]});
    await helper.advanceTimeAndBlock(60 * 60 * 24);
    assert.equal((await pool.earned.call(accounts[1])).toNumber(), 40);
  })

});