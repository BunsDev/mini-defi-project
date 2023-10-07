require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "hardhat",
  networks: {
    bscTestnet: {
      chainId: 97, // bsc testnet
      url: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: `${process.env.BSC_API_KEY}`
  }
};
