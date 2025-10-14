const { ethers } = require("hardhat");

async function main() {
  // 从部署信息文件读取合约地址
  const deploymentInfo = require('../deployment-info.json');
  const contractAddress = deploymentInfo.contractAddress;
  
  console.log("🔗 连接到已部署的合约...");
  console.log("📍 合约地址:", contractAddress);

  // 获取合约实例
  const CustomERC20 = await ethers.getContractFactory("CustomERC20");
  const customERC20 = CustomERC20.attach(contractAddress);

  // 获取账户
  const [owner, addr1, addr2] = await ethers.getSigners();
  
  console.log("\n📊 当前合约状态:");
  console.log("  - 代币名称:", await customERC20.name());
  console.log("  - 代币符号:", await customERC20.symbol());
  console.log("  - 总供应量:", ethers.utils.formatEther(await customERC20.totalSupply()));
  console.log("  - 支持增发:", await customERC20.mintable());
  console.log("  - Owner地址:", await customERC20.owner());

  console.log("\n💰 账户余额:");
  console.log("  - Owner余额:", ethers.utils.formatEther(await customERC20.balanceOf(owner.address)));
  console.log("  - Addr1余额:", ethers.utils.formatEther(await customERC20.balanceOf(addr1.address)));
  console.log("  - Addr2余额:", ethers.utils.formatEther(await customERC20.balanceOf(addr2.address)));

  // 演示转账
  console.log("\n🔄 执行转账操作...");
  const transferAmount = ethers.utils.parseEther("1000");
  
  console.log(`  - 从Owner转账${ethers.utils.formatEther(transferAmount)}代币到Addr1`);
  const tx1 = await customERC20.transfer(addr1.address, transferAmount);
  await tx1.wait();
  console.log("  - 转账交易哈希:", tx1.hash);

  // 演示授权
  console.log("\n🔐 执行授权操作...");
  const approveAmount = ethers.utils.parseEther("500");
  
  console.log(`  - Owner授权Addr1使用${ethers.utils.formatEther(approveAmount)}代币`);
  const tx2 = await customERC20.approve(addr1.address, approveAmount);
  await tx2.wait();
  console.log("  - 授权交易哈希:", tx2.hash);

  // 演示代理转账
  console.log("\n🔄 执行代理转账操作...");
  const proxyTransferAmount = ethers.utils.parseEther("200");
  
  console.log(`  - Addr1代表Owner转账${ethers.utils.formatEther(proxyTransferAmount)}代币到Addr2`);
  const tx3 = await customERC20.connect(addr1).transferFrom(owner.address, addr2.address, proxyTransferAmount);
  await tx3.wait();
  console.log("  - 代理转账交易哈希:", tx3.hash);

  // 演示增发
  console.log("\n🪙 执行增发操作...");
  const mintAmount = ethers.utils.parseEther("5000");
  
  console.log(`  - Owner增发${ethers.utils.formatEther(mintAmount)}代币给Addr1`);
  const tx4 = await customERC20.mint(addr1.address, mintAmount);
  await tx4.wait();
  console.log("  - 增发交易哈希:", tx4.hash);

  console.log("\n📊 操作后状态:");
  console.log("  - 总供应量:", ethers.utils.formatEther(await customERC20.totalSupply()));
  console.log("  - Owner余额:", ethers.utils.formatEther(await customERC20.balanceOf(owner.address)));
  console.log("  - Addr1余额:", ethers.utils.formatEther(await customERC20.balanceOf(addr1.address)));
  console.log("  - Addr2余额:", ethers.utils.formatEther(await customERC20.balanceOf(addr2.address)));
  console.log("  - Addr1授权额度:", ethers.utils.formatEther(await customERC20.allowance(owner.address, addr1.address)));

  console.log("\n✅ 所有操作完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 操作失败:", error);
    process.exit(1);
  });
