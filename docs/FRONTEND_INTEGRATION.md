# 前端集成指南

## Web3.js 集成示例

### 1. 连接钱包
```javascript
// 检查MetaMask是否已安装
if (typeof window.ethereum !== 'undefined') {
  const web3 = new Web3(window.ethereum);
  
  // 请求连接钱包
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  const accounts = await web3.eth.getAccounts();
  const currentAccount = accounts[0];
}
```

### 2. 合约实例化
```javascript
// 合约ABI和地址
const YD_TOKEN_ABI = [...]; // 从编译后的artifacts获取
const PLATFORM_ABI = [...];
const COURSE_MANAGER_ABI = [...];

const CONTRACT_ADDRESSES = {
  YD_TOKEN: "0x...",
  PLATFORM: "0x...",
  COURSE_MANAGER: "0x..."
};

// 创建合约实例
const ydToken = new web3.eth.Contract(YD_TOKEN_ABI, CONTRACT_ADDRESSES.YD_TOKEN);
const platform = new web3.eth.Contract(PLATFORM_ABI, CONTRACT_ADDRESSES.PLATFORM);
const courseManager = new web3.eth.Contract(COURSE_MANAGER_ABI, CONTRACT_ADDRESSES.COURSE_MANAGER);
```

### 3. 开发者功能
```javascript
// 注册开发者
async function registerDeveloper(name, email) {
  try {
    const result = await platform.methods.registerDeveloper(name, email)
      .send({ from: currentAccount });
    console.log('开发者注册成功:', result.transactionHash);
    return result;
  } catch (error) {
    console.error('注册失败:', error);
    throw error;
  }
}

// 记录合约部署
async function recordDeployment(contractName, contractAddress, sourceCode, description, gasUsed) {
  try {
    const result = await platform.methods.recordDeployment(
      contractName,
      contractAddress, 
      sourceCode,
      description,
      gasUsed
    ).send({ from: currentAccount });
    
    console.log('部署记录成功:', result.transactionHash);
    return result;
  } catch (error) {
    console.error('记录部署失败:', error);
    throw error;
  }
}

// 查看开发者信息
async function getDeveloperInfo(developerAddress) {
  const developer = await platform.methods.developers(developerAddress).call();
  const deploymentIds = await platform.methods.getDeveloperDeployments(developerAddress).call();
  
  return {
    ...developer,
    deploymentIds
  };
}
```

### 4. 学生功能
```javascript
// 注册课程
async function enrollInCourse(courseId) {
  try {
    const result = await courseManager.methods.enrollInCourse(courseId)
      .send({ from: currentAccount });
    console.log('课程注册成功:', result.transactionHash);
    return result;
  } catch (error) {
    console.error('注册课程失败:', error);
    throw error;
  }
}

// 查看学习进度
async function getStudentProgress(studentAddress, courseId) {
  const progress = await courseManager.methods.getStudentProgress(studentAddress, courseId).call();
  return {
    startTime: progress.startTime,
    completionTime: progress.completionTime,
    progress: progress.progress,
    isCompleted: progress.isCompleted,
    rewardClaimed: progress.rewardClaimed
  };
}

// 领取课程奖励
async function claimCourseReward(courseId) {
  try {
    const result = await courseManager.methods.claimCourseReward(courseId)
      .send({ from: currentAccount });
    console.log('奖励领取成功:', result.transactionHash);
    return result;
  } catch (error) {
    console.error('领取奖励失败:', error);
    throw error;
  }
}
```

### 5. 代币功能
```javascript
// 查看YD代币余额
async function getYDBalance(address) {
  const balance = await ydToken.methods.balanceOf(address).call();
  return web3.utils.fromWei(balance, 'ether');
}

// 转账YD代币
async function transferYD(toAddress, amount) {
  const amountWei = web3.utils.toWei(amount.toString(), 'ether');
  try {
    const result = await ydToken.methods.transfer(toAddress, amountWei)
      .send({ from: currentAccount });
    console.log('转账成功:', result.transactionHash);
    return result;
  } catch (error) {
    console.error('转账失败:', error);
    throw error;
  }
}
```

