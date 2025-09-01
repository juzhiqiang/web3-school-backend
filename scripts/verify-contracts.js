/**
 * 合约验证脚本
 * 用于在Etherscan上验证已部署的合约
 */

const { execSync } = require('child_process');
require('dotenv').config();

// 合约构造参数配置
const CONSTRUCTOR_ARGS = {
  YDToken: [
    '"YuanDao Token"',
    '"YD"',
    '"100000000000000000000000000"' // 1亿代币，18位小数
  ],
  DeveloperDeploymentPlatform: [
    // YDToken地址将在运行时填入
  ],
  CourseManager: [
    // YDToken地址将在运行时填入
  ]
};

async function verifyContracts(network = 'goerli') {
  console.log(`🔍 开始验证合约 - 网络: ${network}`);
  console.log('=' * 50);
  
  // 检查必要的环境变量
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error('❌ 缺少ETHERSCAN_API_KEY环境变量');
    process.exit(1);
  }
  
  try {
    // 读取部署信息
    const YDToken = artifacts.require('YDToken');
    const DeveloperDeploymentPlatform = artifacts.require('DeveloperDeploymentPlatform');
    const CourseManager = artifacts.require('CourseManager');
    
    const ydTokenInstance = await YDToken.deployed();
    const platformInstance = await DeveloperDeploymentPlatform.deployed();
    const courseManagerInstance = await CourseManager.deployed();
    
    // 更新构造参数
    CONSTRUCTOR_ARGS.DeveloperDeploymentPlatform = [`"${ydTokenInstance.address}"`];
    CONSTRUCTOR_ARGS.CourseManager = [`"${ydTokenInstance.address}"`];
    
    const contracts = [
      {
        name: 'YDToken',
        address: ydTokenInstance.address,
        args: CONSTRUCTOR_ARGS.YDToken
      },
      {
        name: 'DeveloperDeploymentPlatform',
        address: platformInstance.address,
        args: CONSTRUCTOR_ARGS.DeveloperDeploymentPlatform
      },
      {
        name: 'CourseManager',
        address: courseManagerInstance.address,
        args: CONSTRUCTOR_ARGS.CourseManager
      }
    ];
    
    // 验证每个合约
    for (const contract of contracts) {
      console.log(`\n验证合约: ${contract.name}`);
      console.log(`地址: ${contract.address}`);
      
      try {
        const command = `truffle run verify ${contract.name}@${contract.address} --network ${network}`;
        
        if (contract.args.length > 0) {
          const argsString = contract.args.join(' ');
          command += ` --args ${argsString}`;
        }
        
        console.log(`执行命令: ${command}`);
        
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log('✅ 验证成功');
        
        if (result.includes('Successfully verified')) {
          console.log('🔗 Etherscan链接已生成');
        }
        
      } catch (error) {
        console.error(`❌ ${contract.name} 验证失败:`);
        console.error(error.message);
        
        // 提供手动验证信息
        console.log('\n🛠️  手动验证信息:');
        console.log(`   合约名称: ${contract.name}`);
        console.log(`   合约地址: ${contract.address}`);
        console.log(`   构造参数: ${contract.args.join(', ')}`);
        console.log(`   编译器版本: 0.8.19`);
        console.log(`   优化: 启用 (200 runs)`);
      }
    }
    
    console.log('\n🎉 合约验证流程完成！');
    console.log('📊 您可以在以下网站查看验证结果:');
    
    const explorerUrls = {
      mainnet: 'https://etherscan.io',
      goerli: 'https://goerli.etherscan.io',
      sepolia: 'https://sepolia.etherscan.io',
      polygon: 'https://polygonscan.com',
      bsc: 'https://bscscan.com'
    };
    
    const explorerUrl = explorerUrls[network] || explorerUrls.goerli;
    
    contracts.forEach(contract => {
      console.log(`   ${contract.name}: ${explorerUrl}/address/${contract.address}#code`);
    });
    
  } catch (error) {
    console.error('验证过程中出现错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  // 从命令行参数获取网络
  const network = process.argv[2] || 'goerli';
  
  module.exports = function(callback) {
    verifyContracts(network)
      .then(() => callback())
      .catch(error => {
        console.error(error);
        callback(error);
      });
  };
}
