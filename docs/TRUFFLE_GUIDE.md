# Truffle 开发指南

本项目完全基于 **Truffle Framework** 构建，这是以太坊智能合约开发的成熟框架。

## 🛠️ Truffle 工具链

### 核心组件
- **Truffle CLI**: 合约编译、部署和测试
- **Ganache**: 本地以太坊区块链
- **Truffle Console**: 交互式合约调试
- **Truffle Teams**: 团队协作和监控

### 项目结构
```
web3-school-backend/
├── contracts/          # Solidity智能合约
├── migrations/         # 部署脚本
├── test/              # 测试文件
├── scripts/           # 工具脚本
└── truffle-config.js  # Truffle配置
```

## 📦 依赖管理

### 核心依赖
```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^4.9.3",
    "@truffle/hdwallet-provider": "^2.1.15",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "truffle": "^5.11.5",
    "truffle-plugin-verify": "^0.5.31",
    "truffle-flattener": "^1.6.0",
    "solidity-coverage": "^0.8.5"
  }
}
```

### 不使用 Hardhat 相关包
❌ 避免安装这些包:
- `@nomiclabs/hardhat-waffle`
- `@nomiclabs/hardhat-etherscan` 
- `hardhat`
- `hardhat-gas-reporter`

## 🔧 Truffle 配置详解

### truffle-config.js 关键配置
```javascript
module.exports = {
  // 网络配置
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000
    },
    goerli: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 5,
      gas: 8000000,
      gasPrice: 10000000000
    }
  },
  
  // 编译器配置
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  
  // 插件配置
  plugins: [
    'truffle-plugin-verify',
    'solidity-coverage'
  ]
};
```

## 📝 Truffle 命令大全

### 开发命令
```bash
# 编译合约
truffle compile

# 部署到本地网络
truffle migrate --network development

# 重新部署所有合约
truffle migrate --reset --network development

# 运行测试
truffle test

# 运行特定测试文件
truffle test test/YDToken.test.js

# 进入交互控制台
truffle console --network development
```

### 生产命令
```bash
# 部署到测试网
truffle migrate --network goerli

# 验证合约
truffle run verify YDToken --network goerli

# 展平合约代码
truffle-flattener contracts/YDToken.sol > YDToken_flat.sol
```

## 🧪 Truffle 测试框架

### 测试文件结构
```javascript
const ContractName = artifacts.require("ContractName");
const { expect } = require("chai");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

contract("ContractName", (accounts) => {
  const [owner, user1, user2] = accounts;
  
  beforeEach(async () => {
    // 测试前的设置
    this.contract = await ContractName.new({ from: owner });
  });
  
  describe("功能描述", () => {
    it("应该执行预期行为", async () => {
      // 测试逻辑
    });
  });
});
```

### Truffle 测试工具
```javascript
// 使用 @openzeppelin/test-helpers
const { 
  BN,           // 大数处理
  expectEvent,  // 事件断言
  expectRevert, // 回滚断言
  time,         // 时间操作
  balance       // 余额跟踪
} = require("@openzeppelin/test-helpers");

// 事件测试
expectEvent(receipt, 'EventName', {
  param1: expectedValue1,
  param2: expectedValue2
});

// 回滚测试
await expectRevert(
  contract.method(invalidInput),
  "Expected error message"
);
```

## 🔄 Truffle 部署流程

### Migration 文件
```javascript
// migrations/2_deploy_contracts.js
const YDToken = artifacts.require("YDToken");
const DeveloperDeploymentPlatform = artifacts.require("DeveloperDeploymentPlatform");

module.exports = async function (deployer, network, accounts) {
  // 1. 部署YD代币
  await deployer.deploy(YDToken, "YuanDao Token", "YD", initialSupply);
  const ydToken = await YDToken.deployed();
  
  // 2. 部署平台合约
  await deployer.deploy(DeveloperDeploymentPlatform, ydToken.address);
  const platform = await DeveloperDeploymentPlatform.deployed();
  
  // 3. 配置权限
  await ydToken.setPlatformAuthorization(platform.address, true);
};
```

