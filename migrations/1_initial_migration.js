/**
 * 初始化迁移脚本
 * Truffle 框架要求的基础迁移文件
 */

const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  // 在本地开发环境中，Truffle 会自动处理 Migrations 合约
  // 在其他网络中，我们跳过 Migrations 合约的部署
  if (deployer.network === 'development' || deployer.network === 'ganache') {
    console.log("🔄 初始化 Truffle Migrations...");
    // Truffle 会自动部署 Migrations 合约到本地网络
  } else {
    console.log("⏭️ 跳过 Migrations 合约部署 (非本地网络)");
  }
};
