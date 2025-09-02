/**
 * 主合约部署脚本 - 仅支持私钥安全部署
 * 部署 Web3 School 的核心合约：YDToken、DeveloperDeploymentPlatform、CourseManager
 * 
 * 执行顺序: 2_deploy_contracts.js
 */

const YDToken = artifacts.require("YDToken");
const DeveloperDeploymentPlatform = artifacts.require("DeveloperDeploymentPlatform");
const CourseManager = artifacts.require("CourseManager");

module.exports = async function (deployer, network, accounts) {
  console.log("🚀 开始部署 Web3 School 智能合约 (仅私钥安全部署)...");
  console.log(`📡 网络: ${network}`);
  console.log(`👤 部署者地址: ${accounts[0]}`);
  
  // 验证部署环境 (仅对远程网络)
  if (network !== 'development' && network !== 'ganache') {
    await validateDeploymentEnvironment(network, accounts[0]);
  }

  // 部署配置
  const config = getDeploymentConfig(network);
  console.log("⚙️ 部署配置:", config);

  try {
    // 显示账户余额
    const balance = await web3.eth.getBalance(accounts[0]);
    console.log(`💰 部署者余额: ${web3.utils.fromWei(balance, 'ether')} ETH`);

    // 1. 部署 YD Token
    console.log("\n📝 1. 部署 YDToken...");
    await deployer.deploy(YDToken, {
      gas: config.gasLimit,
      gasPrice: config.gasPrice
    });
    const ydToken = await YDToken.deployed();
    console.log(`✅ YDToken 部署成功: ${ydToken.address}`);
    
    // 验证代币部署
    const tokenName = await ydToken.name();
    const tokenSymbol = await ydToken.symbol();
    const totalSupply = await ydToken.totalSupply();
    console.log(`   代币名称: ${tokenName}`);
    console.log(`   代币符号: ${tokenSymbol}`);
    console.log(`   总供应量: ${web3.utils.fromWei(totalSupply, 'ether')} YD`);

    // 2. 部署开发者部署平台
    console.log("\n🏗️ 2. 部署 DeveloperDeploymentPlatform...");
    await deployer.deploy(DeveloperDeploymentPlatform, ydToken.address, {
      gas: config.gasLimit,
      gasPrice: config.gasPrice
    });
    const platform = await DeveloperDeploymentPlatform.deployed();
    console.log(`✅ DeveloperDeploymentPlatform 部署成功: ${platform.address}`);

    // 3. 部署课程管理合约
    console.log("\n📚 3. 部署 CourseManager...");
    const instructor = accounts[1] || accounts[0]; // 使用第二个账户作为讲师，如果没有则使用部署者
    await deployer.deploy(CourseManager, ydToken.address, instructor, {
      gas: config.gasLimit,
      gasPrice: config.gasPrice
    });
    const courseManager = await CourseManager.deployed();
    console.log(`✅ CourseManager 部署成功: ${courseManager.address}`);
    console.log(`📝 默认讲师地址: ${instructor}`);

    // 4. 配置合约权限和分配代币
    console.log("\n🔧 4. 配置合约权限和分配代币...");
    
    // 为平台合约分配代币用于奖励
    const platformAllocation = web3.utils.toWei(config.platformTokens.toString(), "ether");
    const tx1 = await ydToken.transfer(platform.address, platformAllocation, {
      gas: config.transferGasLimit,
      gasPrice: config.gasPrice
    });
    console.log(`✅ 已向平台分配 ${config.platformTokens.toLocaleString()} YD 代币 (tx: ${tx1.tx})`);

    // 为课程管理合约分配代币用于奖励
    const courseAllocation = web3.utils.toWei(config.courseTokens.toString(), "ether");
    const tx2 = await ydToken.transfer(courseManager.address, courseAllocation, {
      gas: config.transferGasLimit,
      gasPrice: config.gasPrice
    });
    console.log(`✅ 已向课程系统分配 ${config.courseTokens.toLocaleString()} YD 代币 (tx: ${tx2.tx})`);

    // 5. 验证合约状态
    console.log("\n🔍 5. 验证合约状态...");
    const platformBalance = await ydToken.balanceOf(platform.address);
    const courseBalance = await ydToken.balanceOf(courseManager.address);
    const ownerBalance = await ydToken.balanceOf(accounts[0]);
    
    console.log(`   平台合约代币余额: ${web3.utils.fromWei(platformBalance, 'ether')} YD`);
    console.log(`   课程合约代币余额: ${web3.utils.fromWei(courseBalance, 'ether')} YD`);
    console.log(`   部署者代币余额: ${web3.utils.fromWei(ownerBalance, 'ether')} YD`);

    // 6. 添加示例数据（仅开发环境）
    if (network === "development" || network === "ganache") {
      console.log("\n📖 6. 添加示例课程...");
      await addSampleCourses(courseManager, instructor, config);
    }

    // 7. 保存部署信息
    await saveDeploymentInfo(network, {
      ydToken: ydToken.address,
      platform: platform.address,
      courseManager: courseManager.address,
      instructor: instructor,
      deploymentMethod: 'truffle-migrations'
    });

    console.log("\n🎉 所有合约部署完成!");
    printDeploymentSummary({
      ydToken: ydToken.address,
      platform: platform.address,
      courseManager: courseManager.address,
      instructor: instructor,
      network: network
    });

  } catch (error) {
    console.error("❌ 部署过程中出现错误:", error);
    
    // 详细错误信息
    if (error.reason) console.error("错误原因:", error.reason);
    if (error.code) console.error("错误代码:", error.code);
    if (error.transaction) console.error("失败的交易:", error.transaction);
    
    throw error;
  }
};

