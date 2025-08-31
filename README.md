# Web3 School Backend

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.21-blue.svg)](https://soliditylang.org/)
[![Truffle](https://img.shields.io/badge/Framework-Truffle-orange.svg)](https://trufflesuite.com/)

A blockchain-based backend infrastructure for Web3 education platform, built with Truffle framework and Solidity smart contracts.

English | [简体中文](README_CN.md)

## 🌟 Features

- **Smart Contract Development**: Solidity-based contracts for educational content management
- **Truffle Framework**: Complete development environment for Ethereum-based applications
- **Testing Suite**: Comprehensive test coverage for all smart contracts
- **Migration Scripts**: Automated deployment scripts for different networks
- **Modular Architecture**: Clean separation of contracts, tests, and migrations

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity ^0.8.21
- **Framework**: Truffle Suite
- **Testing**: Mocha & Chai (via Truffle)
- **Networks**: Ethereum, Polygon, BSC (configurable)
- **Development**: Ganache (local blockchain)

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.0.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Truffle](https://trufflesuite.com/) (`npm install -g truffle`)
- [Ganache](https://trufflesuite.com/ganache/) (for local development)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/juzhiqiang/web3-school-backend.git
cd web3-school-backend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Wallet Configuration
MNEMONIC="your twelve word mnemonic phrase here"

# Network Configuration
INFURA_PROJECT_ID="your_infura_project_id"
ETHERSCAN_API_KEY="your_etherscan_api_key"

# Local Development
GANACHE_URL="http://127.0.0.1:8545"
```

### 4. Start Local Blockchain

```bash
# Start Ganache (in a separate terminal)
ganache-cli
# or use Ganache GUI
```

### 5. Compile Contracts

```bash
truffle compile
```

### 6. Run Migrations

```bash
# Deploy to local network
truffle migrate

# Deploy to specific network
truffle migrate --network goerli
```

### 7. Run Tests

```bash
truffle test
```

## 📂 Project Structure

```
web3-school-backend/
├── contracts/              # Smart contracts
│   └── .gitkeep
├── migrations/             # Deployment scripts
│   └── .gitkeep
├── test/                   # Test files
│   └── .gitkeep
├── truffle-config.js       # Truffle configuration
├── README.md              # Project documentation (English)
├── README_CN.md           # Project documentation (Chinese)
└── .env.example           # Environment variables template
```

## 📖 Smart Contracts

### Core Contracts (Coming Soon)

- **CourseManager.sol**: Manages educational courses and content
- **StudentRegistry.sol**: Handles student registration and progress tracking  
- **CertificateNFT.sol**: Issues completion certificates as NFTs
- **TokenRewards.sol**: Manages reward tokens for achievements

### Contract Interfaces

```solidity
// Example interface for CourseManager
interface ICourseManager {
    function createCourse(string memory title, string memory description) external;
    function enrollStudent(uint256 courseId, address student) external;
    function markComplete(uint256 courseId, address student) external;
}
```

## 🧪 Testing

Run the test suite to ensure all contracts work as expected:

```bash
# Run all tests
truffle test

# Run specific test file
truffle test ./test/CourseManager.test.js

# Run tests with coverage
npm run test:coverage
```

## 🌐 Network Configuration

The project supports multiple networks:

### Local Development
- **Ganache**: Local blockchain for development
- **URL**: http://127.0.0.1:8545
- **Network ID**: 1337

### Testnets
- **Goerli**: Ethereum testnet
- **Mumbai**: Polygon testnet
- **BSC Testnet**: Binance Smart Chain testnet

### Mainnets
- **Ethereum**: Production Ethereum network
- **Polygon**: Production Polygon network
- **BSC**: Production Binance Smart Chain

## 📝 Scripts

Common development scripts:

```bash
# Compile contracts
npm run compile

# Deploy contracts
npm run migrate

# Run tests
npm run test

# Clean build artifacts
npm run clean

# Verify contracts on Etherscan
npm run verify
```

## 🔐 Security

- All contracts follow OpenZeppelin security standards
- Regular security audits recommended for production
- Multi-signature wallet support for admin functions
- Comprehensive access control mechanisms

## 📚 API Documentation

### Smart Contract Functions

#### CourseManager
- `createCourse(title, description)` - Create new course
- `enrollStudent(courseId, student)` - Enroll student in course
- `getStudentProgress(student, courseId)` - Get student progress

#### CertificateNFT  
- `issueCertificate(student, courseId)` - Issue completion certificate
- `verifyCertificate(tokenId)` - Verify certificate authenticity

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Follow Solidity style guidelines
- Use clear, descriptive variable names
- Add comprehensive comments
- Maintain test coverage above 90%

## 🔄 Deployment

### Testnet Deployment

```bash
# Deploy to Goerli testnet
truffle migrate --network goerli

# Verify contracts
truffle run verify ContractName --network goerli
```

### Mainnet Deployment

```bash
# Deploy to mainnet (use with caution)
truffle migrate --network mainnet

# Verify contracts
truffle run verify ContractName --network mainnet
```

## 📊 Monitoring

- Contract events and transactions
- Gas usage optimization
- Performance metrics
- Error tracking and logging

## 🐛 Troubleshooting

### Common Issues

1. **Compilation Errors**
   - Check Solidity version compatibility
   - Ensure all dependencies are installed

2. **Migration Failures**  
   - Verify network configuration
   - Check account balance for gas fees

3. **Test Failures**
   - Restart Ganache
   - Clear build artifacts with `truffle compile --all`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: [juzhiqiang](https://github.com/juzhiqiang)
- **Contributors**: See [Contributors](https://github.com/juzhiqiang/web3-school-backend/contributors)

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/juzhiqiang/web3-school-backend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/juzhiqiang/web3-school-backend/discussions)
- **Email**: [Contact Email]

## 🚦 Roadmap

### Phase 1: Foundation (Current)
- ✅ Basic project setup
- ✅ Truffle configuration  
- 🔄 Core contract development

### Phase 2: Features
- 📋 Course management system
- 📋 Student progress tracking
- 📋 NFT certificate issuance
- 📋 Reward token integration

### Phase 3: Advanced Features  
- 📋 Multi-language support
- 📋 Advanced analytics
- 📋 Mobile app integration
- 📋 DAO governance

## 🌍 Language Support

- [English](README.md)
- [简体中文](README_CN.md)

---

**Made with ❤️ for Web3 Education**

For more information, visit our [documentation](docs/) or check out the [live demo](https://web3-school-demo.com).