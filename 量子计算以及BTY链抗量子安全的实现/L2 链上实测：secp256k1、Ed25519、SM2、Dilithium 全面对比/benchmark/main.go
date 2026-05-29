// Copyright Fuzamei Corp. 2018 All Rights Reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// benchmark is a standalone cross-algorithm benchmark tool for chain33.
// It compares secp256k1, ed25519, sm2, and dilithium across:
//   - key/signature sizes
//   - signing & verification performance
//   - wallet & data directory storage
//   - on-chain verification timing (via node logs)
//
// Usage:
//
//	go run . -rpc=http://localhost:8801 -datadir=D:\blockchain_test\quantum_solo
package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/33cn/chain33/common/crypto"
	_ "github.com/33cn/chain33/system/crypto/ed25519"
	_ "github.com/33cn/chain33/system/crypto/secp256k1"
	_ "github.com/33cn/chain33/system/crypto/sm2"
	_ "github.com/33cn/plugin/plugin/crypto/dilithium"
	"github.com/decred/base58"
	"golang.org/x/crypto/ripemd160"
)

// ==================== Configuration ====================

var (
	rpcAddr  = flag.String("rpc", "http://localhost:8801", "chain33 JSON-RPC address")
	dataDir  = flag.String("datadir", `D:\blockchain_test\quantum_solo`, "node data directory")
	numAddrs = flag.Int("n", 500, "number of addresses per algorithm")
	numSigns = flag.Int("sign", 10000, "number of sign/verify iterations")
	richKey  = flag.String("richkey", "76491916cf0e70437cbed8c2ce9ac2241221e56f8e64ec74e3282b07f24018e1", "secp256k1 private key (hex) with coins")
	richAddr = flag.String("richaddr", "", "rich address (auto-detected if empty; required for ETH-style 0x... addresses)")
)

// ==================== Algorithm Definitions ====================

type AlgoInfo struct {
	Name      string
	TypeID    int32
	AddressID int32
}

var algorithms = []AlgoInfo{
	{Name: "secp256k1", TypeID: 1, AddressID: 0},
	{Name: "ed25519", TypeID: 2, AddressID: 0},
	{Name: "sm2", TypeID: 258, AddressID: 0},
	{Name: "dilithium", TypeID: 261, AddressID: 4},
}

// runID is a unique prefix for wallet labels, generated once per run.
// Prevents label conflicts when re-running without clearing wallet data.
var runID string

// ==================== JSON-RPC Client ====================

type rpcRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      int         `json:"id"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params"`
}

type rpcResponse struct {
	ID     int             `json:"id"`
	Result json.RawMessage `json:"result"`
	Error  interface{}     `json:"error"`
}

func rpcCall(method string, params interface{}, result interface{}) error {
	req := rpcRequest{JSONRPC: "2.0", ID: 1, Method: method, Params: []interface{}{params}}
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	resp, err := http.Post(*rpcAddr, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("http post: %w", err)
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	var rpcResp rpcResponse
	if err := json.Unmarshal(respBody, &rpcResp); err != nil {
		return fmt.Errorf("unmarshal response: %w (body=%s)", err, string(respBody))
	}
	if rpcResp.Error != nil {
		return fmt.Errorf("rpc error: %v", rpcResp.Error)
	}
	if result != nil && rpcResp.Result != nil {
		return json.Unmarshal(rpcResp.Result, result)
	}
	return nil
}

// ==================== Utilities ====================

func dirSize(path string) int64 {
	var size int64
	filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() {
			return nil
		}
		size += info.Size()
		return nil
	})
	return size
}

func formatSize(size int64) string {
	if size < 1024 {
		return fmt.Sprintf("%d B", size)
	}
	div, exp := int64(1024), 0
	for n := size / 1024; n >= 1024; n /= 1024 {
		div *= 1024
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(size)/float64(div), "KMGTPE"[exp])
}

