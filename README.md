# Web3 学校智能合约后端

这是一个基于 **Truffle Framework** 的完整Web3教育平台智能合约系统，包含YD代币、开发者部署平台和课程管理功能。

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
- **统计分析**: 平台使用数据和开发者排行

### 课程管理系统 (CourseManager)
- **课程创建**: 讲师可以创建结构化课程
- **学习进度跟踪**: 实时监控学生学习进度
- **前置课程管理**: 支持课程依赖关系
- **奖励机制**: 完成课程自动获得YD代币奖励
- **章节管理**: 支持课程章节的增删改查

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Truffle Framework
- Ganache CLI (用于本地开发)

### 安装依赖
```bash
git clone https://github.com/juzhiqiang/web3-school-backend.git
cd web3-school-backend
npm install
```

### 编译合约
```bash
npm run compile
```

### 本地开发环境
```bash
# 启动Ganache (新终端窗口)
ganache-cli --deterministic --accounts 10

# 部署合约到本地网络
npm run deploy:local

# 运行交互脚本
npm run interact
```

### 运行测试
```bash
# 运行所有测试
npm run test

# 运行测试覆盖率
npm run test:coverage

# 运行特定测试
truffle test test/YDToken.test.js
```

## 📝 Truffle 框架说明

本项目完全基于 **Truffle Framework** 构建，这是以太坊智能合约开发的成熟框架：

### Truffle 优势
- 🔧 **成熟稳定**: 经过长期验证的开发框架
- 📦 **完整工具链**: 编译、部署、测试一体化
- 🌐 **多网络支持**: 轻松部署到各种网络
- 🧪 **强大测试**: 内置测试框架和断言库
- 📊 **调试工具**: 内置调试器和控制台

### 项目结构
```
web3-school-backend/
├── contracts/           # Solidity智能合约
├── migrations/          # Truffle部署脚本
├── test/               # Truffle测试文件
├── scripts/            # 自定义脚本
└── truffle-config.js   # Truffle配置文件
```

## 🔧 配置说明

### 环境变量设置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件添加:
INFURA_PROJECT_ID=你的Infura项目ID
MNEMONIC=你的钱包助记词
ETHERSCAN_API_KEY=你的Etherscan API密钥
```

### 支持的网络
- **本地开发**: Ganache (localhost:8545)
- **测试网**: Goerli, Sepolia
- **主网**: Ethereum Mainnet, Polygon, BSC

## 📊 代币经济模型

### YD代币分配
- **总供应量**: 10亿 YD代币
- **初始分配**: 1亿代币（可配置）
- **奖励池**: 1000万代币用于教学奖励
- **开发者奖励**: 根据贡献动态分配

### 奖励机制

#### 课程完成奖励
- Solidity基础：100 YD
- Web3开发：200 YD
- DeFi协议开发：300 YD
- NFT开发：250 YD

#### 合约部署奖励
- **基础奖励**: 10 YD代币
- **复杂度奖励**: 根据Gas使用量计算
- **验证奖励**: 5 YD代币（额外）

## 🎯 使用场景

### 开发者场景
1. **注册开发者账户**
2. **部署智能合约并记录**
3. **获得基于贡献的YD代币奖励**
4. **申请合约验证获得额外奖励**

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

### Truffle 命令
```bash
# 编译合约
truffle compile

# 部署到本地
truffle migrate --network development

# 进入Truffle控制台
truffle console --network development

# 运行测试
truffle test

# 验证合约
truffle run verify ContractName --network goerli
```

### 自定义脚本
```bash
# Gas消耗估算
npm run estimate-gas

# 合约大小检查
npm run size-check

# 代码质量检查
npm run lint

# 清理构建文件
npm run clean
```

## 📖 文档资源

- **[API文档](docs/API.md)** - 智能合约API参考
- **[部署指南](docs/DEPLOYMENT.md)** - 详细部署说明
- **[安全指南](docs/SECURITY.md)** - 安全最佳实践
- **[前端集成](docs/FRONTEND_INTEGRATION.md)** - Web3.js集成示例
- **[使用示例](docs/EXAMPLES.md)** - 完整使用案例
- **[Truffle指南](docs/TRUFFLE_GUIDE.md)** - Truffle框架详解

## 🔐 安全特性

- ✅ 基于OpenZeppelin的安全合约库
- ✅ 重入攻击防护 (ReentrancyGuard)
- ✅ 访问控制 (Ownable, 自定义权限)
- ✅ 整数溢出保护 (Solidity 0.8+)
- ✅ 紧急暂停机制 (Pausable)
- ✅ 完整的事件日志记录

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

# 运行特定合约测试
truffle test test/YDToken.test.js
truffle test test/DeveloperDeploymentPlatform.test.js
truffle test test/CourseManager.test.js
```

## 🌐 网络部署

### 本地开发
```bash
# 启动Ganache
ganache-cli --deterministic --accounts 10

# 部署到本地网络
npm run deploy:local
```

### 测试网部署
```bash
# 部署到Goerli测试网
npm run deploy

# 部署到Sepolia测试网
npm run deploy:sepolia

# 验证合约
npm run verify
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
# 完整的本地开发环境设置
git clone https://github.com/juzhiqiang/web3-school-backend.git
cd web3-school-backend
npm install
ganache-cli --deterministic --accounts 10 &
npm run deploy:local
npm run test
npm run interact
```

---

**Web3学校** - 让区块链教育更简单、更有趣！🎓✨

*基于 Truffle Framework 构建，提供稳定可靠的智能合约开发体验*
