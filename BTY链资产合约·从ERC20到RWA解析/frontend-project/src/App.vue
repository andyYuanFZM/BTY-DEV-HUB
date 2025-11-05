<template>
  <div class="container">
    <div class="card">
      <div class="card-header">
        <h1 class="title">Tokenize</h1>
        <p class="subtitle">在BTY Chain上管理您的代币资产</p>
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
         
         <!-- 主Tab选择（ERC20 和 RWA） -->
         <div class="main-tab-container">
          <button 
            class="main-tab" 
            :class="{ active: mainTab === 'erc20' }"
            @click="mainTab = 'erc20'; activeTab = 'deploy'"
          >
            ERC20代币
          </button>
          <button 
            class="main-tab" 
            :class="{ active: mainTab === 'rwa' }"
            @click="mainTab = 'rwa'; updateRWAUserRole()"
          >
            RWA资产管理
          </button>
        </div>

        <!-- ERC20 子Tab -->
        <div v-if="mainTab === 'erc20'" class="tab-container">
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

        <!-- RWA 子Tab -->
        <div v-if="mainTab === 'rwa'" class="tab-container">
          <!-- 资产注册 - 仅Owner可见（AssetRegistry或RevenueDistributor的Owner） -->
          <button 
            v-if="rwaIsAssetRegistryOwner || rwaIsRevenueDistributorOwner"
            class="tab" 
            :class="{ active: rwaSubTab === 'asset-register' }"
            @click="rwaSubTab = 'asset-register'; loadRWAContractOwners()"
          >
            资产注册
          </button>
          <!-- 用户注册 - Owner或Agent可见（IdentityRegistry的Agent或Owner） -->
          <button 
            v-if="rwaIsIdentityRegistryAgent || rwaIsAssetRegistryOwner || rwaIsRevenueDistributorOwner"
            class="tab" 
            :class="{ active: rwaSubTab === 'user-register' }"
            @click="rwaSubTab = 'user-register'; loadRWAAgentPermissions()"
          >
            用户注册
          </button>
          <!-- 代币分发 - Owner或Agent可见（Token的Agent或Owner） -->
          <button 
            v-if="rwaIsTokenAgent || rwaIsAssetRegistryOwner || rwaIsRevenueDistributorOwner"
            class="tab" 
            :class="{ active: rwaSubTab === 'token-distribute' }"
            @click="switchToTokenDistribute"
          >
            代币分发
          </button>
          <!-- 收益管理 - 所有人可见 -->
          <button 
            class="tab" 
            :class="{ active: rwaSubTab === 'revenue' }"
            @click="switchToRevenueTab"
          >
            收益管理
          </button>
          <!-- 信息查询 - 所有人可见 -->
          <button 
            class="tab" 
            :class="{ active: rwaSubTab === 'view' }"
            @click="rwaSubTab = 'view'"
          >
            信息查询
          </button>
        </div>

        <div class="card-body">
          <!-- ERC20 功能区域 -->
          <div v-if="mainTab === 'erc20'">
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

          <!-- RWA 功能区域 -->
          <div v-if="mainTab === 'rwa'">
            <!-- 加载中提示 -->
            <div v-if="!rwaUserRole && account" class="loading" style="margin-bottom: 16px;">
              正在加载权限信息...
            </div>
            
            <!-- 角色提示 -->
            <div v-if="rwaUserRole" class="info-box" style="margin-bottom: 16px; background: #e3f2fd; border-left: 4px solid #2196f3;">
              <div style="font-weight: bold; margin-bottom: 8px;">
                当前角色：
                <span v-if="rwaUserRole === 'owner'" style="color: #1976d2;">
                  👑 Owner
                  <span v-if="rwaUserRoleDetails.isTokenAgent || rwaUserRoleDetails.isIdentityRegistryAgent" style="color: #388e3c;"> & Agent</span>
                  （拥有所有权限）
                </span>
                <span v-else-if="rwaUserRole === 'agent'" style="color: #388e3c;">🔧 Agent（可注册用户和分发代币）</span>
                <span v-else style="color: #666;">👤 普通用户（可查看信息和提取收益）</span>
              </div>
            </div>

            <!-- 资产注册 -->
            <div v-if="rwaSubTab === 'asset-register' && (rwaIsAssetRegistryOwner || rwaIsRevenueDistributorOwner)">
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                注册RWA资产
              </h2>
              <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
                注册新能源设备资产到链上（仅Owner可操作）
              </p>
              <div class="form-group">
                <label class="label">设备ID *</label>
                <input 
                  class="input"
                  type="text"
                  placeholder="例如: PV-001"
                  v-model="rwaAssetId"
                />
              </div>

              <div class="form-group">
                <label class="label">设备类型 *</label>
                <input 
                  class="input"
                  type="text"
                  placeholder="例如: 光伏、风电"
                  v-model="rwaAssetType"
                />
              </div>

              <div class="form-group">
                <label class="label">设备位置 *</label>
                <input 
                  class="input"
                  type="text"
                  placeholder="例如: 甘肃陇南"
                  v-model="rwaAssetLocation"
                />
              </div>

              <div class="form-group">
                <label class="label">设备容量 (kW) *</label>
                <input 
                  class="input"
                  type="text"
                  placeholder="例如: 100"
                  v-model="rwaAssetCapacity"
                />
              </div>

              <div class="info-box">
                <div style="margin-bottom: 8px;">
                  <strong>关联的代币合约：</strong>{{ RWA_DEPLOYMENT_INFO.token }}
                </div>
              </div>

              <div v-if="rwaError" class="error">{{ rwaError }}</div>
              <div v-if="rwaSuccess" class="success">{{ rwaSuccess }}</div>

              <button 
                class="button"
                @click="handleRegisterAsset"
                :disabled="!rwaAssetId || !rwaAssetType || !rwaAssetLocation || !rwaAssetCapacity || rwaLoading || !(rwaIsAssetRegistryOwner || rwaIsRevenueDistributorOwner)"
              >
                {{ rwaLoading ? '注册中...' : '注册资产' }}
              </button>
            </div>

            <!-- 用户注册 -->
            <div v-if="rwaSubTab === 'user-register' && (rwaIsIdentityRegistryAgent || rwaIsAssetRegistryOwner || rwaIsRevenueDistributorOwner)">
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                注册用户身份
              </h2>
              <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
                为用户注册ERC-3643身份（仅Agent可操作，用于后续代币分发）
              </p>

              <div class="form-group">
                <label class="label">用户钱包地址 *</label>
                <input 
                  class="input"
                  type="text"
                  placeholder="0x..."
                  v-model="rwaUserAddress"
                />
              </div>

              <div class="form-group">
                <label class="label">ONCHAINID合约地址 <span style="color: #999; font-weight: normal;">(演示用)</span></label>
                <input 
                  class="input"
                  type="text"
                  placeholder="0x... (正式环境：用户自己的ONCHAINID合约地址，Demo中仅用于展示)"
                  v-model="rwaOnchainIDAddress"
                />
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                  💡 <strong>说明：</strong>在生产环境中，ONCHAINID 是指实现 ERC-734/ERC-735 的身份合约，用于存放KYC/合规模式的 Claim
                </div>
              </div>

              <!-- 国家代码字段已注释，演示时不再使用 -->
              
              <div class="form-group">
                <label class="label">国家代码 (ISO 3166-1) <span style="color: #999; font-weight: normal;">(可选)</span></label>
                <input 
                  class="input"
                  type="text"
                  placeholder="留空使用默认值 0，或输入: 156 (中国), 840 (美国)"
                  v-model="rwaCountryCode"
                />
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                  💡 <strong>说明：</strong>国家代码用于合规管理（例如限制某些国家的用户），在Demo中可留空使用默认值0
                </div>
              </div>
             

              <!-- RWA用户注册信息说明 -->
              <div class="info-box" style="margin-top: 16px; background-color: #e3f2fd; border-left: 4px solid #2196f3;">
                <div style="margin-bottom: 8px;">
                  <strong>📋 RWA用户注册流程说明（Demo模式）：</strong>
                </div>
                <div style="font-size: 12px; line-height: 1.8; color: #333;">
                  <div style="margin-bottom: 8px; padding: 8px; background-color: #fff3cd; border-radius: 4px; color: #856404;">
                    <strong>💡 Demo模式说明：</strong>当前为演示版本，流程已简化，跳过链上 KYC Claims 验证，仅验证注册状态。
                  </div>
                  
                  <div style="margin-bottom: 4px;">
                    <strong>Demo模式注册流程：</strong>
                  </div>
                  <ol style="margin: 4px 0; padding-left: 20px;">
                    <li><strong>输入用户信息</strong>：输入用户钱包地址和ONCHAINID合约地址（演示用，实际使用共享MockOnchainID）</li>
                    <li><strong>注册到IdentityRegistry</strong>：传入用户地址、共享MockOnchainID地址完成注册</li>
                    <li><strong>完成注册</strong>：注册完成后，用户即可被视为"合规用户"，可以接收或转让 ERC-3643 代币</li>
                  </ol>

                  <div style="margin-top: 12px; margin-bottom: 4px;">
                    <strong>实际生产环境流程（参考）：</strong>
                  </div>
                  <ol style="margin: 4px 0; padding-left: 20px; color: #666;">
                    <li><strong>创建ONCHAINID</strong>：为每个用户创建独立的ONCHAINID合约（ERC-734/ERC-735标准）</li>
                    <li><strong>KYC验证</strong>：投资者通过验证机构完成KYC（如身份证、税务居住地、投资资格等）</li>
                    <li><strong>签发Claims</strong>：验证机构向用户的ONCHAINID签发Claims（身份声明），存储在ONCHAINID合约中</li>
                    <li><strong>注册到IdentityRegistry</strong>：调用 <code>IdentityRegistry.registerIdentity(用户地址, ONCHAINID合约地址, 国家代码)</code>，将用户的ONCHAINID合约地址和国家代码注册到IdentityRegistry中</li>
                    <li><strong>合规检查</strong>：IdentityRegistry验证用户ONCHAINID中的Claims，Compliance合约检查规则（包括国家代码限制）后允许代币操作</li>
                  </ol>
                </div>
              </div>

              <div v-if="rwaError" class="error">{{ rwaError }}</div>
              <div v-if="rwaSuccess" class="success">{{ rwaSuccess }}</div>

              <button 
                class="button"
                @click="handleRegisterUser"
                :disabled="!rwaUserAddress || rwaLoading || !(rwaIsIdentityRegistryAgent || rwaIsAssetRegistryOwner || rwaIsRevenueDistributorOwner)"
              >
                {{ rwaLoading ? '注册中...' : '注册用户' }}
              </button>
            </div>

            <!-- 代币分发 -->
            <div v-if="rwaSubTab === 'token-distribute'">
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                分发代币给用户
              </h2>
              <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
                向已注册的用户分发RWA代币（仅Agent可操作）。代币与设备关联，持有代币即可获得对应设备的收益分配。
              </p>
                            
              <div class="form-group">
                <label class="label">接收地址 *</label>
                <input 
                  class="input"
                  type="text"
                  placeholder="0x..."
                  v-model="rwaDistributeAddress"
                  @blur="checkUserVerification"
                  @input="handleDistributeAddressInput"
                />
                <!-- 用户验证状态显示 -->
                <div v-if="rwaDistributeAddress && isValidAddress(rwaDistributeAddress)" style="margin-top: 8px;">
                  <div v-if="rwaCheckingUserVerification" style="font-size: 12px; color: #666;">
                    🔍 正在检查用户身份验证状态...
                  </div>
       <div v-else-if="rwaDistributeUserVerified === true" class="info-box" style="margin-top: 8px; padding: 8px; background-color: #e8f5e9; border-left: 4px solid #4caf50;">
         <div style="font-size: 12px; color: #2e7d32;">
           ✅ <strong>用户已注册</strong>
           <div v-if="rwaDistributeUserInfo" style="margin-top: 4px; font-size: 11px; color: #555;">
             <div><strong>用户地址:</strong> {{ rwaDistributeAddress }}</div>
             <div><strong>Identity合约:</strong> {{ rwaDistributeUserInfo.identity }}</div>
             <div><strong>国家代码:</strong> {{ rwaDistributeUserInfo.countryCode }}</div>
             <div v-if="rwaDistributeUserInfo.isDemoMode" style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #c8e6c9; color: #666; font-style: italic;">
               💡 Demo模式：已跳过KYC Claims验证，仅检查用户是否已注册
             </div>
           </div>
         </div>
       </div>
                  <div v-else-if="rwaDistributeUserVerified === false" class="error" style="margin-top: 8px; padding: 8px; font-size: 12px;">
                    ❌ <strong>用户未注册身份</strong>
                    <div style="margin-top: 4px; font-size: 11px;">
                      该地址尚未在IdentityRegistry中注册。请先在"用户注册"页面为该地址注册身份，然后再分发代币。
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="label">代币数量 *</label>
                <input 
                  class="input"
                  type="text"
                  placeholder="例如: 2 (输入整数)"
                  v-model="rwaDistributeAmount"
                />
              </div>

              <div class="info-box">
                <strong>代币合约：</strong>{{ RWA_DEPLOYMENT_INFO.token }}<br/>
                <strong>代币符号：</strong>RWAET<br/>
                <strong>注意：</strong>用户必须先通过身份验证才能接收代币
              </div>

              <!-- 显示该代币关联的设备列表 -->
              <div class="info-box" style="margin-top: 16px;" v-if="rwaTokenAssets.length > 0">
                <div style="margin-bottom: 8px;">
                  <strong>📋 该代币关联的设备（{{ rwaTokenAssets.length }}台）：</strong>
                </div>
                <div style="max-height: 200px; overflow-y: auto; font-size: 12px;">
                  <div 
                    v-for="(assetId, index) in rwaTokenAssets" 
                    :key="index"
                    style="padding: 4px 0; border-bottom: 1px solid #e0e0e0;"
                  >
                    • {{ assetId }}
                  </div>
                </div>
              </div>
              <div class="info-box" style="margin-top: 16px;" v-else>
                <div style="font-size: 12px; color: #856404;">
                  ⚠️ 该代币尚未关联任何设备。请先注册设备并关联此代币。
                </div>
              </div>

              <div v-if="rwaError" class="error">{{ rwaError }}</div>
              <div v-if="rwaSuccess" class="success">{{ rwaSuccess }}</div>

              <button 
                class="button"
                @click="handleDistributeToken"
                :disabled="!rwaDistributeAddress || !rwaDistributeAmount || rwaLoading || !(rwaIsTokenAgent || rwaIsAssetRegistryOwner || rwaIsRevenueDistributorOwner) || rwaDistributeUserVerified !== true"
              >
                {{ rwaLoading ? '分发中...' : '分发代币' }}
              </button>
            </div>

            <!-- 收益管理 -->
            <div v-if="rwaSubTab === 'revenue'">
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                收益管理
              </h2>
              <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
                分配收益给代币持有人，或提取您的收益
              </p>

              <!-- 分配收益（Owner） -->
              <div v-if="rwaIsRevenueDistributorOwner || rwaIsAssetRegistryOwner" style="margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid #e0e0e0;">
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">分配收益（Owner）</h3>
                
                <!-- 合约余额显示 -->
                <div class="info-box" style="margin-bottom: 16px; background-color: #e3f2fd;">
                  <div style="margin-bottom: 4px;">
                    <strong>合约BTY余额：</strong>
                    <span v-if="rwaRevenueDistributorBalance !== null">{{ rwaRevenueDistributorBalance }} BTY</span>
                    <span v-else style="color: #999;">加载中...</span>
                  </div>
                  <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    💡 合约地址：<span style="font-family: monospace; font-size: 11px;">{{ RWA_DEPLOYMENT_INFO.revenueDistributor }}</span>
                    <br/>需要先向此合约转入BTY，才能分配收益给用户。
                  </div>
                  <button 
                    class="button secondary"
                    @click="loadRevenueDistributorBalance"
                    :disabled="rwaLoading"
                    style="margin-top: 8px; font-size: 12px; padding: 4px 8px;"
                  >
                    刷新余额
                  </button>
                </div>
                
                <div class="form-group">
                  <label class="label">资产ID *</label>
                  <input 
                    class="input"
                    type="text"
                    placeholder="例如: PV-001"
                    v-model="rwaRevenueAssetId"
                  />
                </div>

                <div class="form-group">
                  <label class="label">收益金额 (BTY) *</label>
                  <input 
                    class="input"
                    type="text"
                    placeholder="例如: 10000"
                    v-model="rwaRevenueAmount"
                  />
                </div>

                <div class="info-box" style="background-color: #fff3cd; border-left: 4px solid #ffc107;">
                  <div style="margin-bottom: 8px;">
                    <strong>📋 收益分配流程说明：</strong>
                  </div>
                  <div style="font-size: 12px; line-height: 1.8; color: #333;">
                    <div style="margin-bottom: 4px;">
                      <strong>1. 准备BTY资金：</strong>需要先向RevenueDistributor合约地址转入BTY作为收益资金池。
                    </div>
                    <div style="margin-bottom: 4px; font-family: monospace; font-size: 11px; background-color: #f5f5f5; padding: 4px; border-radius: 2px;">
                      {{ RWA_DEPLOYMENT_INFO.revenueDistributor }}
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>2. 分配收益：</strong>点击"分配收益"按钮，系统会记录收益到资产，并累计到总收益中。
                    </div>
                    <div style="margin-bottom: 4px;">
                      <strong>3. 计算用户收益：</strong>系统会根据用户代币持仓比例计算应得收益。
                    </div>
                  </div>
                </div>

                <button 
                  class="button secondary"
                  @click="handleDistributeRevenue"
                  :disabled="!rwaRevenueAssetId || !rwaRevenueAmount || rwaLoading || !(rwaIsRevenueDistributorOwner || rwaIsAssetRegistryOwner)"
                >
                  {{ rwaLoading ? '分配中...' : '分配收益' }}
                </button>
              </div>

              <!-- 提取收益（仅普通用户可见） -->
              <div v-if="!rwaIsRevenueDistributorOwner && !rwaIsAssetRegistryOwner && !rwaIsTokenAgent && !rwaIsIdentityRegistryAgent">
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px;">我的资产和收益</h3>
                
                <!-- 用户资产信息 -->
                <div class="info-box" style="margin-bottom: 16px;">
                  <div style="margin-bottom: 8px;">
                    <strong>持有的RWA代币：</strong>
                    <span v-if="rwaUserTokenBalance !== null">{{ rwaUserTokenBalance }} RWAET</span>
                    <span v-else style="color: #999;">加载中...</span>
                  </div>
                  <div style="margin-top: 8px;">
                    <strong>可提取收益：</strong>
                    <span v-if="rwaClaimableRevenue !== null">{{ rwaClaimableRevenue }} BTY</span>
                    <span v-else style="color: #999;">加载中...</span>
                  </div>
                  <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    💡 <strong>说明：</strong>代币数量表示您持有的RWA资产份额，收益将按持有比例自动分配。
                  </div>
                </div>

                <button 
                  class="button secondary"
                  @click="loadUserAssetsInfo"
                  :disabled="rwaLoading"
                  style="margin-bottom: 12px;"
                >
                  刷新信息
                </button>

                <button 
                  class="button"
                  @click="handleClaimRevenue"
                  :disabled="!rwaClaimableRevenue || rwaClaimableRevenue === '0' || rwaLoading"
                >
                  {{ rwaLoading ? '提取中...' : '提取收益' }}
                </button>
              </div>

              <div v-if="rwaError" class="error">{{ rwaError }}</div>
              <div v-if="rwaSuccess" class="success">{{ rwaSuccess }}</div>
            </div>

            <!-- 信息查询 -->
            <div v-if="rwaSubTab === 'view'">
              <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
                信息查询
              </h2>
              <p style="font-size: 14px; color: #666; margin-bottom: 16px;">
                查询资产信息、用户余额、收益等
              </p>

              <div class="form-group">
                <label class="label">查询类型</label>
                <select class="input" v-model="rwaViewType">
                  <option value="asset">资产信息</option>
                  <option value="token-assets">代币关联设备</option>
                  <option value="user-balance">用户代币余额</option>
                  <option value="user-verified">用户身份验证状态</option>
                  <option value="claimable-revenue">可提取收益</option>
                  <option value="asset-count">资产总数</option>
                </select>
              </div>

              <div class="form-group" v-if="rwaViewType === 'asset' || rwaViewType === 'user-balance' || rwaViewType === 'user-verified' || rwaViewType === 'claimable-revenue'">
                <label class="label">
                  {{ rwaViewType === 'asset' ? '资产ID' : '用户地址' }} *
                </label>
                <input 
                  class="input"
                  type="text"
                  :placeholder="rwaViewType === 'asset' ? '例如: PV-001' : '0x...'"
                  v-model="rwaViewQuery"
                />
              </div>

              <div class="form-group" v-if="rwaViewType === 'token-assets'">
                <label class="label">代币合约地址 *</label>
                <input 
                  class="input"
                  type="text"
                  placeholder="0x... (留空使用默认代币)"
                  v-model="rwaViewQuery"
                />
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                  默认代币: {{ RWA_DEPLOYMENT_INFO.token }}
                </div>
              </div>

              <button 
                class="button"
                @click="handleViewInfo"
                :disabled="(rwaViewType !== 'asset-count' && rwaViewType !== 'token-assets' && !rwaViewQuery) || rwaLoading"
              >
                {{ rwaLoading ? '查询中...' : '查询' }}
              </button>

              <div v-if="rwaViewResult" class="result-box" style="margin-top: 16px;">
                <div class="result-title">查询结果</div>
                <pre style="white-space: pre-wrap; word-break: break-all; font-size: 12px; color: #666;">{{ rwaViewResult }}</pre>
              </div>

              <div v-if="rwaError" class="error">{{ rwaError }}</div>
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
import { 
  RWA_DEPLOYMENT_INFO, 
  ASSET_REGISTRY_ABI, 
  REVENUE_DISTRIBUTOR_ABI,
  TOKEN_3643_ABI,
  IDENTITY_REGISTRY_ABI,
  IDENTITY_ABI,
  MOCK_ONCHAINID_ABI
} from './constants/rwaContracts'

