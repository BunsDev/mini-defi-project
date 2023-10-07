const { assert } = require("chai")
const { ethers } = require("hardhat")
const { networks } = require("../hardhat.config")

const deployerAddress = "0xA8be82C6091aFb27c5597aFE5a2bab7f91Bb0277"
const SushiRouterV2Address = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
let deployedTreasuryAddress = "0xC8fc271191cD3bD63De3924A671871AcFc1e805a"
const ARBAddress = "0x912CE59144191C1204E64559FE8253a0e49E6548"
const USDCAddress = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
let deployer

describe("Treasury tests", async function () {
    beforeEach(async () => {
        Treasury = await ethers.getContractAt("Treasury", deployedTreasuryAddress)
        // const impersonateDeployer = await ethers.getImpersonatedSigner(deployerAddress);
        // deployer = await ethers.getSigner(deployerAddress)
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [deployerAddress],
          });

        deployer = await ethers.getSigner(deployerAddress)
        console.log("BeforeEach")
    });

    describe("constructor", () => {
        it("sets starting values correctly", async function () {
            const SushiRouterV2Address_ = await Treasury.uniswapRouter();
            assert.equal(SushiRouterV2Address_, SushiRouterV2Address);
        });
    });

    describe("swap function", () => {
        it("Swaps tokens correctly", async function () {
            const ARB = await ethers.getContractAt("IERC20", ARBAddress)
            const timestamp = Date.now()
            const ARBBalance = await ARB.balanceOf(deployerAddress)
            await ARB.connect(deployer).approve(await Treasury.getAddress(), ARBBalance)
            console.log("postApprove", ARBBalance.toString())
            const swap = await Treasury.connect(deployer).swapTokens([ARBAddress, USDCAddress], 0, ARBBalance.toString(), timestamp)
        });
    })
})