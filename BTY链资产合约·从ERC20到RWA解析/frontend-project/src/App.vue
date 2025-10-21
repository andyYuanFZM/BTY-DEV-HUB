<template>
  <div class="container">
    <div class="card">
      <div class="card-header">
        <h1 class="title">Tokenize</h1>
        <p class="subtitle">在BTY Chain上管理您的ERC20代币</p>
      </div>

       <div v-if="!account" class="card-body">
         <button class="button" @click="connectWallet">
           连接钱包
         </button>
       </div>

       <div v-else>
         <!-- 钱包连接状态 -->
         <div class="wallet-info">
           <div class="wallet-address">
             <span class="label">已连接钱包:</span>
             <span class="address">{{ account.substring(0, 6) }}...{{ account.substring(account.length - 4) }}</span>
             <button class="disconnect-btn" @click="disconnectWallet">断开连接</button>
           </div>
         </div>
        <div class="tab-container">
          <button 
            class="tab" 
            :class="{ active: activeTab === 'deploy' }"
            @click="activeTab = 'deploy'"
          >
            发行代币
          </button>
          <button 
            class="tab" 
            :class="{ active: activeTab === 'mint' }"
            @click="activeTab = 'mint'"
          >
            增发代币
          </button>
        </div>

        <div class="card-body">
          <!-- 部署代币Tab -->
          <div v-if="activeTab === 'deploy'">
            <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
              创建新的ERC20代币
            </h2>
            <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
              在BTY Chain上部署您自己的ERC20代币合约
            </p>

            <div class="form-group">
              <label class="label">代币名称 *</label>
              <input 
                class="input"
                type="text"
                placeholder="例如: My Token"
                v-model="tokenName"
              />
            </div>

            <div class="form-group">
              <label class="label">代币符号 *</label>
              <input 
                class="input"
                type="text"
                placeholder="例如: MTK"
                v-model="tokenSymbol"
                @input="tokenSymbol = tokenSymbol.toUpperCase()"
                maxlength="10"
              />
            </div>

            <div class="form-group">
              <label class="label">初始供应量 *</label>
              <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
                输入您想要发行的代币总数量（例如：500000000 表示发行5亿个代币）
              </p>
              <input 
                class="input"
                type="text"
                placeholder="例如: 500000000"
                v-model="initialSupply"
              />
            </div>

            <div class="checkbox-group">
              <input 
                type="checkbox" 
                id="mintable"
                v-model="isMintable"
                class="checkbox"
              />
              <label for="mintable" class="label" style="margin-bottom: 0; cursor: pointer;">
                支持增发功能（部署后可以增加代币供应量）
              </label>
            </div>

            <div class="info-box">
              <strong>禁止使用的代币名称/符号：</strong><br />
              BTC, ETH, BNB, BTY, USDT, USDC, DAI, CAKE, WBTC, WETH, WBTY 等主流代币
            </div>

            <div v-if="deployError" class="error">{{ deployError }}</div>
            <div v-if="deploySuccess" class="success">{{ deploySuccess }}</div>

            <button 
              class="button"
              @click="handleDeploy"
              :disabled="!tokenName || !tokenSymbol || !initialSupply || isDeploying"
            >
              {{ isDeploying ? '部署中...' : '创建代币' }}
            </button>

            <!-- 部署成功结果 -->
            <div v-if="deployedAddress" class="result-box">
              <div class="result-title">部署成功！</div>
              <div class="result-item">
                <span class="result-text">
                  合约地址: {{ deployedAddress.substring(0, 10) }}...{{ deployedAddress.substring(deployedAddress.length - 8) }}
                </span>
                <button class="copy-btn" @click="copyToClipboard(deployedAddress)">复制</button>
              </div>
              <div v-if="deployTxHash" class="result-item">
                <span class="result-text">
                  交易哈希: {{ deployTxHash.substring(0, 10) }}...{{ deployTxHash.substring(deployTxHash.length - 8) }}
                </span>
                <button class="copy-btn" @click="copyToClipboard(deployTxHash)">复制</button>
              </div>
              <button 
                v-if="deployTxHash"
                class="view-btn"
                @click="openExplorer(deployTxHash)"
              >
                在区块浏览器中查看交易
              </button>
            </div>
          </div>

          <!-- 增发代币Tab -->
          <div v-else>
            <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
              增发ERC20代币
            </h2>
            <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
              为已部署的代币合约增加供应量（仅限合约owner操作）
            </p>

            <div class="form-group">
              <label class="label">合约地址 *</label>
              <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
                输入您要增发的代币合约地址
              </p>
              <input 
                class="input"
                type="text"
                placeholder="0x..."
                v-model="contractAddress"
                @input="handleContractAddressChange"
              />
            </div>

            <!-- 加载中 -->
            <div v-if="isLoadingTokenInfo" class="loading">
              正在获取代币信息...
            </div>

            <!-- 代币信息 -->
            <div v-if="tokenInfo && !isLoadingTokenInfo" class="token-info">
              <div class="token-info-title">代币信息</div>
              <div class="token-info-item">名称: {{ tokenInfo.name }}</div>
              <div class="token-info-item">符号: {{ tokenInfo.symbol }}</div>
              <div class="token-info-item">小数位数: {{ tokenInfo.decimals }}</div>
              <div class="token-info-item">当前总供应量: {{ tokenInfo.totalSupply }}</div>
              <div class="token-info-item">支持增发: {{ tokenInfo.mintable ? '是' : '否' }}</div>
              <div class="token-info-item">合约Owner: {{ tokenInfo.owner }}</div>
            </div>

             <!-- 权限检查提示 -->
             <div v-if="tokenInfo && !isLoadingTokenInfo && tokenInfo.owner.toLowerCase() !== account?.toLowerCase()" class="error">
               <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                 <div style="display: flex; align-items: center; margin-bottom: 12px;">
                   <span style="font-size: 20px; margin-right: 8px;">⚠️</span>
                   <strong style="color: #856404;">权限错误</strong>
                 </div>
                 <p style="margin: 0 0 8px 0; color: #856404;">
                   <strong>当前钱包不是合约的owner，无法执行增发操作。</strong>
                 </p>
                 <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin: 8px 0;">
                   <div style="font-size: 12px; color: #666; margin-bottom: 4px;">合约Owner地址：</div>
                   <div style="font-family: monospace; font-size: 12px; word-break: break-all; color: #333;">
                     {{ tokenInfo.owner }}
                   </div>
                 </div>
                 <div style="background: #f8f9fa; padding: 12px; border-radius: 4px; margin: 8px 0;">
                   <div style="font-size: 12px; color: #666; margin-bottom: 4px;">您的钱包地址：</div>
                   <div style="font-family: monospace; font-size: 12px; word-break: break-all; color: #333;">
                     {{ account }}
                   </div>
                 </div>
                 <p style="margin: 8px 0 0 0; font-size: 14px; color: #856404;">
                   <em>请切换到合约owner的钱包地址，或联系合约owner进行增发操作。</em>
                 </p>
               </div>
             </div>

             <!-- 增发表单 -->
             <div v-if="tokenInfo && tokenInfo.mintable && tokenInfo.owner.toLowerCase() === account?.toLowerCase()">
              <div class="form-group">
                <label class="label">增发数量 *</label>
                <p style="font-size: 12px; color: #666; margin-bottom: 8px;">
                  输入要增发的代币数量（将增发给您的钱包地址）
                </p>
                <input 
                  class="input"
                  type="text"
                  placeholder="例如: 1000000"
                  v-model="mintAmount"
                />
              </div>

              <div class="info-box">
                <strong>注意：</strong>增发的代币将直接发送到您的钱包地址
                <div style="word-break: break-all; margin-top: 4px; font-size: 12px; color: #999;">
                  {{ account }}
                </div>
              </div>

              <div v-if="mintError" class="error">{{ mintError }}</div>
              <div v-if="mintSuccess" class="success">{{ mintSuccess }}</div>

              <button 
                class="button secondary"
                @click="handleMint"
                :disabled="!mintAmount || isMinting"
              >
                {{ isMinting ? '增发中...' : '增发代币' }}
              </button>

              <!-- 增发交易结果 -->
              <div v-if="mintTxHash" style="margin-top: 12px;">
                <div class="result-item">
                  <span class="result-text">
                    增发交易哈希: {{ mintTxHash.substring(0, 10) }}...{{ mintTxHash.substring(mintTxHash.length - 8) }}
                  </span>
                  <button class="copy-btn" @click="copyToClipboard(mintTxHash)">复制</button>
                </div>
                <button 
                  class="view-btn"
                  @click="openExplorer(mintTxHash)"
                >
                  查看增发交易
                </button>
              </div>
            </div>

             <!-- 错误提示 -->
             <div v-if="tokenInfo && !isLoadingTokenInfo && !tokenInfo.mintable" class="error">
               该代币合约不支持增发功能
             </div>

            <div v-if="!tokenInfo && !isLoadingTokenInfo && contractAddress && mintError" class="error">
              {{ mintError }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { ethers } from 'ethers'
import { ERC20_CONTRACT_ABI, ERC20_CONTRACT_BYTECODE } from './constants/erc20Contract'

export default {
  name: 'App',
  setup() {
    // 基础状态
    const account = ref('')
    const activeTab = ref('deploy')
    const provider = ref(null)
    const signer = ref(null)

    // 部署相关状态
    const tokenName = ref('')
    const tokenSymbol = ref('')
    const initialSupply = ref('')
    const isMintable = ref(true)
    const deployError = ref('')
    const deploySuccess = ref('')
    const deployedAddress = ref('')
    const deployTxHash = ref('')
    const isDeploying = ref(false)

    // 增发相关状态
    const contractAddress = ref('')
    const mintAmount = ref('')
    const mintError = ref('')
    const mintSuccess = ref('')
    const isMinting = ref(false)
    const mintTxHash = ref('')
    const isLoadingTokenInfo = ref(false)
    const tokenInfo = ref(null)

    // 禁止创建的主流代币名称和符号
    const FORBIDDEN_TOKENS = {
      names: [
        'bitcoin', 'btc', 'ethereum', 'eth', 'binance coin', 'bnb', 'bityuan', 'bty',
        'tether', 'usdt', 'usd coin', 'usdc', 'dai', 'cake', 'pancakeswap',
        'wrapped bitcoin', 'wbtc', 'wrapped ethereum', 'weth', 'wrapped bityuan', 'wbty'
      ],
      symbols: [
        'BTC', 'ETH', 'BNB', 'BTY', 'USDT', 'USDC', 'DAI', 'CAKE', 'WBTC', 'WETH', 'WBTY'
      ]
    }

     // 连接钱包
     const connectWallet = async () => {
       try {
         if (typeof window.ethereum !== 'undefined') {
           const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
           account.value = accounts[0]
           
           try {
             provider.value = new ethers.providers.Web3Provider(window.ethereum, "any")
             signer.value = provider.value.getSigner()
           } catch (providerError) {
             // 如果创建provider失败，尝试使用默认方式
             console.warn('使用默认方式创建provider:', providerError.message)
             provider.value = new ethers.providers.Web3Provider(window.ethereum)
             signer.value = provider.value.getSigner()
           }
           
           // 不主动获取网络信息，避免网络属性错误
           // 网络信息会在需要时自动获取
           console.log('钱包连接成功')
         } else {
           alert('请安装MetaMask钱包')
         }
       } catch (error) {
         console.error('连接钱包失败:', error)
         alert('连接钱包失败: ' + error.message)
       }
     }

     // 断开钱包连接
     const disconnectWallet = () => {
       account.value = ''
       provider.value = null
       signer.value = null
       // 清空所有状态
       tokenName.value = ''
       tokenSymbol.value = ''
       initialSupply.value = ''
       isMintable.value = true
       deployError.value = ''
       deploySuccess.value = ''
       deployedAddress.value = ''
       deployTxHash.value = ''
       contractAddress.value = ''
       mintAmount.value = ''
       mintError.value = ''
       mintSuccess.value = ''
       mintTxHash.value = ''
       tokenInfo.value = null
     }

    // 验证代币名称
    const validateTokenName = (name) => {
      const lowerName = name.toLowerCase()
      return !FORBIDDEN_TOKENS.names.some(forbidden => lowerName.includes(forbidden))
    }

    // 验证代币符号
    const validateTokenSymbol = (symbol) => {
      return !FORBIDDEN_TOKENS.symbols.includes(symbol.toUpperCase())
    }

     // 检查是否是hash mismatch错误
     const isHashMismatchError = (error) => {
       const errorMessage = error?.message || error?.toString() || ''
       const mismatchPatterns = [
         'Transaction hash mismatch',
         'hash mismatch',
         'expectedHash',
         'returnedHash'
       ]
       const lowerErrorMessage = errorMessage.toLowerCase()
       return mismatchPatterns.some(pattern =>
         lowerErrorMessage.includes(pattern.toLowerCase())
       ) || (error?.expectedHash && error?.returnedHash)
     }

     // 检查是否是网络属性错误
     const isNetworkPropertyError = (error) => {
       const errorMessage = error?.message || error?.toString() || ''
       return errorMessage.includes('_network') || 
              errorMessage.includes('read-only') || 
              errorMessage.includes('non-configurable') ||
              errorMessage.includes('proxy') ||
              errorMessage.includes('expected') ||
              errorMessage.includes('got')
     }

     // 检查是否是权限错误
     const isPermissionError = (error) => {
       const errorMessage = error?.message || error?.toString() || ''
       return errorMessage.includes('caller is not the owner') ||
              errorMessage.includes('Ownable') ||
              errorMessage.includes('not the owner')
     }

     // 安全的网络操作包装器
     const safeNetworkOperation = async (operation) => {
       try {
         return await operation()
       } catch (error) {
         if (isNetworkPropertyError(error)) {
           console.warn('网络属性访问错误，但操作可能成功:', error.message)
           return null
         }
         throw error
       }
     }

    // 处理hash mismatch错误
    const handleHashMismatchSuccess = (operation, successMessage) => {
      return `${successMessage}`
    }

    // 从交易收据获取合约地址
    const getContractAddressFromReceipt = async (txHash) => {
      try {
        if (!provider.value) return null
        const receipt = await provider.value.getTransactionReceipt(txHash)
        return receipt?.contractAddress || null
      } catch (error) {
        console.log('获取交易收据失败:', error)
        return null
      }
    }

    // 验证交易是否成功
    const verifyTransactionSuccess = async (txHash) => {
      try {
        if (!provider.value) return false
        const receipt = await provider.value.getTransactionReceipt(txHash)
        return receipt && receipt.status === 1
      } catch (error) {
        return false
      }
    }

    // 复制到剪贴板
    const copyToClipboard = async (text) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text)
          return true
        }
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        return successful
      } catch (error) {
        console.error('复制失败:', error)
        return false
      }
    }

    // 打开区块浏览器
    const openExplorer = (txHash) => {
      window.open(`https://mainnet.bityuan.com/tx/${txHash}`, '_blank')
    }

     // 获取代币信息
     const fetchTokenInfo = async (address) => {
       if (!provider.value || !ethers.utils.isAddress(address)) {
         tokenInfo.value = null
         mintError.value = '请输入有效的合约地址'
         return
       }

       isLoadingTokenInfo.value = true
       mintError.value = ''

       try {
         // 使用更稳定的方式创建合约实例，避免网络属性访问
         const contract = new ethers.Contract(address, ERC20_CONTRACT_ABI, provider.value)

        const [name, symbol, tokenDecimals, totalSupply, mintable, owner] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals(),
          contract.totalSupply(),
          contract.mintable(),
          contract.owner()
        ])

        tokenInfo.value = {
          name,
          symbol,
          decimals: typeof tokenDecimals === 'number' ? tokenDecimals : tokenDecimals.toNumber(),
          totalSupply: ethers.utils.formatUnits(totalSupply, typeof tokenDecimals === 'number' ? tokenDecimals : tokenDecimals.toNumber()),
          mintable,
          owner
        }
      } catch (err) {
        tokenInfo.value = null
        if (err.message?.includes('call revert')) {
          mintError.value = '该地址不是有效的ERC20合约，或合约不支持我们的接口'
        } else if (err.message?.includes('network')) {
          mintError.value = '网络连接失败，请检查网络设置'
        } else {
          mintError.value = `无法获取代币信息: ${err.message || '未知错误'}`
        }
      } finally {
        isLoadingTokenInfo.value = false
      }
    }

    // 处理合约地址变化
    const handleContractAddressChange = (event) => {
      const address = event.target.value
      contractAddress.value = address
      mintError.value = ''
      mintSuccess.value = ''
      tokenInfo.value = null

      if (ethers.utils.isAddress(address)) {
        fetchTokenInfo(address)
      } else {
        mintError.value = '请输入有效的合约地址'
      }
    }

    // 部署代币
    const handleDeploy = async () => {
      if (!account.value) {
        deployError.value = '请先连接钱包'
        return
      }

      if (!signer.value) {
        deployError.value = '无法获取Web3库'
        return
      }

      if (!tokenName.value || !tokenSymbol.value || !initialSupply.value) {
        deployError.value = '请填写所有必填字段'
        return
      }

      if (!validateTokenName(tokenName.value)) {
        deployError.value = '代币名称包含禁止使用的关键词'
        return
      }

      if (!validateTokenSymbol(tokenSymbol.value)) {
        deployError.value = '代币符号已被保留，请使用其他符号'
        return
      }

      const decimalsNum = 18
      const supplyNum = parseFloat(initialSupply.value)
      if (Number.isNaN(supplyNum) || supplyNum <= 0) {
        deployError.value = '初始供应量必须大于0'
        return
      }

      isDeploying.value = true
      deployError.value = ''
      deploySuccess.value = ''
      deployedAddress.value = ''
      deployTxHash.value = ''

       try {
         const initialSupplyWei = ethers.utils.parseUnits(initialSupply.value, 0)
         
         const factory = new ethers.ContractFactory(
           ERC20_CONTRACT_ABI,
           ERC20_CONTRACT_BYTECODE,
           signer.value
         )

        deploySuccess.value = '正在部署合约，请确认钱包交易...'

        try {
          const contract = await factory.deploy(
            tokenName.value,
            tokenSymbol.value,
            initialSupplyWei,
            isMintable.value
          )

          const txHash = contract.deployTransaction.hash
          deployTxHash.value = txHash
          deploySuccess.value = `合约部署中，交易哈希: ${txHash}`

          try {
            await contract.deployed()
            deployedAddress.value = contract.address
            deploySuccess.value = '代币部署成功！'

            // 清空表单
            tokenName.value = ''
            tokenSymbol.value = ''
            initialSupply.value = ''
            isMintable.value = true
          } catch (deployErr) {
            const isMismatch = isHashMismatchError(deployErr)
            if (isMismatch) {
              if (deployErr.transactionHash) {
                const deployedContractAddress = await getContractAddressFromReceipt(deployErr.transactionHash)
                if (deployedContractAddress) {
                  deployedAddress.value = deployedContractAddress
                  deploySuccess.value = handleHashMismatchSuccess('部署', '代币部署成功！')
                  tokenName.value = ''
                  tokenSymbol.value = ''
                  initialSupply.value = ''
                  isMintable.value = true
                  return
                }
              }
            }
            throw deployErr
          }
        } catch (deployErr) {
          const isMismatch = isHashMismatchError(deployErr)
          if (isMismatch) {
            if (deployErr.transactionHash) {
              const deployedContractAddress = await getContractAddressFromReceipt(deployErr.transactionHash)
              if (deployedContractAddress) {
                deployedAddress.value = deployedContractAddress
                deploySuccess.value = handleHashMismatchSuccess('部署', '代币部署成功！')
                tokenName.value = ''
                tokenSymbol.value = ''
                initialSupply.value = ''
                isMintable.value = true
                return
              }
            }
          }
          throw deployErr
        }
       } catch (err) {
         // 检查是否是网络属性错误
         if (isNetworkPropertyError(err)) {
           deployError.value = '网络连接问题，请检查MetaMask网络设置或刷新页面重试'
           console.warn('网络属性错误，但部署可能成功:', err.message)
         } else {
           deployError.value = `部署失败: ${err.message || '未知错误'}`
         }
         deploySuccess.value = ''
         deployedAddress.value = ''
         deployTxHash.value = ''
       } finally {
         isDeploying.value = false
       }
    }

    // 增发代币
    const handleMint = async () => {
      if (!account.value || !signer.value) {
        mintError.value = '请先连接钱包'
        return
      }

      if (!contractAddress.value) {
        mintError.value = '请输入合约地址'
        return
      }

      if (!ethers.utils.isAddress(contractAddress.value)) {
        mintError.value = '请输入有效的合约地址'
        return
      }

      if (!tokenInfo.value) {
        mintError.value = '无法获取代币信息，请检查合约地址'
        return
      }

      if (!tokenInfo.value.mintable) {
        mintError.value = '该代币不支持增发功能'
        return
      }

      if (tokenInfo.value.owner.toLowerCase() !== account.value.toLowerCase()) {
        mintError.value = '只有代币合约的owner才能进行增发操作'
        return
      }

      if (!mintAmount.value) {
        mintError.value = '请输入增发数量'
        return
      }

      const amountNum = parseFloat(mintAmount.value)
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        mintError.value = '增发数量必须大于0'
        return
      }

      isMinting.value = true
      mintError.value = ''
      mintSuccess.value = ''
      mintTxHash.value = ''

      try {
        const contract = new ethers.Contract(contractAddress.value, ERC20_CONTRACT_ABI, signer.value)
        const mintAmountWei = ethers.utils.parseUnits(mintAmount.value, tokenInfo.value.decimals)

        mintSuccess.value = '正在增发代币，请确认钱包交易...'

        try {
          const tx = await contract.mint(account.value, mintAmountWei)
          mintTxHash.value = tx.hash
          mintSuccess.value = `增发交易已提交，交易哈希: ${tx.hash}`

          try {
            await tx.wait()
            mintSuccess.value = `增发成功！已向您的地址增发 ${mintAmount.value} 个 ${tokenInfo.value.symbol} 代币`
            mintAmount.value = ''
            fetchTokenInfo(contractAddress.value)
          } catch (waitErr) {
            const isMismatch = isHashMismatchError(waitErr)
            if (isMismatch) {
              const txHash = waitErr.transactionHash || tx.hash
              if (txHash) {
                const isSuccess = await verifyTransactionSuccess(txHash)
                if (isSuccess) {
                  mintSuccess.value = handleHashMismatchSuccess('增发', `增发成功！已向您的地址增发 ${mintAmount.value} 个 ${tokenInfo.value.symbol} 代币`)
                  mintAmount.value = ''
                  fetchTokenInfo(contractAddress.value)
                  return
                }
              }
            }
            throw waitErr
          }
        } catch (mintErr) {
          const isMismatch = isHashMismatchError(mintErr)
          if (isMismatch) {
            const txHash = mintErr.transactionHash
            if (txHash) {
              const isSuccess = await verifyTransactionSuccess(txHash)
              if (isSuccess) {
                mintSuccess.value = handleHashMismatchSuccess('增发', `增发成功！已向您的地址增发 ${mintAmount.value} 个 ${tokenInfo.value.symbol} 代币`)
                mintAmount.value = ''
                fetchTokenInfo(contractAddress.value)
                return
              }
            }
          }
          throw mintErr
        }
       } catch (err) {
         // 检查不同类型的错误
         if (isPermissionError(err)) {
           mintError.value = '权限错误：当前钱包不是合约的owner，无法执行增发操作。请使用合约owner的钱包地址。'
         } else if (isNetworkPropertyError(err)) {
           mintError.value = '网络连接问题，请检查MetaMask网络设置或刷新页面重试'
           console.warn('网络属性错误，但增发可能成功:', err.message)
         } else {
           mintError.value = `增发失败: ${err.message || '未知错误'}`
         }
         mintSuccess.value = ''
         mintTxHash.value = ''
       } finally {
         isMinting.value = false
       }
    }

    return {
      account,
      activeTab,
      tokenName,
      tokenSymbol,
      initialSupply,
      isMintable,
      deployError,
      deploySuccess,
      deployedAddress,
      deployTxHash,
      isDeploying,
      contractAddress,
      mintAmount,
      mintError,
      mintSuccess,
      isMinting,
      mintTxHash,
      isLoadingTokenInfo,
      tokenInfo,
       connectWallet,
       disconnectWallet,
       handleContractAddressChange,
       handleDeploy,
       handleMint,
       copyToClipboard,
       openExplorer
    }
  }
}
</script>