### 网络特定部署
```javascript
module.exports = function (deployer, network, accounts) {
  if (network === 'development') {
    // 本地开发配置
    return deployForDevelopment(deployer, accounts);
  } else if (network === 'goerli') {
    // 测试网配置
    return deployForTestnet(deployer, accounts);
  } else if (network === 'mainnet') {
    // 主网配置
    return deployForMainnet(deployer, accounts);
  }
};
```

## 🎯 Truffle Console 使用

### 常用控制台命令
```javascript
// 启动控制台
truffle console --network development

// 在控制台中:
// 获取合约实例
let token = await YDToken.deployed()
let platform = await DeveloperDeploymentPlatform.deployed()

// 查看合约信息
token.address
await token.totalSupply()

// 执行交易
accounts = await web3.eth.getAccounts()
await token.transfer(accounts[1], web3.utils.toWei('100', 'ether'))

// 查看事件
let events = await token.getPastEvents('Transfer', {
  fromBlock: 0,
  toBlock: 'latest'
})
```

### 调试技巧
```javascript
// 查看交易详情
let tx = await platform.registerDeveloper("Alice", "alice@example.com")
console.log(tx.logs) // 查看事件日志
console.log(tx.receipt.gasUsed) // 查看gas使用

// 估算gas
let gasEstimate = await platform.registerDeveloper.estimateGas(
  "Bob", "bob@example.com"
)
console.log('Gas estimate:', gasEstimate)
```

## 📊 Truffle 测试覆盖率

### 运行覆盖率测试
```bash
# 安装覆盖率插件
npm install --save-dev solidity-coverage

# 运行覆盖率测试
npm run test:coverage

# 查看覆盖率报告
open coverage/index.html
```

### 覆盖率目标
- **语句覆盖率**: > 95%
- **分支覆盖率**: > 90%
- **函数覆盖率**: > 95%
- **行覆盖率**: > 95%

## 🔍 Truffle 调试

### 内置调试器
```bash
# 调试失败的交易
truffle debug <transaction_hash> --network development

# 在调试器中:
# o - 下一步
# i - 进入函数
# u - 跳出函数  
# n - 下一行
# ; - 切换源码视图
# q - 退出
```

### 控制台调试
```javascript
// 在合约中添加事件用于调试
event DebugLog(string message, uint256 value);

function someFunction(uint256 input) public {
    emit DebugLog("Input value", input);
    // 业务逻辑
    emit DebugLog("Calculation result", result);
}
```

## ⚡ Truffle 性能优化

### 编译优化
```javascript
// truffle-config.js
compilers: {
  solc: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200  // 根据预期调用频率调整
      },
      evmVersion: "london"
    }
  }
}
```

### 测试优化
```javascript
// 使用beforeEach进行测试设置
beforeEach(async () => {
  this.token = await YDToken.new("Test", "TST", 1000000);
});

// 使用快照加速测试
const { snapshot } = require('@openzeppelin/test-helpers');

before(async () => {
  this.snapshot = await snapshot();
});

afterEach(async () => {
  await this.snapshot.restore();
});
```

## 🚀 部署最佳实践

### 分阶段部署
```bash
# 1. 本地测试
npm run deploy:local
npm test

# 2. 测试网部署
npm run deploy
npm run verify

# 3. 生产部署
truffle migrate --network mainnet --dry-run  # 预执行检查
truffle migrate --network mainnet
```

### 部署验证
```javascript
// 在migration中添加验证
module.exports = async function (deployer, network, accounts) {
  // 部署合约
  await deployer.deploy(YDToken, "YuanDao Token", "YD", initialSupply);
  const token = await YDToken.deployed();
  
  // 验证部署
  const name = await token.name();
  const symbol = await token.symbol();
  const supply = await token.totalSupply();
  
  console.log(`✅ YDToken deployed successfully:`);
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Supply: ${web3.utils.fromWei(supply, 'ether')} ${symbol}`);
};
```

这样项目就完全专注于Truffle框架了！现在所有的工具、脚本和配置都是针对Truffle优化的，确保了一致性和最佳实践。🎯
