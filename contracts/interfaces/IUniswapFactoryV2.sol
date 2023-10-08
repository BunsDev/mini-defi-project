// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;

interface IUniswapFactoryV2 {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}