func isHex(s string) bool {
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return len(s) > 0
}

func formatDuration(d time.Duration) string {
	if d < time.Microsecond {
		return fmt.Sprintf("%d ns", d.Nanoseconds())
	}
	if d < time.Millisecond {
		return fmt.Sprintf("%.1f us", float64(d.Nanoseconds())/1000)
	}
	if d < time.Second {
		return fmt.Sprintf("%.1f ms", float64(d.Microseconds())/1000)
	}
	return fmt.Sprintf("%.2f s", d.Seconds())
}

func measureStorage(label, walletDir, datadirDir string) {
	fmt.Printf("\n--- %s ---\n", label)
	if s := dirSize(walletDir); s > 0 {
		fmt.Printf("  Wallet dir:  %s\n", formatSize(s))
	} else {
		fmt.Printf("  Wallet dir:  (not found or empty: %s)\n", walletDir)
	}
	if s := dirSize(datadirDir); s > 0 {
		fmt.Printf("  Datadir:     %s\n", formatSize(s))
	} else {
		fmt.Printf("  Datadir:     (not found or empty: %s)\n", datadirDir)
	}
}

// ==================== Sign/Verify Benchmark ====================

type SignResult struct {
	Algo       AlgoInfo
	PrivLen    int
	PubLen     int
	SigLen     int
	SignTime   time.Duration
	VerifyTime time.Duration
}

func benchSign(algo AlgoInfo, n int) (*SignResult, error) {
	c, err := crypto.Load(algo.Name, -1)
	if err != nil {
		return nil, err
	}
	priv, _ := c.GenKey()
	pub := priv.PubKey()
	msg := []byte("chain33 cross-algorithm benchmark test message")

	r := &SignResult{Algo: algo, PrivLen: len(priv.Bytes()), PubLen: len(pub.Bytes())}

	// Warmup: run a few iterations first
	for i := 0; i < 10; i++ {
		priv.Sign(msg)
	}
	sig := priv.Sign(msg)
	r.SigLen = len(sig.Bytes())
	for i := 0; i < 10; i++ {
		pub.VerifyBytes(msg, sig)
	}

	// Sign benchmark with adaptive timing
	actualN := n
	signStart := time.Now()
	for i := 0; i < actualN; i++ {
		_ = priv.Sign(msg)
	}
	signElapsed := time.Since(signStart)
	// If too fast, increase iterations for better precision
	for signElapsed < 100*time.Millisecond && actualN < 100000 {
		actualN *= 2
		signStart = time.Now()
		for i := 0; i < actualN; i++ {
			_ = priv.Sign(msg)
		}
		signElapsed = time.Since(signStart)
	}
	r.SignTime = signElapsed / time.Duration(actualN)

	// Verify benchmark with adaptive timing
	actualN = n
	verifyStart := time.Now()
	for i := 0; i < actualN; i++ {
		pub.VerifyBytes(msg, sig)
	}
	verifyElapsed := time.Since(verifyStart)
	for verifyElapsed < 100*time.Millisecond && actualN < 100000 {
		actualN *= 2
		verifyStart = time.Now()
		for i := 0; i < actualN; i++ {
			pub.VerifyBytes(msg, sig)
		}
		verifyElapsed = time.Since(verifyStart)
	}
	r.VerifyTime = verifyElapsed / time.Duration(actualN)

	return r, nil
}

// ==================== Account Creation via RPC ====================

// pubkeyToAddr computes a chain33 address from a public key.
// Matches chain33's FormatBtcAddr: RIPEMD160(pubKey) for normal,
// SHA256[:20] for quantum (version 8).
func pubkeyToAddr(pubKey []byte, addrID int32) string {
	if addrID == 4 {
		h := sha256.Sum256(pubKey)
		return formatBase58Addr(8, h[:20])
	}
	// Normal: RIPEMD160(pubKey) directly (chain33 FormatBtcAddr does this)
	md := ripemd160.New()
	md.Write(pubKey)
	return formatBase58Addr(0, md.Sum(nil))
}

