/**
 * Web3 School - 智能合约部署工具
 * 仅支持私钥部署，确保安全性
 * 
 * 使用方法:
 * node scripts/deploy-helper.js --network sepolia
 * node scripts/deploy-helper.js --network mainnet --verify
 */

require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// 合约 ABI 和字节码
const YDTokenArtifact = require('../build/contracts/YDToken.json');
const PlatformArtifact = require('../build/contracts/DeveloperDeploymentPlatform.json');
const CourseManagerArtifact = require('../build/contracts/CourseManager.json');

class PrivateKeyDeploymentHelper {
  constructor(network) {
    this.network = network;
    this.web3 = this.initializeWeb3();
    this.account = this.loadPrivateKeyAccount();
    this.deployedContracts = {};
  }

  /**
   * 初始化 Web3 连接
   */
  initializeWeb3() {
    const rpcUrls = {
      ganache: 'http://localhost:7545',
      sepolia: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      mainnet: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      polygon: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      arbitrum: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    };

    const rpcUrl = rpcUrls[this.network];
    if (!rpcUrl) {
      throw new Error(`❌ 不支持的网络: ${this.network}`);
    }

    console.log(`🌐 连接到网络: ${this.network}`);
    return new Web3(rpcUrl);
  }

  /**
   * 加载私钥账户 (仅支持私钥)
   */
  loadPrivateKeyAccount() {
    const { PRIVATE_KEY } = process.env;
    
    if (!PRIVATE_KEY) {
      throw new Error('❌ 必须在 .env 文件中设置 PRIVATE_KEY');
    }

    if (!PRIVATE_KEY.startsWith('0x')) {
      throw new Error('❌ 私钥必须以 0x 开头');
    }

    if (PRIVATE_KEY.length !== 66) {
      throw new Error('❌ 私钥长度必须为 64 个字符 (加上 0x 前缀)');
    }

    const account = this.web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    this.web3.eth.accounts.wallet.add(account);
    this.web3.eth.defaultAccount = account.address;

    console.log(`🔑 使用私钥部署`);
    console.log(`👤 部署账户: ${account.address}`);
    return account;
  }

  /**
   * 检查账户余额
   */
  async checkBalance() {
    const balance = await this.web3.eth.getBalance(this.account.address);
    const balanceEth = this.web3.utils.fromWei(balance, 'ether');
    
    console.log(`💰 账户余额: ${balanceEth} ETH`);
    
    if (parseFloat(balanceEth) < 0.01) {
      throw new Error('❌ 账户余额不足，无法完成部署');
    }
    
    return balanceEth;
  }

  /**
   * 估算 Gas 价格
   */
  async estimateGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      const gasPriceGwei = this.web3.utils.fromWei(gasPrice, 'gwei');
      console.log(`⛽ 当前 Gas 价格: ${gasPriceGwei} gwei`);
      
      // 如果 Gas 价格过高，给出警告
      if (parseFloat(gasPriceGwei) > 100) {
        console.warn('⚠️ Gas 价格较高，建议等待价格降低或使用 Layer 2 网络');
      }
      
