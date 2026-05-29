module github.com/33cn/benchmark

go 1.22.0

toolchain go1.22.12

replace (
	github.com/33cn/chain33 => ../chain33
	github.com/33cn/plugin => ../plugin
	github.com/ava-labs/avalanchego => github.com/33cn/avalanchego v1.10.10-0.20240529041529-ada691598153
)

require (
	github.com/33cn/chain33 v1.69.1-0.20260508025622-0fa35083839d
	github.com/33cn/plugin v0.0.0
)

require (
	github.com/BurntSushi/toml v1.2.1 // indirect
	github.com/agl/ed25519 v0.0.0-20170116200512-5312a6153412 // indirect
	github.com/btcsuite/btcd v0.24.3-0.20250318170759-4f4ea81776d6 // indirect
	github.com/btcsuite/btcd/btcec/v2 v2.3.4 // indirect
	github.com/btcsuite/btcd/chaincfg/chainhash v1.1.0 // indirect
	github.com/cloudflare/circl v1.6.3 // indirect
	github.com/decred/base58 v1.0.3 // indirect
	github.com/decred/dcrd/crypto/blake256 v1.1.0 // indirect
	github.com/decred/dcrd/dcrec/edwards v1.0.0 // indirect
	github.com/decred/dcrd/dcrec/secp256k1/v4 v4.4.0 // indirect
	github.com/ethereum/go-ethereum v1.12.0 // indirect
	github.com/getamis/alice v1.0.3 // indirect
	github.com/getamis/sirius v1.1.7 // indirect
	github.com/go-stack/stack v1.8.1 // indirect
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/hashicorp/golang-lru v0.5.5-0.20210104140557-80c98217689d // indirect
	github.com/holiman/uint256 v1.2.2-0.20230321075855-87b91420868c // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/minio/blake2b-simd v0.0.0-20160723061019-3f5f724cb5b1 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/rollbar/rollbar-go v1.2.0 // indirect
	github.com/shopspring/decimal v1.2.0 // indirect
	github.com/tjfoc/gmsm v1.3.2 // indirect
	golang.org/x/crypto v0.30.0 // indirect
	golang.org/x/net v0.25.0 // indirect
	golang.org/x/sys v0.28.0 // indirect
	golang.org/x/text v0.21.0 // indirect
	gonum.org/v1/gonum v0.11.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20231030173426-d783a09b4405 // indirect
	google.golang.org/grpc v1.59.0 // indirect
	google.golang.org/protobuf v1.33.0 // indirect
)
