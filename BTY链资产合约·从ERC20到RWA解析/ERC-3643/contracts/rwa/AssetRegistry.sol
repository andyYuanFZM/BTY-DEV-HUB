// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssetRegistry
 * @dev 设备登记合约 - 管理RWA资产设备信息
 * 记录新能源设备（光伏、风电等）的资产信息，包括设备ID、位置、容量、状态等
 * 与ERC-3643 Token合约集成使用
 */
contract AssetRegistry is Ownable {
    
    // 设备信息结构体
    struct Asset {
        string assetId;           // 设备唯一标识
        string assetType;         // 设备类型（如：光伏、风电）
        string location;          // 设备位置
        uint256 capacity;         // 设备容量（单位：kW）
        uint256 installDate;      // 安装日期（时间戳）
        uint256 totalRevenue;     // 累计收益（wei）
        bool isActive;            // 是否激活
        address tokenContract;    // 关联的代币合约地址
    }
    
    // 设备ID到设备信息的映射
    mapping(string => Asset) public assets;
    
    // 设备ID列表
    string[] public assetIds;
    
    // 代币合约到设备ID的映射（一个代币可以关联多个设备）
    mapping(address => string[]) public tokenToAssets;
    
    // 事件
    event AssetRegistered(
        string indexed assetId,
        string assetType,
        string location,
        uint256 capacity,
        address indexed tokenContract
    );
    
    event AssetUpdated(
        string indexed assetId,
        uint256 totalRevenue,
        bool isActive
    );
    
    event RevenueRecorded(
        string indexed assetId,
        uint256 amount,
        uint256 timestamp
    );
    
    /**
     * @dev 注册新设备
     * @param _assetId 设备唯一标识
     * @param _assetType 设备类型
     * @param _location 设备位置
     * @param _capacity 设备容量（kW）
     * @param _tokenContract 关联的代币合约地址
     */
    function registerAsset(
        string memory _assetId,
        string memory _assetType,
        string memory _location,
        uint256 _capacity,
        address _tokenContract
    ) public onlyOwner {
        require(bytes(assets[_assetId].assetId).length == 0, "Asset already registered");
        
        assets[_assetId] = Asset({
            assetId: _assetId,
            assetType: _assetType,
            location: _location,
            capacity: _capacity,
            installDate: block.timestamp,
            totalRevenue: 0,
            isActive: true,
            tokenContract: _tokenContract
        });
        
        assetIds.push(_assetId);
        tokenToAssets[_tokenContract].push(_assetId);
        
        emit AssetRegistered(_assetId, _assetType, _location, _capacity, _tokenContract);
    }
    
    /**
     * @dev 记录设备收益
     * @param _assetId 设备ID
     * @param _amount 收益金额（wei）
     */
    function recordRevenue(string memory _assetId, uint256 _amount) public onlyOwner {
        require(bytes(assets[_assetId].assetId).length > 0, "Asset not found");
        require(assets[_assetId].isActive, "Asset is not active");
        
        assets[_assetId].totalRevenue += _amount;
        
        emit RevenueRecorded(_assetId, _amount, block.timestamp);
        emit AssetUpdated(_assetId, assets[_assetId].totalRevenue, assets[_assetId].isActive);
    }
    
    /**
     * @dev 更新设备状态
     * @param _assetId 设备ID
     * @param _isActive 是否激活
     */
    function updateAssetStatus(string memory _assetId, bool _isActive) public onlyOwner {
        require(bytes(assets[_assetId].assetId).length > 0, "Asset not found");
        
        assets[_assetId].isActive = _isActive;
        
        emit AssetUpdated(_assetId, assets[_assetId].totalRevenue, _isActive);
    }
    
    /**
     * @dev 获取设备信息
     * @param _assetId 设备ID
     * @return assetId 设备ID
     * @return assetType 设备类型
     * @return location 设备位置
     * @return capacity 设备容量
     * @return installDate 安装日期
     * @return totalRevenue 累计收益
     * @return isActive 是否激活
     * @return tokenContract 关联代币合约地址
     */
    function getAsset(string memory _assetId) public view returns (
        string memory assetId,
        string memory assetType,
        string memory location,
        uint256 capacity,
        uint256 installDate,
        uint256 totalRevenue,
        bool isActive,
        address tokenContract
    ) {
        Asset memory asset = assets[_assetId];
        return (
            asset.assetId,
            asset.assetType,
            asset.location,
            asset.capacity,
            asset.installDate,
            asset.totalRevenue,
            asset.isActive,
            asset.tokenContract
        );
    }
    
    /**
     * @dev 获取设备总数
     * @return 设备总数
     */
    function getAssetCount() public view returns (uint256) {
        return assetIds.length;
    }
    
    /**
     * @dev 获取代币关联的设备列表
     * @param _tokenContract 代币合约地址
     * @return 设备ID数组
     */
    function getAssetsByToken(address _tokenContract) public view returns (string[] memory) {
        return tokenToAssets[_tokenContract];
    }
}
