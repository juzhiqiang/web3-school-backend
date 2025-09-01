/**
 * Gas消耗估算脚本
 * 用于估算各种操作的Gas费用
 */

const YDToken = artifacts.require("YDToken");
const DeveloperDeploymentPlatform = artifacts.require("DeveloperDeploymentPlatform");
const CourseManager = artifacts.require("CourseManager");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const [owner, instructor, developer, student] = accounts;
    
    console.log('⛽ Gas消耗估算报告');
    console.log('=' * 60);
    
    // 获取当前gas价格
    const gasPrice = await web3.eth.getGasPrice();
    const gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');
    console.log(`当前Gas价格: ${gasPriceGwei} Gwei`);
    console.log('');
    
    // 部署成本估算
    console.log('📦 合约部署成本:');
    
    const deploymentCosts = {
      'YDToken': 2500000,
      'DeveloperDeploymentPlatform': 3000000,
      'CourseManager': 2800000
    };
    
    let totalDeploymentCost = 0;
    for (const [contractName, gasEstimate] of Object.entries(deploymentCosts)) {
      const costEth = web3.utils.fromWei((gasEstimate * parseInt(gasPrice)).toString(), 'ether');
      totalDeploymentCost += gasEstimate;
      console.log(`   ${contractName.padEnd(30)} ${gasEstimate.toLocaleString().padStart(10)} gas  ~${parseFloat(costEth).toFixed(4)} ETH`);
    }
    
    const totalCostEth = web3.utils.fromWei((totalDeploymentCost * parseInt(gasPrice)).toString(), 'ether');
    console.log(`   ${'总部署成本'.padEnd(30)} ${totalDeploymentCost.toLocaleString().padStart(10)} gas  ~${parseFloat(totalCostEth).toFixed(4)} ETH`);
    console.log('');
    
    // 如果合约已部署，进行实际操作测试
    try {
      const ydToken = await YDToken.deployed();
      const platform = await DeveloperDeploymentPlatform.deployed();
      const courseManager = await CourseManager.deployed();
      
      console.log('🔧 常见操作Gas消耗:');
      
      // 测试各种操作的gas消耗
      const operations = [
        {
          name: '注册开发者',
          test: async () => {
            return await platform.registerDeveloper.estimateGas(
              "Test Developer",
              "test@example.com",
              { from: developer }
            );
          }
        },
        {
          name: '记录合约部署',
          test: async () => {
            // 先注册开发者（如果未注册）
            const isRegistered = await platform.registeredDevelopers(developer);
            if (!isRegistered) {
              await platform.registerDeveloper(
                "Test Developer",
                "test@example.com",
                { from: developer }
              );
            }
            
            return await platform.recordDeployment.estimateGas(
              "TestContract",
              "0x1234567890123456789012345678901234567890",
              "pragma solidity ^0.8.0; contract Test {}",
              "Test contract",
              250000,
              { from: developer }
            );
          }
        },
        {
          name: '学生注册课程',
          test: async () => {
            // 确保课程存在
            const courseIds = await courseManager.getAllCourseIds();
            if (courseIds.length === 0) {
              // 创建测试课程
              await courseManager.setInstructorAuthorization(instructor, true, { from: owner });
              await courseManager.createCourse(
                "TEST_COURSE",
                "Test Course",
                "Test Description",
                web3.utils.toWei("100", "ether"),
                3600,
                [],
                { from: instructor }
              );
            }
            
            return await courseManager.enrollInCourse.estimateGas(
              courseIds[0] || "TEST_COURSE",
              { from: student }
            );
          }
        },
        {
          name: 'YD代币转账',
          test: async () => {
            return await ydToken.transfer.estimateGas(
              student,
              web3.utils.toWei("10", "ether"),
              { from: owner }
            );
          }
        },
        {
          name: '更新学习进度',
          test: async () => {
            // 确保学生已注册课程
            const courseIds = await courseManager.getAllCourseIds();
            if (courseIds.length > 0) {
              const progress = await courseManager.getStudentProgress(student, courseIds[0]);
              if (progress.startTime === '0') {
                await courseManager.enrollInCourse(courseIds[0], { from: student });
              }
              
              return await courseManager.updateProgress.estimateGas(
                student,
                courseIds[0],
                50,
                { from: instructor }
              );
            }
            return 0;
          }
        },
        {
          name: '领取课程奖励',
          test: async () => {
            // 这个操作需要课程完成，所以只能估算
            const courseIds = await courseManager.getAllCourseIds();
            if (courseIds.length > 0) {
              return await courseManager.claimCourseReward.estimateGas(
                courseIds[0],
                { from: student }
              ).catch(() => 120000); // 使用预估值
            }
            return 120000;
          }
        }
      ];
      
      for (const operation of operations) {
        try {
          const gasEstimate = await operation.test();
          const costEth = web3.utils.fromWei((gasEstimate * parseInt(gasPrice)).toString(), 'ether');
          console.log(`   ${operation.name.padEnd(20)} ${gasEstimate.toString().padStart(8)} gas  ~${parseFloat(costEth).toFixed(6)} ETH`);
        } catch (error) {
          console.log(`   ${operation.name.padEnd(20)} ${'估算失败'.padStart(15)}`);
        }
      }
      
    } catch (error) {
      console.log('⚠️  合约未部署，无法进行实际gas测试');
      console.log('请先运行: npm run deploy:local');
    }
    
    console.log('');
    console.log('💡 Gas优化建议:');
    console.log('   1. 批量操作可以显著降低per-operation成本');
    console.log('   2. 考虑使用Layer 2解决方案降低交易费用');
    console.log('   3. 优化数据结构减少存储操作');
    console.log('   4. 使用事件替代存储来记录历史数据');
    
  } catch (error) {
    console.error('Gas估算过程中出现错误:', error);
  }
  
  callback();
};
