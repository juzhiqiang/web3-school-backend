# Web3 学校智能合约后端

这是一个基于 **Truffle Framework** 的完整Web3教育平台智能合约系统，包含YD代币、开发者部署平台和课程管理功能。**仅支持私钥部署，确保最高安全性。**

## 🌟 功能特性

### YD代币 (YDToken)
- **ERC20标准代币**: 符合以太坊ERC20标准
- **教学奖励系统**: 支持课程完成奖励和平台部署奖励
- **权限管理**: 多层级授权系统，支持教师和平台授权
- **安全特性**: 包含暂停、燃烧等安全功能
- **供应量控制**: 最大供应量限制为10亿代币

### 开发者部署平台 (DeveloperDeploymentPlatform)
- **开发者注册**: 开发者身份验证和管理
- **合约部署记录**: 记录所有合约部署信息
- **自动奖励分发**: 基于Gas使用量的智能奖励计算
- **合约验证**: 合约验证和额外奖励机制
- **批量操作**: 支持批量验证提升效率
- **安全防护**: ReentrancyGuard + Pausable 双重保护

### 课程管理系统 (CourseManager)
- **课程创建**: 讲师可以创建结构化课程
- **学习进度跟踪**: 实时监控学生学习进度
- **前置课程管理**: 支持课程依赖关系
- **奖励机制**: 完成课程自动获得YD代币奖励
- **章节管理**: 支持课程章节的增删改查

## 🔑 安全部署特性

### 仅支持私钥部署
- ✅ **私钥部署**: 更高安全性，减少攻击面
- ✅ **格式验证**: 严格的私钥格式检查
- ✅ **错误诊断**: 详细的部署错误分析
- ❌ **不支持助记词**: 确保部署安全

### 部署安全检查
- 账户余额验证
- Gas 价格智能估算
- 网络连接状态检查
- 合约大小限制检查

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Truffle Framework

### 1. 安装和配置
```bash
# 克隆项目
git clone https://github.com/juzhiqiang/web3-school-backend.git
cd web3-school-backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 PRIVATE_KEY=0x你的私钥
```

### 2. 编译和部署
```bash
# 编译合约
npm run compile

# 检查账户余额
npm run check-balance

# 部署到测试网
npm run deploy:sepolia

# 验证部署
npm run verify:deployment
```

### 3. 测试和验证
```bash
# 运行测试
npm run test

# 验证合约代码
npm run verify:all
```

## 📝 部署方式

### 方式一：Truffle 原生部署 (推荐)
```bash
npm run deploy:sepolia    # Sepolia 测试网
npm run deploy:mainnet    # 以太坊主网
```

### 方式二：私钥部署工具
```bash
npm run deploy:privatekey              # 部署到 Sepolia
npm run deploy:privatekey:mainnet      # 部署到主网
```

### 方式三：Truffle Dashboard (最安全)
```bash
truffle dashboard         # 启动 Dashboard
npm run deploy:dashboard  # 使用浏览器钱包部署
```

## 🔧 配置说明

### 环境变量设置
```bash
# 复制环境变量模板
cp .env.example .env

# 必需配置项:
PRIVATE_KEY=0x你的私钥                    # 必须以0x开头，66字符长度
INFURA_PROJECT_ID=你的Infura项目ID        # 或使用 ALCHEMY_API_KEY
ETHERSCAN_API_KEY=你的Etherscan_API密钥   # 用于合约验证
```

### 支持的网络
- **本地开发**: development (localhost:8545), ganache (localhost:7545)
- **测试网**: Sepolia (推荐), Mumbai, Arbitrum Sepolia
- **主网**: Ethereum, Polygon, Arbitrum

## 📊 代币经济模型

### YD代币分配
- **总供应量**: 10亿 YD代币
- **平台奖励**: 1000万代币（主网）/ 10万代币（测试网）
- **课程奖励**: 500万代币（主网）/ 5万代币（测试网）
- **开发者奖励**: 根据贡献动态分配

### 奖励机制

#### 课程完成奖励
- Solidity基础：100 YD
- Web3 DApp开发：200 YD
- DeFi协议开发：300 YD

#### 合约部署奖励
- **基础奖励**: 50 YD代币
- **Gas奖励**: 每10万Gas额外5 YD
- **最大奖励**: 1000 YD代币上限

