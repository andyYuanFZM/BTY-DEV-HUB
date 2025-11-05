// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@onchain-id/solidity/contracts/interface/IIdentity.sol";

/**
 * @title MockOnchainID
 * @dev Demo用的简化ONCHAINID实现，所有用户共享同一个Mock合约
 * 实现IIdentity接口的所有必需方法，用于Demo演示
 * 
 * 注意：在实际生产环境中，应该使用完整的ONCHAINID实现
 */
contract MockOnchainID is IIdentity {
    // 存储用户是否已注册（简化：只用一个mapping）
    mapping(address => bool) public registeredUsers;
    
    address public owner;
    
    event UserRegistered(address indexed user);
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev 注册用户（仅Owner可调用）
     * @param _user 用户地址
     */
    function registerUser(address _user) external {
        require(msg.sender == owner, "only owner");
        require(_user != address(0), "invalid user");
        registeredUsers[_user] = true;
        emit UserRegistered(_user);
    }
    
    // ========== IERC734 (Key Holder) 接口实现 - Payable 方法 ==========
    
    /**
     * @dev 实现IERC734接口的execute方法（必需）
     * 用于执行指令到ERC725 identity
     */
    function execute(
        address /* _to */,
        uint256 /* _value */,
        bytes calldata /* _data */
    ) external payable override returns (uint256 executionId) {
        // Demo模式：返回一个假的executionId
        return 0;
    }
    
    /**
     * @dev 检查用户是否已注册
     * @param _user 用户地址
     */
    function isRegistered(address _user) external view returns (bool) {
        return registeredUsers[_user];
    }
    
    // ========== IERC735 (Claim Holder) 接口实现 ==========
    
    /**
     * @dev 实现IERC735接口的addClaim方法（必需，但Demo中不实现具体逻辑）
     */
    function addClaim(
        uint256 /* _topic */,
        uint256 /* _scheme */,
        address /* issuer */,
        bytes calldata /* _signature */,
        bytes calldata /* _data */,
        string calldata /* _uri */
    ) external pure override returns (bytes32 claimRequestId) {
        // Demo模式：返回一个假的claimRequestId
        return bytes32(0);
    }
    
    /**
     * @dev 实现IERC735接口的removeClaim方法（必需）
     */
    function removeClaim(bytes32 /* _claimId */) external pure override returns (bool success) {
        return true;
    }
    
    /**
     * @dev 实现IERC735接口的getClaim方法（必需）
     */
    function getClaim(bytes32 /* _claimId */) external pure override returns (
        uint256 topic,
        uint256 scheme,
        address issuer,
        bytes memory signature,
        bytes memory data,
        string memory uri
    ) {
        // Demo模式：返回全零值（表示没有Claim）
        return (0, 0, address(0), "", "", "");
    }
    
    /**
     * @dev 实现IERC735接口的getClaimIdsByTopic方法（必需）
     */
    function getClaimIdsByTopic(uint256 /* _topic */) external pure override returns (bytes32[] memory claimIds) {
        return new bytes32[](0);
    }
    
    // ========== IERC734 (Key Holder) 接口实现 - Pure 方法 ==========
    
    /**
     * @dev 实现IERC734接口的approve方法（必需）
     * 用于批准执行或claim添加
     */
    function approve(uint256 /* _id */, bool /* _approve */) external pure override returns (bool success) {
        return true;
    }
    
    /**
     * @dev 实现IERC734接口的addKey方法（必需）
     */
    function addKey(
        bytes32 /* _key */,
        uint256 /* _purpose */,
        uint256 /* _keyType */
    ) external pure override returns (bool success) {
        return true;
    }
    
    /**
     * @dev 实现IERC734接口的removeKey方法（必需）
     */
    function removeKey(bytes32 /* _key */, uint256 /* _purpose */) external pure override returns (bool success) {
        return true;
    }
    
    /**
     * @dev 实现IERC734接口的keyHasPurpose方法（必需）
     */
    function keyHasPurpose(bytes32 /* _key */, uint256 /* _purpose */) external pure override returns (bool) {
        return false;
    }
    
    /**
     * @dev 实现IERC734接口的getKey方法（必需）
     * 注意：返回类型是 uint256[] memory purposes，不是单个uint256
     */
    function getKey(bytes32 /* _key */) external pure override returns (
        uint256[] memory purposes,
        uint256 keyType,
        bytes32 key
    ) {
        // Demo模式：返回空数组和零值
        return (new uint256[](0), 0, bytes32(0));
    }
    
    /**
     * @dev 实现IERC734接口的getKeyPurposes方法（必需）
     */
    function getKeyPurposes(bytes32 /* _key */) external pure override returns (uint256[] memory _purposes) {
        return new uint256[](0);
    }
    
    /**
     * @dev 实现IERC734接口的getKeysByPurpose方法（必需）
     */
    function getKeysByPurpose(uint256 /* _purpose */) external pure override returns (bytes32[] memory keys) {
        return new bytes32[](0);
    }
    
    // ========== IIdentity 接口实现 ==========
    
    /**
     * @dev 实现IIdentity接口的isClaimValid方法（必需）
     */
    function isClaimValid(
        IIdentity /* _identity */,
        uint256 /* claimTopic */,
        bytes calldata /* sig */,
        bytes calldata /* data */
    ) external pure override returns (bool) {
        // Demo模式：简化返回true
        return true;
    }
}

