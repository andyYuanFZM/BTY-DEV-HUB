import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

/**
 * RWA系统交互脚本
 * 演示完整的RWA流程：设备登记、收益分配等
 */
async function main() {
  // 读取部署信息
  const deploymentPath = path.join(__dirname, '..', 'bty-deployment-info.json');
  
  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ 未找到部署信息文件，请先运行部署脚本');
    console.log('   执行: npm run deploy:bty');
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  console.log('🔷 RWA系统交互测试');
  console.log('='.repeat(60));
  console.log('');

  // 获取账户（参考 interact-erc20.js 的安全做法）
  const signers = await ethers.getSigners();
  
  if (signers.length === 0) {
    throw new Error('没有找到可用的账户，请检查 .env 文件中的 PRIVATE_KEY 配置');
  }
  
  const owner = signers[0];
  const user1 = signers[1] || signers[0]; // 如果没有第二个账户，使用第一个
  const user2 = signers[2] || signers[0]; // 如果没有第三个账户，使用第一个
  
  console.log('📋 账户信息：');
  console.log('   Owner:', owner.address);
  console.log('   User1:', user1.address);
  console.log('   User2:', user2.address);
  console.log('');

  // 获取合约实例
  const Token = await ethers.getContractFactory('Token');
  const AssetRegistry = await ethers.getContractFactory('AssetRegistry');
  const RevenueDistributor = await ethers.getContractFactory('RevenueDistributor');

  const token = Token.attach(deploymentInfo.proxies.token);
  const assetRegistry = AssetRegistry.attach(deploymentInfo.rwa.assetRegistry);
  const revenueDistributor = RevenueDistributor.attach(deploymentInfo.rwa.revenueDistributor);

  console.log('📝 合约地址：');
  console.log('   Token:', token.address);
  console.log('   AssetRegistry:', assetRegistry.address);
  console.log('   RevenueDistributor:', revenueDistributor.address);
  console.log('');

  // 1. 查看代币信息
  console.log('1️⃣  查看代币信息');
  console.log('-'.repeat(60));
  try {
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    console.log('   名称:', name);
    console.log('   符号:', symbol);
    console.log('   总供应量:', ethers.utils.formatEther(totalSupply));
  } catch (error: any) {
    console.log('   ⚠️  无法获取代币信息（可能需要先初始化）');
  }
  console.log('');

  // 2. 注册设备
  console.log('2️⃣  注册新能源设备');
  console.log('-'.repeat(60));
  try {
    await assetRegistry.registerAsset(
      'PV-001',
      '光伏',
      '北京市朝阳区',
      ethers.utils.parseUnits('100', 3), // 100kW
      token.address
    );
    console.log('   ✅ 设备注册成功: PV-001 (100kW光伏)');
    
    const asset = await assetRegistry.getAsset('PV-001');
    console.log('   设备ID:', asset.assetId);
    console.log('   设备类型:', asset.assetType);
    console.log('   位置:', asset.location);
    console.log('   容量:', ethers.utils.formatUnits(asset.capacity, 3), 'kW');
  } catch (error: any) {
    console.log('   ❌ 设备注册失败:', error.message);
  }
  console.log('');

  // 3. 记录收益
  console.log('3️⃣  记录设备收益');
  console.log('-'.repeat(60));
  try {
    const revenueAmount = ethers.utils.parseEther('10000');
    await revenueDistributor.distributeRevenue(revenueAmount, 'PV-001');
    console.log('   ✅ 收益记录成功:', ethers.utils.formatEther(revenueAmount), 'ETH');
    
    const asset = await assetRegistry.getAsset('PV-001');
    console.log('   累计收益:', ethers.utils.formatEther(asset.totalRevenue), 'ETH');
  } catch (error: any) {
    console.log('   ❌ 收益记录失败:', error.message);
  }
  console.log('');

  // 4. 计算用户收益
  console.log('4️⃣  计算用户应得收益');
  console.log('-'.repeat(60));
  try {
    const revenueAmount = ethers.utils.parseEther('10000');
    
    // 注意：这里需要用户已经有代币余额
    const user1Revenue = await revenueDistributor.calculateUserRevenue(user1.address, revenueAmount);
    const user2Revenue = await revenueDistributor.calculateUserRevenue(user2.address, revenueAmount);
    
    console.log('   User1 应得收益:', ethers.utils.formatEther(user1Revenue), 'ETH');
    console.log('   User2 应得收益:', ethers.utils.formatEther(user2Revenue), 'ETH');
  } catch (error: any) {
    console.log('   ⚠️  计算收益（可能需要先分配代币）');
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('🎉 RWA系统交互测试完成！');
  console.log('='.repeat(60));
  console.log('');
  console.log('📝 提示：');
  console.log('   - 完整的RWA流程需要先完成身份验证和代币分配');
  console.log('   - 详细操作请参考 BTY-部署指南.md');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 交互失败:', error);
    process.exit(1);
  });
