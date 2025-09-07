#!/usr/bin/env node

/**
 * Truffle 自动部署脚本 - Node.js 版本
 * 功能：自动编译并部署到 sepolia 网络，失败后等待20秒重试
 * 
 * 使用方法：
 * node auto-deploy.js
 * 
 * 或者添加可执行权限后直接运行：
 * chmod +x auto-deploy.js
 * ./auto-deploy.js
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');

// 配置参数
const CONFIG = {
    maxAttempts: 100,        // 最大重试次数
    retryDelay: 120,         // 重试间隔（秒）
    timeout: 300,           // 命令超时时间（秒）
    network: 'sepolia'      // 部署网络
};

// 颜色定义（ANSI 转义码）
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

/**
 * 格式化时间戳
 */
function getTimestamp() {
    return new Date().toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * 日志函数
 */
const logger = {
    info: (message) => {
        console.log(`${colors.cyan}[INFO]${colors.reset} ${getTimestamp()} ${message}`);
    },
    success: (message) => {
        console.log(`${colors.green}[SUCCESS]${colors.reset} ${getTimestamp()} ${message}`);
    },
    error: (message) => {
        console.log(`${colors.red}[ERROR]${colors.reset} ${getTimestamp()} ${message}`);
    },
    warning: (message) => {
        console.log(`${colors.yellow}[WARNING]${colors.reset} ${getTimestamp()} ${message}`);
    }
};

/**
 * 检查前置条件
 */
async function checkPrerequisites() {
    logger.info('检查前置条件...');
    
    // 检查 truffle-config.js 文件
    if (!fs.existsSync('truffle-config.js')) {
        logger.error('未找到 truffle-config.js 文件，请确保在 Truffle 项目根目录运行此脚本');
        process.exit(1);
    }
    
    // 检查 truffle 命令是否可用
    try {
        await execCommand('truffle version', 5000);
        logger.success('Truffle 命令检查通过');
    } catch (error) {
        logger.error('未找到 truffle 命令或版本检查失败');
        logger.error('请确保已安装 Truffle: npm install -g truffle');
        process.exit(1);
    }
    
    logger.success('前置条件检查完成');
}

/**
 * 执行命令并返回 Promise
 */
function execCommand(command, timeout = CONFIG.timeout * 1000) {
    return new Promise((resolve, reject) => {
        logger.info(`执行命令: ${command}`);
        
        const child = exec(command, { 
            cwd: process.cwd(),
            timeout: timeout,
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data;
            // 实时输出编译/部署信息
            process.stdout.write(data);
        });
        
        child.stderr.on('data', (data) => {
            stderr += data;
            // 实时输出错误信息
            process.stderr.write(data);
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject(new Error(`命令执行失败，退出码: ${code}\n${stderr}`));
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
        
        // 超时处理
        setTimeout(() => {
            child.kill('SIGTERM');
            reject(new Error(`命令执行超时 (${timeout/1000}秒)`));
        }, timeout);
    });
}

/**
 * 编译合约
 */
async function compileContracts() {
    logger.info('开始编译合约...');
    
    try {
        await execCommand('truffle compile');
        logger.success('合约编译成功');
        return true;
    } catch (error) {
        logger.error(`合约编译失败: ${error.message}`);
        return false;
    }
}

/**
 * 部署合约
 */
async function deployContracts() {
    logger.info(`开始部署合约到 ${CONFIG.network} 网络...`);
    
    try {
        const result = await execCommand(`truffle migrate --reset --network ${CONFIG.network}`);
        logger.success('合约部署成功！');
        return true;
    } catch (error) {
        logger.error(`合约部署失败: ${error.message}`);
        return false;
    }
}

/**
 * 等待指定时间
 */
function sleep(seconds) {
    return new Promise(resolve => {
        let remaining = seconds;
        
        const countdown = setInterval(() => {
            process.stdout.write(`\r${colors.yellow}[WAITING]${colors.reset} 等待重试... ${remaining}秒 `);
            remaining--;
            
            if (remaining < 0) {
                clearInterval(countdown);
                process.stdout.write(`\r${colors.yellow}[WAITING]${colors.reset} 等待重试... 完成\n\n`);
                resolve();
            }
        }, 1000);
    });
}

/**
 * 主部署函数
 */
async function deployWithRetry() {
    let attempt = 1;
    
    logger.info('开始自动部署流程...');
    logger.info(`最大重试次数: ${CONFIG.maxAttempts}`);
    logger.info(`重试间隔: ${CONFIG.retryDelay}秒`);
    logger.info(`命令超时: ${CONFIG.timeout}秒`);
    console.log();
    
    while (attempt <= CONFIG.maxAttempts) {
        logger.info(`=== 第 ${attempt} 次部署尝试 ===`);
        
        try {
            // 编译合约
            const compileSuccess = await compileContracts();
            if (!compileSuccess) {
                logger.error('编译失败，停止部署');
                process.exit(1);
            }
            
            // 部署合约
            const deploySuccess = await deployContracts();
            if (deploySuccess) {
                logger.success('🎉 部署成功完成！');
                logger.info(`总共尝试了 ${attempt} 次`);
                process.exit(0);
            }
            
        } catch (error) {
            logger.error(`第 ${attempt} 次部署发生异常: ${error.message}`);
        }
        
        // 检查是否还能重试
        if (attempt < CONFIG.maxAttempts) {
            logger.warning(`第 ${attempt} 次部署失败，${CONFIG.retryDelay}秒后重试...`);
            console.log();
            
            // 等待重试
            await sleep(CONFIG.retryDelay);
            
            attempt++;
        } else {
            logger.error(`已达到最大重试次数 (${CONFIG.maxAttempts})，部署失败`);
            process.exit(1);
        }
    }
}

/**
 * 信号处理
 */
function setupSignalHandlers() {
    const cleanup = (signal) => {
        logger.warning(`\n收到 ${signal} 信号，正在清理...`);
        process.exit(signal === 'SIGINT' ? 130 : 1);
    };
    
    process.on('SIGINT', () => cleanup('SIGINT'));
    process.on('SIGTERM', () => cleanup('SIGTERM'));
}

/**
 * 主函数
 */
async function main() {
    console.log('======================================');
    console.log('    Truffle 自动部署脚本启动');
    console.log(`    网络: ${CONFIG.network}`);
    console.log(`    重试间隔: ${CONFIG.retryDelay}秒`);
    console.log('======================================');
    console.log();
    
    // 设置信号处理
    setupSignalHandlers();
    
    try {
        // 检查前置条件
        await checkPrerequisites();
        
        // 开始部署
        await deployWithRetry();
        
    } catch (error) {
        logger.error(`脚本执行失败: ${error.message}`);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        logger.error(`未捕获的异常: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    deployWithRetry,
    compileContracts,
    deployContracts,
    checkPrerequisites
};