/**
 * Web3 School Backend - Truffle 配置
 *
 * 🔑 仅支持私钥部署方式 (安全性更高)
 * 支持部署方式:
 * 1. 私钥部署 - 设置 PRIVATE_KEY 环境变量
 * 2. Truffle Dashboard - 使用浏览器钱包
 *
 * 使用方法:
 * truffle migrate --network <network-name>
 */

require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

// 环境变量
const {
  PRIVATE_KEY, // 私钥 (必需)
  INFURA_PROJECT_ID, // Infura 项目ID
  ALCHEMY_API_KEY, // Alchemy API Key (备选)
  ETHERSCAN_API_KEY, // 合约验证
  GAS_PRICE_GWEI, // 自定义 Gas 价格
} = process.env;

/**
 * 创建钱包提供者 - 仅支持私钥
 */
function createProvider(rpcUrl) {
  if (!PRIVATE_KEY) {
    throw new Error("❌ 必须在 .env 文件中设置 PRIVATE_KEY");
  }

  return new HDWalletProvider(PRIVATE_KEY, rpcUrl);
}

/**
 * 获取 RPC URL
 */
function getRpcUrl(network, nodeProvider = "infura") {
  const urls = {
    infura: {
      sepolia: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      mainnet: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    },
    alchemy: {
      goerli: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      sepolia: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      mainnet: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
  };

  return urls[nodeProvider][network];
}

/**
 * 获取 Gas 价格
 */
function getGasPrice(defaultGwei) {
  if (GAS_PRICE_GWEI) {
    return parseInt(GAS_PRICE_GWEI) * 1000000000; // 转换为 wei
  }
  return defaultGwei * 1000000000;
}

module.exports = {
  /**
   * 网络配置
   */
  networks: {
    // Ganache GUI
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
      gas: 8000000,
      gasPrice: getGasPrice(20),
      confirmations: 0,
      timeoutBlocks: 200,
      skipDryRun: false,
    },

    // Sepolia 测试网 (推荐)
    sepolia: {
      provider: () => {
        const rpcUrl = getRpcUrl(
          "sepolia",
          ALCHEMY_API_KEY ? "alchemy" : "infura"
        );
        return createProvider(rpcUrl);
      },
      network_id: 11155111,
      gas: 6000000,
      gasPrice: getGasPrice(30),
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 1000000,
      deploymentPollingInterval: 15000,
    },

    // 以太坊主网 (生产环境)
    mainnet: {
      provider: () => {
        const rpcUrl = getRpcUrl(
          "mainnet",
          ALCHEMY_API_KEY ? "alchemy" : "infura"
        );
        return createProvider(rpcUrl);
      },
      network_id: 1,
      gas: 3000000,
      gasPrice: getGasPrice(50), // 50 gwei (根据网络情况调整)
      confirmations: 3,
      timeoutBlocks: 200,
      skipDryRun: false, // 主网必须进行 dry run
      networkCheckTimeout: 1000000,
      deploymentPollingInterval: 10000,
      production: true,
    },

    // Truffle Dashboard (推荐用于测试网/主网)
    dashboard: {
      port: 24012,
      networkCheckTimeout: 120000,
      timeoutBlocks: 200,
    },
  },

  // Mocha 测试配置
  mocha: {
    timeout: 100000,
    reporter: process.env.CI ? "json" : "spec",
    reporterOptions: process.env.CI
      ? { output: "test-results.json" }
      : undefined,
  },

  // Solidity 编译器配置
  compilers: {
    solc: {
      version: "0.8.21",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200, // 优化运行次数
          details: {
            yul: true,
            yulDetails: {
              stackAllocation: true,
              optimizerSteps: "dhfoDgvulfnTUtnIf",
            },
          },
        },
        evmVersion: "london",
        viaIR: false, // 设为 false 避免某些网络的兼容性问题
        metadata: {
          bytecodeHash: "ipfs",
        },
        outputSelection: {
          "*": {
            "*": [
              "evm.bytecode",
              "evm.deployedBytecode",
              "devdoc",
              "userdoc",
              "metadata",
              "abi",
            ],
          },
        },
      },
    },
  },

  // 插件配置
  plugins: [
    "truffle-plugin-verify",
    "solidity-coverage",
    "truffle-contract-size",
  ],

  // 合约验证 API Keys
  api_keys: {
    etherscan: ETHERSCAN_API_KEY,
    bscscan: process.env.BSCSCAN_API_KEY,
    polygonscan: process.env.POLYGONSCAN_API_KEY,
    arbiscan: process.env.ARBISCAN_API_KEY,
    optimistic_etherscan: process.env.OPTIMISTIC_ETHERSCAN_API_KEY,
  },

  // 目录配置
  contracts_directory: "./contracts/",
  contracts_build_directory: "./build/contracts/",
  migrations_directory: "./migrations/",
  test_directory: "./test/",

  // Truffle DB 配置
  db: {
    enabled: false,
    host: "127.0.0.1",
    port: 9090,
    adapter: {
      name: "sqlite",
      settings: {
        directory: ".db",
      },
    },
  },

  // 仪表板配置
  dashboard: {
    port: 24012,
    host: "localhost",
  },
};
