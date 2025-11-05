// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AssetRegistry.sol";

/**
 * @title RevenueDistributor
 * @dev 收益分配合约 - 根据代币持仓比例分配收益
 * 从预言机或后端接收收益数据，按代币持有比例分配给代币持有人
 * 与ERC-3643 Token合约集成使用
 */
contract RevenueDistributor is Ownable {
    
    // 代币合约地址
    address public tokenContract;
    
    // 资产登记合约地址
    address public assetRegistry;
    
    // 用户可提取收益映射
    mapping(address => uint256) public claimableRevenue;
    
    // 累计总收益
    uint256 public totalDistributed;
    
    // 事件
    event RevenueDistributed(
        address indexed tokenContract,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event RevenueClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    /**
     * @dev 构造函数
     * @param _tokenContract 代币合约地址
     * @param _assetRegistry 资产登记合约地址
     */
    constructor(address _tokenContract, address _assetRegistry) {
        tokenContract = _tokenContract;
        assetRegistry = _assetRegistry;
    }
    
    /**
     * @dev 接收收益并分配给代币持有人
     * @param _amount 收益总金额（wei）
     * @param _assetId 资产ID（用于记录）
     */
    function distributeRevenue(uint256 _amount, string memory _assetId) public onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20 token = IERC20(tokenContract);
        uint256 totalSupply = token.totalSupply();
        
        require(totalSupply > 0, "No tokens in circulation");
        
        // 记录收益到资产登记合约
        AssetRegistry registry = AssetRegistry(assetRegistry);
        registry.recordRevenue(_assetId, _amount);
        
        // 累计总收益
        totalDistributed += _amount;
        
        emit RevenueDistributed(tokenContract, _amount, block.timestamp);
    }
    
    /**
     * @dev 计算用户应得的收益
     * @param _user 用户地址
     * @param _totalRevenue 总收益金额
     * @return 用户应得收益
     */
    function calculateUserRevenue(address _user, uint256 _totalRevenue) public view returns (uint256) {
        IERC20 token = IERC20(tokenContract);
        uint256 totalSupply = token.totalSupply();
        
        if (totalSupply == 0) {
            return 0;
        }
        
        uint256 userBalance = token.balanceOf(_user);
        return (_totalRevenue * userBalance) / totalSupply;
    }
    
    /**
     * @dev 获取合约ETH余额
     * @return 余额
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 为特定用户添加可提取收益
     * @param _user 用户地址
     * @param _amount 收益金额
     */
    function addClaimableRevenue(address _user, uint256 _amount) public onlyOwner {
        claimableRevenue[_user] += _amount;
    }
    
    /**
     * @dev 批量添加可提取收益
     * @param _users 用户地址数组
     * @param _amounts 收益金额数组
     */
    function batchAddClaimableRevenue(address[] memory _users, uint256[] memory _amounts) public onlyOwner {
        require(_users.length == _amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < _users.length; i++) {
            claimableRevenue[_users[i]] += _amounts[i];
        }
    }
    
    /**
     * @dev 用户提取收益
     */
    function claimRevenue() public {
        uint256 amount = claimableRevenue[msg.sender];
        require(amount > 0, "No revenue to claim");
        
        claimableRevenue[msg.sender] = 0;
        
        // 这里需要合约有足够的ETH余额
        // 实际应用中可能需要通过代币转账或外部支付
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit RevenueClaimed(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev 合约接收ETH（用于收益分配）
     */
    receive() external payable {
        // 合约可以接收ETH用于收益分配
    }
    
    /**
     * @dev 紧急提取（仅owner）
     */
    function emergencyWithdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
