// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title YiDengTokenSwap
 * @dev 一灯币与ETH的兑换合约，支持双向交易
 * @notice 用户可以用ETH购买一灯币，或用一灯币换回ETH
 */
contract YiDengTokenSwap is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable yiDengToken;
    uint256 public rate; // 1 ETH = rate * YiDeng tokens
    
    // 费率设置 (basis points: 100 = 1%)
    uint256 public buyFeeRate = 10; 
    uint256 public sellFeeRate = 10; 
    uint256 public constant MAX_FEE_RATE = 1000; // 最大10%
    uint256 public constant BASIS_POINTS = 10000;
    
    // 累计费用
    uint256 public accumulatedFees;
    
    // 事件
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount, uint256 fee);
    event TokensSold(address indexed seller, uint256 tokenAmount, uint256 ethAmount, uint256 fee);
    event RateUpdated(uint256 oldRate, uint256 newRate);
    event FeeRateUpdated(uint256 oldBuyFee, uint256 newBuyFee, uint256 oldSellFee, uint256 newSellFee);
    event TokensDeposited(uint256 amount);
    event TokensWithdrawn(uint256 amount);
    event ETHDeposited(uint256 amount);
    event ETHWithdrawn(uint256 amount);
    event FeesWithdrawn(uint256 amount);
    
    // 错误定义
    error InvalidTokenAddress();
    error InvalidRate();
    error InvalidFeeRate();
    error AmountMustBePositive();
    error InsufficientTokenBalance();
    error InsufficientETHBalance();
    error InsufficientUserTokenBalance();
    error TokenTransferFailed();
    error ETHTransferFailed();
    error ExcessiveSlippage();
    
    // 修饰符
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert AmountMustBePositive();
        _;
    }
    
    /**
     * @dev 构造函数
     * @param _tokenAddress 一灯币合约地址
     * @param _rate 初始兑换率
     */
    constructor(address _tokenAddress, uint256 _rate) Ownable() {
        if (_tokenAddress == address(0)) revert InvalidTokenAddress();
        if (_rate == 0) revert InvalidRate();
        
        yiDengToken = IERC20(_tokenAddress);
        rate = _rate;
    }
    
    /**
     * @dev 用ETH购买一灯币
     * @param minTokenAmount 最少期望获得的代币数量（滑点保护）
     */
    function buyTokens(uint256 minTokenAmount) 
        external 
        payable 
        validAmount(msg.value) 
        whenNotPaused 
        nonReentrant 
    {
        uint256 tokenAmount = calculateTokensForETH(msg.value);
        uint256 fee = (tokenAmount * buyFeeRate) / BASIS_POINTS;
        uint256 tokenAmountAfterFee = tokenAmount - fee;
        
        // 滑点保护
        if (tokenAmountAfterFee < minTokenAmount) revert ExcessiveSlippage();
        
        uint256 contractBalance = yiDengToken.balanceOf(address(this));
        if (contractBalance < tokenAmountAfterFee) revert InsufficientTokenBalance();
        
        // 累计手续费
        accumulatedFees += fee;
        
        // 转移代币给用户
        yiDengToken.safeTransfer(msg.sender, tokenAmountAfterFee);
        
        emit TokensPurchased(msg.sender, msg.value, tokenAmountAfterFee, fee);
    }
    
    /**
     * @dev 出售一灯币换取ETH
     * @param tokenAmount 要出售的代币数量
     * @param minETHAmount 最少期望获得的ETH数量（滑点保护）
     */
    function sellTokens(uint256 tokenAmount, uint256 minETHAmount) 
        external 
        validAmount(tokenAmount) 
        whenNotPaused 
        nonReentrant 
    {
        uint256 userBalance = yiDengToken.balanceOf(msg.sender);
        if (userBalance < tokenAmount) revert InsufficientUserTokenBalance();
        
        uint256 ethAmount = calculateETHForTokens(tokenAmount);
        uint256 fee = (ethAmount * sellFeeRate) / BASIS_POINTS;
        uint256 ethAmountAfterFee = ethAmount - fee;
        
        // 滑点保护
        if (ethAmountAfterFee < minETHAmount) revert ExcessiveSlippage();
        
        if (address(this).balance < ethAmountAfterFee) revert InsufficientETHBalance();
        
        // 从用户转移代币到合约
        yiDengToken.safeTransferFrom(msg.sender, address(this), tokenAmount);
        
        // 转移ETH给用户（扣除手续费后）
        (bool success, ) = payable(msg.sender).call{value: ethAmountAfterFee}("");
        if (!success) revert ETHTransferFailed();
        
        emit TokensSold(msg.sender, tokenAmount, ethAmountAfterFee, fee);
    }
    
    /**
     * @dev 设置新的兑换率（仅限所有者）
     * @param _rate 新的兑换率
     */
    function setRate(uint256 _rate) external onlyOwner {
        if (_rate == 0) revert InvalidRate();
        
        uint256 oldRate = rate;
        rate = _rate;
        
        emit RateUpdated(oldRate, _rate);
    }
    
    /**
     * @dev 设置手续费率（仅限所有者）
     * @param _buyFeeRate 购买手续费率（basis points）
     * @param _sellFeeRate 出售手续费率（basis points）
     */
    function setFeeRates(uint256 _buyFeeRate, uint256 _sellFeeRate) external onlyOwner {
        if (_buyFeeRate > MAX_FEE_RATE || _sellFeeRate > MAX_FEE_RATE) revert InvalidFeeRate();
        
        uint256 oldBuyFee = buyFeeRate;
        uint256 oldSellFee = sellFeeRate;
        
        buyFeeRate = _buyFeeRate;
        sellFeeRate = _sellFeeRate;
        
        emit FeeRateUpdated(oldBuyFee, _buyFeeRate, oldSellFee, _sellFeeRate);
    }
    
    /**
     * @dev 所有者向合约存入代币
     * @param amount 存入的代币数量
     */
    function depositTokens(uint256 amount) external onlyOwner validAmount(amount) {
        yiDengToken.safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(amount);
    }
    
    /**
     * @dev 所有者从合约提取代币
     * @param amount 提取的代币数量
     */
    function withdrawTokens(uint256 amount) external onlyOwner validAmount(amount) {
        uint256 contractBalance = yiDengToken.balanceOf(address(this));
        if (contractBalance < amount) revert InsufficientTokenBalance();
        
        yiDengToken.safeTransfer(owner(), amount);
        emit TokensWithdrawn(amount);
    }
    
    /**
     * @dev 所有者向合约存入ETH
     */
    function depositETH() external payable onlyOwner validAmount(msg.value) {
        emit ETHDeposited(msg.value);
    }
    
    /**
     * @dev 所有者从合约提取ETH
     * @param amount 提取的ETH数量（以wei为单位）
     */
    function withdrawETH(uint256 amount) external onlyOwner validAmount(amount) {
        if (address(this).balance < amount) revert InsufficientETHBalance();
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert ETHTransferFailed();
        
        emit ETHWithdrawn(amount);
    }
    
    /**
     * @dev 提取累计的手续费（仅限所有者）
     */
    function withdrawFees() external onlyOwner {
        uint256 fees = accumulatedFees;
        if (fees == 0) revert AmountMustBePositive();
        
        uint256 contractBalance = yiDengToken.balanceOf(address(this));
        if (contractBalance < fees) revert InsufficientTokenBalance();
        
        accumulatedFees = 0;
        yiDengToken.safeTransfer(owner(), fees);
        
        emit FeesWithdrawn(fees);
    }
    
    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 紧急提取所有资金（仅限所有者，仅在暂停状态下）
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        // 提取所有代币
        uint256 tokenBalance = yiDengToken.balanceOf(address(this));
        if (tokenBalance > 0) {
            yiDengToken.safeTransfer(owner(), tokenBalance);
        }
        
        // 提取所有ETH
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool success, ) = payable(owner()).call{value: ethBalance}("");
            if (!success) revert ETHTransferFailed();
        }
    }
    
    // 查询函数
    
    /**
     * @dev 获取合约的代币余额
     */
    function getTokenBalance() external view returns (uint256) {
        return yiDengToken.balanceOf(address(this));
    }
    
    /**
     * @dev 获取合约的ETH余额
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 计算购买代币所需的ETH数量（包含手续费）
     * @param tokenAmount 期望获得的代币数量
     */
    function calculateETHForTokens(uint256 tokenAmount) public view returns (uint256) {
        // 计算包含手续费的总代币需求
        uint256 totalTokensNeeded = (tokenAmount * BASIS_POINTS) / (BASIS_POINTS - buyFeeRate);
        return totalTokensNeeded / rate;
    }
    
    /**
     * @dev 计算ETH可购买的代币数量（扣除手续费后）
     * @param ethAmount ETH数量
     */
    function calculateTokensForETH(uint256 ethAmount) public view returns (uint256) {
        uint256 grossTokens = ethAmount * rate;
        uint256 fee = (grossTokens * buyFeeRate) / BASIS_POINTS;
        return grossTokens - fee;
    }
    
    /**
     * @dev 计算出售代币可获得的ETH数量（扣除手续费后）
     * @param tokenAmount 代币数量
     */
    function calculateETHForTokenSale(uint256 tokenAmount) external view returns (uint256) {
        uint256 grossETH = tokenAmount / rate;
        uint256 fee = (grossETH * sellFeeRate) / BASIS_POINTS;
        return grossETH - fee;
    }
    
    /**
     * @dev 获取当前手续费率
     */
    function getFeeRates() external view returns (uint256 buyFee, uint256 sellFee) {
        return (buyFeeRate, sellFeeRate);
    }
    
    /**
     * @dev 获取可提取的手续费数量
     */
    function getAccumulatedFees() external view returns (uint256) {
        return accumulatedFees;
    }
    
    /**
     * @dev 接收ETH的回调函数
     */
    receive() external payable {
        emit ETHDeposited(msg.value);
    }
}