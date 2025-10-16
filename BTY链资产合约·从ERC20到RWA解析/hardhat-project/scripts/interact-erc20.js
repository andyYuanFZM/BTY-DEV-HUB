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
  const signers = await ethers.getSigners();

  if (signers.length === 0) {
    throw new Error("没有找到可用的账户");
  }

  const owner = signers[0];
  // 用于代理转账
  const targetAddress = "0xcdf3504ab72ae9b886b971930d72d15577406659";
  // 上面地址对应的私钥
  const targetPrivateKey = "0x0baddb951661b328dd89fbb05374797beedd251e84d6e90909026a71720a49fa";
  // 用于接收代理转账 - 使用正确的校验和地址
  const receiverAddress = "0xd2f0a5971898f47dc1ac063d31acec5d37cce02e";

  console.log("账户信息:");
  console.log("  - Owner地址:", owner.address);
  console.log("  - 目标地址:", targetAddress);

  console.log("\n当前合约状态:");
  console.log("  - 代币名称:", await customERC20.name());
  console.log("  - 代币符号:", await customERC20.symbol());
  console.log("  - 总供应量:", ethers.utils.formatEther(await customERC20.totalSupply()));
  console.log("  - 支持增发:", await customERC20.mintable());
  console.log("  - Owner地址:", await customERC20.owner());

  console.log("\n账户余额:");
  console.log("  - Owner余额:", ethers.utils.formatEther(await customERC20.balanceOf(owner.address)));
  console.log("  - 目标地址余额:", ethers.utils.formatEther(await customERC20.balanceOf(targetAddress)));

  // 演示转账
  console.log("\n执行转账操作...");
  const transferAmount = ethers.utils.parseEther("1000");

  console.log(`  - 从Owner转账${ethers.utils.formatEther(transferAmount)}代币到目标地址`);
  const tx1 = await customERC20.transfer(targetAddress, transferAmount);
  await tx1.wait();
  console.log("  - 转账交易哈希:", tx1.hash);
  console.log("  - 转账成功！（BTY链hash格式已处理）");

  // 演示授权
  console.log("\n执行授权操作...");
  const approveAmount = ethers.utils.parseEther("500");

  console.log(`  - Owner授权目标地址使用${ethers.utils.formatEther(approveAmount)}代币`);
  const tx2 = await customERC20.approve(targetAddress, approveAmount);
  await tx2.wait();
  console.log("  - 授权交易哈希:", tx2.hash);
  console.log("  - 授权成功！（BTY链hash格式已处理）");

  // 演示代理转账
  console.log("\n执行代理转账操作...");
  const proxyTransferAmount = ethers.utils.parseEther("200");

  console.log(`  - 目标地址代表Owner转账${ethers.utils.formatEther(proxyTransferAmount)}代币到接收地址`);
  console.log(`  - 接收地址: ${receiverAddress}`);

  // 检查授权额度
  const allowance = await customERC20.allowance(owner.address, targetAddress);
  console.log("  - 当前授权额度:", ethers.utils.formatEther(allowance));

  if (allowance.gte(proxyTransferAmount)) {

    const targetSigner = new ethers.Wallet(targetPrivateKey, ethers.provider);

    console.log("  - 使用目标地址私钥执行代理转账");
    let txHash = null;

    try {
      // 尝试执行代理转账
      const tx3 = await customERC20.connect(targetSigner).transferFrom(owner.address, receiverAddress, proxyTransferAmount);
      txHash = tx3.hash;

    } catch (error) {
      // 处理BTY链hash格式不匹配的问题
      if (error.message && error.message.includes("Transaction hash mismatch")) {
        const match = error.message.match(/returnedHash="(0x[0-9a-fA-F]+)"/);
        if (match) {
          txHash = match[1]; // 获取链上真实hash
          console.log("  - 代理转账交易哈希:", txHash);
        } 
      } else {
        console.error("  - 代理转账失败:", error.message);
      }
    }
    // 等交易确认
    if (txHash) {
      const receipt = await ethers.provider.waitForTransaction(txHash);
    
      if (!receipt) {
        console.log(`链上没有找到交易记录，可能节点同步延迟，txHash = ${txHash}`);
      } else if (receipt.status === 1) {
        console.log(`代理转账执行成功 | blockNumber=${receipt.blockNumber}`);
      } else {
        console.log(`代理转账执行失败 | status=0 | 请检查交易回执`);
      }
    }

  } else {
    console.log("  - 授权额度不足，无法执行代理转账");
    console.log("  - 需要更多授权额度");
  }

  // 演示增发
  console.log("\n执行增发操作...");
  const mintAmount = ethers.utils.parseEther("5000");

  console.log(`  - Owner增发${ethers.utils.formatEther(mintAmount)}代币给目标地址`);
  const tx4 = await customERC20.mint(targetAddress, mintAmount);

  await tx4.wait();
  console.log("  - 增发交易哈希:", tx4.hash);
  console.log("  - 增发成功！（BTY链hash格式已处理）");

  console.log("\n操作后状态:");
  console.log("  - 总供应量:", ethers.utils.formatEther(await customERC20.totalSupply()));
  console.log("  - Owner余额:", ethers.utils.formatEther(await customERC20.balanceOf(owner.address)));
  console.log("  - 目标地址余额:", ethers.utils.formatEther(await customERC20.balanceOf(targetAddress)));
  console.log("  - 接收地址余额:", ethers.utils.formatEther(await customERC20.balanceOf(receiverAddress)));
  console.log("  - 目标地址授权额度:", ethers.utils.formatEther(await customERC20.allowance(owner.address, targetAddress)));

  console.log("\n所有操作完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("操作失败:", error);
    process.exit(1);
  });
