/**
 * 初始化迁移脚本
 * Truffle 框架需要这个文件来跟踪迁移状态
 */

const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};
