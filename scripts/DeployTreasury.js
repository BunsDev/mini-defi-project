const hre = require('hardhat')

const deployTreasury = async () => {
    const accounts = await hre.ethers.getSigners()
    const deployer = accounts[0]
}