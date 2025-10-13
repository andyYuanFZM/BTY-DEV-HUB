# BTY链ERC20合约工程

> 🚀 **完整的Hardhat项目，用于部署ERC20代币合约到BTY测试链**

## 📋 项目结构

```
hardhat-project/
├── contracts/          # 智能合约源码
│   └── MyToken.sol     # ERC20代币合约
├── scripts/           # 部署脚本
│   └── deploy.js      # 合约部署脚本
├── test/              # 测试文件
│   └── MyToken.test.js # 合约测试
├── hardhat.config.js  # Hardhat配置
└── package.json       # 依赖管理
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 编译合约

```bash
npx hardhat compile
```

### 3. 运行测试

```bash
npx hardhat test
```

### 4. 部署到BTY测试网

```bash
npx hardhat run scripts/deploy.js --network bty-testnet
```

## 📚 合约说明

### MyToken.sol

这是一个基于OpenZeppelin的ERC20代币合约，包含以下功能：

- ✅ 标准ERC20接口
- ✅ 代币名称和符号
- ✅ 初始供应量
- ✅ 转账和授权功能
- ✅ 事件日志

### 主要特性

- **安全性** - 使用OpenZeppelin标准库
- **可扩展性** - 支持后续功能扩展
- **Gas优化** - 经过优化的Gas消耗
- **完整测试** - 包含完整的单元测试

## 🔧 配置说明

### hardhat.config.js

```javascript
module.exports = {
  networks: {
    "bty-testnet": {
      url: "http://localhost:8546",
      chainId: 6999,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

## 📝 使用说明

1. **设置私钥** - 在`.env`文件中设置你的私钥
2. **启动BTY测试链** - 确保BTY测试链正在运行
3. **部署合约** - 运行部署脚本
4. **验证部署** - 在BTY浏览器中查看合约

## 🎯 下一步

- 查看`frontend-project`了解前端交互
- 学习如何与合约交互
- 探索更多ERC20功能

## 📚 相关资源

- [Hardhat官方文档](https://hardhat.org/docs)
- [OpenZeppelin合约库](https://docs.openzeppelin.com/contracts/)
- [BTY官方文档](https://docs.bityuan.com/)
