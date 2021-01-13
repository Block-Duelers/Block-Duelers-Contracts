const BDT = artifacts.require("BDT");
const DuelersCredit = artifacts.require("DuelersCredit")
const ETHPool = artifacts.require("EthStakingPool")
const ERC20Pool = artifacts.require("ERC20StakingPool")


module.exports = async function (deployer) {
  const bdt = await BDT.deployed()
  const duelersCredit = await DuelersCredit.deployed()
  const ethPool = await ETHPool.deployed()
  const ercPool = await ERC20Pool.deployed()
  await ethPool.stake({value: "100000000000000000"})
  await bdt.approve(ercPool.address, "20000000000000000000")
  await ercPool.stake("20000000000000000000");
};
