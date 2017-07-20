var Persians = artifacts.require("./Persians.sol");

module.exports = function(deployer) {
  deployer.deploy(Persians);
};