### 6. 事件监听
```javascript
// 监听课程完成事件
courseManager.events.CourseCompleted()
  .on('data', (event) => {
    const { student, courseId, rewardAmount } = event.returnValues;
    console.log(`学生 ${student} 完成了课程 ${courseId}，获得 ${web3.utils.fromWei(rewardAmount, 'ether')} YD奖励`);
  })
  .on('error', console.error);

// 监听合约部署事件
platform.events.ContractDeployed()
  .on('data', (event) => {
    const { deploymentId, developer, contractName, contractAddress } = event.returnValues;
    console.log(`开发者 ${developer} 部署了合约 ${contractName} (${contractAddress})`);
  })
  .on('error', console.error);

// 监听奖励发放事件
platform.events.RewardDistributed()
  .on('data', (event) => {
    const { developer, amount, deploymentId } = event.returnValues;
    console.log(`开发者 ${developer} 获得 ${web3.utils.fromWei(amount, 'ether')} YD奖励`);
  })
  .on('error', console.error);
```

## React 组件示例

### 开发者仪表板组件
```jsx
import React, { useState, useEffect } from 'react';

function DeveloperDashboard({ web3, contracts, account }) {
  const [deployments, setDeployments] = useState([]);
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    loadDeveloperData();
  }, [account]);

  const loadDeveloperData = async () => {
    try {
      const developer = await contracts.platform.methods.developers(account).call();
      const deploymentIds = await contracts.platform.methods.getDeveloperDeployments(account).call();
      
      const deploymentDetails = await Promise.all(
        deploymentIds.map(id => 
          contracts.platform.methods.getDeploymentDetails(id).call()
        )
      );
      
      setDeployments(deploymentDetails);
      setTotalRewards(web3.utils.fromWei(developer.totalRewards, 'ether'));
    } catch (error) {
      console.error('加载开发者数据失败:', error);
    }
  };

  return (
    <div className="developer-dashboard">
      <h2>开发者仪表板</h2>
      <div className="stats">
        <div>总部署数: {deployments.length}</div>
        <div>总奖励: {totalRewards} YD</div>
      </div>
      
      <div className="deployments">
        <h3>我的部署</h3>
        {deployments.map((deployment, index) => (
          <div key={index} className="deployment-card">
            <h4>{deployment.contractName}</h4>
            <p>地址: {deployment.contractAddress}</p>
            <p>Gas使用: {deployment.gasUsed}</p>
            <p>奖励: {web3.utils.fromWei(deployment.rewardAmount, 'ether')} YD</p>
            <p>状态: {deployment.isVerified ? '已验证' : '待验证'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 学生学习组件
```jsx
import React, { useState, useEffect } from 'react';