      return gasPrice;
    } catch (error) {
      console.log('⚠️ 无法获取 Gas 价格，使用默认值');
      return this.web3.utils.toWei('25', 'gwei');
    }
  }

  /**
   * 部署单个合约
   */
  async deployContract(artifact, constructorArgs = [], contractName) {
    console.log(`\n📝 部署 ${contractName}...`);
    
    const contract = new this.web3.eth.Contract(artifact.abi);
    const gasPrice = await this.estimateGasPrice();
    
    // 估算 Gas
    const deployData = contract.deploy({
      data: artifact.bytecode,
      arguments: constructorArgs
    });
    
    try {
      const estimatedGas = await deployData.estimateGas({ from: this.account.address });
      const gasLimit = Math.ceil(estimatedGas * 1.2); // 增加 20% 的 Gas 余量
      
      console.log(`   估算 Gas: ${estimatedGas.toLocaleString()}`);
      console.log(`   Gas 限制: ${gasLimit.toLocaleString()}`);
      
      // 计算预估费用
      const estimatedCostWei = gasLimit * gasPrice;
      const estimatedCostEth = this.web3.utils.fromWei(estimatedCostWei.toString(), 'ether');
      console.log(`   预估费用: ${parseFloat(estimatedCostEth).toFixed(6)} ETH`);
      
      // 部署合约
      const deployedContract = await deployData.send({
        from: this.account.address,
        gas: gasLimit,
        gasPrice: gasPrice
      });

      console.log(`✅ ${contractName} 部署成功!`);
      console.log(`   合约地址: ${deployedContract.options.address}`);
      console.log(`   交易哈希: ${deployedContract.transactionHash}`);
      
      return deployedContract;
      
    } catch (error) {
      console.error(`❌ 部署 ${contractName} 失败:`, error.message);
      throw error;
    }
  }

  /**
   * 执行完整部署流程
   */
  async deploy() {
    try {
      console.log('\n🔍 部署前检查...');
      await this.checkBalance();
      
      // 1. 部署 YDToken
      const ydToken = await this.deployContract(
        YDTokenArtifact, 
        [], 
        'YDToken'
      );
      this.deployedContracts.ydToken = ydToken.options.address;

      // 2. 部署 DeveloperDeploymentPlatform
      const platform = await this.deployContract(
        PlatformArtifact,
        [ydToken.options.address],
        'DeveloperDeploymentPlatform'
      );
      this.deployedContracts.platform = platform.options.address;

      // 3. 部署 CourseManager
      const instructor = process.env.DEFAULT_INSTRUCTOR_ADDRESS || this.account.address;
      const courseManager = await this.deployContract(
        CourseManagerArtifact,
        [ydToken.options.address, instructor],
        'CourseManager'
      );
      this.deployedContracts.courseManager = courseManager.options.address;

      // 4. 配置合约
      await this.configureContracts(ydToken, platform, courseManager);

      // 5. 保存部署信息
      this.saveDeploymentInfo();

      console.log('\n🎉 部署完成!');
      this.printSummary();

    } catch (error) {
      console.error('❌ 部署失败:', error);
      
      // 提供详细错误信息和解决建议
      this.handleDeploymentError(error);
      process.exit(1);
    }
  }

  /**
   * 配置合约
   */
  async configureContracts(ydToken, platform, courseManager) {
    console.log('\n🔧 配置合约...');
    
    const gasPrice = await this.estimateGasPrice();
    const config = this.getNetworkConfig();
    
    try {
      // 为平台分配代币
      console.log('   为平台分配代币...');
      const platformAllocation = this.web3.utils.toWei(config.platformTokens.toString(), 'ether');
      await ydToken.methods.transfer(platform.options.address, platformAllocation).send({
        from: this.account.address,
        gas: 100000,
        gasPrice: gasPrice
      });
      console.log(`✅ 已向平台分配 ${config.platformTokens.toLocaleString()} YD 代币`);

      // 为课程系统分配代币
      console.log('   为课程系统分配代币...');
      const courseAllocation = this.web3.utils.toWei(config.courseTokens.toString(), 'ether');
      await ydToken.methods.transfer(courseManager.options.address, courseAllocation).send({
        from: this.account.address,
        gas: 100000,
        gasPrice: gasPrice
      });
      console.log(`✅ 已向课程系统分配 ${config.courseTokens.toLocaleString()} YD 代币`);
      
    } catch (error) {
      console.error('❌ 配置合约失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取网络配置
   */
  getNetworkConfig() {
    const configs = {
      development: { platformTokens: 1000000, courseTokens: 500000 },
      ganache: { platformTokens: 1000000, courseTokens: 500000 },
      sepolia: { platformTokens: 100000, courseTokens: 50000 },
      mainnet: { platformTokens: 10000000, courseTokens: 5000000 }
    };
    
    return configs[this.network] || configs.development;
  }

  /**
   * 保存部署信息
   */
  saveDeploymentInfo() {
    const deploymentInfo = {
      network: this.network,
      timestamp: new Date().toISOString(),
      deployer: this.account.address,
      contracts: this.deployedContracts,
      config: this.getNetworkConfig(),
      deploymentMethod: 'private-key-only'
    };

    const deploymentDir = './deployments';
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir);
    }

    const fileName = `${deploymentDir}/${this.network}.json`;
    fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 部署信息已保存到: ${fileName}`);
  }

  /**
   * 处理部署错误
   */
  handleDeploymentError(error) {
    console.error('\n🔧 错误诊断:');
    
    if (error.message.includes('insufficient funds')) {
      console.error('💰 余额不足 - 请充值 ETH 到部署账户');
    } else if (error.message.includes('nonce')) {
      console.error('🔄 Nonce 问题 - 尝试重新部署或重置 nonce');
    } else if (error.message.includes('gas')) {
      console.error('⛽ Gas 问题 - 检查 Gas 价格和限制设置');
    } else if (error.message.includes('network')) {
      console.error('🌐 网络连接问题 - 检查 RPC 节点配置');
    }
    
    console.error('\n💡 建议解决方案:');
    console.error('1. 检查账户余额: npm run check-balance');
    console.error('2. 降低 Gas 价格: export GAS_PRICE_GWEI=15');
    console.error('3. 使用 Truffle Dashboard: truffle migrate --network dashboard');
  }

  /**
   * 打印部署摘要
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 部署摘要');
    console.log('='.repeat(60));
    console.log(`📡 网络: ${this.network}`);
    console.log(`🔑 部署方式: 私钥部署`);
    console.log(`👤 部署者: ${this.account.address}`);
    console.log(`🪙 YDToken: ${this.deployedContracts.ydToken}`);
    console.log(`🏗️ 开发者平台: ${this.deployedContracts.platform}`);
    console.log(`📚 课程管理: ${this.deployedContracts.courseManager}`);
    console.log('='.repeat(60));
    
    console.log('\n📋 验证合约命令:');
    console.log(`truffle run verify YDToken --network ${this.network}`);
    console.log(`truffle run verify DeveloperDeploymentPlatform --network ${this.network}`);
    console.log(`truffle run verify CourseManager --network ${this.network}`);
    
    console.log('\n🔍 验证部署状态:');
    console.log(`npm run verify:deployment -- --network ${this.network}`);
  }
}

/**
 * 验证合约
 */
async function verifyContracts(network) {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);

  console.log('🔍 开始验证合约...');
  
  const contracts = ['YDToken', 'DeveloperDeploymentPlatform', 'CourseManager'];
  
  for (const contract of contracts) {
    try {
      console.log(`验证 ${contract}...`);
      const { stdout } = await execAsync(`truffle run verify ${contract} --network ${network}`);
      console.log(stdout);
    } catch (error) {
      console.error(`❌ 验证 ${contract} 失败:`, error.message);
    }
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const networkIndex = args.indexOf('--network');
const network = networkIndex !== -1 ? args[networkIndex + 1] : 'development';
const shouldVerify = args.includes('--verify');

// 主函数
async function main() {
  console.log('🚀 Web3 School 合约部署工具 (仅私钥部署)');
  console.log('==========================================');
  
  const deployer = new PrivateKeyDeploymentHelper(network);
  await deployer.deploy();
  
  if (shouldVerify && network !== 'development' && network !== 'ganache') {
    await verifyContracts(network);
  }
  
  console.log('\n✨ 部署流程完成!');
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
});

// 执行部署
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PrivateKeyDeploymentHelper;
