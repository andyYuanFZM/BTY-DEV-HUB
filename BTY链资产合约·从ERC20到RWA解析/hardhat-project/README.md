# BTY链智能合约工程

> 🚀 **Hardhat项目 - 多类型智能合约开发与部署（ERC20/ERC1404/ERC3643等）**

## 📋 项目结构

```
hardhat-project/
├── contracts/                    # 智能合约源码
│   ├── CustomERC20.sol          # ERC20代币合约 ✅
│   ├── CustomERC1404.sol        # ERC1404证券化代币合约 🔜
│   └── CustomERC3643.sol        # ERC3643身份代币合约 🔜
├── scripts/                     # 部署和交互脚本
│   ├── deploy-erc20.js          # ERC20部署脚本 ✅
│   ├── deploy-erc1404.js        # ERC1404部署脚本 🔜
│   ├── deploy-erc3643.js        # ERC3643部署脚本 🔜
│   ├── interact-erc20.js        # ERC20交互脚本 ✅
│   ├── interact-erc1404.js      # ERC1404交互脚本 🔜
│   ├── interact-erc3643.js      # ERC3643交互脚本 🔜
├── test/                        # 测试文件
│   ├── ERC20.test.js            # ERC20测试 ✅
│   ├── ERC1404.test.js          # ERC1404测试 🔜
│   └── ERC3643.test.js          # ERC3643测试 🔜
├── hardhat.config.js            # Hardhat配置
├── package.json                 # 依赖管理
├── .env                         # 环境变量配置
```

**状态说明**：
- ✅ **已完成** - 当前可用的功能
- 🔜 **即将推出** - 计划中的功能

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境
```bash
# 编辑.env文件，设置私钥
PRIVATE_KEY=your_private_key_here
```

### 3. 编译合约
```bash
npm run compile
```

### 4. 运行测试
```bash
npm test
```

### 5. 部署合约
```bash
# 部署ERC20到BTY测试网
npm run deploy:erc20:testnet

```

### 6. 交互测试
```bash
# 与ERC20合约交互
npm run interact:erc20:testnet

```

> **📝 BTY链Hash格式兼容处理说明**
> 
> **问题背景**：
> 由于BTY链最初兼容BTC地址格式，后续增加以太坊兼容性，导致链上返回BTC格式的hash，而ethers.js期望以太坊格式hash，因此某些情况下会出现"Transaction hash mismatch"错误。 
> 
> **为什么需要复杂的try-catch处理**：
> 正常情况下，以太坊合约交互只需要1-2行代码：
> ```javascript
> const tx = await contract.transferFrom(from, to, amount);
> await tx.wait(); // 等待交易确认
> ```
> 
> 但在BTY链上，由于hash格式不匹配，会出现以下情况：
> 1. **交易发送成功**：`transferFrom()` 调用成功后，交易上链，但是ethers.js检查hash不匹配抛出错误信息
> 2. **无法获取真实hash**：错误信息中包含真实的链上hash，但需要从错误消息中提取
> 
> **解决方案对比**：
> - **配置方案**：可以通地过调整BTY测试链中的配置（`enableRlpTxHash=true` 且 `enableTxQuickIndex=false`）来固定返回以太坊格式hash
> - **代码方案**：通过catch块处理hash不匹配错误
> 
> **选择代码方案的原因**：
> 由于后续连接BTY公共RPC节点时，无法保证所有节点都采用相同配置，因此在代码中建议通过catch块处理hash不匹配错误是相对保险的解决方案。
> 
> **Hash兼容处理的具体实现**： 具体参考：/scripts/interact-erc20.js中的83-101行
> ```javascript
> try {
>   const tx = await contract.transferFrom(from, to, amount);
>   await tx.wait(); // 正常情况
> } catch (error) {
>   if (error.message.includes("Transaction hash mismatch")) {
>     // 从错误信息中提取真实hash
>     const match = error.message.match(/returnedHash="(0x[0-9a-fA-F]+)"/);
>     if (match) {
>       const realHash = match[1];
>       // 使用真实hash等待交易确认
>       const receipt = await provider.waitForTransaction(realHash);
>     }
>   }
> }
> ```

## 📝 可用命令

### 编译相关
- `npm run compile` - 编译合约
- `npm run clean` - 清理编译缓存

### 测试相关
- `npm test` - 运行所有测试
- `npm run test:erc20` - 运行ERC20测试 ✅
- `npm run test:erc1404` - 运行ERC1404测试 🔜
- `npm run test:erc3643` - 运行ERC3643测试 🔜

### 部署相关
- `npm run deploy:erc20:testnet` - 部署ERC20到测试网 ✅
- `npm run deploy:erc20:mainnet` - 部署ERC20到主网 ✅
- `npm run deploy:erc1404:testnet` - 部署ERC1404到测试网 🔜
- `npm run deploy:erc1404:mainnet` - 部署ERC1404到主网 🔜
- `npm run deploy:erc3643:testnet` - 部署ERC3643到测试网 🔜
- `npm run deploy:erc3643:mainnet` - 部署ERC3643到主网 🔜

### 交互相关
- `npm run interact:erc20` - 与ERC20合约交互 ✅
- `npm run interact:erc1404` - 与ERC1404合约交互 🔜
- `npm run interact:erc3643` - 与ERC3643合约交互 🔜
- `npm run verify:erc20` - 验证ERC20合约信息 ✅
- `npm run verify:erc1404` - 验证ERC1404合约信息 🔜
- `npm run verify:erc3643` - 验证ERC3643合约信息 🔜

## 🔧 环境配置

在`.env`文件中配置以下变量：

```bash
# 私钥配置
PRIVATE_KEY=your_private_key_here

```

## 📊 部署信息

部署完成后会生成`deployment-info.json`文件，包含合约地址、部署者信息等。
