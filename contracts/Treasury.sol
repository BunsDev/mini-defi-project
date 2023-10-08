// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IUniswapRouterV2.sol";
import "./interfaces/IUniswapFactoryV2.sol";
import "./interfaces/IUniswapV2Pair.sol";

contract Treasury {
    using SafeERC20 for IERC20;

    address owner;

    IUniswapRouterV2 public uniswapRouter;
    IUniswapFactoryV2 public uniswapFactory;

    address public firstPair;
    address public secondPair;
    mapping(address => uint8) public poolPercentages;
    address stableCoin;
    uint256 public stableCoinBalanceForPools;
    uint256 public firstPairLpAmount;
    uint256 public secondPairLpAmount;

    mapping(address => mapping(address => uint256)) public userBalance; // User's balance of a specific token
    event TokenDeposited(address userAddress, address tokenAddress, uint256 amount);
    event TokenSwapped(address userAddress, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event DepositStableCoinForPools(uint256 amount);
    
    modifier onlyOwner() {
        require(owner == msg.sender, "Not owner");
        _;
    }

    constructor(address uniswapRouterAddress, address uniswapFactoryAddress, address firstPair_, address secondPair_, uint8 firstPercentage_, uint8 secondPercentage_, address stableCoinAddress) {
        require(firstPercentage_ + secondPercentage_ == 100, "Percentages does not sum up 100");
        owner = msg.sender;

        uniswapRouter = IUniswapRouterV2(uniswapRouterAddress);
        uniswapFactory = IUniswapFactoryV2(uniswapFactoryAddress);

        firstPair = firstPair_;
        secondPair = secondPair_;

        poolPercentages[firstPair_] = firstPercentage_;
        poolPercentages[firstPair_] = secondPercentage_;

        stableCoin = stableCoinAddress;
    }

    // @notice: Function use for depositing any token into the treasury (USDC, DAI...)
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
    function swapInternalBalance(address[] memory path, uint256 minAmountOut, uint256 amountIn, uint256 deadline) public {
        require(userBalance[msg.sender][path[0]] >= amountIn, "User has not enough balance for swap");
        userBalance[msg.sender][path[0]] -= amountIn;

        uint256 amountTokenOutBefore = IERC20(path[path.length - 1]).balanceOf(address(this));

        IERC20(path[0]).approve(address(uniswapRouter), amountIn);
        uniswapRouter.swapExactTokensForTokens(amountIn, minAmountOut, path, address(this), deadline);

        uint256 amountOut = IERC20(path[path.length - 1]).balanceOf(address(this)) - amountTokenOutBefore;
        userBalance[msg.sender][path[path.length - 1]] += amountOut;
        emit TokenSwapped(msg.sender, path[0], path[path.length - 1], amountIn, amountOut);
    }

    // @notice: Function use for swapping tokens directly from user's wallet
    function swapTokens(address[] memory path, uint256 minAmountOut, uint256 amountIn, uint256 deadline) public {
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(path[0]).approve(address(uniswapRouter), amountIn);
        uint256[] memory amountsOut = uniswapRouter.swapExactTokensForTokens(amountIn, minAmountOut, path, msg.sender, deadline);
        emit TokenSwapped(msg.sender, path[0], path[path.length - 1], amountIn, amountsOut[amountsOut.length - 1]);
    }


    // @notice: Function use for depositing stableCoin in the Treasury for later using them to addLiquidity
    function depositStableCoinForDistributeInPools(uint256 amount) external {
        stableCoinBalanceForPools += amount;
        IERC20(stableCoin).safeTransferFrom(msg.sender, address(this), amount);
        emit DepositStableCoinForPools(amount);
    }

    // @notice: Function use for adding liquidity to different pools
    function addLiquidity(uint256 deadline) external {
        uint256 firstPoolAmount = stableCoinBalanceForPools * poolPercentages[firstPair] / 100;
        uint256 secondPoolAmount = stableCoinBalanceForPools - firstPoolAmount;

        stableCoinBalanceForPools = 0;
        address[] memory path;

        IERC20(IUniswapV2Pair(firstPair).token0()).approve(address(uniswapRouter), type(uint256).max);
        path = new address[](2);
        path[0] = IUniswapV2Pair(firstPair).token0();
        path[1] = IUniswapV2Pair(firstPair).token1();
        uint256[] memory amountsOut = uniswapRouter.swapExactTokensForTokens(firstPoolAmount / 2, 0, path, address(this), deadline);
        IERC20(IUniswapV2Pair(firstPair).token1()).approve(address(uniswapRouter), type(uint256).max);
        (, , uint256 firstPairLpAmount_) = uniswapRouter.addLiquidity(IUniswapV2Pair(firstPair).token0(), IUniswapV2Pair(firstPair).token1(), firstPoolAmount / 2, amountsOut[amountsOut.length - 1], 0, 0, address(this), deadline);
        
        IERC20(IUniswapV2Pair(secondPair).token0()).approve(address(uniswapRouter), type(uint256).max);
        path[0] = IUniswapV2Pair(secondPair).token0();
        path[1] = IUniswapV2Pair(secondPair).token1();
        amountsOut = uniswapRouter.swapExactTokensForTokens(secondPoolAmount / 2, 0, path, address(this), deadline);
         IERC20(IUniswapV2Pair(secondPair).token1()).approve(address(uniswapRouter), type(uint256).max);
        (, , uint256 secondPairLpAmount_) = uniswapRouter.addLiquidity(IUniswapV2Pair(secondPair).token0(), IUniswapV2Pair(secondPair).token1(), secondPoolAmount / 2, amountsOut[amountsOut.length - 1], 0, 0, address(this), deadline);
        
        firstPairLpAmount += firstPairLpAmount_;
        secondPairLpAmount += secondPairLpAmount_;
    }

     // @notice: Function use for removing liquidity to different pools
    function removeLiquidity(uint8 firstPercentage, uint8 secondPercentage, uint256 deadline) external {
        require(firstPercentage + secondPercentage == 100, "Percentage must be below 100");

        uint256 firstLpAmountToRemove = firstPairLpAmount * firstPercentage / 100;
        uint256 secondLpAmountToRemove = secondPercentage * secondPercentage / 100;
        (uint256 firstAmountA, uint256 firstAmountB) = uniswapRouter.removeLiquidity(IUniswapV2Pair(firstPair).token0(), IUniswapV2Pair(firstPair).token1(), firstLpAmountToRemove, 0, 0, address(this), deadline);
        address[] memory path;
        path = new address[](2);
        if (firstAmountB > 0) { // swapTokenB to tokenA (tokenA always is stableCoin due to the selected pairs)
            IERC20(IUniswapV2Pair(firstPair).token1()).approve(address(uniswapRouter), firstAmountB);
            path[0] = IUniswapV2Pair(firstPair).token1();
            path[1] = IUniswapV2Pair(firstPair).token0();
            uint256[] memory amountsOut = uniswapRouter.swapExactTokensForTokens(firstAmountB, 0, path, address(this), deadline);
            stableCoinBalanceForPools += amountsOut[amountsOut.length - 1];
        }
        stableCoinBalanceForPools += firstAmountA;

        (uint256 secondAmountA, uint256 secondAmountB) = uniswapRouter.removeLiquidity(IUniswapV2Pair(secondPair).token0(), IUniswapV2Pair(secondPair).token1(), secondLpAmountToRemove, 0, 0, address(this), deadline);
        if (secondAmountB > 0) { // swapTokenB to tokenA (tokenA always is stableCoin due to the selected pairs)
            IERC20(IUniswapV2Pair(secondPair).token1()).approve(address(uniswapRouter), secondAmountB);
            path[0] = IUniswapV2Pair(secondPair).token1();
            path[1] = IUniswapV2Pair(secondPair).token0();
            uint256[] memory amountsOut = uniswapRouter.swapExactTokensForTokens(secondAmountB, 0, path, address(this), deadline);
            stableCoinBalanceForPools += amountsOut[amountsOut.length - 1];
        }
        stableCoinBalanceForPools += secondAmountA;
    }

    // OnlyOwner functions
    function modifyPoolPercentages(uint8 firstNewPercentage, uint8 secondNewPercentage) external onlyOwner {
        require(firstNewPercentage + secondNewPercentage == 100, "Percentages does not sum up 100");
        poolPercentages[firstPair] = firstNewPercentage;
        poolPercentages[secondPair] = secondNewPercentage;
    }
}