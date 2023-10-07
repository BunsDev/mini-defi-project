const { assert } = require("chai")
const { ethers } = require("hardhat")
const { networks } = require("../hardhat.config")

const deployerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
const SushiRouterV2Address = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
let deployedTreasuryAddress = "0xC8fc271191cD3bD63De3924A671871AcFc1e805a"
const WETHAddress = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
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

        // Get WETH
        const WETH = await ethers.getContractAt("IWETH", WETHAddress)
        const amountIn = 1e18.toString()
        await WETH.connect(deployer).deposit({value: amountIn})

    });

    describe("constructor", () => {
        it("sets starting values correctly", async function () {
            const SushiRouterV2Address_ = await Treasury.uniswapRouter();
            assert.equal(SushiRouterV2Address_, SushiRouterV2Address);
        });
    });

    describe("Deposit function", () => {
        it("Deposits any token correctly into the Treasury", async function () {
            const WETH = await ethers.getContractAt("IWETH", WETHAddress)
            const WETHBalanceBefore = await WETH.balanceOf(deployerAddress)
            const TreasuryUserBalanceBefore = await Treasury.userBalance(deployerAddress, WETHAddress)
            await WETH.connect(deployer).approve(await Treasury.getAddress(), WETHBalanceBefore)

            const amountIn = 1e18.toString()
            const deposit = await Treasury.connect(deployer).deposit(WETHAddress, amountIn)

            const WETHBalanceAfter = await WETH.balanceOf(deployerAddress)
            const TreasuryUserBalanceAfter = await Treasury.userBalance(deployerAddress, WETHAddress)

            
            assert(WETHBalanceBefore > WETHBalanceAfter)
            assert(TreasuryUserBalanceBefore < TreasuryUserBalanceAfter)
        });
    })

    describe("Swap functions", () => {
        it("Swaps tokens correctly directly from user's wallet", async function () {
            const WETH = await ethers.getContractAt("IWETH", WETHAddress)
            const USDC = await ethers.getContractAt("IERC20", USDCAddress)
            const WETHBalanceBefore = await WETH.balanceOf(deployerAddress)
            const USDCBalanceBefore = await USDC.balanceOf(deployerAddress)

            await WETH.connect(deployer).approve(await Treasury.getAddress(), WETHBalanceBefore)

            const timestamp = Date.now()
            const amountIn = 1e18.toString()
            const swap = await Treasury.connect(deployer).swapTokens([WETHAddress, USDCAddress], 0, amountIn, timestamp)

            const WETHBalanceAfter = await WETH.balanceOf(deployerAddress)
            const USDCBalanceAfter = await USDC.balanceOf(deployerAddress)
            assert(WETHBalanceBefore > WETHBalanceAfter)
            assert(USDCBalanceBefore < USDCBalanceAfter)
        });

        it("Swaps internal tokens correctly that were previously deposited", async function () {
            // First step: deposit tokens
            const WETH = await ethers.getContractAt("IWETH", WETHAddress)
            const WETHBalanceBefore = await WETH.balanceOf(deployerAddress)
            const TreasuryUserBalanceBefore = await Treasury.userBalance(deployerAddress, WETHAddress)
            await WETH.connect(deployer).approve(await Treasury.getAddress(), WETHBalanceBefore)
            const amountIn = 1e18.toString()
            const deposit = await Treasury.connect(deployer).deposit(WETHAddress, amountIn)
            const WETHBalanceAfter = await WETH.balanceOf(deployerAddress)
            const TreasuryUserBalanceAfter = await Treasury.userBalance(deployerAddress, WETHAddress)

            
            assert(WETHBalanceBefore > WETHBalanceAfter)
            assert(TreasuryUserBalanceBefore < TreasuryUserBalanceAfter)


            // Second step: swap internally 
            const USDC = await ethers.getContractAt("IERC20", USDCAddress)
            const WETHInternalBalanceBeforeSwap = await Treasury.userBalance(deployerAddress, WETHAddress)
            const USDCInternalBalanceBeforeSwap = await Treasury.userBalance(deployerAddress, USDCAddress)
            await WETH.connect(deployer).approve(await Treasury.getAddress(), WETHBalanceBefore)
            console.log("Before", WETHInternalBalanceBeforeSwap.toString(), USDCInternalBalanceBeforeSwap.toString())
            const timestamp = Date.now()
            const swap = await Treasury.connect(deployer).swapInternalBalance([WETHAddress, USDCAddress], 0, WETHInternalBalanceBeforeSwap.toString(), timestamp)

            const WETHInternalBalanceAfterSwap = await Treasury.userBalance(deployerAddress, WETHAddress)
            const USDCInternalBalanceAfterSwap =  await Treasury.userBalance(deployerAddress, USDCAddress)
            console.log("After", WETHInternalBalanceAfterSwap.toString(), USDCInternalBalanceAfterSwap.toString())
            
            assert(WETHInternalBalanceAfterSwap === '0')
            assert(WETHBalanceBefore > WETHBalanceAfter)
            assert(USDCInternalBalanceAfterSwap < USDCInternalBalanceBeforeSwap)
        });
    })

    

    
})