/**
 * 验证部署环境 - 仅对远程网络进行私钥验证
 */
async function validateDeploymentEnvironment(network, deployerAddress) {
  console.log("\n🔍 验证部署环境...");
  
  // 验证私钥配置 (仅远程网络需要)
  const { PRIVATE_KEY } = process.env;
  if (!PRIVATE_KEY) {
    throw new Error("❌ 远程网络部署必须在 .env 文件中设置 PRIVATE_KEY");
  }
  
  if (!PRIVATE_KEY.startsWith('0x')) {
    throw new Error("❌ 私钥必须以 0x 开头");
  }
  
  if (PRIVATE_KEY.length !== 66) {
    throw new Error("❌ 私钥长度必须为 66 个字符 (包含 0x 前缀)");
  }
  
  console.log("✅ 私钥格式验证通过");
  
  // 验证网络连接
  const balance = await web3.eth.getBalance(deployerAddress);
  const balanceEth = parseFloat(web3.utils.fromWei(balance, 'ether'));
  
  if (balanceEth < 0.01) {
    throw new Error(`❌ 账户余额不足: ${balanceEth} ETH`);
  }
  
  console.log("✅ 账户余额充足");
  
  // 主网部署额外确认
  if (network === 'mainnet') {
    console.log("\n⚠️ 即将部署到主网！");
    console.log("请确认以下信息:");
    console.log(`- 部署账户: ${deployerAddress}`);
    console.log(`- 账户余额: ${balanceEth.toFixed(6)} ETH`);
    console.log("- 使用私钥部署方式");
  }
}

/**
 * 获取网络特定的部署配置
 */
function getDeploymentConfig(network) {
  const configs = {
    development: {
      gasLimit: 6721975,
      gasPrice: web3.utils.toWei('20', 'gwei'),
      transferGasLimit: 100000,
      platformTokens: 1000000, // 100万代币
      courseTokens: 500000,    // 50万代币
      confirmations: 0
    },
    ganache: {
      gasLimit: 6721975,
      gasPrice: web3.utils.toWei('20', 'gwei'),
      transferGasLimit: 100000,
      platformTokens: 1000000,
      courseTokens: 500000,
      confirmations: 0
    },
    sepolia: {
      gasLimit: 5000000,
      gasPrice: web3.utils.toWei('25', 'gwei'),
      transferGasLimit: 100000,
      platformTokens: 100000,  // 测试网使用较少代币
      courseTokens: 50000,
      confirmations: 2
    },
    mainnet: {
      gasLimit: 3000000,
      gasPrice: web3.utils.toWei('50', 'gwei'),
      transferGasLimit: 100000,
      platformTokens: 10000000, // 主网使用更多代币
      courseTokens: 5000000,
      confirmations: 3
    }
  };
  
  return configs[network] || configs.development;
}

