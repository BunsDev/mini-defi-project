const hre = require('hardhat')
const { verify } = require("../utils/verify")

const deployTreasury = async () => {
    const accounts = await hre.ethers.getSigners()
    const deployer = accounts[0]

    const SushiRouterV2 = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
    const SushiFactoryV2 = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4"

    const USDTAddress = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
    const USDTUSDCePair = "0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB"
    const USDTMIM_Pair = "0xB7a2F46B196DeCB610a3046053f757264AcF0537"

    const TreasuryFactory = await hre.ethers.getContractFactory('Treasury');
    const Treasury = await TreasuryFactory.connect(deployer).deploy(SushiRouterV2, SushiFactoryV2, USDTUSDCePair, USDTMIM_Pair, 50, 50, USDTAddress);


    const deploymentReceipt = await Treasury.deploymentTransaction().wait(15);

    if (deploymentReceipt.status === 1) {
        console.log("Treasury contract address:", await Treasury.getAddress())

        if (process.env.ETHERSCAN_API_KEY) {
            console.log("Verifying...")
            await verify(await Treasury.getAddress(), [SushiRouterV2])
        }
    } else {
        console.error("Treasury contract deployment failed.")
    }

    return Treasury.getAddress()
}

deployTreasury()

module.exports = { deployTreasury }




