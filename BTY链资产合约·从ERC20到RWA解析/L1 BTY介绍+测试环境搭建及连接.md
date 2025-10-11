# BTY测试环境搭建与操作指南

> 🚀 **从零开始搭建BTY测试环境，掌握完整的开发流程**

本指南将带你完成BTY测试链的搭建、钱包配置、私钥导入等完整流程，为后续的智能合约开发做好准备。

---

## 📋 目录

- [一、BTY测试环境搭建](#一bty测试环境搭建)
- [二、钱包插件连接测试链](#二钱包插件连接测试链)
- [三、合约中取现操作](#三合约中取现操作)

---

## 一、BTY测试环境搭建

### 1. 下载测试链程序包（Windows版本）

请从以下链接下载 Windows 版本的测试链程序包：

**下载地址**: https://github.com/andyYuanFZM/BTY-DEV-HUB/releases/download/V1.0.0/bityuanTest.zip

### 2. 解压后进入目录

将下载的 `bityuanTest.zip` 解压，进入解压后的目录。

### 3. 启动测试链

在命令行中执行以下命令启动测试链：

```bash
nohup ./bityuan -f bityuan-fullnode.toml >> bty.out &
```

### 4. 生成并解锁钱包

#### 4.1 生成助记词

```bash
./bityuan-cli.exe seed generate -l 0
```

#### 4.2 保存助记词

将上一步生成的助记词替换到以下命令中，并设置钱包密码：

```bash
./bityuan-cli.exe seed save -s "上一步生成的助记词" -p 钱包密码
```

#### 4.3 解锁钱包

使用上一步设置的钱包密码解锁钱包：

```bash
./bityuan-cli.exe wallet unlock -p 钱包密码
```

#### 4.4 开启自动挖矿

开启自动挖矿功能：

```bash
./bityuan-cli.exe wallet auto_mine -f 0
```

### 5. 导入测试私钥

依次执行以下命令导入9对测试私钥：

```bash
# 第1对私钥
./bityuan-cli.exe account import_key -k 56942AD84CCF4788ED6DACBC005A1D0C4F91B63BCF0C99A02BE03C8DEAE71138 -l genesis1 -t 0
./bityuan-cli.exe account import_key -k 2AFF1981291355322C7A6308D46A9C9BA311AA21D94F36B43FC6A6021A1334CF -l return1 -t 0

# 第2对私钥
./bityuan-cli.exe account import_key -k 2116459C0EC8ED01AA0EEAE35CAC5C96F94473F7816F114873291217303F6989 -l genesis2 -t 0
./bityuan-cli.exe account import_key -k 1882EE8592A05E26941E73920F6D11D9DAB5E11B69F3FEE40EA8C3E9CBEDDE4A -l return2 -t 0

# 第3对私钥
./bityuan-cli.exe account import_key -k 0xf714f4af1f88fddae333be52d273a67970af3c0cf3ca60c99d586fb629f49307 -l genesis3 -t 0
./bityuan-cli.exe account import_key -k 0xf05244af548b0794c3635ccb8b47f8fbb11478fae2589a1f793d06b7acdfab11 -l return3 -t 0

# 第4对私钥
./bityuan-cli.exe account import_key -k 0xb2fcabeaa4a56c09b187fbd76fa88b69d2d25ee2fb6c5b232eaaf22344a2ab49 -l genesis4 -t 0
./bityuan-cli.exe account import_key -k 0x24c8187848ee98fe268a5a2f3c97ac88a2f69f2e343c806000b40c2e7263a090 -l return4 -t 0

# 第5对私钥
./bityuan-cli.exe account import_key -k 0xa8a344c1819947816cc5cc72fbf8b00f6d694a1451b7fbb0a1a1d069b775a540 -l genesis5 -t 0
./bityuan-cli.exe account import_key -k 0xbbd82656a523b982ef5de2049b53e5b16944460ce6c94a39125422ccc7dbadc5 -l return5 -t 0

# 第6对私钥
./bityuan-cli.exe account import_key -k 0x45fa21f892fd53e205c24b23bb12a0b69e6155cffcbfda3b81ef9b0c2ebc0006 -l genesis6 -t 0
./bityuan-cli.exe account import_key -k 0x9452f9322c26b97b32970c7601e435ef52d68ec50b30465dec78388a8252ee06 -l return6 -t 0

# 第7对私钥
./bityuan-cli.exe account import_key -k 0x29c2d299259c921c4a587ac6fe8adc30d2ba2aaec50ec3974db5221cada46ea6 -l genesis7 -t 0
./bityuan-cli.exe account import_key -k 0x66c91bbf153d9632597fcfca98ebbaf8649a7fbe3582a610d37b03071ca64b5d -l return7 -t 0

# 第8对私钥
./bityuan-cli.exe account import_key -k 0x9bb34fb54dd00abcd37c6246a5234854e4ade2a4fe409a11577ec28e23aa38fd -l genesis8 -t 0
./bityuan-cli.exe account import_key -k 0xcfd3702e25b7d1e8d5e132e640f17c918740d67ded23944aad9d02a1be4fc079 -l return8 -t 0

# 第9对私钥
./bityuan-cli.exe account import_key -k 0xd92a8b9abb4b020a0c9fce0b12594c731442286fc163a404d920efc400796f9e -l genesis9 -t 0
./bityuan-cli.exe account import_key -k 0xc1a06acf063e96b9a409bf8a4da999a569bf042b15653e80645cf24cefef7dc8 -l return9 -t 0
```

### 6. 查看地址中挖矿的余额

查看指定地址的余额：

```bash
./bityuan-cli.exe account balance -a 1KcCVZLSQYRUwE5EXTsAoQs9LuJW6xwfQa -e ticket
```

### 7. 查看全网挖矿的总票数

查询全网总票数：

```bash
./bityuan-cli.exe ticket count
```

---

## 二、钱包插件连接测试链

### 🔗 连接配置

| 配置项 | 值 | 说明 |
|--------|----|----|
| **URL** | `http://本地IP:8546` | 请将 `本地IP` 替换为实际运行测试链的服务器 IP 地址 |
| **Chain ID** | `6999` | 测试链的链ID |
| **网络名称** | BTY Testnet | 自定义网络名称 |

### 📝 配置步骤

1. 打开 MetaMask 钱包
2. 点击网络选择器
3. 选择"添加网络"
4. 填入上述配置信息
5. 保存并切换到BTY测试网络

---

## 三、合约中取现操作

### 1. 打一些手续费

向指定地址转入手续费：

```bash
./bityuan-cli.exe send coins transfer -a 100 -t 1KcCVZLSQYRUwE5EXTsAoQs9LuJW6xwfQa -k 1PUiGcbsccfxW3zuvHXZBJfznziph5miAo
```

### 2. 从ticket合约中取现

从合约中提取代币：

```bash
./bityuan-cli send coins withdraw -a 200000 -e ticket -k 2AFF1981291355322C7A6308D46A9C9BA311AA21D94F36B43FC6A6021A1334CF
```

### 3. 转账到外部钱包

将代币转账至外部钱包地址：

```bash
./bityuan-cli.exe send coins transfer -a 200000 -t 0x955f5Eb55a0C89e2a40d8062f3D7513f745152D5 -k 1KcCVZLSQYRUwE5EXTsAoQs9LuJW6xwfQa
```

---

## 🎯 下一步

完成测试环境搭建后，后续可在此基础上：

- ✅ 开始编写和部署智能合约
- ✅ 使用Web3.js/ethers.js与合约交互
- ✅ 开发完整的DApp应用
- ✅ 部署到BTY主网进行实际应用

---
