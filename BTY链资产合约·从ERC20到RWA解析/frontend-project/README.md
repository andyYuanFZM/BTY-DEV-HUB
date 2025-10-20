# BTY链ERC20代币管理DAPP

基于Vue3的BTY链ERC20代币管理应用，支持代币部署和增发功能。

## 🛠️ 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置合约ABI
从hardhat项目复制合约ABI和字节码：
```bash
# 复制合约ABI和字节码到 src/constants/erc20Contract.js
cp ../hardhat-project/artifacts/contracts/CustomERC20.sol/CustomERC20.json ./src/constants/
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 构建生产版本
```bash
npm run build
```

## 🔧 配置说明

### 合约配置
需要从hardhat项目复制以下文件内容到 `src/constants/erc20Contract.js`：
- **ABI**：从 `artifacts/contracts/CustomERC20.sol/CustomERC20.json` 复制
- **字节码**：从 `artifacts/contracts/CustomERC20.sol/CustomERC20.json` 复制

### 网络配置
- **BTY主网**：https://mainnet.bityuan.com
- **BTY测试网**：http://localhost:8545（本地测试）

## 📱 使用说明

### 1. 连接钱包
- 确保已安装MetaMask钱包
- 点击"连接钱包"按钮
- 授权应用访问钱包

### 2. 部署代币
- 切换到"发行代币"Tab
- 填写代币信息：
  - **代币名称**：如"My Token"
  - **代币符号**：如"MTK"
  - **初始供应量**：如"500000000"
- 选择是否支持增发功能
- 点击"创建代币"按钮
- 确认钱包交易

### 3. 增发代币
- 切换到"增发代币"Tab
- 输入合约地址
- 系统自动获取代币信息
- 输入增发数量
- 点击"增发代币"按钮
- 确认钱包交易

## 🔍 BTY链兼容性

### Hash格式处理
由于BTY链使用SHA256而不是keccak256，ethers.js会出现"Transaction hash mismatch"错误。应用已内置处理机制：

1. **自动检测**：识别hash不匹配错误
2. **交易验证**：确认交易实际成功
3. **用户提示**：显示操作成功状态

### 错误处理
- **网络错误**：自动重试和错误提示
- **权限错误**：清晰的权限验证提示
- **合约错误**：详细的错误信息说明

## 📁 项目结构

```
frontend-project/
├── src/
│   ├── App.vue              # 主应用组件
│   ├── main.js             # 应用入口
│   ├── style.css           # 全局样式
│   └── constants/
│       └── erc20Contract.js # 合约ABI和字节码配置
├── package.json            # 项目配置
├── vite.config.js         # Vite配置
└── index.html             # HTML模板
```

## 🚨 注意事项

1. **合约ABI配置**：必须从hardhat项目复制正确的ABI和字节码
2. **网络连接**：确保MetaMask连接到正确的BTY网络
3. **权限管理**：只有合约owner才能进行增发操作
4. **代币名称**：避免使用主流代币名称和符号

## 🔗 相关链接

- [BTY链官网](https://bityuan.com)
- [BTY区块浏览器](https://mainnet.bityuan.com)
- [Ethers.js文档](https://docs.ethers.io/v5/)
- [Vue 3文档](https://vuejs.org/)
