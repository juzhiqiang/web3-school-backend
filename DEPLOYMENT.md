# Web3 School 智能合约部署指南

## 🎯 概述

本指南详细说明如何部署 Web3 School 智能合约，**仅支持私钥部署方式**，确保最高安全性。

## 🔧 环境准备

### 1. 安装依赖

```bash
# 安装项目依赖
npm install

# 或使用 yarn
yarn install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

**必需配置项：**

```env
# 🔑 私钥部署 (必需)
PRIVATE_KEY=0x1234567890abcdef...  # 从 MetaMask 导出

# 🌐 RPC 节点 (选择其一)
INFURA_PROJECT_ID=your_infura_project_id
# 或
ALCHEMY_API_KEY=your_alchemy_api_key

# 🔍 合约验证 (可选)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. 私钥安全要求

⚠️ **重要安全提醒：**
- 私钥必须以 `0x` 开头
- 私钥长度必须为 66 个字符 (64 字符 + 0x)
- 永远不要将私钥提交到代码仓库
- 生产环境建议使用硬件钱包或多签钱包

### 4. 获取测试代币

**Sepolia 测试网：**
- 访问 [Sepolia Faucet](https://sepoliafaucet.com/)
- 输入您的钱包地址获取测试 ETH

## 🚀 部署流程

### 方式一：使用 Truffle (推荐)

```bash
# 编译合约
npm run compile

# 部署到本地网络
npm run deploy:local

# 部署到 Sepolia 测试网
npm run deploy:sepolia

# 部署到主网 (谨慎!)
npm run deploy:mainnet
```

### 方式二：使用私钥部署工具

```bash
# 部署到 Sepolia
npm run deploy:privatekey

# 部署到主网并验证
npm run deploy:privatekey:mainnet
```

### 方式三：使用 Truffle Dashboard (最安全)

```bash
# 启动 Truffle Dashboard
truffle dashboard

# 在浏览器中连接钱包，然后部署
npm run deploy:dashboard
```

## ✅ 验证部署

### 1. 验证部署是否成功

```bash
# 验证部署状态
npm run verify:deployment

# 验证并测试功能
npm run verify:deployment -- --test
```

### 2. 在区块链浏览器验证合约

```bash
# 验证所有合约
npm run verify:all

# 或单独验证
npm run verify:ydtoken
npm run verify:platform  
npm run verify:coursemanager
```

## 📊 部署后检查

部署完成后会生成 `deployments/{network}.json` 文件，包含：

```json
{
  "network": "sepolia",
  "timestamp": "2025-09-02T...",
  "deployer": "0x123...",
  "deploymentMethod": "private-key-only",
  "contracts": {
    "ydToken": "0xabc...",
    "platform": "0xdef...", 
    "courseManager": "0x789..."
  }
}
```

## 🔒 安全最佳实践

### 私钥管理
- **必须使用私钥部署** (不支持助记词)
- 使用环境变量存储敏感信息
- 生产环境推荐使用硬件钱包或多签钱包
- 定期轮换私钥提升安全性

### 部署前检查
```bash
# 检查账户余额
npm run check-balance

# 检查合约大小
npm run size-check

# 代码检查
npm run lint

# 运行测试
npm run test

# 检查覆盖率
npm run test:coverage
```

### 主网部署注意事项
- 确保有足够的 ETH 用于 Gas 费用
- 设置合理的 Gas 价格
- 使用 `skipDryRun: false` 进行模拟
- 部署后立即验证合约
- 考虑使用多签钱包管理合约

## 🛠️ 故障排除

### 常见问题

**1. "必须在 .env 文件中设置 PRIVATE_KEY"**
```bash
# 检查 .env 文件是否存在
ls -la .env

# 确保私钥格式正确
PRIVATE_KEY=0x1234567890abcdef...  # 必须包含 0x 前缀且为 66 字符
```

**2. "私钥必须以 0x 开头"**
```bash
# 错误格式
PRIVATE_KEY=1234567890abcdef...

# 正确格式
PRIVATE_KEY=0x1234567890abcdef...
```

**3. "insufficient funds for gas"**
```bash
# 检查账户余额
npm run check-balance

# 获取测试代币 (Sepolia)
# 访问 https://sepoliafaucet.com/

# 降低 Gas 价格
export GAS_PRICE_GWEI=15
```

**4. "nonce too low"**
```bash
# 重置 nonce (谨慎使用)
truffle migrate --reset --network sepolia
```

### 部署失败恢复

```bash
# 清理构建文件
npm run clean

# 重新编译
npm run compile

# 重新部署
npm run deploy:sepolia
```

## 📈 Gas 优化

### 优化策略
1. **编译器优化**：已在 `truffle-config.js` 中启用
2. **合约结构优化**：使用 `immutable` 和 `constant` 变量
3. **批量操作**：支持批量验证部署
4. **事件优化**：合理使用事件记录

### Gas 估算

```bash
# 估算部署 Gas 消耗
npm run estimate-gas

# 查看详细 Gas 报告
npm run test:gas
```

## 🔄 升级策略

### 合约升级准备
当前合约不支持升级，如需升级功能：

1. **部署新版本合约**
2. **迁移数据和权限**
3. **更新前端接口**
4. **通知用户更新**

### 代理合约升级 (可选)
如需支持合约升级，可考虑使用 OpenZeppelin 的升级插件：

```bash
npm install @openzeppelin/truffle-upgrades
```

## 📚 下一步

部署成功后可以：

1. **运行测试**: `npm run test`
2. **与合约交互**: `npm run interact:sepolia`
3. **监控合约**: 使用区块链浏览器
4. **集成前端**: 使用部署地址配置 DApp

## 🆘 获取帮助

- 查看 [Truffle 文档](https://trufflesuite.com/docs/)
- 访问 [OpenZeppelin 文档](https://docs.openzeppelin.com/)
- 提交 [GitHub Issues](https://github.com/juzhiqiang/web3-school-backend/issues)

---

**⚠️ 重要提醒**: 
- 仅支持私钥部署，不支持助记词
- 主网部署前请务必在测试网充分测试
- 生产环境建议使用硬件钱包或多签钱包
