const YDToken = artifacts.require("YDToken");
const DeveloperDeploymentPlatform = artifacts.require("DeveloperDeploymentPlatform");
const { expect } = require("chai");
const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

contract("DeveloperDeploymentPlatform", (accounts) => {
  const [owner, developer1, developer2] = accounts;
  const initialSupply = web3.utils.toWei("1000000", "ether");
  
  let ydToken, platform;
  
  beforeEach(async () => {
    ydToken = await YDToken.new(
      "YuanDao Token",
      "YD",
      initialSupply,
      { from: owner }
    );
    
    platform = await DeveloperDeploymentPlatform.new(
      ydToken.address,
      { from: owner }
    );
    
    // 授权平台发放奖励
    await ydToken.setPlatformAuthorization(platform.address, true, { from: owner });
    
    // 向YD代币合约存入代币用于奖励
    const rewardAmount = web3.utils.toWei("100000", "ether");
    await ydToken.depositTokensForRewards(rewardAmount, { from: owner });
  });
  
  describe("开发者注册", () => {
    it("开发者可以注册", async () => {
      const receipt = await platform.registerDeveloper(
        "Alice Developer",
        "alice@example.com",
        { from: developer1 }
      );
      
      expectEvent(receipt, "DeveloperRegistered", {
        developer: developer1,
        name: "Alice Developer"
      });
      
      const isRegistered = await platform.registeredDeveloper(developer1);
      expect(isRegistered).to.be.true;
      
      const totalDevelopers = await platform.totalDevelopers();
      expect(totalDevelopers.toString()).to.equal("1");
    });
    
    it("不能重复注册", async () => {
      await platform.registerDeveloper(
        "Alice Developer",
        "alice@example.com",
        { from: developer1 }
      );
      
      await expectRevert(
        platform.registerDeveloper(
          "Alice Again",
          "alice2@example.com",
          { from: developer1 }
        ),
        "Developer already registered"
      );
    });
    
    it("名称不能为空", async () => {
      await expectRevert(
        platform.registerDeveloper(
          "",
          "alice@example.com",
          { from: developer1 }
        ),
        "Name cannot be empty"
      );
    });
  });
  
  describe("合约部署记录", () => {
    beforeEach(async () => {
      await platform.registerDeveloper(
        "Alice Developer",
        "alice@example.com",
        { from: developer1 }
      );
    });
    
    it("注册开发者可以记录部署", async () => {
      const contractName = "TestContract";
      const contractAddress = "0x1234567890123456789012345678901234567890";
      const sourceCode = "pragma solidity ^0.8.0; contract Test {}";
      const description = "A test contract";
      const gasUsed = 500000;
      
      const receipt = await platform.recordDeployment(
        contractName,
        contractAddress,
        sourceCode,
        description,
        gasUsed,
        { from: developer1 }
      );
      
      expectEvent(receipt, "ContractDeployed", {
        deploymentId: "0",
        developer: developer1,
        contractName: contractName,
        contractAddress: contractAddress
      });
      
      const totalDeployments = await platform.totalDeployments();
      expect(totalDeployments.toString()).to.equal("1");
      
      // 检查是否自动发放了奖励
      const developerBalance = await ydToken.balanceOf(developer1);
      expect(parseInt(developerBalance.toString())).to.be.greaterThan(0);
    });
    
    it("未注册开发者不能记录部署", async () => {
      await expectRevert(
        platform.recordDeployment(
          "TestContract",
          "0x1234567890123456789012345678901234567890",
          "pragma solidity ^0.8.0; contract Test {}",
          "A test contract",
          500000,
          { from: developer2 }
        ),
        "Developer not registered"
      );
    });
  });
  
  describe("合约验证", () => {
    beforeEach(async () => {
      await platform.registerDeveloper(
        "Alice Developer",
        "alice@example.com",
        { from: developer1 }
      );
      
      await platform.recordDeployment(
        "TestContract",
        "0x1234567890123456789012345678901234567890",
        "pragma solidity ^0.8.0; contract Test {}",
        "A test contract",
        500000,
        { from: developer1 }
      );
    });
    
    it("所有者可以验证合约", async () => {
      const receipt = await platform.verifyContract(0, { from: owner });
      
      expectEvent(receipt, "ContractVerified", {
        deploymentId: "0"
      });
      
      const deployment = await platform.deployments(0);
      expect(deployment.isVerified).to.be.true;
    });
    
    it("非所有者不能验证合约", async () => {
      await expectRevert(
        platform.verifyContract(0, { from: developer1 }),
        "Ownable: caller is not the owner"
      );
    });
  });
  
  describe("平台统计", () => {
    it("可以获取平台统计数据", async () => {
      const stats = await platform.getPlatformStats();
      
      expect(stats._totalDeployments.toString()).to.equal("0");
      expect(stats._totalDevelopers.toString()).to.equal("0");
      expect(stats._totalRewardsDistributed.toString()).to.equal("0");
    });
  });
});
