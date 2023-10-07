// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswapRouterV2.sol";

contract Treasury {
    using SafeERC20 for IERC20;

    IUniswapRouterV2 public uniswapRouter;

    mapping(address => mapping(address => uint256)) public userBalance; // User's balance of a specific token
    event TokenDeposited(address userAddress, address tokenAddress, uint256 amount);
    event TokenSwapped(address userAddress, address tokenIn, address tokenOut, uint256 amountOut);
    

    constructor(address uniswapRouterAddress) {
        uniswapRouter = IUniswapRouterV2(uniswapRouterAddress);
    }

    // @notice: Function use for depositing any token into the treasury(USDC, DAI...)
    function deposit(address tokenAddress, uint256 amount) external {
        userBalance[msg.sender][tokenAddress] += amount;
        uint256 amountBeforeTransfer = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        uint256 amountAfterTransfer = IERC20(tokenAddress).balanceOf(address(this));

        uint256 transferedAmount = amountAfterTransfer - amountBeforeTransfer;
        require(transferedAmount == amount, "Fee on transfer tokens not supported");
        emit TokenDeposited(msg.sender, tokenAddress, amount);
    }

    // @notice: Function use for swapping tokens internally that were previously deposited
    function swapInternalBalance(address[] memory path, uint256 mintAmountOut, uint256 amountIn, uint256 deadline) external returns (uint256 amountOut) {
        require(userBalance[msg.sender][path[0]] > amountIn, "User has not enough balance for swap");
        userBalance[msg.sender][path[0]] -= amountIn;

        uint256 amountTokenOutBefore = IERC20(path[path.length - 1]).balanceOf(address(this));
        this.swapTokens(path, mintAmountOut, amountIn, deadline);
        amountOut = IERC20(path[path.length - 1]).balanceOf(address(this)) - amountTokenOutBefore;
        userBalance[msg.sender][path[path.length - 1]] += amountOut;
    }

    // @notice: Function use for swapping tokens directly from user's wallet
    function swapTokens(address[] memory path, uint256 minAmountOut, uint256 amountIn, uint256 deadline) external {
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(path[0]).approve(address(uniswapRouter), amountIn);
        uniswapRouter.swapExactTokensForTokens(amountIn, minAmountOut, path, msg.sender, deadline);
        emit TokenSwapped(msg.sender, path[0], path[path.length - 1], amountIn);
    }
}