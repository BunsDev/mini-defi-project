const hre = require('hardhat')
const { verify } = require("../utils/verify")

const deployTreasury = async () => {
    const accounts = await hre.ethers.getSigners()
    const deployer = accounts[0]

    const SushiRouterV2 = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"

    const TreasuryFactory = await hre.ethers.getContractFactory('Treasury');
    const Treasury = await TreasuryFactory.connect(deployer).deploy(SushiRouterV2);

    // Wait for the deployment to be confirmed
    const deploymentReceipt = await Treasury.deploymentTransaction().wait(15);

    if (deploymentReceipt.status === 1) {
        // Contract deployment was successful
        console.log("Treasury contract address:", await Treasury.getAddress())

        if (process.env.ETHERSCAN_API_KEY) {
            console.log("Verifying...")
            await verify(await Treasury.getAddress(), [SushiRouterV2])
        }
    } else {
        console.error("Treasury contract deployment failed.")
    }
}

deployTreasury()

module.exports = { deployTreasury }




