# chain33 多算法横向对比测试工具

独立于链节点的跨算法基准测试工具，对比 **secp256k1**、**ed25519**、**SM2**、**Dilithium（抗量子）** 四种签名算法。

## 环境准备

### 1. 部署区块链测试环境

按照 [BTY 链上量子安全地址演示](https://github.com/andyYuanFZM/BTY-DEV-HUB/blob/main/%E9%87%8F%E5%AD%90%E8%AE%A1%E7%AE%97%E4%BB%A5%E5%8F%8ABTY%E9%93%BE%E6%8A%97%E9%87%8F%E5%AD%90%E5%AE%89%E5%85%A8%E7%9A%84%E5%AE%9E%E7%8E%B0/L1%20BTY%E9%93%BE%E4%B8%8A%E9%87%8F%E5%AD%90%E5%AE%89%E5%85%A8%E5%9C%B0%E5%9D%80%E6%BC%94%E7%A4%BA/readme.md) 部署测试节点。

### 2. 使用干净环境

```bash
# 删除之前的测试数据（如果有）
rmdir /s /q D:\blockchain_test\quantum_solo\wallet
rmdir /s /q D:\blockchain_test\quantum_solo\datadir
rmdir /s /q D:\blockchain_test\quantum_solo\logs
```

### 3. 启动节点 + 创建钱包

```bash
# 启动节点（solo 共识）
./chain33.exe -f chain33.solo.toml

# 创建助记词（新窗口）
./chain33-cli.exe seed generate -l 0

# 保存助记词并解锁钱包
./chain33-cli.exe seed save -s "上一步的 12 mnemonic words" -p walletpassword
./chain33-cli.exe wallet unlock -p walletpassword -t 0

```

详见 [chain33 CLI 文档](https://chain.33.cn/document/286)。


## 编译

本工具位于 `33cn/benchmark/`，需要在 **chain33 和 plugin 同级目录**下编译（因为 `go.mod` 用 `replace` 指向 `../chain33` 和 `../plugin`）：

```bash
cd 33cn/benchmark
go build -o benchmark.exe
```

## 使用

```bash
.\benchmark.exe -n=500 -sign=10000 -rpc=http://localhost:8801 -datadir=D:\blockchain_test\quantum_solo -richaddr=0x4797A444f34C26e71803A1d98D5031a3cAE70650
```

### 参数说明

| 参数 | 默认值 | 说明 |
|---|---|---|
| `-rpc` | `http://localhost:8801` | 节点 JSON-RPC 地址 |
| `-datadir` | `D:\blockchain_test\quantum_solo` | 节点数据目录（含 wallet/logs/datadir） |
| `-n` | `500` | 每种算法创建的地址数量 |
| `-sign` | `10000` | 签名/验签基准测试迭代次数（自适应，实际可能更多） |
| `-richkey` | (内置) | 持有代币的 secp256k1 私钥（hex，用于链上转账测试） |
| `-richaddr` | 必填 | 持有代币的创世/rich 地址（ETH 格式，0x...） |

## 运行流程

```
Phase 0  初始存储测量       测量 wallet/datadir 目录大小
Phase 1  RPC 连接检测       自动判断在线/离线模式
Phase 2  批量创建地址        每种算法创建 N 个钱包地址，逐算法测量存储增量
Phase 3  签名/验签基准       自适应迭代，含预热，测量单次签名和验签耗时
Phase 4  链上验签测试（仅 secp256k1 vs dilithium，两个极端对比）
   4a    生成 2 个 from 地址（secp256k1 复用 rich，dilithium 新生成）
   4b    从 rich 地址向 dilithium 地址转入 10 万币
   4c    等待 10s 让资金交易上链确认
   4d    从每个 from 地址签名并发出 20 笔转账交易（共 40 笔）
         日志解析            读取 logs/*.log，解析 CheckSign 日志统计验签耗时
Phase 5  最终存储测量        再次测量 wallet/datadir 目录大小
         输出对比报告        密钥尺寸 / 性能 / 区块膨胀 / 相对倍率
```

## 输出报告示例

> 测试环境：Windows, Intel i7-14700, Go 1.22, chain33 solo 共识

```
======================================================================
        chain33 CROSS-ALGORITHM BENCHMARK REPORT
======================================================================

--- Key & Signature Sizes ---
Algorithm         PrivKey     PubKey  Signature
------------------------------------------------
secp256k1           32 B       33 B       71 B
ed25519             64 B       32 B       64 B
sm2                 32 B       33 B       71 B
dilithium         2528 B     1312 B     2420 B

--- Performance (per operation) ---
Algorithm                 Sign          Verify
------------------------------------------------
secp256k1              68.7 us         93.5 us
ed25519                23.8 us         68.8 us
sm2                   295.3 us        873.5 us
dilithium             134.6 us         35.5 us

--- Relative to secp256k1 (baseline = 1.0x) ---
Algorithm         SigSize   SignTime VerifyTime PubKeySize
--------------------------------------------------------------
secp256k1           1.0x      1.0x      1.0x      1.0x
ed25519             0.9x      0.3x      0.7x      1.0x
sm2                 1.0x      4.3x      9.3x      1.0x
dilithium          34.1x      2.0x      0.4x     39.8x

--- Estimated Block Size Impact (1000 TX) ---
Algorithm        SigData/TX    Block@1000TX    vs secp256k1
------------------------------------------------------------
secp256k1            108 B         204.1 KB        baseline
ed25519              100 B         196.3 KB     1.0x larger
sm2                  108 B         204.1 KB     1.0x larger
dilithium           3736 B           3.7 MB    18.4x larger
```

### 逐算法钱包存储增量（500 地址）

| Algorithm | Wallet Growth | Per Account |
|---|---|---|
| secp256k1 | 330.5 KB | 676.8 B/acc |
| ed25519 | 326.7 KB | 669.0 B/acc |
| sm2 | 319.4 KB | 654.1 B/acc |
| **dilithium** | **7.1 MB** | **14970.9 B/acc** |

> dilithium 每账户钱包存储约为 secp256k1 的 **22 倍**（~15 KB vs ~0.7 KB），主要来自 2528 字节私钥的 hex 编码存储。

## 节点日志中的验签耗时

节点代码修改了 `chain33/types/block.go` 的 `CheckSign()` 函数，每次验签会输出：

```
CheckSign ty=261 name=dilithium pubKeyLen=1312 sigLen=2420 cost=35.4us ok=true
```

工具在 Phase 4 自动读取 `logs/` 目录解析这些日志，按算法汇总验签耗时。

## 关于存储数据的说明

报告中 "Block@1000TX" 是**原始 protobuf 序列化大小**（不含压缩），代表：

- 网络传输开销
- 内存/缓存占用
- 区块大小上限判断

实际磁盘存储会因 LevelDB 默认启用 **Snappy 压缩**而显著减小（通常 1.5-2x 压缩比）。
因此 `datadir` 目录大小通常会小于报告中的 Block 估算值。

