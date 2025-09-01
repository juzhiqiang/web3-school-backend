/**
 * 合约交互脚本
 * 用于演示如何与部署的合约进行交互
 */

const YDToken = artifacts.require("YDToken");
const DeveloperDeploymentPlatform = artifacts.require("DeveloperDeploymentPlatform");
const CourseManager = artifacts.require("CourseManager");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const [owner, instructor, developer, student] = accounts;
    
    console.log("=== 合约交互示例 ===");
    
    const ydToken = await YDToken.deployed();
    const platform = await DeveloperDeploymentPlatform.deployed();
    const courseManager = await CourseManager.deployed();
    
    // 查看平台统计
    console.log("\n1. 平台当前状态:");
    const stats = await platform.getPlatformStats();
    console.log(`   总部署数: ${stats._totalDeployments}`);
    console.log(`   总开发者数: ${stats._totalDevelopers}`);
    console.log(`   已分发奖励: ${web3.utils.fromWei(stats._totalRewardsDistributed, "ether")} YD`);
    
    // 查看课程列表
    console.log("\n2. 可用课程:");
    const courseIds = await courseManager.getAllCourseIds();
    for (const courseId of courseIds) {
      const course = await courseManager.getCourse(courseId);
      console.log(`   ${courseId}: ${course.title}`);
      console.log(`     奖励: ${web3.utils.fromWei(course.rewardAmount, "ether")} YD`);
      console.log(`     时长: ${course.duration/3600} 小时`);
    }
    
    // 开发者注册和部署示例
    console.log("\n3. 开发者操作示例:");
    
    // 检查开发者是否已注册
    const isRegistered = await platform.registeredDevelopers(developer);
    if (!isRegistered) {
      await platform.registerDeveloper(
        "Bob Blockchain Dev",
        "bob@web3school.com",
        { from: developer }
      );
      console.log("   ✓ 新开发者已注册");
    } else {
      console.log("   ✓ 开发者已存在");
    }
    
    // 记录新的合约部署
    const deploymentCount = await platform.totalDeployments();
    await platform.recordDeployment(
      "ERC20Token",
      `0xabcdef${Date.now().toString().slice(-32).padStart(32, '0')}`,
      "pragma solidity ^0.8.0; import '@openzeppelin/contracts/token/ERC20/ERC20.sol'; contract MyToken is ERC20 { constructor() ERC20('MyToken', 'MTK') { _mint(msg.sender, 1000000 * 10**18); } }",
      "一个基于OpenZeppelin的ERC20代币合约",
      350000,
      { from: developer }
    );
    console.log(`   ✓ 已记录第${parseInt(deploymentCount) + 1}个部署`);
    
    // 学生课程学习示例
    console.log("\n4. 学生学习示例:");
    
    // 检查学生是否已注册课程
    const progress = await courseManager.getStudentProgress(student, "SOLIDITY_BASICS");
    if (progress.startTime.toString() === "0") {
      await courseManager.enrollInCourse("SOLIDITY_BASICS", { from: student });
      console.log("   ✓ 学生已注册Solidity基础课程");
    }
    
    // 模拟学习进度更新
    await courseManager.updateProgress(
      student,
      "SOLIDITY_BASICS",
      75,
      { from: instructor }
    );
    console.log("   ✓ 学习进度已更新至75%");
    
    // 查看更新后的统计数据
    console.log("\n5. 更新后的平台状态:");
    const updatedStats = await platform.getPlatformStats();
    console.log(`   总部署数: ${updatedStats._totalDeployments}`);
    console.log(`   总开发者数: ${updatedStats._totalDevelopers}`);
    console.log(`   已分发奖励: ${web3.utils.fromWei(updatedStats._totalRewardsDistributed, "ether")} YD`);
    
    // 显示开发者余额
    const developerBalance = await ydToken.balanceOf(developer);
    console.log(`   开发者YD余额: ${web3.utils.fromWei(developerBalance, "ether")} YD`);
    
    console.log("\n=== 交互完成 ===");
    console.log("可以通过以下方式继续测试:");
    console.log("1. truffle console --network development");
    console.log("2. 使用Web3前端应用连接到这些合约");
    console.log("3. 运行 npm run test 执行完整测试套件");
    
  } catch (error) {
    console.error("交互过程中出现错误:", error);
  }
  
  callback();
};