// formatBase58Addr encodes [version + hash20 + checksum] in base58.
func formatBase58Addr(version byte, hash20 []byte) string {
	raw := make([]byte, 1+20+4)
	raw[0] = version
	copy(raw[1:21], hash20)
	// checksum = first 4 bytes of SHA256(SHA256(raw[:21]))
	h1 := sha256.Sum256(raw[:21])
	h2 := sha256.Sum256(h1[:])
	copy(raw[21:], h2[:4])
	return string(base58.Encode(raw))
}

func createAccounts(algo AlgoInfo, count int) (int, []string) {
	fmt.Printf("  Creating %d %s accounts...\n", count, algo.Name)

	// Generate keys locally — we don't import into wallet
	// because ImportPrivkey only supports the wallet's configured SignType.
	// Wallet storage impact is measured separately via NewAccount.
	type accResult struct {
		Acc struct{ Addr string } `json:"acc"`
	}

	sem := make(chan struct{}, 10)
	var mu sync.Mutex
	var addrs []string
	var errs int
	var wg sync.WaitGroup

	for i := 0; i < count; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			// Generate key pair locally
			c, err := crypto.Load(algo.Name, -1)
			if err != nil {
				mu.Lock()
				errs++
				mu.Unlock()
				return
			}
			priv, err := c.GenKey()
			if err != nil {
				mu.Lock()
				errs++
				mu.Unlock()
				return
			}
			addr := pubkeyToAddr(priv.PubKey().Bytes(), algo.AddressID)
			_ = priv // key generated for measurement purposes

			// Try to create via NewAccount (works if wallet supports this type)
			var r accResult
			err = rpcCall("Chain33.NewAccount", map[string]interface{}{
				"label":     fmt.Sprintf("%s_%s_%d", runID, algo.Name, idx),
				"addressID": algo.AddressID,
			}, &r)
			mu.Lock()
			if err != nil {
				errs++
			} else {
				addrs = append(addrs, addr)
			}
			mu.Unlock()
		}(i)
	}
	wg.Wait()
	fmt.Printf("    %d generated, %d wallet errors (keys tracked locally)\n", count-errs, errs)
	return count - errs, addrs
}

// ==================== Protobuf Encoding (manual, avoids importing chain33/types) ====================

// pbTag returns a protobuf field tag (fieldNum << 3 | wireType)
func pbTag(fieldNum int, wireType int) uint64 {
	return uint64(fieldNum)<<3 | uint64(wireType)
}

// pbVarint encodes a uint64 as a protobuf varint
func pbVarint(v uint64) []byte {
	var buf [10]byte
	n := 0
	for {
		b := byte(v & 0x7f)
		v >>= 7
		if v != 0 {
			b |= 0x80
		}
		buf[n] = b
		n++
		if v == 0 {
			break
		}
	}
	return buf[:n]
}

// pbVarintField encodes a varint field (wire type 0)
func pbVarintField(num int, v uint64) []byte {
	tag := pbVarint(pbTag(num, 0))
	val := pbVarint(v)
	return append(tag, val...)
}

// pbBytesField encodes a length-delimited field (wire type 2)
func pbBytesField(num int, data []byte) []byte {
	tag := pbVarint(pbTag(num, 2))
	length := pbVarint(uint64(len(data)))
	out := make([]byte, 0, len(tag)+len(length)+len(data))
	out = append(out, tag...)
	out = append(out, length...)
	out = append(out, data...)
	return out
}

// pbStringField encodes a string field (wire type 2, utf8 bytes)
func pbStringField(num int, s string) []byte {
	return pbBytesField(num, []byte(s))
}

// pbMessageField encodes a nested message field (wire type 2)
func pbMessageField(num int, msg []byte) []byte {
	return pbBytesField(num, msg)
}

