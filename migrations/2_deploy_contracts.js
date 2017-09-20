var PersianTokenICO = artifacts.require("./PersianTokenICO.sol");
var Immortals = artifacts.require("./Immortals.sol");
var Battle = artifacts.require("./Battle.sol");
var TestLib = artifacts.require("./TestLib.sol");
var SimpleToken = artifacts.require("./SimpleToken.sol");

module.exports = function(deployer) {
  deployer.deploy(PersianTokenICO, 1, 2);
  deployer.deploy(Immortals);
  
  var persianAddress, immortalAddress, spartanAddress, athenianAddress;
  deployer.deploy(SimpleToken, "Persian", "PRS", 18, 300000 * Math.pow(10, 18)).then(function() { persianAddress = SimpleToken.address;
  }).then(function() {
    return deployer.deploy(SimpleToken, "Immortal", "IMT", 0, 100).then(function() { immortalAddress = SimpleToken.address; });
  }).then(function() {
    return deployer.deploy(SimpleToken, "Spartan", "300", 18, 300 * Math.pow(10, 18)).then(function() { spartanAddress = SimpleToken.address; });
  }).then(function() {
    return deployer.deploy(SimpleToken, "Athenian", "ATH", 18, 100 * Math.pow(10, 18)).then(function() { athenianAddress = SimpleToken.address; });
  }).then(function() {
    var now = Math.floor(new Date().getTime() / 1000);
    var startBattle = now;
    var endBattle = startBattle + (60 * 60 * 24);
    var avarageBlockTime = 24;
    deployer.deploy(Battle, startBattle, endBattle, avarageBlockTime, persianAddress, immortalAddress, spartanAddress, athenianAddress);
  });
  
  deployer.deploy(TestLib);
};
