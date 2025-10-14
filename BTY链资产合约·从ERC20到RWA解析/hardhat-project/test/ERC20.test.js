const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CustomERC20", function () {
  let customERC20;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const tokenName = "BTY Test Token";
  const tokenSymbol = "BTT";
  const initialSupply = 1000000; // 100万代币
  const mintable = true;

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // 部署合约
    const CustomERC20 = await ethers.getContractFactory("CustomERC20");
    customERC20 = await CustomERC20.deploy(
      tokenName,
      tokenSymbol,
      initialSupply,
      mintable
    );
    await customERC20.deployed();
  });

  describe("部署", function () {
    it("应该设置正确的代币信息", async function () {
      expect(await customERC20.name()).to.equal(tokenName);
      expect(await customERC20.symbol()).to.equal(tokenSymbol);
      expect(await customERC20.decimals()).to.equal(18);
      expect(await customERC20.mintable()).to.equal(mintable);
    });

    it("应该将初始供应量分配给部署者", async function () {
      const expectedSupply = ethers.utils.parseEther(initialSupply.toString());
      expect(await customERC20.totalSupply()).to.equal(expectedSupply);
      expect(await customERC20.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("应该设置正确的owner", async function () {
      expect(await customERC20.owner()).to.equal(owner.address);
    });
  });

  describe("转账功能", function () {
    it("应该允许owner转账给其他地址", async function () {
      const transferAmount = ethers.utils.parseEther("1000");
      await customERC20.transfer(addr1.address, transferAmount);
      
      expect(await customERC20.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("应该拒绝余额不足的转账", async function () {
      const transferAmount = ethers.utils.parseEther("2000000"); // 超过总供应量
      
      await expect(
        customERC20.transfer(addr1.address, transferAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("应该发出Transfer事件", async function () {
      const transferAmount = ethers.utils.parseEther("1000");
      
      await expect(customERC20.transfer(addr1.address, transferAmount))
        .to.emit(customERC20, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });
  });

  describe("授权功能", function () {
    it("应该允许授权和代理转账", async function () {
      const approveAmount = ethers.utils.parseEther("1000");
      const transferAmount = ethers.utils.parseEther("500");
      
      // 授权
      await customERC20.approve(addr1.address, approveAmount);
      expect(await customERC20.allowance(owner.address, addr1.address)).to.equal(approveAmount);
      
      // 代理转账
      await customERC20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      expect(await customERC20.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await customERC20.allowance(owner.address, addr1.address)).to.equal(approveAmount.sub(transferAmount));
    });

    it("应该拒绝超过授权额度的转账", async function () {
      const approveAmount = ethers.utils.parseEther("1000");
      const transferAmount = ethers.utils.parseEther("1500");
      
      await customERC20.approve(addr1.address, approveAmount);
      
      await expect(
        customERC20.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    });
  });

  describe("增发功能", function () {
    it("应该允许owner增发代币", async function () {
      const mintAmount = ethers.utils.parseEther("10000");
      const initialBalance = await customERC20.balanceOf(addr1.address);
      
      await customERC20.mint(addr1.address, mintAmount);
      
      expect(await customERC20.balanceOf(addr1.address)).to.equal(initialBalance.add(mintAmount));
      expect(await customERC20.totalSupply()).to.equal(ethers.utils.parseEther(initialSupply.toString()).add(mintAmount));
    });

    it("应该拒绝非owner增发", async function () {
      const mintAmount = ethers.utils.parseEther("10000");
      
      await expect(
        customERC20.connect(addr1).mint(addr1.address, mintAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("应该发出Transfer事件", async function () {
      const mintAmount = ethers.utils.parseEther("10000");
      
      await expect(customERC20.mint(addr1.address, mintAmount))
        .to.emit(customERC20, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, mintAmount);
    });
  });


  describe("增发控制", function () {
    it("应该允许owner禁用增发", async function () {
      await customERC20.disableMinting();
      expect(await customERC20.mintable()).to.equal(false);
    });

    it("应该允许owner启用增发", async function () {
      await customERC20.disableMinting();
      await customERC20.enableMinting();
      expect(await customERC20.mintable()).to.equal(true);
    });

    it("应该拒绝在禁用增发后增发", async function () {
      await customERC20.disableMinting();
      const mintAmount = ethers.utils.parseEther("10000");
      
      await expect(
        customERC20.mint(addr1.address, mintAmount)
      ).to.be.revertedWith("Token is not mintable");
    });
  });

  describe("边界情况", function () {
    it("应该处理零金额转账", async function () {
      await expect(customERC20.transfer(addr1.address, 0))
        .to.emit(customERC20, "Transfer")
        .withArgs(owner.address, addr1.address, 0);
    });

    it("应该处理零金额授权", async function () {
      await expect(customERC20.approve(addr1.address, 0))
        .to.emit(customERC20, "Approval")
        .withArgs(owner.address, addr1.address, 0);
    });
  });
});
