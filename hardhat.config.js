require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    bscTestnet: {
      chainId: '97', // bsc testnet
      url: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545'
    }
  }
};
