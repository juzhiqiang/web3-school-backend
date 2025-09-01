/**
 * 检查合约字节码大小的工具脚本
 * 以太坊合约大小限制为24KB
 */

const fs = require('fs');
const path = require('path');

const CONTRACT_SIZE_LIMIT = 24 * 1024; // 24KB
const BUILD_DIR = './build/contracts';

function checkContractSize() {
  console.log('🔍 检查合约字节码大小...');
  console.log('=' = 50);
  
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ 构建目录不存在，请先编译合约');
    process.exit(1);
  }
  
  const contractFiles = fs.readdirSync(BUILD_DIR).filter(file => file.endsWith('.json'));
  let hasOversized = false;
  
  contractFiles.forEach(file => {
    const contractPath = path.join(BUILD_DIR, file);
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    // 跳过抽象合约和接口
    if (!contractArtifact.bytecode || contractArtifact.bytecode === '0x') {
      return;
    }
    
    const bytecodeSize = (contractArtifact.bytecode.length - 2) / 2; // 减去0x前缀，除以2得到字节数
    const contractName = contractArtifact.contractName;
    const sizeInKB = (bytecodeSize / 1024).toFixed(2);
    const percentage = ((bytecodeSize / CONTRACT_SIZE_LIMIT) * 100).toFixed(1);
    
    let status = '✅';
    if (bytecodeSize > CONTRACT_SIZE_LIMIT) {
      status = '❌';
      hasOversized = true;
    } else if (bytecodeSize > CONTRACT_SIZE_LIMIT * 0.9) {
      status = '⚠️';
    }
    
    console.log(`${status} ${contractName.padEnd(30)} ${sizeInKB.padStart(8)}KB (${percentage}%)`);
  });
  
  console.log('=' * 50);
  
  if (hasOversized) {
    console.log('❌ 发现超过大小限制的合约！');
    console.log('💡 优化建议：');
    console.log('   1. 移除未使用的代码和导入');
    console.log('   2. 优化数据结构');
    console.log('   3. 将复杂逻辑分解到多个合约');
    console.log('   4. 使用代理模式分离逻辑和存储');
    process.exit(1);
  } else {
    console.log('✅ 所有合约大小都在限制范围内');
  }
}

if (require.main === module) {
  checkContractSize();
}

module.exports = { checkContractSize };