// encodeSignature builds a Signature protobuf message:
//
//	int32 ty = 1;  bytes pubkey = 2;  bytes signature = 3;
func encodeSignature(ty int32, pubkey, sig []byte) []byte {
	out := pbVarintField(1, uint64(ty))
	out = append(out, pbBytesField(2, pubkey)...)
	out = append(out, pbBytesField(3, sig)...)
	return out
}

// buildSignedTransferTx creates a coins transfer transaction, signs it with the
// given algorithm, and returns the hex-encoded signed protobuf.
//
// Protobuf layout (field numbers only for used fields):
//
//	Transaction:
//	  1: bytes  execer    = "coins"
//	  2: bytes  payload   = {"transfer":{"to":"...","amount":...}}
//	  3: Signature        (see encodeSignature)
//	  4: int64  fee
//	  5: int64  expire
//	  6: int64  nonce
//	  7: string to
//	 11: int32  chainID = 0
func buildSignedTransferTx(algo AlgoInfo, priv crypto.PrivKey, toAddr string, amount int64) (string, error) {
	// 1. Get canonical unsigned TX from the node
	createReq := map[string]interface{}{
		"to":     toAddr,
		"amount": amount,
		"fee":    1000000,
		"note":   "bench",
	}
	var unsignedHex string
	if err := rpcCall("Chain33.CreateRawTransaction", createReq, &unsignedHex); err != nil {
		return "", fmt.Errorf("CreateRawTransaction: %w", err)
	}
	// Sometimes the RPC returns hex with "0x" prefix — strip it.
	unsignedHex = strings.TrimPrefix(unsignedHex, "0x")
	if len(unsignedHex) < 10 || !isHex(unsignedHex) {
		return "", fmt.Errorf("CreateRawTransaction returned non-hex: %q", unsignedHex)
	}
	unsigned, err := hex.DecodeString(unsignedHex)
	if err != nil {
		return "", fmt.Errorf("decode unsigned hex: %w", err)
	}

	// 2. Sign the canonical unsigned bytes
	pub := priv.PubKey()
	sig := priv.Sign(unsigned)

	// 3. Append Signature (field 3) to the unsigned bytes.
	// Protobuf permits fields in any order; appending field 3 is valid.
	// signID = (addressID << 12) | cryptoID  (matches chain33 types.EncodeSignID)
	//   secp256k1+eth: (2<<12)|1=8193   dilithium+quantum: (4<<12)|261=16645
	signID := (algo.AddressID << 12) | algo.TypeID
	sigMsg := encodeSignature(signID, pub.Bytes(), sig.Bytes())
	signed := make([]byte, len(unsigned)+len(sigMsg)+10)
	n := copy(signed, unsigned)
	n += copy(signed[n:], pbMessageField(3, sigMsg))

	return hex.EncodeToString(signed[:n]), nil
}

// submitSignedTx builds a signed transfer tx and sends it to the chain.
func submitSignedTx(algo AlgoInfo, priv crypto.PrivKey, toAddr string, amount int64) (string, error) {
	txHex, err := buildSignedTransferTx(algo, priv, toAddr, amount)
	if err != nil {
		return "", err
	}
	var txHash string
	err = rpcCall("Chain33.SendTransaction", map[string]string{"data": txHex}, &txHash)
	return txHash, err
}

// ==================== Log Parsing ====================

func parseCheckSignLogs(logsDir string) map[string][]time.Duration {
	result := make(map[string][]time.Duration)
	entries, err := os.ReadDir(logsDir)
	if err != nil {
		return result
	}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".log") {
			continue
		}
		data, _ := os.ReadFile(filepath.Join(logsDir, e.Name()))
		for _, line := range strings.Split(string(data), "\n") {
			if !strings.Contains(line, "CheckSign") {
				continue
			}
			var algo, costStr string
			for _, part := range strings.Fields(line) {
				if strings.HasPrefix(part, "name=") {
					algo = strings.TrimPrefix(part, "name=")
				}
				if strings.HasPrefix(part, "cost=") {
					costStr = strings.TrimPrefix(part, "cost=")
				}
			}
			if algo == "" || costStr == "" {
				continue
			}
			d, err := time.ParseDuration(costStr)
			if err != nil {
				continue
			}
			result[algo] = append(result[algo], d)
		}
	}
	return result
}

