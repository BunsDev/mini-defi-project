const { assert } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { loadFixture } = require('ethereum-waffle')
const { deployTreasury } = require("../scripts/DeployTreasury")

let treasury, deployer
const uniswapRouterAddress = "0x9a489505a00cE272eAa5e07Dba6491314CaE3796"

describe("Treasury tests", async function () {
    before(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        treasury = await ethers.getContract("Raffle", deployer)
    });

    describe("constructor", () => {
        it("sets starting values correctly", async function () {
            const uniswapAddress = await treasury.uniswapRouter(); // Use 'await' here
            assert.equal(uniswapAddress, uniswapRouterAddress); // Corrected 'uniswapRouter' to 'uniswapAddress'
        });
    });
})