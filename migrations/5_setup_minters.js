const BDT = artifacts.require("BDT");
const DuelersCredit = artifacts.require("DuelersCredit")
const ETHPool = artifacts.require("EthStakingPool")
const ERC20Pool = artifacts.require("ERC20StakingPool")


module.exports = async function (deployer) {
  const duelersCredit = await DuelersCredit.deployed()
  const ethPool = await ETHPool.deployed()
  const ercPool = await ERC20Pool.deployed()
  await duelersCredit.addMinter(ercPool.address);
  await duelersCredit.addMinter(ethPool.address);
};
