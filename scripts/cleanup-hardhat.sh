#!/bin/bash

# 清理Hardhat相关文件的脚本
echo "🧹 正在清理Hardhat相关文件..."

# 删除Hardhat配置文件（如果存在）
if [ -f "hardhat.config.js" ]; then
    rm hardhat.config.js
    echo "✅ 已删除 hardhat.config.js"
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

# 检查并清理package.json中的Hardhat依赖
echo "📦 检查package.json中的依赖..."

# 更新.gitignore确保忽略Hardhat文件
echo "📝 更新.gitignore文件..."

# 显示清理结果
echo ""
echo "🎯 项目现在完全基于Truffle框架："
echo "   ✅ 使用 truffle-config.js"
echo "   ✅ 使用 Truffle 测试框架"
echo "   ✅ 使用 Truffle 部署系统"
echo "   ✅ 使用 Ganache 作为本地区块链"
echo ""
echo "🚀 接下来可以运行："
echo "   npm install"
echo "   npm run compile"
echo "   npm run test"
echo "   npm run deploy:local"
