const BDT = artifacts.require("BDT");
const DuelersCredit = artifacts.require("DuelersCredit")
const ETHPool = artifacts.require("EthStakingPool")
const ERC20Pool = artifacts.require("ERC20StakingPool")


module.exports = async function (deployer) {
  const bdt = await BDT.deployed()
  const duelersCredit = await DuelersCredit.deployed()
  const ethPool = await deployer.deploy(ETHPool, duelersCredit.address, "0x423047a21249a8Be9b55Ba0f36e3F1BF8A334449", "10000000000000000", "100000000000000000")
  const ercPool = await deployer.deploy(ERC20Pool, bdt.address, duelersCredit.address,"0x423047a21249a8Be9b55Ba0f36e3F1BF8A334449",  "10000000000000000", "100000000000000000")
};
