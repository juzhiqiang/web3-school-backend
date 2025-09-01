/**
 * 主合约部署脚本
 * 部署 Web3 School 的核心合约：YDToken、DeveloperDeploymentPlatform、CourseManager
 */

const YDToken = artifacts.require("YDToken");
const DeveloperDeploymentPlatform = artifacts.require("DeveloperDeploymentPlatform");
const CourseManager = artifacts.require("CourseManager");

module.exports = async function (deployer, network, accounts) {
  const [owner, instructor] = accounts;

  console.log("开始部署 Web3 School 智能合约...");
  console.log(`网络: ${network}`);
  console.log(`部署者地址: ${owner}`);

  try {
    // 1. 部署 YD Token
    console.log("\n1. 部署 YDToken...");
    await deployer.deploy(YDToken);
    const ydToken = await YDToken.deployed();
    console.log(`✅ YDToken 部署成功: ${ydToken.address}`);

    // 2. 部署开发者部署平台
    console.log("\n2. 部署 DeveloperDeploymentPlatform...");
    await deployer.deploy(DeveloperDeploymentPlatform, ydToken.address);
    const platform = await DeveloperDeploymentPlatform.deployed();
    console.log(`✅ DeveloperDeploymentPlatform 部署成功: ${platform.address}`);

    // 3. 部署课程管理合约
    console.log("\n3. 部署 CourseManager...");
    await deployer.deploy(CourseManager, ydToken.address, instructor);
    const courseManager = await CourseManager.deployed();
    console.log(`✅ CourseManager 部署成功: ${courseManager.address}`);

    // 4. 配置权限和初始化
    console.log("\n4. 配置合约权限...");
    
    // 为平台合约分配代币用于奖励
    const platformAllocation = web3.utils.toWei("1000000", "ether"); // 100万 YD
    await ydToken.transfer(platform.address, platformAllocation);
    console.log(`✅ 已向平台分配 ${web3.utils.fromWei(platformAllocation, "ether")} YD 代币`);

    // 为课程管理合约分配代币用于奖励
    const courseAllocation = web3.utils.toWei("500000", "ether"); // 50万 YD
    await ydToken.transfer(courseManager.address, courseAllocation);
    console.log(`✅ 已向课程系统分配 ${web3.utils.fromWei(courseAllocation, "ether")} YD 代币`);

    // 5. 添加示例课程（如果是开发网络）
    if (network === "development") {
      console.log("\n5. 添加示例课程...");
      
      await courseManager.addCourse(
        "SOLIDITY_BASICS",
        "Solidity 智能合约基础",
        "学习 Solidity 编程语言的基础知识",
        web3.utils.toWei("100", "ether"), // 100 YD 奖励
        3600 * 24 * 7, // 7天课程
        { from: instructor }
      );
      console.log("✅ 已添加 'Solidity 基础' 课程");

      await courseManager.addCourse(
        "WEB3_DEVELOPMENT",
        "Web3 DApp 开发",
        "学习如何构建去中心化应用",
        web3.utils.toWei("200", "ether"), // 200 YD 奖励
        3600 * 24 * 14, // 14天课程
        { from: instructor }
      );
      console.log("✅ 已添加 'Web3 DApp 开发' 课程");
    }

    console.log("\n🎉 所有合约部署完成!");
    console.log("===========================================");
    console.log(`YDToken: ${ydToken.address}`);
    console.log(`DeveloperDeploymentPlatform: ${platform.address}`);
    console.log(`CourseManager: ${courseManager.address}`);
    console.log("===========================================");
    
    console.log("\n📝 下一步:");
    console.log("1. 运行测试: npm run test");
    console.log("2. 合约交互: npm run interact");
    console.log("3. 验证合约: npm run verify (mainnet/testnet)");

  } catch (error) {
    console.error("❌ 部署过程中出现错误:", error);
    throw error;
  }
};