// ==================== Report ====================

func printReport(results []*SignResult) {
	fmt.Println()
	fmt.Println("======================================================================")
	fmt.Println("        chain33 CROSS-ALGORITHM BENCHMARK REPORT")
	fmt.Println("======================================================================")

	fmt.Println("\n--- Key & Signature Sizes ---")
	fmt.Printf("%-14s %10s %10s %10s\n", "Algorithm", "PrivKey", "PubKey", "Signature")
	fmt.Println(strings.Repeat("-", 48))
	for _, r := range results {
		fmt.Printf("%-14s %7d B  %7d B  %7d B\n", r.Algo.Name, r.PrivLen, r.PubLen, r.SigLen)
	}

	fmt.Println("\n--- Performance (per operation) ---")
	fmt.Printf("%-14s %15s %15s\n", "Algorithm", "Sign", "Verify")
	fmt.Println(strings.Repeat("-", 48))
	for _, r := range results {
		fmt.Printf("%-14s %15s %15s\n", r.Algo.Name, formatDuration(r.SignTime), formatDuration(r.VerifyTime))
	}

	// Relative comparison
	var secpRes *SignResult
	for _, r := range results {
		if r.Algo.Name == "secp256k1" {
			secpRes = r
			break
		}
	}
	if secpRes != nil {
		fmt.Println("\n--- Relative to secp256k1 (baseline = 1.0x) ---")
		fmt.Printf("%-14s %10s %10s %10s %10s\n", "Algorithm", "SigSize", "SignTime", "VerifyTime", "PubKeySize")
		fmt.Println(strings.Repeat("-", 62))
		for _, r := range results {
			fmt.Printf("%-14s %8.1fx %8.1fx %8.1fx %8.1fx\n",
				r.Algo.Name,
				float64(r.SigLen)/float64(secpRes.SigLen),
				float64(r.SignTime)/float64(secpRes.SignTime),
				float64(r.VerifyTime)/float64(secpRes.VerifyTime),
				float64(r.PubLen)/float64(secpRes.PubLen),
			)
		}
	}

	// Block size estimation
	fmt.Println("\n--- Estimated Block Size Impact (1000 TX) ---")
	fmt.Printf("%-14s %12s %15s %15s\n", "Algorithm", "SigData/TX", "Block@1000TX", "vs secp256k1")
	fmt.Println(strings.Repeat("-", 60))
	for _, r := range results {
		sigBytes := 4 + r.PubLen + r.SigLen // 4B type + pubkey + signature
		blockEst := int64(sigBytes+100)*1000 + 1024
		ratio := "-"
		if secpRes != nil && r.Algo.Name != "secp256k1" {
			secpSig := 4 + secpRes.PubLen + secpRes.SigLen
			secpBlock := int64(secpSig+100)*1000 + 1024
			ratio = fmt.Sprintf("%.1fx larger", float64(blockEst)/float64(secpBlock))
		} else if r.Algo.Name == "secp256k1" {
			ratio = "baseline"
		}
		fmt.Printf("%-14s %9d B  %15s %15s\n", r.Algo.Name, sigBytes, formatSize(blockEst), ratio)
	}
}

// ==================== Main ====================

