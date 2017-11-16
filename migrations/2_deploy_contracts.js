var PersianTokenICO = artifacts.require("./PersianTokenICO.sol");
var Immortals = artifacts.require("./Immortals.sol");
var BattleOfThermopylae = artifacts.require("./BattleOfThermopylae.sol");
var BattleToken = artifacts.require("./BattleToken.sol");
var TestLib = artifacts.require("./TestLib.sol");
var SimpleToken = artifacts.require("./SimpleToken.sol");

module.exports = function (deployer) {
  deployer.deploy(PersianTokenICO, 1, 2);
  deployer.deploy(Immortals);

  var persianAddress, immortalAddress, spartanAddress, athenianAddress, battleTokenAddress;
  deployer.deploy(SimpleToken, "Persian", "PRS", 18, 300000 * Math.pow(10, 18)).then(function () {
    persianAddress = SimpleToken.address;
  }).then(function () {
    return deployer.deploy(SimpleToken, "Immortal", "IMT", 0, 100).then(function () { immortalAddress = SimpleToken.address; });
  }).then(function () {
    return deployer.deploy(SimpleToken, "Spartan", "300", 18, 300 * Math.pow(10, 18)).then(function () { spartanAddress = SimpleToken.address; });
  }).then(function () {
    return deployer.deploy(SimpleToken, "Athenian", "ATH", 18, 100 * Math.pow(10, 18)).then(function () { athenianAddress = SimpleToken.address; });
  }).then(function () {
    var now = Math.floor(new Date().getTime() / 1000);
    var startBattle = now;
    var endBattle = startBattle + (60 * 60 * 24);
    var avarageBlockTime = 24;
    return deployer.deploy(BattleOfThermopylae, startBattle, endBattle, avarageBlockTime, persianAddress, immortalAddress, spartanAddress, athenianAddress);
  }).then(function () {
    return deployer.deploy(BattleToken).then(function () { battleTokenAddress = BattleToken.address; });
  }).then(function () {
    return BattleOfThermopylae.at(BattleOfThermopylae.address).setBattleTokenAddress(battleTokenAddress, "0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39");
  });

  deployer.deploy(TestLib);
};
