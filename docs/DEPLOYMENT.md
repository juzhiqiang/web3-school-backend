# 部署指南

## 本地部署

### 1. 环境准备
```bash
# 安装依赖
npm install

# 启动Ganache
ganache-cli --deterministic --accounts 10 --host 0.0.0.0
```

### 2. 编译合约
```bash
npm run compile
```

### 3. 部署到本地网络
```bash
npm run deploy:local
```

### 4. 运行交互脚本
```bash
npm run interact
```

## 测试网部署

### 1. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入:
# - INFURA_PROJECT_ID
# - MNEMONIC
# - ETHERSCAN_API_KEY
```

### 2. 获取测试ETH
- Goerli测试网: https://goerlifaucet.com/
- Sepolia测试网: https://sepoliafaucet.com/

### 3. 部署到测试网
```bash
npm run deploy
```

### 4. 验证合约
```bash
npm run verify
```

## 主网部署

⚠️ **警告**: 主网部署需要真实的ETH，请确保:
1. 代码已通过完整测试
2. 进行了安全审计
3. 备份了所有私钥和助记词

### 部署步骤
1. 更新 `truffle-config.js` 中的主网配置
2. 确保部署账户有足够的ETH
3. 运行部署命令
4. 验证所有合约
5. 更新前端配置

## 部署后配置

### 1. 权限设置
```javascript
// 授权平台合约
await ydToken.setPlatformAuthorization(platformAddress, true);

// 授权课程管理合约
await ydToken.setTeacherAuthorization(courseManagerAddress, true);

// 授权讲师账户
await courseManager.setInstructorAuthorization(instructorAddress, true);
```

### 2. 奖励池设置
```javascript
// 向合约存入奖励代币
const rewardAmount = web3.utils.toWei("10000000", "ether"); // 1000万代币
await ydToken.depositTokensForRewards(rewardAmount);
```

### 3. 课程配置
```javascript
// 设置课程奖励
await ydToken.setCourseReward("SOLIDITY_BASICS", web3.utils.toWei("100", "ether"));
```

## 升级策略

当前合约没有实现代理模式，如需升级请考虑：
1. 部署新版本合约
2. 迁移数据和权限
3. 更新前端配置
4. 通知用户切换

## Gas 优化

### 部署Gas消耗估算
- YDToken: ~2,500,000 gas
- DeveloperDeploymentPlatform: ~3,000,000 gas
- CourseManager: ~2,800,000 gas
- **总计**: ~8,300,000 gas

### 交互Gas消耗
- 注册开发者: ~100,000 gas
- 记录部署: ~150,000 gas
- 注册课程: ~80,000 gas
- 更新进度: ~60,000 gas
- 领取奖励: ~120,000 gas

## 故障排除

### 常见问题

1. **编译失败**
   - 检查Solidity版本兼容性
   - 确保安装了OpenZeppelin依赖

2. **部署失败**
   - 检查网络连接
   - 确认账户余额充足
   - 验证Gas价格设置

3. **交易失败**
   - 检查权限配置
   - 确认合约状态
   - 验证参数格式

### 调试技巧
```bash
# 查看详细错误信息
truffle test --verbose

# 进入控制台调试
truffle console --network development

# 检查合约状态
const instance = await YDToken.deployed();
console.log(await instance.totalSupply());
```

## 监控和维护

### 重要指标
- 代币总供应量和分发情况
- 平台活跃开发者数量
- 课程完成率
- 奖励分发统计

### 日志监控
```javascript
// 监控重要事件
ydToken.CourseReward().on('data', (event) => {
  console.log('课程奖励发放:', event);
});

platform.ContractDeployed().on('data', (event) => {
  console.log('新合约部署:', event);
});
```
