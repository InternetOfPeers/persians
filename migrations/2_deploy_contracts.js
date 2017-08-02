var PersianTokenICO = artifacts.require("./PersianTokenICO.sol");
var Immortals = artifacts.require("./Immortals.sol");
var Battle = artifacts.require("./Battle.sol");

module.exports = function(deployer) {
  deployer.deploy(PersianTokenICO, 1, 2);
  deployer.deploy(Immortals);
  deployer.deploy(Battle);
};
