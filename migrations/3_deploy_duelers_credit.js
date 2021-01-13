const BDT = artifacts.require("BDT");
const DuelersCredit = artifacts.require("DuelersCredit")
const ETHPool = artifacts.require("EthStakingPool")
const ERC20Pool = artifacts.require("ERC20StakingPool")


module.exports = async function (deployer) {
  deployer.deploy(DuelersCredit, "DuelersCredit", "DLC")
};
