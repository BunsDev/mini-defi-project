const hre = require('hardhat')

export const deployTreasury = async () => {
    const accounts = await hre.ethers.getSigners()
    const deployer = accounts[0]

    const SmartRouterAddress = 0x9a489505a00cE272eAa5e07Dba6491314CaE3796; // PancakeSwap Smart Router in BSC Testnet

    const Treasury = (await (await hre.ethers.getContractFactory('Treasury')).connect(deployer).deploy(SmartRouterAddress)).deployed()
    console.log("Treasury contract address", Treasury.address)
}