export default {
  name: 'App',
  setup() {
    // 基础状态
    const account = ref('')
    const activeTab = ref('deploy')
    const mainTab = ref('erc20') // 主Tab：erc20 或 rwa
    const provider = ref(null)
    const signer = ref(null)

    // RWA 状态
    const rwaSubTab = ref('') // 初始为空，根据角色自动设置
    const rwaAssetId = ref('')
    const rwaAssetType = ref('')
    const rwaAssetLocation = ref('')
    const rwaAssetCapacity = ref('')
    const rwaUserAddress = ref('')
    const rwaCountryCode = ref('') // 演示时不再使用，使用默认值0
    const rwaOnchainIDAddress = ref('') // ONCHAINID合约地址（仅用于演示展示）
    const rwaDistributeAddress = ref('')
    const rwaDistributeAmount = ref('')
    const rwaDistributeUserVerified = ref(null) // null=未检查, true=已验证, false=未验证
    const rwaDistributeUserInfo = ref(null) // 用户注册信息
    const rwaCheckingUserVerification = ref(false) // 正在检查用户验证状态
    const rwaRevenueAssetId = ref('')
    const rwaRevenueAmount = ref('')
    const rwaRevenueDistributorBalance = ref(null) // RevenueDistributor合约的ETH余额
    const rwaClaimableRevenue = ref(null)
    const rwaUserTokenBalance = ref(null) // 用户持有的RWA代币数量
    const rwaViewType = ref('asset')
    const rwaViewQuery = ref('')
    const rwaViewResult = ref('')
    const rwaError = ref('')
    const rwaSuccess = ref('')
    const rwaLoading = ref(false)
    const rwaTokenAssets = ref([]) // 当前代币关联的设备列表
    const rwaAssetRegistryOwner = ref('')
    const rwaRevenueDistributorOwner = ref('')
    const rwaIsAssetRegistryOwner = ref(false)
    const rwaIsRevenueDistributorOwner = ref(false)
    const rwaIsTokenAgent = ref(false)
    const rwaIsIdentityRegistryAgent = ref(false)
    const rwaUserRole = ref('') // 'owner' | 'agent' | 'user' | ''
    const rwaUserRoleDetails = ref({
      isAssetRegistryOwner: false,
      isRevenueDistributorOwner: false,
      isTokenAgent: false,
      isIdentityRegistryAgent: false
    })

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

    // ========== RWA 功能函数 ==========

    // 注册资产
    const handleRegisterAsset = async () => {
      if (!account.value || !signer.value) {
        rwaError.value = '请先连接钱包'
        return
      }

      if (!rwaAssetId.value || !rwaAssetType.value || !rwaAssetLocation.value || !rwaAssetCapacity.value) {
        rwaError.value = '请填写所有必填字段'
        return
      }

      const capacityNum = parseFloat(rwaAssetCapacity.value)
      if (Number.isNaN(capacityNum) || capacityNum <= 0) {
        rwaError.value = '设备容量必须大于0'
        return
      }

      rwaLoading.value = true
      rwaError.value = ''
      rwaSuccess.value = ''

      try {
        const assetRegistry = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.assetRegistry,
          ASSET_REGISTRY_ABI,
          signer.value
        )

        const capacityWei = ethers.utils.parseUnits(rwaAssetCapacity.value, 3) // kW to W
        
        rwaSuccess.value = '正在注册资产，请确认钱包交易...'
        
        const tx = await assetRegistry.registerAsset(
          rwaAssetId.value,
          rwaAssetType.value,
          rwaAssetLocation.value,
          capacityWei,
          RWA_DEPLOYMENT_INFO.token
        )

        rwaSuccess.value = `交易已提交，交易哈希: ${tx.hash}`

        try {
          await tx.wait()
          rwaSuccess.value = `资产注册成功！资产ID: ${rwaAssetId.value}`
          rwaAssetId.value = ''
          rwaAssetType.value = ''
          rwaAssetLocation.value = ''
          rwaAssetCapacity.value = ''
          // 刷新代币关联设备列表（如果当前在代币分发Tab）
          if (rwaSubTab.value === 'token-distribute') {
            await loadTokenAssets()
          }
        } catch (waitErr) {
          if (isHashMismatchError(waitErr)) {
            const txHash = waitErr.transactionHash || tx.hash
            if (txHash && await verifyTransactionSuccess(txHash)) {
              rwaSuccess.value = `资产注册成功！资产ID: ${rwaAssetId.value}`
              rwaAssetId.value = ''
              rwaAssetType.value = ''
              rwaAssetLocation.value = ''
              rwaAssetCapacity.value = ''
              // 刷新代币关联设备列表（如果当前在代币分发Tab）
              if (rwaSubTab.value === 'token-distribute') {
                await loadTokenAssets()
              }
              return
            }
          }
          throw waitErr
        }
      } catch (err) {
        rwaError.value = `注册失败: ${err.message || '未知错误'}`
        rwaSuccess.value = ''
      } finally {
        rwaLoading.value = false
      }
    }

    // 获取用户Identity合约地址（Demo模式：直接返回共享的MockOnchainID地址）
    const createUserIdentity = async (userAddress) => {
      if (!RWA_DEPLOYMENT_INFO.mockOnchainID) {
        throw new Error('MockOnchainID未部署。请先部署MockOnchainID合约并更新RWA_DEPLOYMENT_INFO。')
      }

      // Demo模式：所有用户共享同一个MockOnchainID合约
      const identityAddress = RWA_DEPLOYMENT_INFO.mockOnchainID
      console.log('✅ 用户Identity合约地址（MockOnchainID）:', identityAddress)
      return identityAddress
    }

    // 注册用户（正确方式：为每个用户创建独立Identity合约）
    const handleRegisterUser = async () => {
      if (!account.value || !signer.value) {
        rwaError.value = '请先连接钱包'
        return
      }

      if (!rwaUserAddress.value || !ethers.utils.isAddress(rwaUserAddress.value)) {
        rwaError.value = '请输入有效的用户地址'
        return
      }

      // 国家代码：如果为空或无效，使用默认值0
      let countryCode = 0
      if (rwaCountryCode.value && rwaCountryCode.value.trim() !== '') {
        const parsed = parseInt(rwaCountryCode.value.trim())
        if (Number.isNaN(parsed) || parsed < 0 || parsed > 65535) {
          rwaError.value = '国家代码必须是0-65535之间的数字，留空将使用默认值0'
          return
        }
        countryCode = parsed
      }

      rwaLoading.value = true
      rwaError.value = ''
      rwaSuccess.value = ''

      try {
        // 步骤1：检查用户是否已注册
        const identityRegistry = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.identityRegistry,
          IDENTITY_REGISTRY_ABI,
          provider.value
        )
        
        const isAlreadyRegistered = await identityRegistry.contains(rwaUserAddress.value)
        if (isAlreadyRegistered) {
          rwaError.value = '该用户地址已注册'
          rwaLoading.value = false
          return
        }

        // 步骤2：获取用户Identity合约地址（Demo模式：共享MockOnchainID）
        rwaSuccess.value = '正在获取用户Identity合约地址...'
        let userIdentityAddress
        
        try {
          userIdentityAddress = await createUserIdentity(rwaUserAddress.value)
          console.log('✅ Identity合约地址（MockOnchainID）:', userIdentityAddress)
        } catch (identityErr) {
          rwaError.value = `获取Identity合约地址失败: ${identityErr.message}`
          rwaLoading.value = false
          return
        }

        // 步骤3：注册Identity到IdentityRegistry
        rwaSuccess.value = '正在注册用户Identity到IdentityRegistry...'
        
        const tx = await identityRegistry.connect(signer.value).registerIdentity(
          rwaUserAddress.value,
          userIdentityAddress,
          countryCode
        )

        rwaSuccess.value = `交易已提交，交易哈希: ${tx.hash}`

        try {
          await tx.wait()
          const onchainIDDisplay = rwaOnchainIDAddress.value || '(未输入，演示用)'
          rwaSuccess.value = `用户注册成功！\n用户地址: ${rwaUserAddress.value}\n实际使用的Identity合约: ${userIdentityAddress} (共享MockOnchainID)\n演示输入的ONCHAINID: ${onchainIDDisplay}\n国家代码: ${countryCode} (默认值)`
          rwaUserAddress.value = ''
          rwaOnchainIDAddress.value = ''
          rwaCountryCode.value = ''
        } catch (waitErr) {
          if (isHashMismatchError(waitErr)) {
            const txHash = waitErr.transactionHash || tx.hash
            if (txHash && await verifyTransactionSuccess(txHash)) {
              const onchainIDDisplay = rwaOnchainIDAddress.value || '(未输入，演示用)'
              rwaSuccess.value = `用户注册成功！\n用户地址: ${rwaUserAddress.value}\n实际使用的Identity合约: ${userIdentityAddress} (共享MockOnchainID)\n演示输入的ONCHAINID: ${onchainIDDisplay}\n国家代码: ${countryCode} (默认值)`
              rwaUserAddress.value = ''
              rwaOnchainIDAddress.value = ''
              rwaCountryCode.value = ''
              return
            }
          }
          throw waitErr
        }
      } catch (err) {
        rwaError.value = `注册失败: ${err.message || '未知错误'}`
        rwaSuccess.value = ''
      } finally {
        rwaLoading.value = false
      }
    }

    // 验证地址格式
    const isValidAddress = (address) => {
      if (!address) return false
      try {
        return ethers.utils.isAddress(address)
      } catch {
        return false
      }
    }

    // 处理接收地址输入
    const handleDistributeAddressInput = () => {
      // 输入时重置验证状态
      if (!rwaDistributeAddress.value || !isValidAddress(rwaDistributeAddress.value)) {
        rwaDistributeUserVerified.value = null
        rwaDistributeUserInfo.value = null
      }
    }

    // 检查用户身份验证状态（Demo模式：只检查是否注册，不检查Claims）
    const checkUserVerification = async () => {
      if (!provider.value) {
        return
      }

      if (!rwaDistributeAddress.value || !isValidAddress(rwaDistributeAddress.value)) {
        rwaDistributeUserVerified.value = null
        rwaDistributeUserInfo.value = null
        return
      }

      rwaCheckingUserVerification.value = true
      rwaError.value = ''

      try {
        const identityRegistry = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.identityRegistry,
          IDENTITY_REGISTRY_ABI,
          provider.value
        )

        // Demo模式：只检查用户是否已在IdentityRegistry中注册（contains）
        // 不检查isVerified（因为不需要Claims验证）
        const [contains, identityAddress, countryCode] = await Promise.all([
          identityRegistry.contains(rwaDistributeAddress.value),
          identityRegistry.identity(rwaDistributeAddress.value).catch(() => '0x0000000000000000000000000000000000000000'),
          identityRegistry.investorCountry(rwaDistributeAddress.value).catch(() => 0)
        ])

        if (contains && identityAddress !== '0x0000000000000000000000000000000000000000') {
          // Demo模式：只要用户已注册（有Identity合约），就认为可以分发代币
          rwaDistributeUserVerified.value = true
          rwaDistributeUserInfo.value = {
            identity: identityAddress,
            countryCode: countryCode.toString(),
            isDemoMode: true // 标记为Demo模式
          }
          console.log('✅ 用户已注册（Demo模式）:', {
            address: rwaDistributeAddress.value,
            contains,
            identity: identityAddress,
            countryCode
          })
        } else {
          rwaDistributeUserVerified.value = false
          rwaDistributeUserInfo.value = null
          console.log('❌ 用户未注册:', {
            address: rwaDistributeAddress.value,
            contains,
            identity: identityAddress
          })
        }
      } catch (err) {
        console.error('检查用户验证状态失败:', err)
        rwaDistributeUserVerified.value = false
        rwaDistributeUserInfo.value = null
        // 不显示错误，只标记为未验证
      } finally {
        rwaCheckingUserVerification.value = false
      }
    }

    // 分发代币
    const handleDistributeToken = async () => {
      if (!account.value || !signer.value) {
        rwaError.value = '请先连接钱包'
        return
      }

      if (!rwaDistributeAddress.value || !isValidAddress(rwaDistributeAddress.value)) {
        rwaError.value = '请输入有效的接收地址'
        return
      }

      // 再次检查用户验证状态（确保数据最新）
      if (rwaDistributeUserVerified.value !== true) {
        await checkUserVerification()
        if (rwaDistributeUserVerified.value !== true) {
          rwaError.value = '用户未通过身份验证，无法分发代币。请先在"用户注册"页面为该地址注册身份。'
          return
        }
      }

      if (!rwaDistributeAmount.value) {
        rwaError.value = '请输入代币数量'
        return
      }

      const amountNum = parseFloat(rwaDistributeAmount.value)
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        rwaError.value = '代币数量必须大于0'
        return
      }

      rwaLoading.value = true
      rwaError.value = ''
      rwaSuccess.value = ''

      try {
        const token = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.token,
          TOKEN_3643_ABI,
          signer.value
        )

        // 获取代币的decimals（动态查询，而不是硬编码）
        const tokenDecimals = await token.decimals()
        const decimalsNum = typeof tokenDecimals === 'number' ? tokenDecimals : tokenDecimals.toNumber()
        
        // 根据实际decimals转换数量
        const amountWei = ethers.utils.parseUnits(rwaDistributeAmount.value, decimalsNum)
        
        rwaSuccess.value = '正在分发代币，请确认钱包交易...'
        
        const tx = await token.mint(rwaDistributeAddress.value, amountWei)

        rwaSuccess.value = `交易已提交，交易哈希: ${tx.hash}`

        try {
          await tx.wait()
          rwaSuccess.value = `代币分发成功！已向 ${rwaDistributeAddress.value} 分发 ${rwaDistributeAmount.value} RWAET`
          rwaDistributeAddress.value = ''
          rwaDistributeAmount.value = ''
          rwaDistributeUserVerified.value = null
          rwaDistributeUserInfo.value = null
        } catch (waitErr) {
          if (isHashMismatchError(waitErr)) {
            const txHash = waitErr.transactionHash || tx.hash
            if (txHash && await verifyTransactionSuccess(txHash)) {
              rwaSuccess.value = `代币分发成功！已向 ${rwaDistributeAddress.value} 分发 ${rwaDistributeAmount.value} RWAET`
              rwaDistributeAddress.value = ''
              rwaDistributeAmount.value = ''
              rwaDistributeUserVerified.value = null
              rwaDistributeUserInfo.value = null
              return
            }
          }
          throw waitErr
        }
      } catch (err) {
        rwaError.value = `分发失败: ${err.message || '未知错误'}`
        rwaSuccess.value = ''
      } finally {
        rwaLoading.value = false
      }
    }

    // 分配收益
    const handleDistributeRevenue = async () => {
      if (!account.value || !signer.value) {
        rwaError.value = '请先连接钱包'
        return
      }

      if (!rwaRevenueAssetId.value || !rwaRevenueAmount.value) {
        rwaError.value = '请填写所有必填字段'
        return
      }

      const amountNum = parseFloat(rwaRevenueAmount.value)
      if (Number.isNaN(amountNum) || amountNum <= 0) {
        rwaError.value = '收益金额必须大于0'
        return
      }

      rwaLoading.value = true
      rwaError.value = ''
      rwaSuccess.value = ''

      try {
        const revenueDistributor = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.revenueDistributor,
          REVENUE_DISTRIBUTOR_ABI,
          signer.value
        )

        const amountWei = ethers.utils.parseEther(rwaRevenueAmount.value)
        
        rwaSuccess.value = '正在分配收益，请确认钱包交易...'
        
        const tx = await revenueDistributor.distributeRevenue(amountWei, rwaRevenueAssetId.value)

        rwaSuccess.value = `交易已提交，交易哈希: ${tx.hash}`

        try {
          await tx.wait()
          rwaSuccess.value = `收益分配成功！资产ID: ${rwaRevenueAssetId.value}，金额: ${rwaRevenueAmount.value} ETH`
          rwaRevenueAssetId.value = ''
          rwaRevenueAmount.value = ''
        } catch (waitErr) {
          if (isHashMismatchError(waitErr)) {
            const txHash = waitErr.transactionHash || tx.hash
            if (txHash && await verifyTransactionSuccess(txHash)) {
              rwaSuccess.value = `收益分配成功！资产ID: ${rwaRevenueAssetId.value}，金额: ${rwaRevenueAmount.value} ETH`
              rwaRevenueAssetId.value = ''
              rwaRevenueAmount.value = ''
              return
            }
          }
          throw waitErr
        }
      } catch (err) {
        rwaError.value = `分配失败: ${err.message || '未知错误'}`
        rwaSuccess.value = ''
      } finally {
        rwaLoading.value = false
      }
    }

    // 提取收益
    const handleClaimRevenue = async () => {
      if (!account.value || !signer.value) {
        rwaError.value = '请先连接钱包'
        return
      }

      rwaLoading.value = true
      rwaError.value = ''
      rwaSuccess.value = ''

      try {
        const revenueDistributor = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.revenueDistributor,
          REVENUE_DISTRIBUTOR_ABI,
          signer.value
        )
        
        rwaSuccess.value = '正在提取收益，请确认钱包交易...'
        
        const tx = await revenueDistributor.claimRevenue()

        rwaSuccess.value = `交易已提交，交易哈希: ${tx.hash}`

        try {
          await tx.wait()
          rwaSuccess.value = '收益提取成功！'
          await loadClaimableRevenue()
        } catch (waitErr) {
          if (isHashMismatchError(waitErr)) {
            const txHash = waitErr.transactionHash || tx.hash
            if (txHash && await verifyTransactionSuccess(txHash)) {
              rwaSuccess.value = '收益提取成功！'
              await loadClaimableRevenue()
              return
            }
          }
          throw waitErr
        }
      } catch (err) {
        rwaError.value = `提取失败: ${err.message || '未知错误'}`
        rwaSuccess.value = ''
      } finally {
        rwaLoading.value = false
      }
    }

    // 加载可提取收益
    const loadClaimableRevenue = async () => {
      if (!account.value || !provider.value) {
        return
      }

      try {
        const revenueDistributor = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.revenueDistributor,
          REVENUE_DISTRIBUTOR_ABI,
          provider.value
        )

        const claimable = await revenueDistributor.claimableRevenue(account.value)
        rwaClaimableRevenue.value = ethers.utils.formatEther(claimable)
      } catch (err) {
        console.error('加载可提取收益失败:', err)
        rwaClaimableRevenue.value = '0'
      }
    }

    // 加载用户资产信息（代币余额和收益）
    const loadUserAssetsInfo = async () => {
      if (!account.value || !provider.value) {
        return
      }

      try {
        // 同时加载代币余额和可提取收益
        const [token, revenueDistributor] = await Promise.all([
          new ethers.Contract(
            RWA_DEPLOYMENT_INFO.token,
            TOKEN_3643_ABI,
            provider.value
          ),
          new ethers.Contract(
            RWA_DEPLOYMENT_INFO.revenueDistributor,
            REVENUE_DISTRIBUTOR_ABI,
            provider.value
          )
        ])

        const [balance, decimals, claimable] = await Promise.all([
          token.balanceOf(account.value),
          token.decimals(),
          revenueDistributor.claimableRevenue(account.value)
        ])

        const decimalsNum = typeof decimals === 'number' ? decimals : decimals.toNumber()
        rwaUserTokenBalance.value = ethers.utils.formatUnits(balance, decimalsNum)
        rwaClaimableRevenue.value = ethers.utils.formatEther(claimable)
      } catch (err) {
        console.error('加载用户资产信息失败:', err)
        rwaUserTokenBalance.value = '0'
        rwaClaimableRevenue.value = '0'
      }
    }

    // 加载代币关联的设备列表
    const loadTokenAssets = async () => {
      if (!provider.value) {
        rwaError.value = '请先连接钱包'
        return
      }

      try {
        const assetRegistry = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.assetRegistry,
          ASSET_REGISTRY_ABI,
          provider.value
        )
        const assetIds = await assetRegistry.getAssetsByToken(RWA_DEPLOYMENT_INFO.token)
        rwaTokenAssets.value = assetIds
        console.log('✅ 加载代币关联设备:', assetIds)
      } catch (err) {
        console.error('加载代币关联设备失败:', err)
        rwaTokenAssets.value = []
        rwaError.value = `加载失败: ${err.message || '未知错误'}`
      }
    }

    // 切换到代币分发Tab并加载数据
    const switchToTokenDistribute = async () => {
      console.log('🔄 切换到代币分发Tab，当前Tab:', rwaSubTab.value)
      rwaSubTab.value = 'token-distribute'
      console.log('✅ Tab已设置为:', rwaSubTab.value)
      try {
        await loadRWAAgentPermissions()
        await loadTokenAssets()
        console.log('✅ 数据加载完成，当前Tab:', rwaSubTab.value)
      } catch (err) {
        console.error('❌ 加载数据失败:', err)
      }
    }

    // 切换到收益管理Tab
    const switchToRevenueTab = async () => {
      rwaSubTab.value = 'revenue'
      try {
        // 如果是Owner/Agent，加载Owner信息和合约余额
        if (account.value) {
          await loadRWAContractOwners()
          if (rwaIsRevenueDistributorOwner.value || rwaIsAssetRegistryOwner.value) {
            await loadRevenueDistributorBalance()
          }
        }
        // 如果是普通用户，加载用户资产信息
        if (account.value && !rwaIsRevenueDistributorOwner.value && !rwaIsAssetRegistryOwner.value && !rwaIsTokenAgent.value && !rwaIsIdentityRegistryAgent.value) {
          await loadUserAssetsInfo()
        }
      } catch (err) {
        console.error('❌ 加载收益管理数据失败:', err)
      }
    }

    // 加载RevenueDistributor合约的ETH余额
    const loadRevenueDistributorBalance = async () => {
      if (!provider.value) {
        return
      }

      try {
        const revenueDistributor = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.revenueDistributor,
          REVENUE_DISTRIBUTOR_ABI,
          provider.value
        )
        const balance = await revenueDistributor.getBalance()
        rwaRevenueDistributorBalance.value = ethers.utils.formatEther(balance)
      } catch (err) {
        console.error('加载RevenueDistributor余额失败:', err)
        rwaRevenueDistributorBalance.value = '0'
      }
    }

    // 查询信息
    const handleViewInfo = async () => {
      if (!provider.value) {
        rwaError.value = '请先连接钱包'
        return
      }

      if (rwaViewType.value !== 'asset-count' && rwaViewType.value !== 'token-assets' && !rwaViewQuery.value) {
        rwaError.value = '请输入查询参数'
        return
      }

      rwaLoading.value = true
      rwaError.value = ''
      rwaViewResult.value = ''

      try {
        if (rwaViewType.value === 'asset') {
          const assetRegistry = new ethers.Contract(
            RWA_DEPLOYMENT_INFO.assetRegistry,
            ASSET_REGISTRY_ABI,
            provider.value
          )
          
          // 使用try-catch包装，提供更友好的错误信息
          // 先尝试使用getAsset函数，如果失败则尝试使用mapping的自动getter
          let asset
          try {
            asset = await assetRegistry.getAsset(rwaViewQuery.value)
            console.log('✅ 使用getAsset查询成功:', asset)
          } catch (getAssetErr) {
            console.warn('⚠️ getAsset调用失败，尝试使用mapping getter:', getAssetErr.message)
            
            // 备用方案：使用mapping的自动getter（assets(string)）
            try {
              asset = await assetRegistry.assets(rwaViewQuery.value)
              console.log('✅ 使用assets mapping查询成功:', asset)
            } catch (mappingErr) {
              // 如果两种方法都失败，给出友好提示
              console.error('❌ 所有查询方法都失败:', {
                getAssetErr: getAssetErr.message,
                mappingErr: mappingErr.message
              })
              
              // 检查是否是资产不存在（通过检查错误消息）
              const errorMsg = (getAssetErr.message || '').toLowerCase()
              if (errorMsg.includes('revert') || errorMsg.includes('call exception')) {
                rwaError.value = `查询失败：资产ID "${rwaViewQuery.value}" 可能不存在或合约调用失败。\n\n可能的原因：\n1. 资产ID不存在（请检查大小写）\n2. 网络连接问题\n3. 合约地址错误\n\n建议：\n• 使用"查询代币关联设备"功能查看所有可用资产\n• 检查资产ID是否正确（例如：PV-001）`
              } else {
                rwaError.value = `查询失败：${getAssetErr.message || '未知错误'}\n请检查资产ID是否正确：${rwaViewQuery.value}`
              }
              rwaViewResult.value = ''
              return
            }
          }
          
          // 检查资产是否存在（不存在的资产assetId为空字符串）
          if (!asset || !asset.assetId || asset.assetId === '') {
            rwaError.value = `资产ID "${rwaViewQuery.value}" 不存在。请检查资产ID是否正确，或使用"查询代币关联设备"功能查看所有可用资产。`
            rwaViewResult.value = ''
            return
          }
          
          rwaViewResult.value = `资产ID: ${asset.assetId}\n设备类型: ${asset.assetType}\n位置: ${asset.location}\n容量: ${ethers.utils.formatUnits(asset.capacity, 3)} kW\n安装日期: ${new Date(asset.installDate.toNumber() * 1000).toLocaleString()}\n累计收益: ${ethers.utils.formatEther(asset.totalRevenue)} ETH\n状态: ${asset.isActive ? '激活' : '未激活'}\n关联代币: ${asset.tokenContract}`
        } else if (rwaViewType.value === 'token-assets') {
          const assetRegistry = new ethers.Contract(
            RWA_DEPLOYMENT_INFO.assetRegistry,
            ASSET_REGISTRY_ABI,
            provider.value
          )
          const tokenAddress = rwaViewQuery.value || RWA_DEPLOYMENT_INFO.token
          const assetIds = await assetRegistry.getAssetsByToken(tokenAddress)
          if (assetIds.length === 0) {
            rwaViewResult.value = `代币合约: ${tokenAddress}\n关联设备: 无`
          } else {
            rwaViewResult.value = `代币合约: ${tokenAddress}\n关联设备数量: ${assetIds.length}\n设备列表:\n${assetIds.map((id, index) => `  ${index + 1}. ${id}`).join('\n')}`
          }
        } else if (rwaViewType.value === 'user-balance') {
          const token = new ethers.Contract(
            RWA_DEPLOYMENT_INFO.token,
            TOKEN_3643_ABI,
            provider.value
          )
          const balance = await token.balanceOf(rwaViewQuery.value)
          const decimals = await token.decimals()
          rwaViewResult.value = `用户地址: ${rwaViewQuery.value}\n代币余额: ${ethers.utils.formatUnits(balance, decimals)} RWAET`
        } else if (rwaViewType.value === 'user-verified') {
          const identityRegistry = new ethers.Contract(
            RWA_DEPLOYMENT_INFO.identityRegistry,
            IDENTITY_REGISTRY_ABI,
            provider.value
          )
          const isVerified = await identityRegistry.isVerified(rwaViewQuery.value)
          const contains = await identityRegistry.contains(rwaViewQuery.value)
          rwaViewResult.value = `用户地址: ${rwaViewQuery.value}\n已注册: ${contains ? '是' : '否'}\n已验证: ${isVerified ? '是' : '否'}`
        } else if (rwaViewType.value === 'claimable-revenue') {
          const revenueDistributor = new ethers.Contract(
            RWA_DEPLOYMENT_INFO.revenueDistributor,
            REVENUE_DISTRIBUTOR_ABI,
            provider.value
          )
          const claimable = await revenueDistributor.claimableRevenue(rwaViewQuery.value)
          rwaViewResult.value = `用户地址: ${rwaViewQuery.value}\n可提取收益: ${ethers.utils.formatEther(claimable)} ETH`
        } else if (rwaViewType.value === 'asset-count') {
          const assetRegistry = new ethers.Contract(
            RWA_DEPLOYMENT_INFO.assetRegistry,
            ASSET_REGISTRY_ABI,
            provider.value
          )
          const count = await assetRegistry.getAssetCount()
          rwaViewResult.value = `已注册资产总数: ${count.toString()}`
        }
      } catch (err) {
        rwaError.value = `查询失败: ${err.message || '未知错误'}`
        rwaViewResult.value = ''
      } finally {
        rwaLoading.value = false
      }
    }

    // 加载RWA合约的Owner和Agent信息
    const loadRWAContractOwners = async () => {
      if (!provider.value) {
        console.warn('⚠️ loadRWAContractOwners: provider未设置')
        return
      }

      if (!account.value) {
        console.warn('⚠️ loadRWAContractOwners: account未设置')
        // 即使没有account，也先查询Owner地址，以便后续使用
      }

      try {
        // 查询AssetRegistry Owner（使用try-catch单独处理）
        let assetRegistryOwner = ''
        try {
          const assetRegistry = new ethers.Contract(
            RWA_DEPLOYMENT_INFO.assetRegistry,
            ASSET_REGISTRY_ABI,
            provider.value
          )
          assetRegistryOwner = await assetRegistry.owner()
          rwaAssetRegistryOwner.value = assetRegistryOwner
        } catch (assetErr) {
          console.error('❌ 查询AssetRegistry Owner失败:', assetErr)
          rwaAssetRegistryOwner.value = ''
          // 如果获取失败，不抛出错误，继续执行后续逻辑
        }

        // 查询RevenueDistributor Owner（使用try-catch单独处理，避免一个失败影响另一个）
        let revenueDistributorOwner = ''
        try {
          const revenueDistributor = new ethers.Contract(
            RWA_DEPLOYMENT_INFO.revenueDistributor,
            REVENUE_DISTRIBUTOR_ABI,
            provider.value
          )
          revenueDistributorOwner = await revenueDistributor.owner()
          rwaRevenueDistributorOwner.value = revenueDistributorOwner
        } catch (revenueErr) {
          console.error('❌ 查询RevenueDistributor Owner失败:', revenueErr)
          rwaRevenueDistributorOwner.value = ''
          // 如果获取失败，不抛出错误，继续执行后续逻辑
        }

        // 检查当前用户是否是Owner（即使account未设置，也要初始化标志）
        if (account.value) {
          const accountLower = account.value.toLowerCase()
          const assetRegistryOwnerLower = assetRegistryOwner ? assetRegistryOwner.toLowerCase() : ''
          const revenueDistributorOwnerLower = revenueDistributorOwner ? revenueDistributorOwner.toLowerCase() : ''
          
          rwaIsAssetRegistryOwner.value = assetRegistryOwnerLower === accountLower && assetRegistryOwnerLower !== ''
          rwaIsRevenueDistributorOwner.value = revenueDistributorOwnerLower === accountLower && revenueDistributorOwnerLower !== ''
          
        } else {
          // 如果没有account，重置标志
          rwaIsAssetRegistryOwner.value = false
          rwaIsRevenueDistributorOwner.value = false
          console.log('⚠️ loadRWAContractOwners: account未设置，无法检查Owner权限')
        }
        
        // 更新权限详情
        rwaUserRoleDetails.value.isAssetRegistryOwner = rwaIsAssetRegistryOwner.value
        rwaUserRoleDetails.value.isRevenueDistributorOwner = rwaIsRevenueDistributorOwner.value
      } catch (err) {
        console.error('❌ 加载Owner信息失败:', err)
        // 发生错误时重置标志
        rwaIsAssetRegistryOwner.value = false
        rwaIsRevenueDistributorOwner.value = false
      }
    }

    // 加载Agent权限信息
    const loadRWAAgentPermissions = async () => {
      if (!provider.value || !account.value) return

      try {
        // 查询Token Agent权限
        const token = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.token,
          TOKEN_3643_ABI,
          provider.value
        )
        rwaIsTokenAgent.value = await token.isAgent(account.value)

        // 查询IdentityRegistry Agent权限
        const identityRegistry = new ethers.Contract(
          RWA_DEPLOYMENT_INFO.identityRegistry,
          IDENTITY_REGISTRY_ABI,
          provider.value
        )
        rwaIsIdentityRegistryAgent.value = await identityRegistry.isAgent(account.value)
        
        console.log('🔍 Agent权限检查:', {
          account: account.value,
          isTokenAgent: rwaIsTokenAgent.value,
          isIdentityRegistryAgent: rwaIsIdentityRegistryAgent.value
        })
        
        // 更新权限详情
        rwaUserRoleDetails.value.isTokenAgent = rwaIsTokenAgent.value
        rwaUserRoleDetails.value.isIdentityRegistryAgent = rwaIsIdentityRegistryAgent.value
      } catch (err) {
        console.error('加载Agent权限失败:', err)
      }
    }

    // 判断用户角色并更新Tab显示
    const updateRWAUserRole = async () => {
      if (!account.value) {
        rwaUserRole.value = ''
        rwaUserRoleDetails.value = {
          isAssetRegistryOwner: false,
          isRevenueDistributorOwner: false,
          isTokenAgent: false,
          isIdentityRegistryAgent: false
        }
        return
      }

      try {
        // 确保加载了所有权限信息
        await loadRWAContractOwners()
        await loadRWAAgentPermissions()
        
        // 重新检查权限（确保使用最新数据）
        const isOwner = rwaIsAssetRegistryOwner.value || rwaIsRevenueDistributorOwner.value
        const isAgent = rwaIsTokenAgent.value || rwaIsIdentityRegistryAgent.value
        
        console.log('🔍 角色判断:', {
          account: account.value,
          isOwner,
          isAgent,
          isAssetRegistryOwner: rwaIsAssetRegistryOwner.value,
          isRevenueDistributorOwner: rwaIsRevenueDistributorOwner.value,
          isTokenAgent: rwaIsTokenAgent.value,
          isIdentityRegistryAgent: rwaIsIdentityRegistryAgent.value,
          'rwaIsAssetRegistryOwner.value': rwaIsAssetRegistryOwner.value,
          'rwaIsRevenueDistributorOwner.value': rwaIsRevenueDistributorOwner.value,
          'rwaAssetRegistryOwner.value': rwaAssetRegistryOwner.value,
          'rwaRevenueDistributorOwner.value': rwaRevenueDistributorOwner.value
        })
        
        // 判断角色优先级：Owner > Agent > 普通用户
        // 注意：如果同时是Owner和Agent，显示为Owner（因为Owner权限更高，包含所有Agent权限）
        if (isOwner) {
          rwaUserRole.value = 'owner'
          console.log('✅ 设置为Owner角色（优先级最高）')
        } else if (isAgent) {
          rwaUserRole.value = 'agent'
          console.log('⚠️ 设置为Agent角色（因为isOwner为false）')
        } else {
          rwaUserRole.value = 'user'
          console.log('ℹ️ 设置为普通用户角色')
        }

        console.log('✅ 最终角色:', rwaUserRole.value, {
          'rwaUserRole.value': rwaUserRole.value,
          'isOwner': isOwner,
          'isAgent': isAgent
        })

        // 如果当前选中的Tab对当前角色不可见，切换到第一个可见的Tab
        const isTokenAgent = rwaIsTokenAgent.value
        const isIdentityRegistryAgent = rwaIsIdentityRegistryAgent.value
        
        if (isOwner) {
          // Owner可以看到所有Tab，如果当前没有选中Tab或选中的Tab不可见，默认选中资产注册
          if (!rwaSubTab.value || rwaSubTab.value === '') {
            rwaSubTab.value = 'asset-register'
          }
        } else if (isTokenAgent || isIdentityRegistryAgent) {
          // Agent不能看到资产注册
          if (rwaSubTab.value === 'asset-register' || !rwaSubTab.value || rwaSubTab.value === '') {
            rwaSubTab.value = 'user-register'
          }
        } else {
          // 普通用户只能看到收益管理和信息查询
          if (rwaSubTab.value === 'asset-register' || 
              rwaSubTab.value === 'user-register' || 
              rwaSubTab.value === 'token-distribute' ||
              !rwaSubTab.value || rwaSubTab.value === '') {
            rwaSubTab.value = 'revenue'
          }
        }
      } catch (err) {
        console.error('更新用户角色失败:', err)
        rwaUserRole.value = 'user' // 默认设为普通用户
      }
    }

    // 修改 connectWallet 以自动加载可提取收益、Owner和Agent信息
    const originalConnectWallet = connectWallet
    const connectWalletWithRWA = async () => {
      await originalConnectWallet()
      if (account.value) {
        await loadClaimableRevenue()
        // 先加载权限信息，然后更新角色（updateRWAUserRole内部会再次加载，但这样可以确保数据同步）
        await loadRWAContractOwners()
        await loadRWAAgentPermissions()
        await updateRWAUserRole()
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
       connectWallet: connectWalletWithRWA,
       disconnectWallet,
       handleContractAddressChange,
       handleDeploy,
       handleMint,
       copyToClipboard,
       openExplorer,
       // RWA 相关
       mainTab,
       rwaSubTab,
       RWA_DEPLOYMENT_INFO,
       rwaAssetId,
       rwaAssetType,
       rwaAssetLocation,
       rwaAssetCapacity,
       rwaUserAddress,
       rwaCountryCode,
       rwaOnchainIDAddress,
       rwaDistributeAddress,
       rwaDistributeAmount,
       rwaDistributeUserVerified,
       rwaDistributeUserInfo,
       rwaCheckingUserVerification,
       checkUserVerification,
       handleDistributeAddressInput,
       isValidAddress,
       rwaRevenueAssetId,
       rwaRevenueAmount,
       rwaRevenueDistributorBalance,
       rwaClaimableRevenue,
       rwaUserTokenBalance,
       rwaTokenAssets,
       rwaViewType,
       rwaViewQuery,
       rwaViewResult,
       rwaError,
       rwaSuccess,
       rwaLoading,
       rwaAssetRegistryOwner,
       rwaRevenueDistributorOwner,
       rwaIsAssetRegistryOwner,
       rwaIsRevenueDistributorOwner,
       rwaIsTokenAgent,
       rwaIsIdentityRegistryAgent,
       rwaUserRole,
       rwaUserRoleDetails,
       loadRWAContractOwners,
       loadRWAAgentPermissions,
       updateRWAUserRole,
       handleRegisterAsset,
       handleRegisterUser,
       handleDistributeToken,
       handleDistributeRevenue,
       handleClaimRevenue,
       loadClaimableRevenue,
       loadUserAssetsInfo,
       loadRevenueDistributorBalance,
       loadTokenAssets,
       switchToTokenDistribute,
       switchToRevenueTab,
       handleViewInfo
    }
  }
}
</script>
