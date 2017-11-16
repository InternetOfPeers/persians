module.exports = {
  networks: {
    //testrpc
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 6700000
    },
    //ganache
    ganache: {
      host: "localhost",
      port: 7545,
      network_id: "5777", // Match any network id
      gas: 6700000
    },
    //launch parity with: parity --chain kovan --ports-shift 1
    kovan_local: {
      network_id: "42",
      host: "localhost",
      port: 8546,
      gas: 6700000   
    }
  }
};