/**
 * 合约交互脚本
 * 用于演示如何与部署的合约进行交互
 */

const YDToken = artifacts.require("YDToken");
const CourseManager = artifacts.require("CourseManager");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const [owner, instructor, student] = accounts;
    
    console.log("=== 合约交互示例 ===");
    
    const ydToken = await YDToken.deployed();
    const courseManager = await CourseManager.deployed();
    
    // 查看课程列表
    console.log("\n1. 可用课程:");
    const courseIds = await courseManager.getAllCourseIds();
    for (const courseId of courseIds) {
      const course = await courseManager.getCourse(courseId);
      console.log(`   ${courseId}: ${course.title}`);
      console.log(`     奖励: ${web3.utils.fromWei(course.rewardAmount, "ether")} YD`);
      console.log(`     价格: ${web3.utils.fromWei(course.price, "ether")} YD`);
    }
    
    // 学生课程学习示例
    console.log("\n2. 学生学习示例:");
    
    // 检查学生是否已注册课程
    if (courseIds.length > 0) {
      const progress = await courseManager.getStudentProgress(student, courseIds[0]);
      if (progress.startTime.toString() === "0") {
        // 给学生一些代币用于购买课程
        const course = await courseManager.getCourse(courseIds[0]);
        if (course.price > 0) {
          await ydToken.transfer(student, course.price, { from: owner });
          await ydToken.approve(courseManager.address, course.price, { from: student });
        }
        
        await courseManager.enrollInCourse(courseIds[0], { from: student });
        console.log(`   ✓ 学生已注册课程: ${courseIds[0]}`);
      }
      
      // 模拟学习进度更新
      await courseManager.updateProgress(
        student,
        courseIds[0],
        75,
        { from: instructor }
      );
      console.log("   ✓ 学习进度已更新至75%");
      
      // 显示更新后的进度
      const updatedProgress = await courseManager.getStudentProgress(student, courseIds[0]);
      console.log(`   当前进度: ${updatedProgress.progress}%`);
    }
    
    // 显示代币余额
    console.log("\n3. 代币余额:");
    const ownerBalance = await ydToken.balanceOf(owner);
    const studentBalance = await ydToken.balanceOf(student);
    const contractBalance = await courseManager.getContractTokenBalance();
    
    console.log(`   所有者YD余额: ${web3.utils.fromWei(ownerBalance, "ether")} YD`);
    console.log(`   学生YD余额: ${web3.utils.fromWei(studentBalance, "ether")} YD`);
    console.log(`   合约YD余额: ${web3.utils.fromWei(contractBalance, "ether")} YD`);
    
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
