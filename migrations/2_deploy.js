const Token = artifacts.require("BDT");

module.exports = function (deployer) {
  deployer.deploy(Token);
};
