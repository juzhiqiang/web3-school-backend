/**
 * 部署验证脚本
 * 验证合约是否正确部署并配置
 */

require('dotenv').config();
const Web3 = require('web3');
const fs = require('fs');

// 合约 ABI
const YDTokenABI = require('../build/contracts/YDToken.json').abi;
const PlatformABI = require('../build/contracts/DeveloperDeploymentPlatform.json').abi;
const CourseManagerABI = require('../build/contracts/CourseManager.json').abi;

class DeploymentVerifier {
  constructor(network) {
    this.network = network;
    this.web3 = this.initializeWeb3();
    this.account = this.loadAccount();
    this.loadDeploymentInfo();
  }

  initializeWeb3() {
    const rpcUrls = {
      ganache: 'http://localhost:7545',
      sepolia: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      mainnet: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    };

    return new Web3(rpcUrls[this.network]);
  }

  loadAccount() {
    const { PRIVATE_KEY } = process.env;
    const account = this.web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    this.web3.eth.accounts.wallet.add(account);
    this.web3.eth.defaultAccount = account.address;
    return account;
  }

  /**
   * 加载部署信息
   */
  loadDeploymentInfo() {
    const filePath = `./deployments/${this.network}.json`;
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ 找不到部署信息文件: ${filePath}`);
    }
    
    this.deploymentInfo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📄 已加载部署信息: ${filePath}`);
  }

  /**
   * 验证合约部署
   */
  async verifyDeployment() {
    console.log('\n🔍 开始验证部署...');
    
    const { contracts } = this.deploymentInfo;
    
    // 验证 YDToken
    await this.verifyYDToken(contracts.ydToken);
    
    // 验证 DeveloperDeploymentPlatform
    await this.verifyPlatform(contracts.platform, contracts.ydToken);
    
    // 验证 CourseManager
    await this.verifyCourseManager(contracts.courseManager, contracts.ydToken);
    
    console.log('\n✅ 所有合约验证完成!');
  }

  /**
   * 验证 YDToken 合约
   */
  async verifyYDToken(address) {
    console.log('\n📝 验证 YDToken...');
    
    const contract = new this.web3.eth.Contract(YDTokenABI, address);
    
    try {
      const name = await contract.methods.name().call();
      const symbol = await contract.methods.symbol().call();
      const decimals = await contract.methods.decimals().call();
      const totalSupply = await contract.methods.totalSupply().call();
      const owner = await contract.methods.owner().call();
      
      console.log(`   ✅ 名称: ${name}`);
      console.log(`   ✅ 符号: ${symbol}`);
      console.log(`   ✅ 精度: ${decimals}`);
      console.log(`   ✅ 总供应量: ${this.web3.utils.fromWei(totalSupply, 'ether')} ${symbol}`);
      console.log(`   ✅ 所有者: ${owner}`);
      
      if (owner.toLowerCase() !== this.account.address.toLowerCase()) {
        console.warn(`   ⚠️ 所有者地址不匹配! 期望: ${this.account.address}, 实际: ${owner}`);
      }
      
    } catch (error) {
      console.error(`   ❌ YDToken 验证失败:`, error.message);
      throw error;
    }
  }

  /**
   * 验证 DeveloperDeploymentPlatform 合约
   */
  async verifyPlatform(address, tokenAddress) {
    console.log('\n🏗️ 验证 DeveloperDeploymentPlatform...');
    
    const contract = new this.web3.eth.Contract(PlatformABI, address);
    const tokenContract = new this.web3.eth.Contract(YDTokenABI, tokenAddress);
    
    try {
      const ydTokenAddr = await contract.methods.ydToken().call();
      const owner = await contract.methods.owner().call();
      const stats = await contract.methods.getPlatformStats().call();
      const tokenBalance = await tokenContract.methods.balanceOf(address).call();
      
      console.log(`   ✅ 关联代币地址: ${ydTokenAddr}`);
      console.log(`   ✅ 合约所有者: ${owner}`);
      console.log(`   ✅ 总部署数: ${stats._totalDeployments}`);
      console.log(`   ✅ 总开发者数: ${stats._totalDevelopers}`);
      console.log(`   ✅ 总奖励分发: ${this.web3.utils.fromWei(stats._totalRewardsDistributed, 'ether')} YD`);
      console.log(`   ✅ 代币余额: ${this.web3.utils.fromWei(tokenBalance, 'ether')} YD`);
      
      // 验证代币地址匹配
      if (ydTokenAddr.toLowerCase() !== tokenAddress.toLowerCase()) {
        throw new Error(`代币地址不匹配! 期望: ${tokenAddress}, 实际: ${ydTokenAddr}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Platform 验证失败:`, error.message);
      throw error;
    }
  }

  /**
   * 验证 CourseManager 合约
   */
  async verifyCourseManager(address, tokenAddress) {
    console.log('\n📚 验证 CourseManager...');
    
    const contract = new this.web3.eth.Contract(CourseManagerABI, address);
    const tokenContract = new this.web3.eth.Contract(YDTokenABI, tokenAddress);
    
    try {
      const ydTokenAddr = await contract.methods.ydToken().call();
      const owner = await contract.methods.owner().call();
      const tokenBalance = await tokenContract.methods.balanceOf(address).call();
      
      console.log(`   ✅ 关联代币地址: ${ydTokenAddr}`);
      console.log(`   ✅ 合约所有者: ${owner}`);
      console.log(`   ✅ 代币余额: ${this.web3.utils.fromWei(tokenBalance, 'ether')} YD`);
      
      if (ydTokenAddr.toLowerCase() !== tokenAddress.toLowerCase()) {
        throw new Error(`代币地址不匹配! 期望: ${tokenAddress}, 实际: ${ydTokenAddr}`);
      }
      
    } catch (error) {
      console.error(`   ❌ CourseManager 验证失败:`, error.message);
      throw error;
    }
  }

  /**
   * 测试基本功能
   */
  async testBasicFunctions() {
    console.log('\n🧪 测试基本功能...');
    
    const { contracts } = this.deploymentInfo;
    const platform = new this.web3.eth.Contract(PlatformABI, contracts.platform);
    
    try {
      // 测试注册开发者
      console.log('   测试开发者注册...');
      const gasPrice = await this.web3.eth.getGasPrice();
      
      const tx = await platform.methods.registerDeveloper(
        'Test Developer',
        'test@example.com'
      ).send({
        from: this.account.address,
        gas: 200000,
        gasPrice: gasPrice
      });
      
      console.log(`   ✅ 开发者注册成功! 交易: ${tx.transactionHash}`);
      
      // 验证注册信息
      const devInfo = await platform.methods.getDeveloperInfo(this.account.address).call();
      console.log(`   ✅ 开发者姓名: ${devInfo.name}`);
      console.log(`   ✅ 开发者邮箱: ${devInfo.email}`);
      
    } catch (error) {
      if (error.message.includes('Already registered')) {
        console.log('   ✅ 开发者已注册 (符合预期)');
      } else {
        console.error(`   ❌ 功能测试失败:`, error.message);
      }
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const networkIndex = args.indexOf('--network');
  const network = networkIndex !== -1 ? args[networkIndex + 1] : 'development';
  const shouldTest = args.includes('--test');
  
  console.log('🔍 Web3 School 部署验证工具');
  console.log('==============================');
  
  try {
    const verifier = new DeploymentVerifier(network);
    await verifier.verifyDeployment();
    
    if (shouldTest) {
      await verifier.testBasicFunctions();
    }
    
    console.log('\n🎉 验证完成!');
    
  } catch (error) {
    console.error('❌ 验证失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeploymentVerifier;