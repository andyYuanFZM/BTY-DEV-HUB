# BTY链ERC20前端交互工程

> 🎨 **完整的前端项目，用于与BTY链上的ERC20合约交互**

## 📋 项目结构

```
frontend-project/
├── src/               # 前端源码
│   ├── components/    # React组件
│   ├── utils/         # 工具函数
│   └── App.js         # 主应用组件
├── public/            # 静态资源
├── package.json       # 依赖管理
└── README.md          # 使用说明
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm start
```

### 3. 构建生产版本

```bash
npm run build
```

## 🎯 功能特性

### 核心功能

- ✅ **钱包连接** - 支持MetaMask钱包连接
- ✅ **余额查询** - 实时查询代币余额
- ✅ **转账功能** - 发送代币到指定地址
- ✅ **授权管理** - 管理代币授权额度
- ✅ **交易历史** - 查看转账记录
- ✅ **网络切换** - 支持BTY主网和测试网

### 技术栈

- **React** - 前端框架
- **Web3.js** - 区块链交互
- **ethers.js** - 以太坊兼容库
- **Bootstrap** - UI组件库
- **Axios** - HTTP请求库

## 🔧 配置说明

### 环境变量

```bash
# .env文件
REACT_APP_CONTRACT_ADDRESS=0x...  # 合约地址
REACT_APP_NETWORK_ID=6999         # 网络ID
REACT_APP_RPC_URL=http://localhost:8546  # RPC地址
```

### 网络配置

```javascript
const networks = {
  btyTestnet: {
    chainId: 6999,
    rpcUrl: 'http://localhost:8546',
    name: 'BTY Testnet'
  },
  btyMainnet: {
    chainId: 2999,
    rpcUrl: 'https://mainnet.bityuan.com/eth',
    name: 'BTY Mainnet'
  }
};
```

## 📱 界面功能

### 主要页面

1. **首页** - 钱包连接和网络状态
2. **代币管理** - 余额查询和转账功能
3. **授权管理** - 代币授权和取消授权
4. **交易记录** - 历史交易查询
5. **设置** - 网络配置和合约地址

### 交互流程

1. **连接钱包** - 点击连接MetaMask
2. **选择网络** - 切换到BTY网络
3. **查询余额** - 查看代币余额
4. **执行转账** - 发送代币交易
5. **确认交易** - 在钱包中确认

## 🛠️ 开发说明

### 项目特点

- **响应式设计** - 支持移动端和桌面端
- **错误处理** - 完善的错误提示和处理
- **加载状态** - 交易过程中的加载提示
- **交易确认** - 交易状态的实时更新

### 代码结构

```javascript
// 主要组件
├── WalletConnect.js    # 钱包连接组件
├── TokenBalance.js     # 余额显示组件
├── TransferForm.js     # 转账表单组件
├── ApprovalManager.js  # 授权管理组件
└── TransactionList.js  # 交易列表组件
```

## 🎯 使用流程

1. **启动BTY测试链** - 确保测试链正在运行
2. **部署ERC20合约** - 使用hardhat-project部署合约
3. **配置前端** - 设置合约地址和网络配置
4. **启动前端** - 运行前端项目
5. **开始交互** - 连接钱包并开始使用

## 📚 相关资源

- [React官方文档](https://reactjs.org/docs)
- [Web3.js文档](https://web3js.readthedocs.io/)
- [ethers.js文档](https://docs.ethers.io/)
- [BTY官方文档](https://docs.bityuan.com/)
