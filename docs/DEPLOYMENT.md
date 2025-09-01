# 部署指南

## 本地部署
```bash
# 1. 安装依赖
npm install

# 2. 启动本地网络
ganache-cli --deterministic --accounts 10 --host 0.0.0.0

# 3. 编译并部署
npm run deploy:local

# 4. 测试交互
npm run interact
```

## 测试网部署
```bash
# 1. 配置环境变量
cp .env.example .env
# 填入: INFURA_PROJECT_ID, MNEMONIC, ETHERSCAN_API_KEY

# 2. 获取测试ETH
# Goerli: https://goerlifaucet.com/
# Sepolia: https://sepoliafaucet.com/

# 3. 部署并验证
npm run deploy
npm run verify
```

## 部署后配置
```javascript
// 权限设置
await ydToken.setPlatformAuthorization(platformAddress, true);
await ydToken.setTeacherAuthorization(courseManagerAddress, true);

// 奖励池配置
const rewardAmount = web3.utils.toWei("10000000", "ether");
await ydToken.depositTokensForRewards(rewardAmount);
```

## Gas消耗估算
- **部署总计**: ~8,300,000 gas
- **注册开发者**: ~100,000 gas  
- **记录部署**: ~150,000 gas
- **领取奖励**: ~120,000 gas
