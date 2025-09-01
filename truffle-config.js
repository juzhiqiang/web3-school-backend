/**
 * Web3 School Backend - Truffle Configuration
 * 
 * 配置说明:
 * - development: 本地开发网络 (Ganache/Hardhat)
 * - goerli: Goerli 测试网络
 * - sepolia: Sepolia 测试网络
 * - mainnet: 以太坊主网
 */

require('dotenv').config();
const { MNEMONIC, INFURA_PROJECT_ID, ETHERSCAN_API_KEY } = process.env;

const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  /**
   * 网络配置
   * 使用方法: truffle migrate --network <network-name>
   */
  networks: {
    // Ganache GUI 默认配置
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
      gas: 8000000,
      gasPrice: 20000000000,
      confirmations: 0,
      timeoutBlocks: 200,
      skipDryRun: false
    },

    // Goerli 测试网
    goerli: {
      provider: () => new HDWalletProvider(
        MNEMONIC, 
        `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`
      ),
      network_id: 5,
      gas: 8000000,
      gasPrice: 10000000000, // 10 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 1000000,
      deploymentPollingInterval: 10000
    },

    // Sepolia 测试网
    sepolia: {
      provider: () => new HDWalletProvider(
        MNEMONIC, 
        `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`
      ),
      network_id: 11155111,
      gas: 8000000,
      gasPrice: 10000000000, // 10 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 1000000,
      deploymentPollingInterval: 10000
    },

    // 以太坊主网 (请谨慎使用!)
    mainnet: {
      provider: () => new HDWalletProvider(
        MNEMONIC, 
        `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
      ),
      network_id: 1,
      gas: 8000000,
      gasPrice: 30000000000, // 30 gwei (根据网络情况调整)
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: false, // 主网必须进行 dry run
      networkCheckTimeout: 1000000,
      deploymentPollingInterval: 10000,
      production: true
    },

    // Truffle Dashboard (推荐用于测试网/主网部署)
    dashboard: {
      port: 24012,
      networkCheckTimeout: 120000
    }
  },

  // Mocha 测试配置
  mocha: {
    timeout: 100000,
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 20,
      showTimeSpent: true,
      excludeContracts: ['Migrations']
    }
  },

  // Solidity 编译器配置
  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "london"
      }
    }
  },

  // 插件配置
  plugins: [
    'truffle-plugin-verify',
    'solidity-coverage'
  ],

  // 合约验证配置
  api_keys: {
    etherscan: ETHERSCAN_API_KEY,
    // bscscan: process.env.BSCSCAN_API_KEY,
    // polygonscan: process.env.POLYGONSCAN_API_KEY
  },

  // 目录配置
  contracts_directory: './contracts/',
  contracts_build_directory: './build/contracts/',
  migrations_directory: './migrations/',
  test_directory: './test/',

  // Truffle DB 配置 (暂时禁用)
  db: {
    enabled: false
  }
};
