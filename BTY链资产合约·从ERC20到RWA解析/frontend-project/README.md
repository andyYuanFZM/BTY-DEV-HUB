# BTY链ERC20/ERC3643代币管理DAPP

基于Vue3的BTY链ERC20/ERC3643代币管理应用，支持代币部署和增发功能。

## 📁 项目结构

```
frontend-project/
├── src/
│   ├── App.vue             # 主应用组件（包含ERC20和RWA功能）
│   ├── main.js             # 应用入口
│   ├── style.css           # 全局样式
│   └── constants/
│       ├── erc20Contract.js # ERC20合约ABI和字节码
│       └── rwaContracts.js  # RWA合约ABI和部署信息
├── package.json            # 项目配置
├── vite.config.js         # Vite配置
└── index.html             # HTML模板
```

## 🔧 配置说明

ERC20配置：需要从hardhat-project项目复制以下文件内容到 `src/constants/erc20Contract.js`：
- **ABI**：从 `artifacts/contracts/CustomERC20.sol/CustomERC20.json` 复制
- **字节码**：从 `artifacts/contracts/CustomERC20.sol/CustomERC20.json` 复制

RWA合约配置：将ERC-3643目录下的bty-deployment-info.json 中的合约地址复制到 src/constants/rwaContracts.js
确保ABI配置正确（AssetRegistry、RevenueDistributor、Token等）

## 🛠️ 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
```