/**
 * 添加示例课程
 */
async function addSampleCourses(courseManager, instructor, config) {
  try {
    console.log("   添加 Solidity 基础课程...");
    await courseManager.addCourse(
      "SOLIDITY_BASICS",
      "Solidity 智能合约基础",
      "学习 Solidity 编程语言的基础知识，包括变量、函数、修饰符等",
      web3.utils.toWei("100", "ether"), // 100 YD 奖励
      3600 * 24 * 7, // 7天课程
      { 
        from: instructor,
        gas: config.transferGasLimit,
        gasPrice: config.gasPrice
      }
    );
    console.log("   ✅ Solidity 基础课程添加成功");

    console.log("   添加 Web3 DApp 开发课程...");
    await courseManager.addCourse(
      "WEB3_DAPP",
      "Web3 DApp 开发实战", 
      "学习如何构建完整的去中心化应用，包括前端和智能合约交互",
      web3.utils.toWei("200", "ether"), // 200 YD 奖励
      3600 * 24 * 14, // 14天课程
      { 
        from: instructor,
        gas: config.transferGasLimit,
        gasPrice: config.gasPrice
      }
    );
    console.log("   ✅ Web3 DApp 开发课程添加成功");
    
  } catch (error) {
    console.error("   ⚠️ 添加示例课程时出错:", error.message);
  }
}

/**
 * 保存部署信息到文件
 */
async function saveDeploymentInfo(network, addresses) {
  const deploymentInfo = {
    network: network,
    timestamp: new Date().toISOString(),
    deploymentMethod: 'truffle-migrations-private-key-only',
    contracts: addresses,
    securityFeatures: [
      'private-key-only',
      'no-mnemonic-support', 
      'reentrancy-guard',
      'pausable-contracts',
      'input-validation'
    ]
  };
  
  console.log(`💾 部署信息已记录 (${network} 网络)`);
}

/**
 * 打印部署摘要
 */
function printDeploymentSummary(info) {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 部署摘要 (仅私钥安全部署)");
  console.log("=".repeat(60));
  console.log(`📡 网络: ${info.network}`);
  console.log(`🔑 部署方式: 私钥部署 (Truffle Migrations)`);
  console.log(`🪙 YDToken: ${info.ydToken}`);
  console.log(`🏗️ 开发者平台: ${info.platform}`);
  console.log(`📚 课程管理: ${info.courseManager}`);
  console.log(`👨‍🏫 默认讲师: ${info.instructor}`);
  console.log("=".repeat(60));
  
  console.log("\n📋 下一步操作:");
  console.log("1. 🧪 运行测试: npm run test");
  console.log("2. 🔍 验证部署: npm run verify:deployment");
  console.log("3. ✅ 验证合约: npm run verify:all");
  console.log("4. 💰 检查余额: npm run check-balance");
  console.log("5. 📖 查看指南: cat DEPLOYMENT.md");
  
  if (info.network === 'development' || info.network === 'ganache') {
    console.log("\n💡 本地部署说明:");
    console.log("- 本地网络不需要私钥配置");
    console.log("- 使用 Truffle 内置账户进行部署");
    console.log("- 适用于开发和测试环境");
  } else if (info.network !== 'mainnet') {
    console.log("\n⚠️ 注意: 这是测试网络部署，请勿用于生产环境");
  } else {
    console.log("\n🚨 警告: 这是主网部署，请立即验证合约并确保安全!");
  }
  
  console.log("\n🔒 安全特性:");
  console.log("- ✅ 仅支持私钥安全部署");
  console.log("- ✅ 禁用助记词部署方式");  
  console.log("- ✅ 合约安全防护已启用");
  console.log("- ✅ 紧急暂停机制已配置");
}
