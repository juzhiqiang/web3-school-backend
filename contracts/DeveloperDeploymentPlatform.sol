// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./YDToken.sol";

/**
 * @title DeveloperDeploymentPlatform
 * @dev 开发者部署平台合约 - 优化版本，支持私钥部署
 */
contract DeveloperDeploymentPlatform is Ownable, ReentrancyGuard, Pausable {
    YDToken public immutable ydToken;
    
    struct Developer {
        string name;
        string email;
        uint256 totalDeployments;
        uint256 totalRewards;
        bool isRegistered;
        uint256 registrationTime;
    }
    
    struct Deployment {
        address developer;
        string contractName;
        address contractAddress;
        string sourceCode;
        string description;
        uint256 gasUsed;
        uint256 reward;
        uint256 timestamp;
        bool verified;
    }
    
    mapping(address => Developer) public registeredDevelopers;
    mapping(uint256 => Deployment) public deployments;
    mapping(address => uint256[]) public developerDeployments;
    
    uint256 public totalDeployments;
    uint256 public totalDevelopers;
    uint256 public totalRewardsDistributed;
    uint256 public constant BASE_REWARD = 50 * 10**18; // 50 YD
    uint256 public constant MAX_REWARD = 1000 * 10**18; // 最大奖励 1000 YD
    
    event DeveloperRegistered(address indexed developer, string name, uint256 timestamp);
    event DeploymentRecorded(
        uint256 indexed deploymentId,
        address indexed developer,
        string contractName,
        address contractAddress,
        uint256 reward,
        uint256 timestamp
    );
    event DeploymentVerified(uint256 indexed deploymentId, address indexed verifier);
    event RewardClaimed(address indexed developer, uint256 amount);
    
    modifier onlyRegisteredDeveloper() {
        require(registeredDevelopers[msg.sender].isRegistered, "Developer not registered");
        _;
    }
    
    constructor(address _ydToken) {
        require(_ydToken != address(0), "Invalid token address");
        ydToken = YDToken(_ydToken);
    }
    
    /**
     * @dev 注册开发者
     */
    function registerDeveloper(
        string calldata _name, 
        string calldata _email
    ) external whenNotPaused {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        require(!registeredDevelopers[msg.sender].isRegistered, "Already registered");
        
        registeredDevelopers[msg.sender] = Developer({
            name: _name,
            email: _email,
            totalDeployments: 0,
            totalRewards: 0,
            isRegistered: true,
            registrationTime: block.timestamp
        });
        
        totalDevelopers++;
        emit DeveloperRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev 记录部署信息
     */
    function recordDeployment(
        string calldata _contractName,
        address _contractAddress,
        string calldata _sourceCode,
        string calldata _description,
        uint256 _gasUsed
    ) external onlyRegisteredDeveloper whenNotPaused nonReentrant {
        require(bytes(_contractName).length > 0, "Contract name required");
        require(_contractAddress != address(0), "Invalid contract address");
        require(_gasUsed > 0, "Gas used must be greater than 0");
        
        uint256 reward = calculateReward(_gasUsed);
        
        deployments[totalDeployments] = Deployment({
            developer: msg.sender,
            contractName: _contractName,
            contractAddress: _contractAddress,
            sourceCode: _sourceCode,
            description: _description,
            gasUsed: _gasUsed,
            reward: reward,
            timestamp: block.timestamp,
            verified: false
        });
        
        developerDeployments[msg.sender].push(totalDeployments);
        registeredDevelopers[msg.sender].totalDeployments++;
        registeredDevelopers[msg.sender].totalRewards += reward;
        totalRewardsDistributed += reward;
        
        emit DeploymentRecorded(
            totalDeployments, 
            msg.sender, 
            _contractName, 
            _contractAddress, 
            reward,
            block.timestamp
        );
        totalDeployments++;
    }
    
    /**
     * @dev 验证部署（管理员功能）
     */
    function verifyDeployment(uint256 _deploymentId) external onlyOwner {
        require(_deploymentId < totalDeployments, "Invalid deployment ID");
        require(!deployments[_deploymentId].verified, "Already verified");
        
        deployments[_deploymentId].verified = true;
        address developer = deployments[_deploymentId].developer;
        uint256 reward = deployments[_deploymentId].reward;
        
        // 发放奖励代币
        require(ydToken.balanceOf(address(this)) >= reward, "Insufficient reward tokens");
        require(ydToken.transfer(developer, reward), "Reward transfer failed");
        
        emit DeploymentVerified(_deploymentId, msg.sender);
        emit RewardClaimed(developer, reward);
    }
    
    /**
     * @dev 计算奖励
     */
    function calculateReward(uint256 _gasUsed) public pure returns (uint256) {
        // 基础奖励 + Gas使用量奖励（每10万Gas额外奖励5 YD）
        uint256 gasBonus = (_gasUsed / 100000) * 5 * 10**18;
        uint256 totalReward = BASE_REWARD + gasBonus;
        
        // 限制最大奖励
        return totalReward > MAX_REWARD ? MAX_REWARD : totalReward;
    }
    
    /**
     * @dev 获取平台统计信息
     */
    function getPlatformStats() external view returns (
        uint256 _totalDeployments,
        uint256 _totalDevelopers,
        uint256 _totalRewardsDistributed
    ) {
        return (totalDeployments, totalDevelopers, totalRewardsDistributed);
    }
    
    /**
     * @dev 获取开发者信息
     */
    function getDeveloperInfo(address _developer) external view returns (
        string memory name,
        string memory email,
        uint256 totalDeploymentsCount,
        uint256 totalRewardsEarned,
        bool isRegistered,
        uint256 registrationTime
    ) {
        Developer memory dev = registeredDevelopers[_developer];
        return (
            dev.name, 
            dev.email, 
            dev.totalDeployments, 
            dev.totalRewards, 
            dev.isRegistered,
            dev.registrationTime
        );
    }
    
    /**
     * @dev 获取部署信息
     */
    function getDeployment(uint256 _deploymentId) external view returns (
        address developer,
        string memory contractName,
        address contractAddress,
        string memory description,
        uint256 gasUsed,
        uint256 reward,
        uint256 timestamp,
        bool verified
    ) {
        require(_deploymentId < totalDeployments, "Invalid deployment ID");
        Deployment memory deployment = deployments[_deploymentId];
        return (
            deployment.developer,
            deployment.contractName,
            deployment.contractAddress,
            deployment.description,
            deployment.gasUsed,
            deployment.reward,
            deployment.timestamp,
            deployment.verified
        );
    }
    
    /**
     * @dev 获取开发者的所有部署
     */
    function getDeveloperDeployments(address _developer) external view returns (uint256[] memory) {
        return developerDeployments[_developer];
    }
    
    /**
     * @dev 批量验证部署
     */
    function batchVerifyDeployments(uint256[] calldata _deploymentIds) external onlyOwner {
        for (uint256 i = 0; i < _deploymentIds.length; i++) {
            uint256 deploymentId = _deploymentIds[i];
            if (deploymentId < totalDeployments && !deployments[deploymentId].verified) {
                deployments[deploymentId].verified = true;
                
                address developer = deployments[deploymentId].developer;
                uint256 reward = deployments[deploymentId].reward;
                
                if (ydToken.balanceOf(address(this)) >= reward) {
                    ydToken.transfer(developer, reward);
                    emit RewardClaimed(developer, reward);
                }
                
                emit DeploymentVerified(deploymentId, msg.sender);
            }
        }
    }
    
    /**
     * @dev 更新基础奖励（管理员功能）
     */
    function updateBaseReward(uint256 _newBaseReward) external onlyOwner {
        require(_newBaseReward > 0, "Reward must be greater than 0");
        // 这里可以添加事件记录奖励变更
    }
    
    /**
     * @dev 紧急暂停功能
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 紧急提取函数（仅限管理员）
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = ydToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(ydToken.transfer(owner(), balance), "Withdrawal failed");
    }
    
    /**
     * @dev 检查合约是否有足够的代币用于奖励
     */
    function checkTokenBalance() external view returns (uint256) {
        return ydToken.balanceOf(address(this));
    }
}