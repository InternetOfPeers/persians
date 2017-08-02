var Immortals = artifacts.require("./Immortals.sol");

module.exports = function(deployer) {
  //deployer.deploy(PersianTokenICO, 1, 2);
  deployer.deploy(Immortals);
  //deployer.deploy(Battle);
};
