# Web3学校后端

[![许可证](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.21-blue.svg)](https://soliditylang.org/)
[![Truffle](https://img.shields.io/badge/Framework-Truffle-orange.svg)](https://trufflesuite.com/)

基于区块链的Web3教育平台后端基础设施，使用Truffle框架和Solidity智能合约构建。

[English](README.md) | 简体中文

## 🌟 特性

- **智能合约开发**: 基于Solidity的教育内容管理合约
- **Truffle框架**: 完整的以太坊应用开发环境
- **测试套件**: 全面的智能合约测试覆盖
- **部署脚本**: 不同网络的自动化部署脚本
- **模块化架构**: 合约、测试和部署的清晰分离

## 🛠️ 技术栈

- **智能合约**: Solidity ^0.8.21
- **开发框架**: Truffle Suite
- **测试框架**: Mocha & Chai (通过Truffle)
- **支持网络**: 以太坊、Polygon、BSC (可配置)
- **本地开发**: Ganache (本地区块链)

## 📋 前置条件

运行此项目前，请确保已安装以下工具:

- [Node.js](https://nodejs.org/) (v14.0.0 或更高版本)
- [npm](https://www.npmjs.com/) 或 [yarn](https://yarnpkg.com/)
- [Truffle](https://trufflesuite.com/) (`npm install -g truffle`)
- [Ganache](https://trufflesuite.com/ganache/) (用于本地开发)

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/juzhiqiang/web3-school-backend.git
cd web3-school-backend
```

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 3. 环境配置

在根目录创建 `.env` 文件:

```env
# 钱包配置
MNEMONIC="你的十二个单词助记词"

# 网络配置
INFURA_PROJECT_ID="你的infura项目ID"
ETHERSCAN_API_KEY="你的etherscan API密钥"

# 本地开发
GANACHE_URL="http://127.0.0.1:8545"
```

### 4. 启动本地区块链

```bash
# 启动Ganache (在新的终端窗口)
ganache-cli
# 或使用Ganache图形界面
```

### 5. 编译合约

```bash
truffle compile
```

### 6. 运行迁移

```bash
# 部署到本地网络
truffle migrate

# 部署到指定网络
truffle migrate --network goerli
```

### 7. 运行测试

```bash
truffle test
```

## 📂 项目结构

```
web3-school-backend/
├── contracts/              # 智能合约
│   └── .gitkeep
├── migrations/             # 部署脚本
│   └── .gitkeep
├── test/                   # 测试文件
│   └── .gitkeep
├── truffle-config.js       # Truffle配置文件
├── README.md              # 英文项目文档
├── README_CN.md           # 中文项目文档
└── .env.example           # 环境变量模板
```

## 📖 智能合约

### 核心合约 (开发中)

- **CourseManager.sol**: 管理教育课程和内容
- **StudentRegistry.sol**: 处理学生注册和学习进度追踪  
- **CertificateNFT.sol**: 发行完成证书NFT
- **TokenRewards.sol**: 管理成就奖励代币

### 合约接口

```solidity
// CourseManager接口示例
interface ICourseManager {
    function createCourse(string memory title, string memory description) external;
    function enrollStudent(uint256 courseId, address student) external;
    function markComplete(uint256 courseId, address student) external;
}
```

## 🧪 测试

运行测试套件确保所有合约正常工作:

```bash
# 运行所有测试
truffle test

# 运行指定测试文件
truffle test ./test/CourseManager.test.js

# 运行覆盖率测试
npm run test:coverage
```

## 🌐 网络配置

项目支持多个网络:

### 本地开发
- **Ganache**: 本地开发区块链
- **URL**: http://127.0.0.1:8545
- **网络ID**: 1337

### 测试网
- **Goerli**: 以太坊测试网
- **Mumbai**: Polygon测试网
- **BSC Testnet**: 币安智能链测试网

### 主网
- **Ethereum**: 以太坊生产网络
- **Polygon**: Polygon生产网络
- **BSC**: 币安智能链生产网络

## 📝 脚本命令

常用开发脚本:

```bash
# 编译合约
npm run compile

# 部署合约
npm run migrate

# 运行测试
npm run test

# 清理构建文件
npm run clean

# 在Etherscan上验证合约
npm run verify
```

## 🔐 安全性

- 所有合约遵循OpenZeppelin安全标准
- 生产环境建议定期进行安全审计
- 支持多重签名钱包管理员功能
- 完善的访问控制机制

## 📚 API文档

### 智能合约功能

#### CourseManager (课程管理)
- `createCourse(title, description)` - 创建新课程
- `enrollStudent(courseId, student)` - 学生注册课程
- `getStudentProgress(student, courseId)` - 获取学生进度

#### CertificateNFT (证书NFT)
- `issueCertificate(student, courseId)` - 发行完成证书
- `verifyCertificate(tokenId)` - 验证证书真实性

## 🤝 贡献

我们欢迎贡献！请查看我们的 [贡献指南](CONTRIBUTING.md) 了解详情。

### 开发流程

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 进行修改
4. 为新功能添加测试
5. 提交更改 (`git commit -m '添加了amazing功能'`)
6. 推送到分支 (`git push origin feature/amazing-feature`)
7. 创建 Pull Request

### 代码规范

- 遵循Solidity代码风格指南
- 使用清晰、描述性的变量名
- 添加全面的注释
- 保持测试覆盖率在90%以上

## 🔄 部署

### 测试网部署

```bash
# 部署到Goerli测试网
truffle migrate --network goerli

# 验证合约
truffle run verify ContractName --network goerli
```

### 主网部署

```bash
# 部署到主网 (请谨慎使用)
truffle migrate --network mainnet

# 验证合约
truffle run verify ContractName --network mainnet
```

## 📊 监控

- 合约事件和交易监控
- Gas使用优化
- 性能指标
- 错误跟踪和日志记录

## 🐛 故障排除

### 常见问题

1. **编译错误**
   - 检查Solidity版本兼容性
   - 确保所有依赖已安装

2. **迁移失败**  
   - 验证网络配置
   - 检查账户余额是否足够支付gas费用

3. **测试失败**
   - 重启Ganache
   - 使用 `truffle compile --all` 清理构建文件

## 📄 许可证

此项目基于MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 团队

- **项目负责人**: [juzhiqiang](https://github.com/juzhiqiang)
- **贡献者**: 查看 [贡献者列表](https://github.com/juzhiqiang/web3-school-backend/contributors)

## 🙋 支持

- **问题反馈**: [GitHub Issues](https://github.com/juzhiqiang/web3-school-backend/issues)
- **讨论**: [GitHub Discussions](https://github.com/juzhiqiang/web3-school-backend/discussions)
- **邮箱**: [联系邮箱]

## 🚦 开发路线图

### 第一阶段: 基础建设 (当前)
- ✅ 基本项目设置
- ✅ Truffle配置  
- 🔄 核心合约开发

### 第二阶段: 功能开发
- 📋 课程管理系统
- 📋 学生进度追踪
- 📋 NFT证书发行
- 📋 奖励代币集成

### 第三阶段: 高级功能  
- 📋 多语言支持
- 📋 高级分析
- 📋 移动应用集成
- 📋 DAO治理

## 🌍 多语言支持

- [English](README.md)
- [简体中文](README_CN.md)

---

**用❤️为Web3教育而构建**

更多信息请访问我们的 [文档](docs/) 或查看 [在线演示](https://web3-school-demo.com)