const hre = require('hardhat')
const { verify } = require("../utils/verify")

const deployTreasury = async () => {
    const accounts = await hre.ethers.getSigners()
    const deployer = accounts[0]

    const SmartRouterAddress = "0x9a489505a00cE272eAa5e07Dba6491314CaE3796"; // PancakeSwap Smart Router in BSC Testnet

    const overrides = {
        gasLimit: 2000000, 
        gasPrice: ethers.parseUnits('10', 'gwei'),
    };

    const args = SmartRouterAddress
    const Treasury = await hre.ethers.getContractFactory('Treasury');
    const treasury = await Treasury.connect(deployer).deploy(args, overrides);
    
    console.log("Treasury contract address:", treasury.address);

    if (process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(treasury.address, args)
    }
}

deployTreasury()