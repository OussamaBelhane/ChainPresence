/**
 * ChainPresence — Truffle Configuration
 * Target: Ganache GUI on localhost:7545
 * Compiler: Solidity 0.8.19 with optimizer
 */

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 6721975,
      gasPrice: 20000000000,
    },
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
  },

  mocha: {
    timeout: 100000,
  },

  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },

  // Plugin for coverage (optional)
  plugins: [],
};