function StudentDashboard({ web3, contracts, account }) {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    loadCoursesData();
  }, [account]);

  const loadCoursesData = async () => {
    try {
      const courseIds = await contracts.courseManager.methods.getAllCourseIds().call();
      
      const courseDetails = await Promise.all(
        courseIds.map(async (courseId) => {
          const course = await contracts.courseManager.methods.getCourse(courseId).call();
          const progress = await contracts.courseManager.methods.getStudentProgress(account, courseId).call();
          
          return {
            id: courseId,
            ...course,
            progress: progress
          };
        })
      );
      
      setCourses(courseDetails);
      setEnrolledCourses(courseDetails.filter(course => course.progress.startTime > 0));
    } catch (error) {
      console.error('加载课程数据失败:', error);
    }
  };

  const enrollInCourse = async (courseId) => {
    try {
      await contracts.courseManager.methods.enrollInCourse(courseId)
        .send({ from: account });
      await loadCoursesData(); // 重新加载数据
    } catch (error) {
      console.error('注册课程失败:', error);
    }
  };

  const claimReward = async (courseId) => {
    try {
      await contracts.courseManager.methods.claimCourseReward(courseId)
        .send({ from: account });
      await loadCoursesData(); // 重新加载数据
    } catch (error) {
      console.error('领取奖励失败:', error);
    }
  };

  return (
    <div className="student-dashboard">
      <h2>学生仪表板</h2>
      
      <div className="enrolled-courses">
        <h3>我的课程</h3>
        {enrolledCourses.map(course => (
          <div key={course.id} className="course-card">
            <h4>{course.title}</h4>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${course.progress.progress}%`}}
              ></div>
            </div>
            <p>进度: {course.progress.progress}%</p>
            {course.progress.isCompleted && !course.progress.rewardClaimed && (
              <button onClick={() => claimReward(course.id)}>
                领取 {web3.utils.fromWei(course.rewardAmount, 'ether')} YD 奖励
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="available-courses">
        <h3>可用课程</h3>
        {courses.filter(course => course.progress.startTime === '0').map(course => (
          <div key={course.id} className="course-card">
            <h4>{course.title}</h4>
            <p>{course.description}</p>
            <p>奖励: {web3.utils.fromWei(course.rewardAmount, 'ether')} YD</p>
            <button onClick={() => enrollInCourse(course.id)}>
              注册课程
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 错误处理最佳实践

### 1. 用户友好的错误信息
```javascript
const ERROR_MESSAGES = {
  'execution reverted: Developer already registered': '开发者已注册',
  'execution reverted: Course not completed': '课程尚未完成',
  'execution reverted: Reward already claimed': '奖励已经领取',
  'execution reverted: Only authorized teachers can reward': '只有授权教师可以发放奖励'
};

function handleContractError(error) {
  const message = error.message;
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return value;
    }
  }
  return '操作失败，请检查网络连接和账户权限';
}
```

### 2. 交易状态跟踪
```javascript
async function executeTransaction(contractMethod, successMessage) {
  try {
    // 显示加载状态
    setLoading(true);
    setStatus('交易发送中...');
    
    const result = await contractMethod;
    
    setStatus('等待交易确认...');
    
    // 等待交易确认
    const receipt = await web3.eth.getTransactionReceipt(result.transactionHash);
    
    if (receipt.status) {
      setStatus(successMessage);
      setTimeout(() => setStatus(''), 3000);
    } else {
      throw new Error('交易执行失败');
    }
    
    return result;
  } catch (error) {
    setStatus(handleContractError(error));
  } finally {
    setLoading(false);
  }
}
```

## 性能优化

### 1. 批量数据加载
```javascript
// 使用Promise.all并行加载数据
const loadDashboardData = async () => {
  const [
    platformStats,
    userBalance,
    userCourses
  ] = await Promise.all([
    platform.methods.getPlatformStats().call(),
    ydToken.methods.balanceOf(account).call(),
    courseManager.methods.getStudentCourses(account).call()
  ]);
  
  return { platformStats, userBalance, userCourses };
};
```

### 2. 事件过滤
```javascript
// 只监听相关用户的事件
const listenToUserEvents = () => {
  // 监听当前用户的奖励事件
  platform.events.RewardDistributed({
    filter: { developer: account },
    fromBlock: 'latest'
  })
  .on('data', handleRewardEvent)
  .on('error', console.error);
  
  // 监听当前用户的课程完成事件
  courseManager.events.CourseCompleted({
    filter: { student: account },
    fromBlock: 'latest'
  })
  .on('data', handleCourseCompletedEvent)
  .on('error', console.error);
};
```

## 移动端适配

### 1. WalletConnect 集成
```javascript
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

const connector = new WalletConnect({
  bridge: "https://bridge.walletconnect.org",
  qrcodeModal: QRCodeModal,
});

// 连接移动钱包
if (!connector.connected) {
  connector.createSession();
}
```

### 2. 响应式界面
确保在移动设备上提供良好的用户体验：
- 简化的操作流程
- 清晰的状态反馈
- 适配触屏操作
- 优化加载时间

这个完整的 Web3 学校智能合约系统现在已经准备就绪！系统包含了：

## 📋 已完成的组件

✅ **YD代币合约** - 完整的ERC20代币，支持教学奖励
✅ **开发者部署平台** - 记录部署、分发奖励的完整系统  
✅ **课程管理系统** - 课程创建、进度跟踪、奖励分发
✅ **部署脚本** - 自动化部署和配置
✅ **测试套件** - 全面的合约测试
✅ **文档系统** - API文档、部署指南、前端集成示例

## 🚀 下一步操作

您现在可以：
1. **本地测试**: `npm install && npm run deploy:local && npm run test`
2. **部署到测试网**: 配置 `.env` 文件后运行 `npm run deploy`
3. **开发前端**: 参考 `docs/FRONTEND_INTEGRATION.md` 构建用户界面
4. **添加更多功能**: 基于现有架构扩展新特性

整个系统已经实现了完整的Web3教育平台功能，包括代币经济、开发者激励和学习进度管理。所有合约都经过了精心设计，包含了安全机制和权限控制。
