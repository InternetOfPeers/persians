var PersianTokenICO = artifacts.require("./PersianTokenICO.sol");
var Battle = artifacts.require("./Battle.sol");

module.exports = function(deployer) {
  deployer.deploy(PersianTokenICO);
  deployer.deploy(Battle);
};
