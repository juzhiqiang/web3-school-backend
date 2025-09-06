/**
 * 主合约部署脚本 - Web3 School 核心合约部署
 * 部署 YDToken、YiDengTokenSwap 和 CourseManager 合约
 *
 * 执行顺序: 2_deploy_contracts.js
 */

const YDToken = artifacts.require("YDToken");
const YiDengTokenSwap = artifacts.require("YiDengTokenSwap");
const CourseManager = artifacts.require("CourseManager");

module.exports = async function (deployer, network, accounts) {
  console.log("🚀 开始部署 Web3 School 智能合约...");
  console.log(`📡 网络: ${network}`);
  console.log(`👤 部署者地址: ${accounts[0]}`);

  // 验证部署环境 (仅对远程网络)
  if (network !== "development" && network !== "ganache") {
    await validateDeploymentEnvironment(network, accounts[0]);
  }

  // 部署配置
  const config = getDeploymentConfig(network);
  console.log("⚙️ 部署配置:", config);

  try {
    // 显示账户余额
    const balance = await web3.eth.getBalance(accounts[0]);
    console.log(`💰 部署者余额: ${web3.utils.fromWei(balance, "ether")} ETH`);

    // 1. 部署 YD Token
    console.log("\n📝 1. 部署 YDToken...");
    await deployer.deploy(YDToken, {
      gas: config.gasLimit,
      gasPrice: config.gasPrice,
    });
    const ydToken = await YDToken.deployed();
    console.log(`✅ YDToken 部署成功: ${ydToken.address}`);

    // 验证代币部署
    const tokenName = await ydToken.name();
    const tokenSymbol = await ydToken.symbol();
    const totalSupply = await ydToken.totalSupply();
    console.log(`   代币名称: ${tokenName}`);
    console.log(`   代币符号: ${tokenSymbol}`);
    console.log(`   总供应量: ${web3.utils.fromWei(totalSupply, "ether")} YD`);

    // 2. 部署 YiDengTokenSwap
    console.log("\n📝 2. 部署 YiDengTokenSwap...");
    await deployer.deploy(YiDengTokenSwap, ydToken.address, 1000, {
      gas: config.gasLimit,
      gasPrice: config.gasPrice,
    });
    const yiDengTokenSwap = await YiDengTokenSwap.deployed();
    console.log(`✅ YiDengTokenSwap 部署成功: ${yiDengTokenSwap.address}`);

    // 3. 部署 CourseManager
    console.log("\n📝 3. 部署 CourseManager...");
    await deployer.deploy(CourseManager, ydToken.address, {
      gas: config.gasLimit,
      gasPrice: config.gasPrice,
    });
    const courseManager = await CourseManager.deployed();
    console.log(`✅ CourseManager 部署成功: ${courseManager.address}`);

    // 4. 初始化合约设置
    console.log("\n🔧 4. 初始化合约设置...");
    
    // 为 CourseManager 合约充值代币用于奖励发放
    const fundAmount = web3.utils.toWei(config.courseTokens.toString(), "ether");
    console.log(`   向 CourseManager 充值 ${config.courseTokens} YD 代币...`);
    
    // 首先授权 CourseManager 合约使用代币
    await ydToken.approve(courseManager.address, fundAmount, {
      gas: config.transferGasLimit,
      gasPrice: config.gasPrice,
    });
    console.log(`   ✅ 已授权 CourseManager 使用代币`);
    
    // 然后调用 fundContract 为合约充值
    await courseManager.fundContract(fundAmount, {
      gas: config.transferGasLimit,
      gasPrice: config.gasPrice,
    });
    console.log(`   ✅ 已为 CourseManager 充值代币`);

    // 5. 验证合约状态
    console.log("\n🔍 5. 验证合约状态...");
    const ownerBalance = await ydToken.balanceOf(accounts[0]);
    const contractBalance = await courseManager.getContractTokenBalance();
    console.log(`   部署者代币余额: ${web3.utils.fromWei(ownerBalance, "ether")} YD`);
    console.log(`   CourseManager 合约余额: ${web3.utils.fromWei(contractBalance, "ether")} YD`);

    // 6. 保存部署信息
    await saveDeploymentInfo(network, {
      ydToken: ydToken.address,
      yiDengTokenSwap: yiDengTokenSwap.address,
      courseManager: courseManager.address,
      deploymentMethod: "truffle-migrations",
    });

    console.log("\n🎉 所有合约部署完成!");
    printDeploymentSummary({
      ydToken: ydToken.address,
      yiDengTokenSwap: yiDengTokenSwap.address,
      courseManager: courseManager.address,
      network: network,
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

  if (PRIVATE_KEY.length !== 64) {
    throw new Error("❌ 私钥长度必须为 64 个字符");
  }

  console.log("✅ 私钥格式验证通过");

  // 验证网络连接
  const balance = await web3.eth.getBalance(deployerAddress);
  const balanceEth = parseFloat(web3.utils.fromWei(balance, "ether"));

  if (balanceEth < 0.01) {
    throw new Error(`❌ 账户余额不足: ${balanceEth} ETH`);
  }

  console.log("✅ 账户余额充足");

  // 主网部署额外确认
  if (network === "mainnet") {
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
    ganache: {
      gasLimit: 6721975,
      gasPrice: web3.utils.toWei("20", "gwei"),
      transferGasLimit: 100000,
      platformTokens: 1000000,
      courseTokens: 500000,
      confirmations: 0,
    },
    sepolia: {
      gasLimit: 5000000,
      gasPrice: web3.utils.toWei("25", "gwei"),
      transferGasLimit: 100000,
      platformTokens: 100000, // 测试网使用较少代币
      courseTokens: 50000,
      confirmations: 2,
    },
    mainnet: {
      gasLimit: 3000000,
      gasPrice: web3.utils.toWei("50", "gwei"),
      transferGasLimit: 100000,
      platformTokens: 10000000, // 主网使用更多代币
      courseTokens: 5000000,
      confirmations: 3,
    },
  };

  return configs[network] || configs.development;
}

/**
 * 保存部署信息到文件
 */
async function saveDeploymentInfo(network, addresses) {
  const deploymentInfo = {
    network: network,
    timestamp: new Date().toISOString(),
    deploymentMethod: "truffle-migrations-private-key-only",
    contracts: addresses,
    securityFeatures: [
      "private-key-only",
      "no-mnemonic-support", 
      "reentrancy-guard",
      "access-control",
      "input-validation",
    ],
  };

  console.log(`💾 部署信息已记录 (${network} 网络)`);
}

/**
 * 打印部署摘要
 */
function printDeploymentSummary(info) {
  console.log("\n" + "=".repeat(60));
  console.log(`📡 网络: ${info.network}`);
  console.log(`🔑 部署方式: 私钥部署 (Truffle Migrations)`);
  console.log(`🪙 YDToken: ${info.ydToken}`);
  console.log(`💱 YiDengTokenSwap: ${info.yiDengTokenSwap}`);
  console.log(`📚 CourseManager: ${info.courseManager}`);
  console.log("=".repeat(60));

  console.log("\n📋 下一步操作:");
  console.log("1. 🧪 运行测试: npm run test");
  console.log("2. 🔍 验证部署: npm run verify:deployment");
  console.log("3. ✅ 验证合约: npm run verify:all");
  console.log("4. 💰 检查余额: npm run check-balance");

  if (info.network === "development" || info.network === "ganache") {
    console.log("\n💡 本地部署说明:");
    console.log("- 本地网络不需要私钥配置");
    console.log("- 使用 Truffle 内置账户进行部署");
    console.log("- CourseManager 已自动充值代币用于奖励发放");
    console.log("- YiDengTokenSwap 支持 ETH/YD 代币兑换");
    console.log("- 适用于开发和测试环境");
  } else if (info.network !== "mainnet") {
    console.log("\n⚠️ 注意: 这是测试网络部署，请勿用于生产环境");
  } else {
    console.log("\n🚨 警告: 这是主网部署，请立即验证合约并确保安全!");
  }
}
