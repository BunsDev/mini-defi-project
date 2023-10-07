// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswapRouterV2.sol";

contract Treasury {
    using SafeERC20 for IERC20;

    IUniswapRouterV2 public uniswapRouter;

    mapping(address => mapping(address => uint256)) public userBalance; // User's balance of a specific token
    event depositToken(address userAddress, address tokenAddress, uint256 amount);
    

    constructor(address uniswapRouterAddress) {
        uniswapRouter = IUniswapRouterV2(uniswapRouterAddress);
    }

    // @notice: Function use for depositing any token (USDC, DAI...)
    function deposit(address tokenAddress, uint256 amount) external {
        uint256 amountBeforeTransfer = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        uint256 amountAfterTransfer = IERC20(tokenAddress).balanceOf(address(this));

        userBalance[msg.sender][tokenAddress] += amountAfterTransfer - amountBeforeTransfer;
        emit depositToken(msg.sender, tokenAddress, amount);
    }

    function swapTokens(address[] memory path, uint256 minAmountOut, uint256 amountIn, uint256 deadline) external {
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(path[0]).approve(address(uniswapRouter), amountIn);
        uniswapRouter.swapExactTokensForTokens(amountIn, minAmountOut, path, msg.sender, deadline);
    }
}