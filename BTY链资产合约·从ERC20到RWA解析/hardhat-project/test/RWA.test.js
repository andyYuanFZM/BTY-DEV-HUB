const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RWA System", function () {
  let rwaToken;
  let assetRegistry;
  let revenueDistributor;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // 部署RWA3643Token
    const RWA3643Token = await ethers.getContractFactory("RWA3643Token");
    rwaToken = await RWA3643Token.deploy(
      "RWA Energy Token",
      "RWAET",
      ethers.utils.parseEther("1000000") // 初始供应量100万
    );
    await rwaToken.deployed();

    // 部署AssetRegistry
    const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
    assetRegistry = await AssetRegistry.deploy();
    await assetRegistry.deployed();

    // 部署RevenueDistributor
    const RevenueDistributor = await ethers.getContractFactory("RevenueDistributor");
    revenueDistributor = await RevenueDistributor.deploy(
      rwaToken.address,
      assetRegistry.address
    );
    await revenueDistributor.deployed();

    // 设置关联关系
    await rwaToken.setAssetRegistry(assetRegistry.address);
    await rwaToken.setRevenueDistributor(revenueDistributor.address);
  });

  describe("RWA3643Token", function () {
    it("应该正确部署代币", async function () {
      expect(await rwaToken.name()).to.equal("RWA Energy Token");
      expect(await rwaToken.symbol()).to.equal("RWAET");
      expect(await rwaToken.totalSupply()).to.equal(ethers.utils.parseEther("1000000"));
    });

    it("应该验证用户身份", async function () {
      await rwaToken.verifyIdentity(addr1.address, true);
      expect(await rwaToken.verifiedIdentities(addr1.address)).to.equal(true);
    });

    it("应该正确检测转账限制", async function () {
      // 验证身份前应该被阻止
      let restrictionCode = await rwaToken.detectTransferRestriction(
        owner.address,
        addr1.address,
        ethers.utils.parseEther("100")
      );
      expect(restrictionCode).to.equal(2); // NOT_VERIFIED_CODE

      // 验证身份后应该允许
      await rwaToken.verifyIdentity(addr1.address, true);
      restrictionCode = await rwaToken.detectTransferRestriction(
        owner.address,
        addr1.address,
        ethers.utils.parseEther("100")
      );
      expect(restrictionCode).to.equal(0); // SUCCESS_CODE
    });

    it("应该阻止未验证身份的转账", async function () {
      await expect(
        rwaToken.transfer(addr1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Address identity is not verified");

      // 验证身份后应该成功
      await rwaToken.verifyIdentity(addr1.address, true);
      await rwaToken.transfer(addr1.address, ethers.utils.parseEther("100"));
      expect(await rwaToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("100"));
    });

    it("应该阻止黑名单用户转账", async function () {
      await rwaToken.verifyIdentity(addr1.address, true);
      await rwaToken.addToBlacklist(addr1.address);

      await expect(
        rwaToken.transfer(addr1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Address is blacklisted");
    });

    it("应该支持增发代币", async function () {
      await rwaToken.verifyIdentity(addr1.address, true);
      await rwaToken.mint(addr1.address, ethers.utils.parseEther("1000"));
      expect(await rwaToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1000"));
    });
  });

  describe("AssetRegistry", function () {
    it("应该注册新设备", async function () {
      await assetRegistry.registerAsset(
        "PV-001",
        "光伏",
        "北京市朝阳区",
        ethers.utils.parseUnits("100", 3), // 100kW
        rwaToken.address
      );

      const asset = await assetRegistry.getAsset("PV-001");
      expect(asset.assetId).to.equal("PV-001");
      expect(asset.assetType).to.equal("光伏");
      expect(asset.location).to.equal("北京市朝阳区");
      expect(asset.capacity).to.equal(ethers.utils.parseUnits("100", 3));
      expect(asset.tokenContract).to.equal(rwaToken.address);
      expect(asset.isActive).to.equal(true);
    });

    it("应该记录设备收益", async function () {
      await assetRegistry.registerAsset(
        "PV-001",
        "光伏",
        "北京市朝阳区",
        ethers.utils.parseUnits("100", 3),
        rwaToken.address
      );

      await assetRegistry.recordRevenue("PV-001", ethers.utils.parseEther("1000"));
      const asset = await assetRegistry.getAsset("PV-001");
      expect(asset.totalRevenue).to.equal(ethers.utils.parseEther("1000"));
    });

    it("应该更新设备状态", async function () {
      await assetRegistry.registerAsset(
        "PV-001",
        "光伏",
        "北京市朝阳区",
        ethers.utils.parseUnits("100", 3),
        rwaToken.address
      );

      await assetRegistry.updateAssetStatus("PV-001", false);
      const asset = await assetRegistry.getAsset("PV-001");
      expect(asset.isActive).to.equal(false);
    });

    it("应该获取设备总数", async function () {
      expect(await assetRegistry.getAssetCount()).to.equal(0);
      
      await assetRegistry.registerAsset(
        "PV-001",
        "光伏",
        "北京市朝阳区",
        ethers.utils.parseUnits("100", 3),
        rwaToken.address
      );
      
      expect(await assetRegistry.getAssetCount()).to.equal(1);
    });
  });

  describe("RevenueDistributor", function () {
    beforeEach(async function () {
      // 注册设备
      await assetRegistry.registerAsset(
        "PV-001",
        "光伏",
        "北京市朝阳区",
        ethers.utils.parseUnits("100", 3),
        rwaToken.address
      );

      // 验证用户身份并分配代币
      await rwaToken.verifyIdentity(addr1.address, true);
      await rwaToken.verifyIdentity(addr2.address, true);
      await rwaToken.transfer(addr1.address, ethers.utils.parseEther("100000")); // 10%
      await rwaToken.transfer(addr2.address, ethers.utils.parseEther("200000")); // 20%
    });

    it("应该记录收益到资产登记合约", async function () {
      const revenueAmount = ethers.utils.parseEther("1000");
      
      await revenueDistributor.distributeRevenue(revenueAmount, "PV-001");
      
      const asset = await assetRegistry.getAsset("PV-001");
      expect(asset.totalRevenue).to.equal(revenueAmount);
      expect(await revenueDistributor.totalDistributed()).to.equal(revenueAmount);
    });

    it("应该计算用户应得收益", async function () {
      const totalRevenue = ethers.utils.parseEther("1000");
      
      // addr1持有10%，应得100
      const addr1Revenue = await revenueDistributor.calculateUserRevenue(addr1.address, totalRevenue);
      expect(addr1Revenue).to.equal(ethers.utils.parseEther("100"));
      
      // addr2持有20%，应得200
      const addr2Revenue = await revenueDistributor.calculateUserRevenue(addr2.address, totalRevenue);
      expect(addr2Revenue).to.equal(ethers.utils.parseEther("200"));
    });

    it("应该添加可提取收益", async function () {
      const amount = ethers.utils.parseEther("100");
      await revenueDistributor.addClaimableRevenue(addr1.address, amount);
      
      expect(await revenueDistributor.claimableRevenue(addr1.address)).to.equal(amount);
    });

    it("应该批量添加可提取收益", async function () {
      const users = [addr1.address, addr2.address];
      const amounts = [
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      ];
      
      await revenueDistributor.batchAddClaimableRevenue(users, amounts);
      
      expect(await revenueDistributor.claimableRevenue(addr1.address)).to.equal(amounts[0]);
      expect(await revenueDistributor.claimableRevenue(addr2.address)).to.equal(amounts[1]);
    });
  });

  describe("集成测试", function () {
    it("应该完成完整的RWA流程", async function () {
      // 1. 注册设备
      await assetRegistry.registerAsset(
        "PV-001",
        "光伏",
        "北京市朝阳区",
        ethers.utils.parseUnits("100", 3),
        rwaToken.address
      );

      // 2. 验证用户身份
      await rwaToken.verifyIdentity(addr1.address, true);
      await rwaToken.verifyIdentity(addr2.address, true);

      // 3. 分配代币
      await rwaToken.transfer(addr1.address, ethers.utils.parseEther("500000")); // 50%
      await rwaToken.transfer(addr2.address, ethers.utils.parseEther("300000")); // 30%

      // 4. 分配收益
      const revenueAmount = ethers.utils.parseEther("10000");
      await revenueDistributor.distributeRevenue(revenueAmount, "PV-001");

      // 5. 计算应得收益
      const addr1Revenue = await revenueDistributor.calculateUserRevenue(addr1.address, revenueAmount);
      const addr2Revenue = await revenueDistributor.calculateUserRevenue(addr2.address, revenueAmount);

      expect(addr1Revenue).to.equal(ethers.utils.parseEther("5000")); // 50%
      expect(addr2Revenue).to.equal(ethers.utils.parseEther("3000")); // 30%

      // 6. 添加可提取收益
      await revenueDistributor.addClaimableRevenue(addr1.address, addr1Revenue);
      await revenueDistributor.addClaimableRevenue(addr2.address, addr2Revenue);

      expect(await revenueDistributor.claimableRevenue(addr1.address)).to.equal(addr1Revenue);
      expect(await revenueDistributor.claimableRevenue(addr2.address)).to.equal(addr2Revenue);
    });
  });
});
