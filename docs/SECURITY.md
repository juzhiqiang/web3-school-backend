# 安全指南

## 🔒 安全最佳实践

### 1. 私钥管理
- **永远不要**在代码中硬编码私钥
- 使用环境变量存储敏感信息
- 在生产环境使用硬件钱包或多签钱包
- 定期轮换测试网私钥

### 2. 合约安全

#### 访问控制
```solidity
// ✅ 正确: 使用OpenZeppelin的访问控制
modifier onlyAuthorized() {
    require(authorizedUsers[msg.sender], "Not authorized");
    _;
}

// ❌ 错误: 简单的地址检查容易被绕过
modifier onlyOwner() {
    require(msg.sender == owner); // 缺少错误信息
    _;
}
```

#### 重入攻击防护
```solidity
// ✅ 正确: 使用ReentrancyGuard
function claimReward() external nonReentrant {
    // 业务逻辑
}

// ❌ 错误: 没有重入保护
function claimReward() external {
    // 可能被重入攻击
}
```

#### 整数溢出保护
```solidity
// ✅ 正确: Solidity 0.8+ 自动检查溢出
function addReward(uint256 amount) external {
    totalRewards += amount; // 自动检查溢出
}

// ✅ 正确: 使用SafeMath (Solidity < 0.8)
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
using SafeMath for uint256;
```

### 3. 输入验证

#### 参数验证
```solidity
function setCourseReward(string memory courseId, uint256 amount) external onlyOwner {
    require(bytes(courseId).length > 0, "Course ID cannot be empty");
    require(amount > 0, "Reward amount must be positive");
    require(amount <= maxRewardAmount, "Reward exceeds maximum");
    
    courseRewards[courseId] = amount;
}
```

#### 地址验证
```solidity
function authorize(address user) external onlyOwner {
    require(user != address(0), "Invalid address");
    require(user != address(this), "Cannot authorize contract itself");
    
    authorizedUsers[user] = true;
}
```

## 🛡️ 安全审计清单

### 合约层面
- [ ] 所有函数都有适当的访问控制
- [ ] 使用了重入攻击保护
- [ ] 输入参数得到充分验证
- [ ] 没有整数溢出/下溢风险
- [ ] 实现了紧急停止机制
- [ ] 事件日志记录完整

### 业务逻辑
- [ ] 奖励分发机制合理且公平
- [ ] 权限模型清楚且最小化
- [ ] 升级路径明确
- [ ] 资金管理安全可控

### 运营安全
- [ ] 多签钱包管理关键权限
- [ ] 监控异常交易和事件
- [ ] 定期备份重要数据
- [ ] 建立应急响应流程

## 🚨 已知风险与缓解措施

### 1. 中心化风险
**风险**: 合约所有者权限过大
**缓解措施**:
- 使用多签钱包管理所有者权限
- 实施时间锁延迟关键操作
- 考虑逐步去中心化治理

### 2. 奖励池耗尽
**风险**: 奖励代币用完导致系统停止
**缓解措施**:
- 实时监控奖励池余额
- 设置自动补充机制
- 实施动态奖励调整

### 3. Gas价格波动
**风险**: 高Gas费影响用户体验
**缓解措施**:
- 优化合约Gas使用
- 使用Layer 2方案
- 提供Gas费补贴

### 4. 智能合约漏洞
**风险**: 代码漏洞导致资金损失
**缓解措施**:
- 专业安全审计
- 漏洞赏金计划
- 渐进式资金投入

## 🔍 监控和告警

### 关键指标监控
```javascript
// 余额监控
setInterval(async () => {
  const balance = await ydToken.methods.balanceOf(contractAddress).call();
  const balanceInEther = web3.utils.fromWei(balance, 'ether');
  
  if (parseFloat(balanceInEther) < MINIMUM_BALANCE_THRESHOLD) {
    sendAlert('奖励池余额不足');
  }
}, 60000); // 每分钟检查一次

// 异常活动监控
platform.events.RewardDistributed()
  .on('data', (event) => {
    const amount = web3.utils.fromWei(event.returnValues.amount, 'ether');
    if (parseFloat(amount) > LARGE_REWARD_THRESHOLD) {
      sendAlert(`大额奖励分发: ${amount} YD`);
    }
  });
```

### 日志记录
```javascript
// 重要操作日志
const logTransaction = (txHash, operation, user, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    transactionHash: txHash,
    operation: operation,
    user: user,
    details: details,
    blockNumber: null // 稍后更新
  };
  
  // 保存到安全日志存储
  saveToSecureLog(logEntry);
};

// 监控合约调用
const monitorContractCalls = () => {
  // 监控敏感函数调用
  ['setCourseReward', 'setTeacherAuthorization', 'mint'].forEach(methodName => {
    contracts.ydToken.events.allEvents({
      filter: { method: methodName }
    })
    .on('data', (event) => {
      logTransaction(
        event.transactionHash,
        methodName,
        event.returnValues.from || event.address,
        event.returnValues
      );
    });
  });
};
```

## ⚡ 紧急响应程序

### 1. 发现漏洞时
```javascript
// 立即暂停合约
await ydToken.pause({ from: owner });
await platform.pause({ from: owner });

// 通知所有用户
broadcastEmergencyNotice("系统维护中，请暂停所有操作");

// 评估风险和损失
assessDamageAndRisk();
```

### 2. 恶意行为检测
```javascript
// 检测异常模式
const detectAnomalies = async () => {
  // 检查是否有异常大量的奖励领取
  const recentRewards = await getRecentRewards(24); // 24小时内
  const totalRewards = recentRewards.reduce((sum, reward) => sum + reward.amount, 0);
  
  if (totalRewards > DAILY_REWARD_LIMIT) {
    await ydToken.pause({ from: owner });
    sendAlert('检测到异常奖励分发，系统已自动暂停');
  }
};
```

### 3. 资金提取程序
```javascript
// 紧急资金提取（仅限紧急情况）
async function emergencyWithdraw() {
  // 多重签名确认
  const signaturesRequired = await multiSigWallet.required();
  const currentSignatures = await multiSigWallet.getSignatureCount(withdrawTxId);
  
  if (currentSignatures >= signaturesRequired) {
    await ydToken.emergencyWithdrawTokens(
      await ydToken.balanceOf(ydToken.address),
      { from: owner }
    );
  }
}
```

## 📊 安全指标仪表板

建议监控以下指标：

### 技术指标
- 合约调用成功率
- 平均Gas使用量
- 交易确认时间
- 网络拥堵状态

### 业务指标
- 日活跃用户数
- 奖励分发速度
- 异常交易比例
- 资金池健康度

### 安全指标
- 失败交易数量
- 权限变更频率
- 大额转账监控
- 合约暂停事件

## 🔧 安全工具推荐

### 静态分析
- **Slither**: 自动化漏洞检测
- **MythX**: 专业安全分析平台
- **Securify**: ETH合约安全验证

### 测试工具
- **Echidna**: 模糊测试框架
- **Manticore**: 符号执行引擎
- **Truffle Security**: 集成安全检查

### 监控工具
- **OpenZeppelin Defender**: 合约监控和自动化
- **Forta**: 实时威胁检测
- **Tenderly**: 交易监控和调试

## 📞 安全事件上报

如发现安全问题，请立即：
1. 通过加密渠道联系安全团队
2. 提供详细的漏洞信息和影响评估
3. 等待团队响应，切勿公开披露
4. 配合团队进行漏洞修复和验证

**安全邮箱**: security@web3school.com
**PGP公钥**: [链接到公钥文件]

---

**记住**: 安全是一个持续的过程，需要定期审查和更新安全措施。
