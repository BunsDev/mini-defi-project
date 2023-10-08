require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.20" },
      { version: "0.4.18" },
      { version: "0.5.0" },
    ]
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 42161,
      forking: {
        enabled: true,
        url: 'https://arb1.arbitrum.io/rpc', // forking Arbitrum
        accounts: [process.env.PRIVATE_KEY]
      }
    },
    arbitrum: {
      url: 'https://arb1.arbitrum.io/rpc',
      accounts: [process.env.PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: `${process.env.BSC_API_KEY}`
  },
};
