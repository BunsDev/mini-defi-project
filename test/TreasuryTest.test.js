const { assert } = require("chai")
const {ethers } = require("hardhat")

const SushiRouterV2Address = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
let deployedTreasuryAddress = "0xC8fc271191cD3bD63De3924A671871AcFc1e805a"

describe("Treasury tests", async function () {
    before(async () => {
        Treasury = await ethers.getContractAt("Treasury", deployedTreasuryAddress)
    });

    describe("constructor", () => {
        it("sets starting values correctly", async function () {
            const SushiRouterV2Address_ = await Treasury.uniswapRouter();
            assert.equal(SushiRouterV2Address_, SushiRouterV2Address);
        });
    });

    describe("swap function", () => {

    })
})