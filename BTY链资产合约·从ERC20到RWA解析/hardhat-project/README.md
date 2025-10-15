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
│   ├── verify-erc20.js          # ERC20验证脚本 ✅
│   ├── verify-erc1404.js        # ERC1404验证脚本 🔜
│   └── verify-erc3643.js        # ERC3643验证脚本 🔜
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

# 部署ERC1404到BTY测试网
npm run deploy:erc1404:testnet

# 部署ERC3643到BTY测试网
npm run deploy:erc3643:testnet
```

### 6. 交互测试
```bash
# 与ERC20合约交互
npm run interact:erc20

# 与ERC1404合约交互
npm run interact:erc1404

# 与ERC3643合约交互
npm run interact:erc3643
```

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