## 🎯 使用场景

### 开发者场景
1. **注册开发者账户**
2. **部署智能合约并记录**
3. **获得基于贡献的YD代币奖励**
4. **申请合约验证获得奖励发放**

### 学生场景
1. **注册感兴趣的课程**
2. **按进度学习课程内容**
3. **完成课程获得YD代币奖励**
4. **使用代币解锁高级课程**

### 讲师场景
1. **创建结构化课程内容**
2. **跟踪学生学习进度**
3. **管理课程章节和要求**
4. **获得教学贡献奖励**

## 🛠️ 开发工具

### 主要命令
```bash
# 编译和部署
npm run compile              # 编译合约
npm run deploy:sepolia       # 部署到Sepolia
npm run verify:deployment    # 验证部署状态

# 测试和质量
npm run test                 # 运行测试
npm run test:coverage        # 测试覆盖率
npm run lint                 # 代码检查

# 工具脚本  
npm run check-balance        # 检查账户余额
npm run size-check          # 检查合约大小
npm run estimate-gas        # Gas估算
```

### Truffle 命令
```bash
# 进入控制台
truffle console --network sepolia

# 手动部署
truffle migrate --network sepolia --reset

# 验证合约
truffle run verify YDToken --network sepolia
```

## 🔐 安全特性

- ✅ 基于OpenZeppelin的安全合约库
- ✅ 重入攻击防护 (ReentrancyGuard)
- ✅ 访问控制 (Ownable, 自定义权限)
- ✅ 整数溢出保护 (Solidity 0.8+)
- ✅ 紧急暂停机制 (Pausable)
- ✅ 完整的事件日志记录
- ✅ 私钥部署安全验证

## 🧪 测试覆盖

### 测试组件
- **YDToken**: 代币基础功能、权限管理、奖励分发
- **DeveloperDeploymentPlatform**: 开发者注册、部署记录、奖励计算
- **CourseManager**: 课程管理、学生注册、进度跟踪

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行覆盖率测试
npm run test:coverage

# Gas 消耗报告
npm run test:gas
```

## 📈 监控和分析

### 平台统计
- 总部署数量
- 注册开发者数量
- 已分发奖励总额
- 合约余额状态

### 学习数据
- 课程注册人数
- 完成率统计
- 奖励分发记录
- 学习进度分析

## 🛡️ 安全最佳实践

### 私钥安全
- 使用硬件钱包生成私钥
- 私钥必须以 `0x` 开头且为 66 字符长度
- 永远不要在代码中硬编码私钥
- 定期轮换私钥提升安全性

### 部署安全
- 测试网充分测试后再部署主网
- 主网部署前进行 dry run 模拟
- 使用合理的 Gas 价格避免抢跑
- 部署后立即验证合约源码

### 合约安全
- 启用编译器优化减少 Gas 消耗
- 使用事件记录重要操作
- 实现紧急暂停机制
- 定期进行安全审计

## 🤝 贡献指南

欢迎参与项目贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 开发流程
1. Fork 项目到您的GitHub账户
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目使用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🚀 快速启动命令

```bash
# 完整的开发环境设置
git clone https://github.com/juzhiqiang/web3-school-backend.git
cd web3-school-backend
npm install

# 配置私钥
cp .env.example .env
# 编辑 .env 设置 PRIVATE_KEY=0x你的私钥

# 部署到测试网
npm run compile
npm run deploy:sepolia
npm run verify:deployment
```

## 📚 文档资源

- **[部署指南](DEPLOYMENT.md)** - 详细部署说明
- **[API文档](docs/API.md)** - 智能合约API参考
- **[安全指南](docs/SECURITY.md)** - 安全最佳实践
- **[前端集成](docs/FRONTEND_INTEGRATION.md)** - Web3.js集成示例

## ⚡ 新手快速上手

```bash
# 第一次使用？一键设置开发环境
npm run setup:dev

# 已有私钥？直接部署测试
npm run start:sepolia
```

---

**🔐 Web3学校 - 私钥安全部署版** 

让区块链教育更简单、更安全！🎓✨

*基于 Truffle Framework 构建，仅支持私钥部署，提供最高安全保障*