func main() {
	flag.Parse()

	fmt.Println("============================================================")
	fmt.Println("   chain33 Cross-Algorithm Benchmark Tool")
	fmt.Println("   Algorithms: secp256k1, ed25519, sm2, dilithium")
	fmt.Println("============================================================")
	fmt.Printf("RPC: %s\n", *rpcAddr)
	fmt.Printf("DataDir: %s\n", *dataDir)
	fmt.Printf("Addresses per type: %d\n", *numAddrs)
	fmt.Printf("Sign iterations: %d\n\n", *numSigns)

	walletDir := filepath.Join(*dataDir, "wallet")
	logsDir := filepath.Join(*dataDir, "logs")
	datadirDir := filepath.Join(*dataDir, "datadir")

	// Phase 0: Initial storage
	measureStorage("Phase 0: Initial Storage", walletDir, datadirDir)

	// Phase 1: Check RPC
	fmt.Println("\n======== Phase 1: RPC Connection ========")
	rpcOK := false
	if err := rpcCall("Chain33.GetLastHeader", nil, &map[string]interface{}{}); err == nil {
		fmt.Println("  RPC connection: OK")
		rpcOK = true
	} else {
		fmt.Printf("  RPC connection: FAILED (%v) - will run offline benchmarks only\n", err)
	}

	// Generate unique run ID for wallet labels (avoids conflicts on re-runs)
	runID = fmt.Sprintf("bench_%s", time.Now().Format("0102_150405"))

	// Phase 2: Create accounts — measure per-algorithm storage impact
	fmt.Println("\n======== Phase 2: Create Wallet Accounts ========")
	algoAddrs := make(map[string][]string) // saved for Phase 4
	if rpcOK {
		type algoStorage struct {
			algo  string
			delta int64
		}
		var storageStats []algoStorage
		prevWalletSize := dirSize(walletDir)
		prevDataSize := dirSize(datadirDir)
		totalCreated := 0

		for _, algo := range algorithms {
			n, addrs := createAccounts(algo, *numAddrs)
			algoAddrs[algo.Name] = addrs
			totalCreated += n

			curWallet := dirSize(walletDir)
			curData := dirSize(datadirDir)
			storageStats = append(storageStats, algoStorage{
				algo:  algo.Name,
				delta: curWallet - prevWalletSize,
			})
			fmt.Printf("    -> wallet +%s, datadir +%s (%s)\n",
				formatSize(curWallet-prevWalletSize),
				formatSize(curData-prevDataSize),
				algo.Name)
			prevWalletSize = curWallet
			prevDataSize = curData
		}
		fmt.Printf("  Total accounts created: %d\n", totalCreated)

		// Show per-algorithm comparison
		fmt.Println("\n  --- Per-Algorithm Wallet Storage Impact ---")
		fmt.Printf("  %-14s %15s %15s\n", "Algorithm", "Wallet Growth", "Per Account")
		fmt.Println("  " + strings.Repeat("-", 48))
		for _, s := range storageStats {
			perAcc := float64(s.delta) / float64(*numAddrs)
			fmt.Printf("  %-14s %15s %12.1f B/acc\n", s.algo, formatSize(s.delta), perAcc)
		}
	} else {
		fmt.Println("  (skipped - no RPC)")
		measureStorage("Phase 2: Current Storage", walletDir, datadirDir)
	}

	// Phase 3: Crypto benchmark
	fmt.Println("\n======== Phase 3: Sign/Verify Benchmark ========")
	var results []*SignResult
	for _, algo := range algorithms {
		fmt.Printf("\n  %s (%d iterations):\n", algo.Name, *numSigns)
		r, err := benchSign(algo, *numSigns)
		if err != nil {
			fmt.Printf("    ERROR: %v\n", err)
			continue
		}
		fmt.Printf("    Key: priv=%dB pub=%dB sig=%dB\n", r.PrivLen, r.PubLen, r.SigLen)
		fmt.Printf("    Sign:   %s/op\n", formatDuration(r.SignTime))
		fmt.Printf("    Verify: %s/op\n", formatDuration(r.VerifyTime))
		results = append(results, r)
	}

	// Phase 4: On-chain verification
	//   4a. Generate one "from" key per algorithm
	//   4b. Fund each from the rich secp256k1 (100k coins each)
	//   4c. Wait for funding to confirm
	//   4d. From each funded key, sign+submit 20 self-transfer TX
	fmt.Println("\n======== Phase 4: On-Chain TX Sign + Verify ========")
	txCountPerAlgo := 20
	fundAmount := int64(100000 * 1e8) // 100k coins (in chain33 base units)

	if rpcOK {
		// Load rich secp256k1 key
		sc, err := crypto.Load("secp256k1", -1)
		if err != nil {
			fmt.Printf("  ERROR loading secp256k1: %v\n", err)
		} else {
			richBytes, err := hex.DecodeString(*richKey)
			if err != nil {
				fmt.Printf("  ERROR decoding rich key: %v\n", err)
			} else {
				richPriv, err := sc.PrivKeyFromBytes(richBytes)
				if err != nil {
					fmt.Printf("  ERROR importing rich key: %v\n", err)
				} else {
					richAddrStr := *richAddr
					richBtcAddr := pubkeyToAddr(richPriv.PubKey().Bytes(), 0)
					if richAddrStr == "" {
						richAddrStr = richBtcAddr
					}
					fmt.Printf("  Rich address: %s (BTC: %s)\n", richAddrStr, richBtcAddr)
					fmt.Println()

					// Import rich key into wallet so SendToAddress can find it
					importReq := map[string]interface{}{
						"privkey": *richKey,
						"label":   runID + "_rich",
					}
					if err := rpcCall("Chain33.ImportPrivkey", importReq, nil); err != nil {
						// ErrPrivkeyExist is OK — key already imported
						if !strings.Contains(fmt.Sprint(err), "PrivkeyExist") &&
							!strings.Contains(fmt.Sprint(err), "LabelHasUsed") {
							fmt.Printf("    ImportPrivkey warning: %v\n", err)
						}
					}

					// Step 4a+b: Generate keys and fund them

					// Step 4a+b: Generate keys and fund them
					type fundedKey struct {
						algo AlgoInfo
						priv crypto.PrivKey
						addr string
					}
					var fundedKeys []fundedKey

					for _, algo := range algorithms {
						// Phase 4 only compares secp256k1 vs dilithium (the two extremes)
						if algo.Name != "secp256k1" && algo.Name != "dilithium" {
							continue
						}
						dc, err := crypto.Load(algo.Name, -1)
						if err != nil {
							fmt.Printf("  ERROR loading %s: %v\n", algo.Name, err)
							continue
						}
						dpriv, err := dc.GenKey()
						if err != nil {
							fmt.Printf("  ERROR GenKey %s: %v\n", algo.Name, err)
							continue
						}
						daddr := pubkeyToAddr(dpriv.PubKey().Bytes(), algo.AddressID)

						if algo.Name == "secp256k1" {
							// Rich key uses ETH address format (addressID=2, not BTC=0)
							// The signID = 1 + 2*256 = 513 tells the executor to derive ETH from-address
							dpriv = richPriv
							daddr = richAddrStr
							fmt.Printf("  %-14s from=%s (rich key, %d bytes, signID=%d)\n",
								algo.Name, daddr, len(dpriv.Bytes()), (2<<12)|1)
						} else {
							// Fund via CreateRawTransaction + sign + SendTransaction (same as CLI approach)
							// Avoids wallet's internal balance check which uses wrong address format
							fmt.Printf("  %-14s addr=%s funding %d coins...\n", algo.Name, daddr, fundAmount/1e8)
							fundTxHex, err := buildSignedTransferTx(
								AlgoInfo{Name: "secp256k1", TypeID: 1, AddressID: 2}, // 2=ETH address
								richPriv, daddr, fundAmount)
							if err != nil {
								fmt.Printf("    ERROR building fund tx: %v\n", err)
							} else {
								var fundHash string
								if err := rpcCall("Chain33.SendTransaction", map[string]string{"data": fundTxHex}, &fundHash); err != nil {
									fmt.Printf("    ERROR sending fund tx: %v\n", err)
								} else {
									fmt.Printf("    Fund TX: %s\n", fundHash)
								}
							}
						}

						fundedKeys = append(fundedKeys, fundedKey{algo: algo, priv: dpriv, addr: daddr})
					}

					// Step 4c: Wait for funding to be mined
					fmt.Println("\n  Waiting 10s for funding TX to be mined...")
					time.Sleep(10 * time.Second)

					// Step 4d: From each funded key, sign + submit 20 self-transfer TX
					for _, fk := range fundedKeys {
						// For secp256k1 rich key, override addressID to 2 (ETH) for correct from-address derivation
						algo := fk.algo
						if algo.Name == "secp256k1" {
							algo.AddressID = 2 // ETH address format
						}
						fmt.Printf("\n  === %s ===\n", algo.Name)
						fmt.Printf("    From: %s\n", fk.addr)

						totalSign := time.Duration(0)
						// Pick txCountPerAlgo destination addresses from Phase 2 (skip self)
						destAddrs := algoAddrs[algo.Name]
						if len(destAddrs) > txCountPerAlgo {
							destAddrs = destAddrs[:txCountPerAlgo]
						}
						// Fallback: if not enough addresses, generate more
						for len(destAddrs) < txCountPerAlgo {
							dc, _ := crypto.Load(algo.Name, -1)
							if dpriv2, err := dc.GenKey(); err == nil {
								destAddrs = append(destAddrs, pubkeyToAddr(dpriv2.PubKey().Bytes(), algo.AddressID))
							}
						}

						var txHashes []string
						for i := 0; i < txCountPerAlgo; i++ {
							destAddr := destAddrs[i]
							signStart := time.Now()
							txHex, err := buildSignedTransferTx(algo, fk.priv, destAddr, 1)
							totalSign += time.Since(signStart)
							if err != nil {
								fmt.Printf("    [%d] ERROR building tx: %v\n", i, err)
								continue
							}
							var txHash string
							if err := rpcCall("Chain33.SendTransaction", map[string]string{"data": txHex}, &txHash); err != nil {
								fmt.Printf("    [%d] Submit ERROR: %v\n", i, err)
							} else {
								txHashes = append(txHashes, txHash)
							}
						}

						avgSign := totalSign / time.Duration(txCountPerAlgo)
						fmt.Printf("    Signed %d TX: avg sign time = %s/op\n", txCountPerAlgo, formatDuration(avgSign))
						fmt.Printf("    Submitted %d TX to chain (sig %d bytes each)\n",
							len(txHashes), len(fk.priv.PubKey().Bytes())+len(fk.priv.Sign([]byte("x")).Bytes()))
						for _, h := range txHashes {
							fmt.Printf("      txHash: %s\n", h)
						}
					}
				}
			}
		}
	} else {
		fmt.Println("  (skipped - no RPC)")
	}

	// Parse node logs
	fmt.Println("\n  --- Node Log Analysis ---")
	csData := parseCheckSignLogs(logsDir)
	if len(csData) == 0 {
		fmt.Printf("  No 'CheckSign' entries found in logs yet.\n")
		fmt.Printf("  (They appear after the node processes transactions.)\n")
		fmt.Printf("  Check directory: %s\n", logsDir)
	} else {
		for algo, times := range csData {
			var total time.Duration
			for _, t := range times {
				total += t
			}
			avg := total / time.Duration(len(times))
			fmt.Printf("  %s: %d entries, avg=%s\n", algo, len(times), formatDuration(avg))
		}
	}

	// Phase 5: Final storage
	measureStorage("Phase 5: Final Storage", walletDir, datadirDir)

	// Print report
	printReport(results)

	fmt.Println("\nBenchmark complete.")
	fmt.Printf("Node logs (for CheckSign timing): %s\n", logsDir)
}
