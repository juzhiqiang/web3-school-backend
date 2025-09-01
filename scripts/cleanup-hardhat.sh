#!/bin/bash

echo "🧹 正在清理Hardhat相关文件并优化Truffle项目结构..."

# 删除Hardhat配置文件（如果存在）
if [ -f "hardhat.config.js" ]; then
    rm hardhat.config.js
    echo "✅ 已删除 hardhat.config.js"
else
    echo "ℹ️  hardhat.config.js 不存在"
fi

# 删除Hardhat相关的构建文件夹
if [ -d "cache/" ]; then
    rm -rf cache/
    echo "✅ 已删除 cache/ 目录"
fi

if [ -d "artifacts/" ]; then
    rm -rf artifacts/
    echo "✅ 已删除 artifacts/ 目录"
fi

echo ""
echo "📁 Truffle项目结构说明："
echo ""
echo "migrations/ - 合约部署脚本"
echo "  ├── 1_initial_migration.js     # 初始migration合约"
echo "  ├── 2_deploy_contracts.js      # 主要合约部署"
echo "  └── 3_setup_sample_data.js     # 部署后的初始数据设置"
echo ""
echo "scripts/ - 工具和维护脚本"  
echo "  ├── interact.js               # 合约交互演示"
echo "  ├── estimate-gas.js           # Gas消耗分析"
echo "  ├── verify-contracts.js       # 合约验证工具"
echo "  └── check-contract-size.js    # 合约大小检查"
echo ""
echo "🎯 关键区别："
echo "  • migrations/ = 合约部署管理（truffle migrate）"
echo "  • scripts/ = 部署后的工具和交互（truffle exec）"
echo ""
echo "✅ 项目现在完全基于Truffle框架，结构清晰明确！"
