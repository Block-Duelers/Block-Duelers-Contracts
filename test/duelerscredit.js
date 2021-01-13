const truffleAssert = require('truffle-assertions');

const DuelersCredit = artifacts.require("DuelersCredit")

contract("DuelersCredit", accounts => {
  it ("should work support customizable minters", async () => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    assert.sameMembers((await duelersCredit.getMinters.call()), []);
    await duelersCredit.addMinter(accounts[1])
    assert.sameMembers((await duelersCredit.getMinters.call()), [accounts[1]]);

    await duelersCredit.addMinter(accounts[2])
    assert.sameMembers((await duelersCredit.getMinters.call()), [accounts[1], accounts[2]]);

    await duelersCredit.removeMinter(accounts[1])
    assert.sameMembers((await duelersCredit.getMinters.call()), [accounts[2]]);
  })

  it("should only allow the owner to add / remove minters", async () => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    assert.sameMembers((await duelersCredit.getMinters.call()), []);
    await duelersCredit.addMinter(accounts[1])
    assert.sameMembers((await duelersCredit.getMinters.call()), [accounts[1]]);

    truffleAssert.fails(duelersCredit.addMinter(accounts[2], { from: accounts[1] }));
    assert.sameMembers((await duelersCredit.getMinters.call()), [accounts[1]]);

    truffleAssert.fails(duelersCredit.removeMinter(accounts[1], { from: accounts[1] }));
    assert.sameMembers((await duelersCredit.getMinters.call()), [accounts[1]]);

  })

  it("should only allow minters to mint coin", async () => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    assert.sameMembers((await duelersCredit.getMinters.call()), []);
    await duelersCredit.addMinter(accounts[1])
    assert.sameMembers((await duelersCredit.getMinters.call()), [accounts[1]]);

    await duelersCredit.mint(accounts[2], 100, { from: accounts[1] })
    const balance = (await duelersCredit.balanceOf.call(accounts[2])).toNumber();
    assert.equal(balance, 100);

    truffleAssert.fails(duelersCredit.mint(accounts[2], 100, { from: accounts[0] }));
    truffleAssert.fails(duelersCredit.mint(accounts[2], 100, { from: accounts[2] }));
    await duelersCredit.removeMinter(accounts[1]);

    truffleAssert.fails(duelersCredit.mint(accounts[2], 100, { from: accounts[1] }));
    const finalBalance = (await duelersCredit.balanceOf.call(accounts[2])).toNumber();
    assert.equal(finalBalance, 100);
  })
})