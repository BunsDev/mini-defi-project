const { assert } = require("chai")
const { ethers } = require("hardhat")
const { networks } = require("../hardhat.config")

const deployerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
const SushiRouterV2Address = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
let deployedTreasuryAddress = "0x5b4D7CF06bB561Dc5FEfaB28De5B3C7DDdad66f6"
const WETHAddress = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
const ARBAddress = "0x912CE59144191C1204E64559FE8253a0e49E6548"
const USDCAddress = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
const USDTAddress = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
let deployer

describe("Treasury tests", async function () {
    this.beforeAll(async () => {
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
        const amountIn = 10e18.toString()
        await WETH.connect(deployer).deposit({ value: amountIn })

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
    })

    describe("Swap Internal Balance", () => {
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
            const timestamp = Date.now()
            const swap = await Treasury.connect(deployer).swapInternalBalance([WETHAddress, USDCAddress], 0, WETHInternalBalanceBeforeSwap.toString(), timestamp)

            const WETHInternalBalanceAfterSwap = await Treasury.userBalance(deployerAddress, WETHAddress)
            const USDCInternalBalanceAfterSwap = await Treasury.userBalance(deployerAddress, USDCAddress)

            assert(WETHInternalBalanceAfterSwap.toString() === '0')
            assert(WETHInternalBalanceBeforeSwap > WETHInternalBalanceAfterSwap)
            assert(USDCInternalBalanceAfterSwap > USDCInternalBalanceBeforeSwap)
        });
    })

    describe("DepositStablecoin", () => {
        it("Swaps WETH for USDT and then depositStableCoin correctly", async function () {
            // First step: swap WETH to USDT
            const WETH = await ethers.getContractAt("IWETH", WETHAddress)
            const USDT = await ethers.getContractAt("IERC20", USDTAddress)
            const WETHBalanceBefore = await WETH.balanceOf(deployerAddress)

            await WETH.connect(deployer).approve(await Treasury.getAddress(), WETHBalanceBefore)

            const timestamp = Date.now()
            const amountIn = 1e18.toString()
            const swap = await Treasury.connect(deployer).swapTokens([WETHAddress, USDTAddress], 0, WETHBalanceBefore, timestamp)
            const WETHBalanceAfter = await WETH.balanceOf(deployerAddress)
            const USDTBalanceAfter = await USDT.balanceOf(deployerAddress)

            assert(USDTBalanceAfter > 0)
            assert(WETHBalanceAfter == 0)

            // Second step: deposit USDT
            await USDT.connect(deployer).approve(await Treasury.getAddress(), USDTBalanceAfter)
            const deposit = await Treasury.connect(deployer).depositStableCoinForDistributeInPools(USDTBalanceAfter)
            const TreasuryUSDTBalanceAfter = await USDT.balanceOf(deployedTreasuryAddress)
            assert(TreasuryUSDTBalanceAfter == USDTBalanceAfter)
        });
    })

    describe("Liquidity", () => {
        it("Swaps WETH for USDT, then depositStableCoin correctly and then adds liquidity", async function () {
            // First step: swap WETH to USDT
            const WETH = await ethers.getContractAt("IWETH", WETHAddress)
            const USDT = await ethers.getContractAt("IERC20", USDTAddress)
            const WETHBalanceBefore = await WETH.balanceOf(deployerAddress)

            await WETH.connect(deployer).approve(await Treasury.getAddress(), WETHBalanceBefore)

            const timestamp = Date.now()
            const amountIn = 1e18.toString()
            const swap = await Treasury.connect(deployer).swapTokens([WETHAddress, USDTAddress], 0, WETHBalanceBefore, timestamp)
            const WETHBalanceAfter = await WETH.balanceOf(deployerAddress)
            const USDTBalanceAfter = await USDT.balanceOf(deployerAddress)

            assert(USDTBalanceAfter > 0)
            assert(WETHBalanceAfter == 0)

            // Second step: deposit USDT
            await USDT.connect(deployer).approve(await Treasury.getAddress(), USDTBalanceAfter)
            const deposit = await Treasury.connect(deployer).depositStableCoinForDistributeInPools(USDTBalanceAfter)
            const TreasuryUSDTBalanceAfter = await USDT.balanceOf(deployedTreasuryAddress)
            assert(TreasuryUSDTBalanceAfter == USDTBalanceAfter)

            // Third step: add liquidity
            const addLiquidity = await Treasury.connect(deployer).addLiquidity(Date.now())
            const firstPairLpAmount = await Treasury.connect(deployer).firstPairLpAmount()
            const secondPairLpAmount = await Treasury.connect(deployer).secondPairLpAmount()

            assert(firstPairLpAmount > 0)
            assert(secondPairLpAmount > 0)
        });

        it("Swaps WETH for USDT, then depositStableCoin correctly, then adds liquidity and then removes liquidity", async function () {
            // First step: swap WETH to USDT
            const WETH = await ethers.getContractAt("IWETH", WETHAddress)
            const USDT = await ethers.getContractAt("IERC20", USDTAddress)
            const WETHBalanceBefore = await WETH.balanceOf(deployerAddress)

            await WETH.connect(deployer).approve(await Treasury.getAddress(), WETHBalanceBefore)

            const timestamp = Date.now()
            const amountIn = 1e18.toString()
            const swap = await Treasury.connect(deployer).swapTokens([WETHAddress, USDTAddress], 0, WETHBalanceBefore, timestamp)
            const WETHBalanceAfter = await WETH.balanceOf(deployerAddress)
            const USDTBalanceAfter = await USDT.balanceOf(deployerAddress)

            assert(USDTBalanceAfter > 0)
            assert(WETHBalanceAfter == 0)

            // Second step: deposit USDT
            await USDT.connect(deployer).approve(await Treasury.getAddress(), USDTBalanceAfter)
            const deposit = await Treasury.connect(deployer).depositStableCoinForDistributeInPools(USDTBalanceAfter)
            const TreasuryUSDTBalanceAfter = await USDT.balanceOf(deployedTreasuryAddress)
            assert(TreasuryUSDTBalanceAfter == USDTBalanceAfter)

            // Third step: add liquidity
            const addLiquidity = await Treasury.connect(deployer).addLiquidity(Date.now())
            const firstPairLpAmount = await Treasury.connect(deployer).firstPairLpAmount()
            const secondPairLpAmount = await Treasury.connect(deployer).secondPairLpAmount()

            assert(firstPairLpAmount > 0)
            assert(secondPairLpAmount > 0)

            // Fourth step: remove liquidity
            console.log("First", await Treasury.connect(deployer).firstPairLpAmount())
            console.log("First", await Treasury.connect(deployer).secondPairLpAmount())
            const removeLiquidity = await Treasury.connect(deployer).removeLiquidity(50, 50, Date.now())
        })
    })
})