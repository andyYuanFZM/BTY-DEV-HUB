# L1 BTY链上量子安全地址演示

> **核心问题**：量子计算机来了，你的 BTY 地址还安全吗？如何生成一个抗量子攻击的地址？

目前已在 BTY 代码中整合了量子安全地址支持，并跑通了从生成私钥、公钥、签名到上链转账的**完整功能链路**。

---

## 🔬 Dilithium — 抗量子签名插件

基于 **CRYSTALS-Dilithium**（NIST FIPS 204 标准）的 chain33 抗量子加密插件。

### 算法简介

| 项目 | 说明 |
|---|---|
| 算法 | CRYSTALS-Dilithium2（NIST PQC 标准化，FIPS 204） |
| 安全级别 | NIST Level 1（约等效 AES-128 抗量子强度） |
| 数学基础 | Module-LWE / Module-SIS 格密码 |
| 量子安全性 | ✅ 设计目标为抵抗已知量子计算攻击（包括 Shor 类攻击） |

---

## 📊 经典密码学 vs 抗量子密码学 对比

### 私钥对比

| 项目 | 经典 secp256k1 | 抗量子 Dilithium2 | 倍数 |
|---|---|---|---|
| 大小 | 32 bytes | 2,528 bytes | ~79x |
| 格式 | 32-byte hex（64 hex 字符） | 以 hex 编码展示时约 5,056 hex 字符 |
| 示例（详见下面演示） | `30440220...0220...` | `a3f1c2...0e9d...` |

### 公钥对比

| 项目 | 经典 secp256k1 | 抗量子 Dilithium2 | 倍数 |
|---|---|---|---|
| 大小 | 33 bytes（压缩） | 1,312 bytes | ~40x |
| 格式 | 33-byte hex（66 hex 字符） | 以 hex 编码展示时约 2,624 hex 字符 |
| 示例（详见下面演示） | `30440220...0220...` | `a3f1c2...0e9d...` |

### 签名内容对比

| 项目 | 经典 ECDSA（secp256k1） | 抗量子 Dilithium2 | 倍数 |
|---|---|---|---|
| 大小 | 64 bytes（原始） / ~70-72 bytes（DER 编码） | ~2,420 bytes | ~35x |
| 格式 | ASN.1 DER 编码的 (r, s) | 原始字节序列 |
| 示例（详见下面演示） | `30440220...0220...` | `a3f1c2...0e9d...` |

> 📌 可以看出，抗量子签名的安全增益以**较大的密钥和签名体积**为代价（约 30x vs secp256k1）。这在区块链场景中意味着更高的存储和带宽成本，需要在安全性和效率之间做权衡。 后面视频还会针对 secp256k1、ed25519 一起做性能专项评测

---

## 📦 源码获取与运行

### 开源代码仓库

BTY 抗量子安全实现在以下两个仓库的 `quantum` 分支：

| 仓库 | 地址 | 说明 |
|---|---|---|
| chain33 | [https://github.com/andyYuanFZM/chain33/tree/quantum](https://github.com/andyYuanFZM/chain33/tree/quantum) | 区块链主节点代码 |
| plugin | [https://github.com/andyYuanFZM/plugin/tree/quantum](https://github.com/andyYuanFZM/plugin/tree/quantum) | 插件库 |

### 📁 插件目录

```
plugin/plugin/crypto/dilithium/
├── dilithium.go              # Crypto 驱动
├── address.go                # 地址驱动
├── dilithium_test.go         
└── README.md
```

### 自行编译（Windows / Linux / macOS）

区块链节点，请 clone 上述两个仓库的 `quantum` 分支，按 chain33 标准编译流程构建：

```bash
# 1. 克隆代码（quantum 分支）
git clone -b quantum https://github.com/andyYuanFZM/chain33.git
git clone -b quantum https://github.com/andyYuanFZM/plugin.git

# 2. 按 plugin 标准流程编译（详见 plugin 仓库 README）

# 3. 节点起动的配置文件，参考目录下的： chain33.solo.toml
```

---

## 🛠️ CLI 实操：量子安全地址全流程

所有操作均复用现有 CLI 命令，无需单独工具：

```bash
# 1. 创建量子账户（自动生成 dilithium 密钥对）
./chain33-cli.exe account create -t 4 -l quantum

# 2. 查看量子地址私钥
./chain33-cli.exe account dump_key -a 4...

# 3. 构造转账交易
./chain33-cli.exe coins transfer -a 100 -t 0x...

# 4. 量子签名（关键：加 -p 4）
./chain33-cli.exe wallet sign -k <2528-byte-privkey-hex> -p 4 -d <raw-tx-hex>

# 5. 广播交易
./chain33-cli.exe wallet send -d <signed-tx-hex>
```

---

