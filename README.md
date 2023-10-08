# Mini DeFi Project
This document presents a mini DeFi project centered around a primary smart contract, Treasury.sol.

The protocol comprises three primary functionalities:

1. Users have the ability to directly exchange tokens from their wallets and subsequently receive the exchanged tokens back into their wallets by invoking the `swapTokens` function.
2. Users can deposit any type of ERC20 token into the treasury by calling the `deposit` function, their balance is saved in a mapping called `userBalance`. Each user can also swap their internal contract balance by calling `swapInternalBalance`.
3. The most important functionality: The `Treasury` contract can receive `StableCoin` funds, which has been deployed as USDT in Arbitrum. Users can deposit stableCoin by calling `depositStableCoinForDistributeInPools`. This funds are being accumulated in the contract and counted in the `stableCoinBalanceForPools` variable. Then this funds can be used for adding liquidity to the `USDT/MIM` and `USDT/USDCe` pairs in SushiSwap.

TO DO: The addLiquidity and removeLiquidity functions should implement and access modifier if it is wanted to. It would be also a good idea to implement some logic for swapping assets back to `StableCoin` after removing liquidity.