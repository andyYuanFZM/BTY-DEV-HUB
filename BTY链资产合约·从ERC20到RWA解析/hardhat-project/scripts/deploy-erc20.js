const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 开始部署CustomERC20合约...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📝 部署者地址:", deployer.address);
  console.log("💰 部署者余额:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // 合约参数
  const tokenName = "BTY Test Token";
  const tokenSymbol = "BTT";
  const initialSupply = 1000000; // 100万代币
  const mintable = true;

  console.log("📋 合约参数:");
  console.log("  - 代币名称:", tokenName);
  console.log("  - 代币符号:", tokenSymbol);
  console.log("  - 小数位数: 18 (固定)");
  console.log("  - 初始供应量:", initialSupply);
  console.log("  - 支持增发:", mintable);

  // 部署合约
  const CustomERC20 = await ethers.getContractFactory("CustomERC20");
  const customERC20 = await CustomERC20.deploy(
    tokenName,
    tokenSymbol,
    initialSupply,
    mintable
  );

  await customERC20.deployed();

  console.log("✅ 合约部署成功!");
  console.log("📍 合约地址:", customERC20.address);
  console.log("🔗 区块链浏览器:", `https://mainnet.bityuan.com/address/${customERC20.address}`);

  // 验证合约信息
  console.log("\n📊 合约信息验证:");
  console.log("  - 代币名称:", await customERC20.name());
  console.log("  - 代币符号:", await customERC20.symbol());
  console.log("  - 小数位数:", await customERC20.decimals());
  console.log("  - 总供应量:", ethers.utils.formatEther(await customERC20.totalSupply()));
  console.log("  - 部署者余额:", ethers.utils.formatEther(await customERC20.balanceOf(deployer.address)));
  console.log("  - 支持增发:", await customERC20.mintable());

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: customERC20.address,
    deployer: deployer.address,
    tokenName: tokenName,
    tokenSymbol: tokenSymbol,
    tokenDecimals: 18,
    initialSupply: initialSupply,
    mintable: mintable,
    deploymentTime: new Date().toISOString(),
    transactionHash: customERC20.deployTransaction.hash
  };

  console.log("\n💾 部署信息已保存到 deployment-info.json");
  require('fs').writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
