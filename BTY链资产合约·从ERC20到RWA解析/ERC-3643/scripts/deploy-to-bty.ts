import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import OnchainID from '@onchain-id/solidity';
import { BigNumber } from 'ethers';

/**
 * 部署ERC-3643完整套件到BTY测试网
 * 参考test/fixtures/deploy-full-suite.fixture.ts
 */
async function main() {
  // 获取账户（参考 deploy-erc20.js 的安全做法）
  const signers = await ethers.getSigners();
  
  if (signers.length === 0) {
    throw new Error('没有找到可用的账户，请检查 .env 文件中的 PRIVATE_KEY 配置');
  }
  
  const deployer = signers[0];
  const tokenIssuer = signers[1] || signers[0]; // 如果没有第二个账户，使用第一个
  const tokenAgent = signers[2] || signers[0]; // 如果没有第三个账户，使用第一个
  
  console.log('🔷 部署ERC-3643系统到BTY测试网...');
  console.log('部署账户:', deployer.address);
  console.log('账户余额:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH');
  console.log('');

  // 1. 部署实现合约
  console.log('📝 步骤1: 部署实现合约...');
  
  const claimTopicsRegistryImplementation = await ethers.deployContract('ClaimTopicsRegistry', deployer);
  await claimTopicsRegistryImplementation.deployed();
  console.log('   ✅ ClaimTopicsRegistry Implementation:', claimTopicsRegistryImplementation.address);

  const trustedIssuersRegistryImplementation = await ethers.deployContract('TrustedIssuersRegistry', deployer);
  await trustedIssuersRegistryImplementation.deployed();
  console.log('   ✅ TrustedIssuersRegistry Implementation:', trustedIssuersRegistryImplementation.address);

  const identityRegistryStorageImplementation = await ethers.deployContract('IdentityRegistryStorage', deployer);
  await identityRegistryStorageImplementation.deployed();
  console.log('   ✅ IdentityRegistryStorage Implementation:', identityRegistryStorageImplementation.address);

  const identityRegistryImplementation = await ethers.deployContract('IdentityRegistry', deployer);
  await identityRegistryImplementation.deployed();
  console.log('   ✅ IdentityRegistry Implementation:', identityRegistryImplementation.address);

  const modularComplianceImplementation = await ethers.deployContract('ModularCompliance', deployer);
  await modularComplianceImplementation.deployed();
  console.log('   ✅ ModularCompliance Implementation:', modularComplianceImplementation.address);

  const tokenImplementation = await ethers.deployContract('Token', deployer);
  await tokenImplementation.deployed();
  console.log('   ✅ Token Implementation:', tokenImplementation.address);
  console.log('');

  // 2. 部署Identity相关合约
  console.log('📝 步骤2: 部署Identity相关合约...');
  
  const identityImplementation = await new ethers.ContractFactory(
    OnchainID.contracts.Identity.abi,
    OnchainID.contracts.Identity.bytecode,
    deployer,
  ).deploy(deployer.address, true);
  await identityImplementation.deployed();
  console.log('   ✅ Identity Implementation:', identityImplementation.address);

  const identityImplementationAuthority = await new ethers.ContractFactory(
    OnchainID.contracts.ImplementationAuthority.abi,
    OnchainID.contracts.ImplementationAuthority.bytecode,
    deployer,
  ).deploy(identityImplementation.address);
  await identityImplementationAuthority.deployed();
  console.log('   ✅ Identity ImplementationAuthority:', identityImplementationAuthority.address);

  const identityFactory = await new ethers.ContractFactory(
    OnchainID.contracts.Factory.abi,
    OnchainID.contracts.Factory.bytecode,
    deployer,
  ).deploy(identityImplementationAuthority.address);
  await identityFactory.deployed();
  console.log('   ✅ Identity Factory:', identityFactory.address);
  console.log('');

  // 3. 部署TREXImplementationAuthority
  console.log('📝 步骤3: 部署TREXImplementationAuthority...');
  
  const trexImplementationAuthority = await ethers.deployContract(
    'TREXImplementationAuthority',
    [true, ethers.constants.AddressZero, ethers.constants.AddressZero],
    deployer,
  );
  await trexImplementationAuthority.deployed();
  console.log('   ✅ TREXImplementationAuthority:', trexImplementationAuthority.address);

  const versionStruct = {
    major: 4,
    minor: 0,
    patch: 0,
  };
  const contractsStruct = {
    tokenImplementation: tokenImplementation.address,
    ctrImplementation: claimTopicsRegistryImplementation.address,
    irImplementation: identityRegistryImplementation.address,
    irsImplementation: identityRegistryStorageImplementation.address,
    tirImplementation: trustedIssuersRegistryImplementation.address,
    mcImplementation: modularComplianceImplementation.address,
  };
  
  await trexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);
  console.log('   ✅ TREX版本已注册');
  console.log('');

  // 4. 部署TREXFactory
  console.log('📝 步骤4: 部署TREXFactory...');
  
  const trexFactory = await ethers.deployContract(
    'TREXFactory',
    [trexImplementationAuthority.address, identityFactory.address],
    deployer,
  );
  await trexFactory.deployed();
  console.log('   ✅ TREXFactory:', trexFactory.address);

  await identityFactory.connect(deployer).addTokenFactory(trexFactory.address);
  console.log('   ✅ Identity Factory已绑定TREXFactory');
  console.log('');

  // 5. 部署代理合约
  console.log('📝 步骤5: 部署代理合约...');
  
  const claimTopicsRegistryProxy = await ethers.deployContract(
    'ClaimTopicsRegistryProxy',
    [trexImplementationAuthority.address],
    deployer,
  );
  await claimTopicsRegistryProxy.deployed();
  const claimTopicsRegistry = await ethers.getContractAt('ClaimTopicsRegistry', claimTopicsRegistryProxy.address);
  console.log('   ✅ ClaimTopicsRegistry Proxy:', claimTopicsRegistry.address);

  const trustedIssuersRegistryProxy = await ethers.deployContract(
    'TrustedIssuersRegistryProxy',
    [trexImplementationAuthority.address],
    deployer,
  );
  await trustedIssuersRegistryProxy.deployed();
  const trustedIssuersRegistry = await ethers.getContractAt('TrustedIssuersRegistry', trustedIssuersRegistryProxy.address);
  console.log('   ✅ TrustedIssuersRegistry Proxy:', trustedIssuersRegistry.address);

  const identityRegistryStorageProxy = await ethers.deployContract(
    'IdentityRegistryStorageProxy',
    [trexImplementationAuthority.address],
    deployer,
  );
  await identityRegistryStorageProxy.deployed();
  const identityRegistryStorage = await ethers.getContractAt('IdentityRegistryStorage', identityRegistryStorageProxy.address);
  console.log('   ✅ IdentityRegistryStorage Proxy:', identityRegistryStorage.address);

  const identityRegistryProxy = await ethers.deployContract(
    'IdentityRegistryProxy',
    [
      trexImplementationAuthority.address,
      trustedIssuersRegistry.address,
      claimTopicsRegistry.address,
      identityRegistryStorage.address,
    ],
    deployer,
  );
  await identityRegistryProxy.deployed();
  const identityRegistry = await ethers.getContractAt('IdentityRegistry', identityRegistryProxy.address);
  console.log('   ✅ IdentityRegistry Proxy:', identityRegistry.address);

  const defaultCompliance = await ethers.deployContract('DefaultCompliance', deployer);
  await defaultCompliance.deployed();
  console.log('   ✅ DefaultCompliance:', defaultCompliance.address);
  console.log('');

  // 6. 绑定IdentityRegistryStorage
  console.log('📝 步骤6: 绑定IdentityRegistryStorage...');
  await identityRegistryStorage.connect(deployer).bindIdentityRegistry(identityRegistry.address);
  console.log('   ✅ IdentityRegistryStorage已绑定');
  console.log('');

  // 7. 部署Token OID和Token
  console.log('📝 步骤7: 部署Token...');
  
  const tokenOIDProxy = await new ethers.ContractFactory(
    OnchainID.contracts.IdentityProxy.abi,
    OnchainID.contracts.IdentityProxy.bytecode,
    deployer,
  ).deploy(identityImplementationAuthority.address, tokenIssuer.address);
  await tokenOIDProxy.deployed();
  const tokenOID = await ethers.getContractAt('Identity', tokenOIDProxy.address);
  console.log('   ✅ Token OID:', tokenOID.address);

  const tokenName = 'RWA Energy Token';
  const tokenSymbol = 'RWAET';
  const tokenDecimals = BigNumber.from('0');
  
  const tokenProxy = await ethers.deployContract(
    'TokenProxy',
    [
      trexImplementationAuthority.address,
      identityRegistry.address,
      defaultCompliance.address,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      tokenOID.address,
    ],
    deployer,
  );
  await tokenProxy.deployed();
  const token = await ethers.getContractAt('Token', tokenProxy.address);
  console.log('   ✅ Token Proxy:', token.address);
  console.log('');

  // 8. 添加Agent
  console.log('📝 步骤8: 配置Token Agent...');
  await token.connect(deployer).addAgent(tokenAgent.address);
  await identityRegistry.connect(deployer).addAgent(tokenAgent.address);
  await identityRegistry.connect(deployer).addAgent(token.address);
  console.log('   ✅ Agent已添加');
  console.log('');

  // 9. 部署RWA扩展合约
  console.log('📝 步骤9: 部署RWA扩展合约...');
  
  const AssetRegistry = await ethers.getContractFactory('AssetRegistry');
  const assetRegistry = await AssetRegistry.deploy();
  await assetRegistry.deployed();
  console.log('   ✅ AssetRegistry:', assetRegistry.address);

  const RevenueDistributor = await ethers.getContractFactory('RevenueDistributor');
  const revenueDistributor = await RevenueDistributor.deploy(token.address, assetRegistry.address);
  await revenueDistributor.deployed();
  console.log('   ✅ RevenueDistributor:', revenueDistributor.address);
  
  // 部署MockOnchainID（Demo模式：所有用户共享同一个Mock合约）
  const MockOnchainID = await ethers.getContractFactory('MockOnchainID');
  const mockOnchainID = await MockOnchainID.deploy();
  await mockOnchainID.deployed();
  console.log('   ✅ MockOnchainID (共享):', mockOnchainID.address);
  console.log('');

  // 10. 保存部署信息
  const deploymentInfo = {
    network: 'bty-testnet',
    deployer: deployer.address,
    tokenIssuer: tokenIssuer.address,
    tokenAgent: tokenAgent.address,
    timestamp: new Date().toISOString(),
    implementations: {
      claimTopicsRegistry: claimTopicsRegistryImplementation.address,
      trustedIssuersRegistry: trustedIssuersRegistryImplementation.address,
      identityRegistryStorage: identityRegistryStorageImplementation.address,
      identityRegistry: identityRegistryImplementation.address,
      modularCompliance: modularComplianceImplementation.address,
      token: tokenImplementation.address,
      identity: identityImplementation.address,
    },
    authorities: {
      trexImplementationAuthority: trexImplementationAuthority.address,
      identityImplementationAuthority: identityImplementationAuthority.address,
    },
    factories: {
      trexFactory: trexFactory.address,
      identityFactory: identityFactory.address,
    },
    proxies: {
      claimTopicsRegistry: claimTopicsRegistry.address,
      trustedIssuersRegistry: trustedIssuersRegistry.address,
      identityRegistryStorage: identityRegistryStorage.address,
      identityRegistry: identityRegistry.address,
      token: token.address,
      tokenOID: tokenOID.address,
    },
    compliance: {
      defaultCompliance: defaultCompliance.address,
    },
    rwa: {
      assetRegistry: assetRegistry.address,
      revenueDistributor: revenueDistributor.address,
      mockOnchainID: mockOnchainID.address,
    },
    tokenInfo: {
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals.toString(),
    },
  };

  const deploymentPath = path.join(__dirname, '..', 'bty-deployment-info.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('📄 部署信息已保存到:', deploymentPath);
  console.log('');

  console.log('='.repeat(60));
  console.log('🎉 ERC-3643系统部署完成！');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 核心合约地址：');
  console.log('   Token:', token.address);
  console.log('   IdentityRegistry:', identityRegistry.address);
  console.log('   DefaultCompliance:', defaultCompliance.address);
  console.log('   AssetRegistry:', assetRegistry.address);
  console.log('   RevenueDistributor:', revenueDistributor.address);
  console.log('   MockOnchainID (Demo):', mockOnchainID.address);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 部署失败:', error);
    process.exit(1);
  });
