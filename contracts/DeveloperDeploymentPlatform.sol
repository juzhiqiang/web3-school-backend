// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./YDToken.sol";

/**
 * @title DeveloperDeploymentPlatform
 * @dev 开发者部署平台合约
 */
contract DeveloperDeploymentPlatform is Ownable, ReentrancyGuard {
    YDToken public immutable ydToken;
    
    struct Developer {
        string name;
        string email;
        uint256 totalDeployments;
        uint256 totalRewards;
        bool isRegistered;
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
    }
    
    mapping(address => Developer) public registeredDevelopers;
    mapping(uint256 => Deployment) public deployments;
    
    uint256 public totalDeployments;
    uint256 public totalDevelopers;
    uint256 public totalRewardsDistributed;
    uint256 public constant BASE_REWARD = 50 * 10**18; // 50 YD
    
    event DeveloperRegistered(address indexed developer, string name);
    event DeploymentRecorded(
        uint256 indexed deploymentId,
        address indexed developer,
        string contractName,
        address contractAddress,
        uint256 reward
    );
    
    constructor(address _ydToken) {
        ydToken = YDToken(_ydToken);
    }
    
    function registerDeveloper(string calldata _name, string calldata _email) external {
        require(!registeredDevelopers[msg.sender].isRegistered, "Already registered");
        
        registeredDevelopers[msg.sender] = Developer({
            name: _name,
            email: _email,
            totalDeployments: 0,
            totalRewards: 0,
            isRegistered: true
        });
        
        totalDevelopers++;
        emit DeveloperRegistered(msg.sender, _name);
    }
    
    function recordDeployment(
        string calldata _contractName,
        address _contractAddress,
        string calldata _sourceCode,
        string calldata _description,
        uint256 _gasUsed
    ) external {
        require(registeredDevelopers[msg.sender].isRegistered, "Developer not registered");
        
        uint256 reward = calculateReward(_gasUsed);
        
        deployments[totalDeployments] = Deployment({
            developer: msg.sender,
            contractName: _contractName,
            contractAddress: _contractAddress,
            sourceCode: _sourceCode,
            description: _description,
            gasUsed: _gasUsed,
            reward: reward,
            timestamp: block.timestamp
        });
        
        registeredDevelopers[msg.sender].totalDeployments++;
        registeredDevelopers[msg.sender].totalRewards += reward;
        totalRewardsDistributed += reward;
        
        // 发放奖励
        ydToken.transfer(msg.sender, reward);
        
        emit DeploymentRecorded(totalDeployments, msg.sender, _contractName, _contractAddress, reward);
        totalDeployments++;
    }
    
    function calculateReward(uint256 _gasUsed) public pure returns (uint256) {
        // 基础奖励 + Gas使用量奖励（每10万Gas额外奖励10 YD）
        uint256 gasBonus = (_gasUsed / 100000) * 10 * 10**18;
        return BASE_REWARD + gasBonus;
    }
    
    function getPlatformStats() external view returns (
        uint256 _totalDeployments,
        uint256 _totalDevelopers,
        uint256 _totalRewardsDistributed
    ) {
        return (totalDeployments, totalDevelopers, totalRewardsDistributed);
    }
    
    function getDeveloperInfo(address _developer) external view returns (
        string memory name,
        string memory email,
        uint256 totalDeploymentsCount,
        uint256 totalRewardsEarned,
        bool isRegistered
    ) {
        Developer memory dev = registeredDevelopers[_developer];
        return (dev.name, dev.email, dev.totalDeployments, dev.totalRewards, dev.isRegistered);
    }
    
    function getDeployment(uint256 _deploymentId) external view returns (
        address developer,
        string memory contractName,
        address contractAddress,
        string memory description,
        uint256 gasUsed,
        uint256 reward,
        uint256 timestamp
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
            deployment.timestamp
        );
    }
    
    // 紧急提取函数（仅限所有者）
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = ydToken.balanceOf(address(this));
        ydToken.transfer(owner(), balance);
    }
}
