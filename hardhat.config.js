require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "hardhat",
  networks: {
    arbitrum: {
      url: 'https://arb1.arbitrum.io/rpc',
      accounts: [process.env.PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: `${process.env.BSC_API_KEY}`
  },
};
