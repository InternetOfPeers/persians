require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    //testrpc
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    //launch parity with: parity --chain kovan --ports-shift 1
    kovan_local: {
      network_id: "42",
      host: "localhost",
      port: 8546      
    }
  }
};