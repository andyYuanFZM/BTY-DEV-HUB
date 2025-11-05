// RWA 合约部署信息（从 bty-deployment-info.json 获取）
// 注意：如果重新部署了合约，需要更新这里的地址
export const RWA_DEPLOYMENT_INFO = {
  token: "0x331EAD053b69978D7d105029E56f4c9f20982DB2", // Token Proxy地址
  identityRegistry: "0x18E35060d2A3Fd556BAa3B8cfbF6230b779aE5ab", // IdentityRegistry Proxy地址
  assetRegistry: "0xE890F4EdBAe227CcAB5e51415a271825C26Ce5b7", // AssetRegistry地址
  revenueDistributor: "0xDa0C4E4744c320Bc38161aaEC5C0673570B50Cbc", // RevenueDistributor地址
  tokenOID: "0xA0B29703394dA534FBA5BA5d19F498Ea26a67375", // Token OID地址
  tokenAgent: "0x5408BacC4b9EA83E668b190589ba3abF9f669350", // 部署时设置的Agent地址
  identityFactory: "0x83c4891414A91C972a2e3A292232Ba11bF6B3847", // IdentityFactory地址（当前未使用，但保留以备后用）
  identityImplementationAuthority: "0x198eAd02aeA8A83fE25582bd717E0F7542f31B60", // Identity ImplementationAuthority地址（当前未使用，但保留以备后用）
  mockOnchainID: "0xe7Fa360d0D3B7e4F4aF3d312645001BC1C2E7bAd", // MockOnchainID地址（Demo模式：所有用户共享）
  tokenInfo: {
    name: "RWA Energy Token",
    symbol: "RWAET",
    decimals: 0 // 从部署信息中获取：decimals为0表示无小数位
  }
};

// AssetRegistry ABI (简化版，只包含必要函数)
export const ASSET_REGISTRY_ABI = [
  "function registerAsset(string memory _assetId, string memory _assetType, string memory _location, uint256 _capacity, address _tokenContract) public",
  "function getAsset(string memory _assetId) public view returns (string memory assetId, string memory assetType, string memory location, uint256 capacity, uint256 installDate, uint256 totalRevenue, bool isActive, address tokenContract)",
  "function assets(string memory) public view returns (string memory assetId, string memory assetType, string location, uint256 capacity, uint256 installDate, uint256 totalRevenue, bool isActive, address tokenContract)",
  "function getAssetCount() public view returns (uint256)",
  "function getAssetsByToken(address _tokenContract) public view returns (string[] memory)",
  "function recordRevenue(string memory _assetId, uint256 _amount) public",
  "function updateAssetStatus(string memory _assetId, bool _isActive) public",
  "function owner() public view returns (address)",
  "event AssetRegistered(string indexed assetId, string assetType, string location, uint256 capacity, address indexed tokenContract)"
];

// RevenueDistributor ABI
export const REVENUE_DISTRIBUTOR_ABI = [
  "function distributeRevenue(uint256 _amount, string memory _assetId) public",
  "function calculateUserRevenue(address _user, uint256 _totalRevenue) public view returns (uint256)",
  "function addClaimableRevenue(address _user, uint256 _amount) public",
  "function batchAddClaimableRevenue(address[] memory _users, uint256[] memory _amounts) public",
  "function claimRevenue() public",
  "function claimableRevenue(address _user) public view returns (uint256)",
  "function totalDistributed() public view returns (uint256)",
  "function getBalance() public view returns (uint256)",
  "function tokenContract() public view returns (address)",
  "function assetRegistry() public view returns (address)",
  "function owner() public view returns (address)",
  "function emergencyWithdraw() public",
  "event RevenueDistributed(address indexed tokenContract, uint256 totalAmount, uint256 timestamp)",
  "event RevenueClaimed(address indexed user, uint256 amount, uint256 timestamp)"
];

// ERC-3643 Token ABI (简化版，只包含必要函数)
export const TOKEN_3643_ABI = [
  "function name() public view returns (string memory)",
  "function symbol() public view returns (string memory)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function mint(address _to, uint256 _amount) external",
  "function batchMint(address[] calldata _toList, uint256[] calldata _amounts) external",
  "function transfer(address _to, uint256 _amount) public returns (bool)",
  "function isVerified(address _userAddress) external view returns (bool)",
  "function isAgent(address _agent) public view returns (bool)"
];

// IdentityRegistry ABI (简化版)
export const IDENTITY_REGISTRY_ABI = [
  "function registerIdentity(address _userAddress, address _identity, uint16 _country) public",
  "function batchRegisterIdentity(address[] calldata _userAddresses, address[] calldata _identities, uint16[] calldata _countries) external",
  "function isVerified(address _userAddress) external view returns (bool)",
  "function contains(address _userAddress) external view returns (bool)",
  "function identity(address _userAddress) public view returns (address)",
  "function investorCountry(address _userAddress) external view returns (uint16)",
  "function isAgent(address _agent) public view returns (bool)"
];

// IERC20 标准 ABI (用于余额查询等)
export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

// Identity合约ABI (用于查询用户Claims)
export const IDENTITY_ABI = [
  "function getClaim(uint256 _claimId) public view returns (uint256 topic, uint256 scheme, address issuer, bytes memory signature, bytes memory data, string memory uri)",
  "function getClaimIdsByTopic(uint256 _topic) public view returns (bytes32[] memory claimIds)",
  "function keyHasPurpose(bytes32 _key, uint256 _purpose) public view returns (bool)",
  "function getKey(bytes32 _key) public view returns (uint256 purpose, uint256 keyType, bytes32 key)"
];

// MockOnchainID ABI (Demo模式：所有用户共享的Identity合约)
export const MOCK_ONCHAINID_ABI = [
  "function registerUser(address _user) external",
  "function isRegistered(address _user) external view returns (bool)",
  "function getClaim(bytes32 _claimId) external view returns (uint256 topic, uint256 scheme, address issuer, bytes memory signature, bytes memory data, string memory uri)",
  "function getClaimIdsByTopic(uint256 _topic) external view returns (bytes32[] memory claimIds)",
  "function keyHasPurpose(bytes32 _key, uint256 _purpose) external view returns (bool)",
  "function getKey(bytes32 _key) external view returns (uint256[] memory purposes, uint256 keyType, bytes32 key)",
  "function isClaimValid(address _identity, uint256 claimTopic, bytes calldata sig, bytes calldata data) external view returns (bool)",
  "function owner() public view returns (address)",
  "event UserRegistered(address indexed user)"
];
