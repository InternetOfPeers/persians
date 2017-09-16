var PersianTokenICO = artifacts.require("./PersianTokenICO.sol");
var Immortals = artifacts.require("./Immortals.sol");
var Battle = artifacts.require("./Battle.sol");
var TestLib = artifacts.require("./TestLib.sol");

module.exports = function(deployer) {
  deployer.deploy(PersianTokenICO, 1, 2);
  deployer.deploy(Immortals);
  
  var startBattle = 1505517534;
  var endBattle = startBattle + (60 * 60 * 24);
  var avarageBlockTime = 24;
  deployer.deploy(Battle, startBattle, endBattle, avarageBlockTime);

  deployer.deploy(TestLib);
};
