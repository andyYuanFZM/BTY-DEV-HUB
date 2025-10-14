const { ethers } = require("hardhat");

async function main() {
  // 从部署信息文件读取合约地址
  const deploymentInfo = require('../deployment-info.json');
  const contractAddress = deploymentInfo.contractAddress;
  
  console.log("🔍 查看合约信息...");
  console.log("📍 合约地址:", contractAddress);
  console.log("🌐 网络:", deploymentInfo.network);

  // 获取合约实例
  const CustomERC20 = await ethers.getContractFactory("CustomERC20");
  const customERC20 = CustomERC20.attach(contractAddress);

  console.log("\n📊 合约信息:");
  console.log("  - 代币名称:", await customERC20.name());
  console.log("  - 代币符号:", await customERC20.symbol());
  console.log("  - 小数位数:", await customERC20.decimals());
  console.log("  - 总供应量:", ethers.utils.formatEther(await customERC20.totalSupply()));
  console.log("  - 支持增发:", await customERC20.mintable());
  console.log("  - Owner地址:", await customERC20.owner());

  console.log("\n🔗 BTY浏览器链接:", `https://mainnet.bityuan.com/address/${contractAddress}`);
  console.log("✅ 合约信息查看完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 查看失败:", error);
    process.exit(1);
  });
