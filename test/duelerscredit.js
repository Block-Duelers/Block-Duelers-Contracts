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

  it("the token should be untransferable by default", async () => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    await duelersCredit.addMinter(accounts[0])
    await duelersCredit.mint(accounts[1], 100, { from: accounts[0] })

    truffleAssert.fails(duelersCredit.transfer(accounts[2], 50, { from: accounts[1] }));
    await duelersCredit.approve(accounts[1], 50, { from: accounts[1] });
    truffleAssert.fails(duelersCredit.transferFrom(accounts[1], accounts[2], 50, { from: accounts[1] }));
  })

  it("should be able to disable the whitelist", async () => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    await duelersCredit.addMinter(accounts[0])
    await duelersCredit.mint(accounts[1], 100, { from: accounts[0] })
    
    await duelersCredit.setIsWhitelistEnabled(false);
    truffleAssert.passes(duelersCredit.transfer(accounts[2], 50, { from: accounts[1] }));
    await duelersCredit.approve(accounts[1], 50, { from: accounts[1] });
    truffleAssert.passes(duelersCredit.transferFrom(accounts[1], accounts[2], 50, { from: accounts[1] }));
  })

  it("should be able to renable the whitelist", async () => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    await duelersCredit.addMinter(accounts[0])
    await duelersCredit.mint(accounts[1], 100, { from: accounts[0] })

    await duelersCredit.setIsWhitelistEnabled(false);
    await duelersCredit.setIsWhitelistEnabled(true);
    truffleAssert.fails(duelersCredit.transfer(accounts[2], 50, { from: accounts[1] }));
    await duelersCredit.approve(accounts[1], 50, { from: accounts[1] });
    truffleAssert.fails(duelersCredit.transferFrom(accounts[1], accounts[2], 50, { from: accounts[1] }));
  })

  it("should be able to add address to whitelist to receive transfers", async() => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    await duelersCredit.addMinter(accounts[0])
    await duelersCredit.mint(accounts[1], 100, { from: accounts[0] })
    
    await duelersCredit.addToWhitelist(accounts[2]);
    truffleAssert.passes(duelersCredit.transfer(accounts[2], 50, { from: accounts[1] }));
    await duelersCredit.approve(accounts[1], 50, { from: accounts[1] });
    truffleAssert.passes(duelersCredit.transferFrom(accounts[1], accounts[2], 50, { from: accounts[1] }));
  })

  it("should be able to add address to whitelist to send transfers", async() => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    await duelersCredit.addMinter(accounts[0])
    await duelersCredit.mint(accounts[1], 100, { from: accounts[0] })
    
    await duelersCredit.addToWhitelist(accounts[1]);
    truffleAssert.passes(duelersCredit.transfer(accounts[2], 50, { from: accounts[1] }));
    await duelersCredit.approve(accounts[1], 50, { from: accounts[1] });
    truffleAssert.passes(duelersCredit.transferFrom(accounts[1], accounts[2], 50, { from: accounts[1] }));
  })

  it("should be able to remove address from the whitelist", async() => {
    const duelersCredit = await DuelersCredit.new("DuelersCredit", "DLC")
    await duelersCredit.addMinter(accounts[0])
    await duelersCredit.mint(accounts[1], 100, { from: accounts[0] })
    
    await duelersCredit.addToWhitelist(accounts[1]);
    await duelersCredit.removeFromWhitelist(accounts[1]);
    truffleAssert.fails(duelersCredit.transfer(accounts[2], 50, { from: accounts[1] }));
    await duelersCredit.approve(accounts[1], 50, { from: accounts[1] });
    truffleAssert.fails(duelersCredit.transferFrom(accounts[1], accounts[2], 50, { from: accounts[1] }));
  })

})