# ERC-3643 + RWA 部署到BTY测试网指南

> 🚀 **基于官方ERC-3643标准实现RWA系统的部署方案**

## 📋 目录

- [项目目录结构](#项目目录结构)
- [BTY测试网配置](#bty测试网配置)
- [部署操作](#部署操作)
- [部署顺序](#部署顺序)
- [RWA扩展合约](#rwa扩展合约)

---

## 项目目录结构

```
ERC-3643/
├── contracts/
│   ├── rwa/                              # RWA扩展合约（新增）
│   │   ├── AssetRegistry.sol            # 设备登记合约
│   │   └── RevenueDistributor.sol        # 收益分配合约
│   ├── token/                            # ERC-3643标准合约
│   │   └── Token.sol
│   ├── registry/implementation/          # 登记实现合约
│   │   ├── IdentityRegistry.sol
│   │   ├── IdentityRegistryStorage.sol
│   │   ├── ClaimTopicsRegistry.sol
│   │   └── TrustedIssuersRegistry.sol
│   ├── compliance/                       # 合规模块
│   │   ├── legacy/DefaultCompliance.sol
│   │   └── modular/ModularCompliance.sol
│   ├── proxy/                            # 代理合约
│   │   ├── TokenProxy.sol
│   │   ├── IdentityRegistryProxy.sol
│   │   └── ...（其他代理合约）
│   └── factory/                          # 工厂合约
│       ├── TREXFactory.sol
│       └── TREXGateway.sol
├── scripts/
│   ├── deploy-to-bty.ts                  # BTY部署脚本
│   └── interact-rwa.ts                   # RWA交互脚本
├── hardhat.config.ts                     # Hardhat配置（已配置BTY网络）
├── package.json                          # 依赖管理（已添加脚本）
└── bty-deployment-info.json              # 部署信息（部署后生成）
```

---

## BTY测试网配置

**网络配置**（已在 `hardhat.config.ts` 中配置）：
- BTY测试网：`http://localhost:8546` (chainId: 6999)

---

## 部署操作

### 步骤1：环境准备

```bash
# 安装依赖
npm install

### 步骤2：编译合约
```bash
npm run build
```

### 步骤3：部署到BTY测试网

```bash
# 部署到BTY测试网
npm run deploy:bty
```

**部署脚本说明**：`scripts/deploy-to-bty.ts` 会自动完成：
1. 部署所有ERC-3643实现合约
2. 部署代理合约
3. 部署Token
4. 部署RWA扩展合约
5. 保存部署信息到 `bty-deployment-info.json`

### 步骤4：查看部署信息

```bash
cat bty-deployment-info.json
```

部署信息包含所有合约地址：
```json
{
  "network": "bty-testnet",
  "proxies": {
    "token": "...",
    "identityRegistry": "..."
  },
  "rwa": {
    "assetRegistry": "...",
    "revenueDistributor": "..."
  }
}
```

### 步骤5：交互测试

```bash
npm run interact:rwa
```

---

## 部署顺序

部署脚本按以下顺序自动执行：

```
1. 实现合约 → 2. Identity系统 → 3. TREX授权 → 4. 工厂合约
   ↓
5. 代理合约 → 6. Token → 7. RWA扩展合约 → 8. 保存部署信息
```

**详细步骤**（脚本自动完成）：
- 步骤1-6：部署ERC-3643标准系统（实现合约、代理合约、Token等）
- 步骤7：部署RWA扩展合约（AssetRegistry、RevenueDistributor）
- 步骤8：保存所有合约地址到 `bty-deployment-info.json`

---

## RWA扩展合约

### 合约说明

| 合约 | 位置 | 主要功能 |
|------|------|---------|
| **AssetRegistry** | `contracts/rwa/AssetRegistry.sol` | 设备登记、收益记录、状态管理 |
| **RevenueDistributor** | `contracts/rwa/RevenueDistributor.sol` | 收益分配、收益计算、收益提取 |

### 集成方式

```
ERC-3643 Token → AssetRegistry → RevenueDistributor
    (通过地址关联，独立部署)
```
