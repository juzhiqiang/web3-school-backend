# Truffle 开发指南

## 核心组件
- **Truffle CLI**: 合约编译、部署和测试
- **Ganache**: 本地以太坊区块链  
- **Truffle Console**: 交互式合约调试

## 项目结构
```
web3-school-backend/
├── contracts/          # Solidity智能合约
├── migrations/         # 部署脚本
├── test/              # 测试文件
├── scripts/           # 工具脚本
└── truffle-config.js  # Truffle配置
```


## 基本配置

```javascript
// truffle-config.js
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: { optimizer: { enabled: true, runs: 200 } }
    }
  }
};
```

## 常用命令

```bash
# 开发
truffle compile
truffle migrate --network development
truffle test
truffle console --network development

# 生产
truffle migrate --network goerli
truffle run verify YDToken --network goerli
```

## 测试框架

```javascript
const ContractName = artifacts.require("ContractName");
const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

contract("ContractName", (accounts) => {
  beforeEach(async () => {
    this.contract = await ContractName.new({ from: accounts[0] });
  });
  
  it("应该执行预期行为", async () => {
    // 测试逻辑
  });
});
```

## 部署脚本

```javascript
// migrations/2_deploy_contracts.js
const YDToken = artifacts.require("YDToken");
const Platform = artifacts.require("DeveloperDeploymentPlatform");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(YDToken, "YuanDao Token", "YD", initialSupply);
  const token = await YDToken.deployed();
  
  await deployer.deploy(Platform, token.address);
  const platform = await Platform.deployed();
  
  await token.setPlatformAuthorization(platform.address, true);
};
```

## Console 使用

```javascript
// 启动控制台
truffle console --network development

// 基本操作
let token = await YDToken.deployed()
accounts = await web3.eth.getAccounts()
await token.transfer(accounts[1], web3.utils.toWei('100', 'ether'))

// 调试
let tx = await platform.registerDeveloper("Alice", "alice@example.com")
console.log(tx.receipt.gasUsed)
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
