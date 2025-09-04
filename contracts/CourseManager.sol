// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./YDToken.sol";

/**
 * @title CourseManager - Web3课程管理合约
 * @dev 管理Web3开发课程和学生进度
 */
contract CourseManager is Ownable, ReentrancyGuard {
    YDToken public ydToken;
    
    // 课程结构（简化版 - 只存储核心信息）
    struct Course {
        string courseId;
        string uuid;            // 课程UUID
        string title;
        address instructor;     // 讲师地址
        uint256 rewardAmount;   // 完成奖励
        uint256 price;          // 课程价格（YD代币）
        bool isActive;          // 是否活跃
        uint256 createdTime;    // 创建时间
        uint256 totalEnrollments; // 总注册人数
        uint256 completionCount;   // 完成人数
    }
    
    // 学生进度结构
    struct StudentProgress {
        address student;
        string courseId;
        uint256 startTime;
        uint256 completionTime;
        uint256 progress; // 进度百分比 (0-100)
        bool isCompleted;
        bool rewardClaimed;
    }
    
    // 存储映射
    mapping(string => Course) public courses;
    mapping(address => mapping(string => StudentProgress)) public studentProgress;
    mapping(address => string[]) public studentCourses; // 学生注册的课程
    mapping(string => address[]) public courseStudents; // 课程的学生列表
    mapping(address => bool) public authorizedInstructors;
    mapping(address => string[]) public authorCourses; // 作者发布的课程UUID列表
    mapping(string => address) public courseAuthors; // UUID到作者的映射
    
    // 课程列表
    string[] public courseIds;
    
    // 事件定义
    event CourseCreated(string indexed courseId, string indexed uuid, string title, address instructor, uint256 price);
    event StudentEnrolled(address indexed student, string indexed courseId, uint256 pricePaid);
    event CourseCompleted(address indexed student, string indexed courseId, uint256 rewardAmount);
    event InstructorAuthorized(address indexed instructor, bool authorized);
    event CoursePublishReward(address indexed instructor, string indexed uuid, uint256 rewardAmount);
    
    constructor(address _ydTokenAddress) {
        ydToken = YDToken(_ydTokenAddress);
    }
    
    /**
     * @dev 授权/取消授权讲师
     */
    function setInstructorAuthorization(address instructor, bool authorized) public onlyOwner {
        authorizedInstructors[instructor] = authorized;
        emit InstructorAuthorized(instructor, authorized);
    }
    
    /**
     * @dev 创建新课程（简化版 - 只存储核心信息）
     */
    function createCourse(
        string memory courseId,
        string memory uuid,
        string memory title,
        uint256 rewardAmount,
        uint256 price
    ) public {
        require(
            authorizedInstructors[msg.sender] || msg.sender == owner(),
            "Only authorized instructors can create courses"
        );
        require(bytes(courseId).length > 0, "Course ID cannot be empty");
        require(bytes(uuid).length > 0, "UUID cannot be empty");
        require(bytes(courses[courseId].courseId).length == 0, "Course already exists");
        require(courseAuthors[uuid] == address(0), "UUID already exists");
        
        courses[courseId] = Course({
            courseId: courseId,
            uuid: uuid,
            title: title,
            instructor: msg.sender,
            rewardAmount: rewardAmount,
            price: price,
            isActive: true,
            createdTime: block.timestamp,
            totalEnrollments: 0,
            completionCount: 0
        });
        
        courseIds.push(courseId);
        authorCourses[msg.sender].push(uuid);
        courseAuthors[uuid] = msg.sender;
        
        // 发放课程发布奖励（1-10个随机YD代币）
        _rewardCoursePublisher(msg.sender, uuid);
        
        emit CourseCreated(courseId, uuid, title, msg.sender, price);
    }
    
    /**
     * @dev 学生注册课程（需要支付YD代币）
     */
    function enrollInCourse(string memory courseId) public nonReentrant {
        require(bytes(courses[courseId].courseId).length > 0, "Course does not exist");
        require(courses[courseId].isActive, "Course is not active");
        require(
            studentProgress[msg.sender][courseId].startTime == 0,
            "Already enrolled in this course"
        );
        
        // 处理课程费用支付
        uint256 coursePrice = courses[courseId].price;
        if (coursePrice > 0) {
            // 检查学生是否有足够的YD代币
            require(
                ydToken.balanceOf(msg.sender) >= coursePrice,
                "Insufficient YD tokens"
            );
            
            // 将YD代币转给课程讲师
            require(
                ydToken.transferFrom(msg.sender, courses[courseId].instructor, coursePrice),
                "Payment transfer failed"
            );
        }
        
        studentProgress[msg.sender][courseId] = StudentProgress({
            student: msg.sender,
            courseId: courseId,
            startTime: block.timestamp,
            completionTime: 0,
            progress: 0,
            isCompleted: false,
            rewardClaimed: false
        });
        
        studentCourses[msg.sender].push(courseId);
        courseStudents[courseId].push(msg.sender);
        
        // 增加注册人数
        courses[courseId].totalEnrollments++;
        
        emit StudentEnrolled(msg.sender, courseId, coursePrice);
    }
    
    /**
     * @dev 更新学生进度
     */
    function updateProgress(
        address student,
        string memory courseId,
        uint256 newProgress
    ) public {
        require(
            courses[courseId].instructor == msg.sender || msg.sender == owner(),
            "Only course instructor can update progress"
        );
        require(newProgress <= 100, "Progress cannot exceed 100%");
        require(
            studentProgress[student][courseId].startTime > 0,
            "Student not enrolled in this course"
        );
        require(
            !studentProgress[student][courseId].isCompleted,
            "Course already completed"
        );
        
        studentProgress[student][courseId].progress = newProgress;
        
        // 如果进度达到100%，标记为完成
        if (newProgress == 100) {
            _completeCourse(student, courseId);
        }
    }
    
    /**
     * @dev 完成课程
     */
    function _completeCourse(address student, string memory courseId) internal {
        studentProgress[student][courseId].isCompleted = true;
        studentProgress[student][courseId].completionTime = block.timestamp;
        
        // 增加完成人数
        courses[courseId].completionCount++;
        
        emit CourseCompleted(student, courseId, courses[courseId].rewardAmount);
    }
    
    /**
     * @dev 发放课程发布奖励
     */
    function _rewardCoursePublisher(address instructor, string memory uuid) internal {
        // 生成1-10之间的随机数
        uint256 randomReward = _generateRandomReward(uuid);
        
        // 转换为完整的代币数量（18位小数）
        uint256 rewardAmount = randomReward * 10**18;
        
        // 发放奖励（需要合约有足够余额）
        if (ydToken.balanceOf(address(this)) >= rewardAmount) {
            require(
                ydToken.transfer(instructor, rewardAmount),
                "Publisher reward transfer failed"
            );
            
            emit CoursePublishReward(instructor, uuid, randomReward);
        }
    }
    
    /**
     * @dev 生成1-10之间的随机奖励数量
     */
    function _generateRandomReward(string memory uuid) internal view returns (uint256) {
        // 使用多个因子生成伪随机数
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.difficulty,
            msg.sender,
            uuid,
            courseIds.length
        )));
        
        // 生成1-10之间的随机数 (1 + 0~9)
        return 1 + (randomHash % 10);
    }
    
    /**
     * @dev 领取课程完成奖励
     */
    function claimCourseReward(string memory courseId) public nonReentrant {
        require(
            studentProgress[msg.sender][courseId].isCompleted,
            "Course not completed"
        );
        require(
            !studentProgress[msg.sender][courseId].rewardClaimed,
            "Reward already claimed"
        );
        
        studentProgress[msg.sender][courseId].rewardClaimed = true;
        
        // 发放YD代币奖励
        uint256 rewardAmount = courses[courseId].rewardAmount;
        if (rewardAmount > 0) {
            require(
                ydToken.transfer(msg.sender, rewardAmount),
                "Reward transfer failed"
            );
        }
    }
    
    /**
     * @dev 获取课程信息（完整版本）
     */
    function getFullCourse(string memory courseId) public view returns (
        Course memory
    ) {
        return courses[courseId];
    }
    
    /**
     * @dev 获取课程基本信息
     */
    function getCourse(string memory courseId) public view returns (
        string memory title,
        address instructor,
        uint256 rewardAmount,
        uint256 price,
        bool isActive,
        uint256 createdTime
    ) {
        Course memory course = courses[courseId];
        return (
            course.title,
            course.instructor,
            course.rewardAmount,
            course.price,
            course.isActive,
            course.createdTime
        );
    }
    
    /**
     * @dev 获取课程统计信息
     */
    function getCourseStats(string memory courseId) public view returns (
        uint256 totalEnrollments,
        uint256 completionCount,
        uint256 completionRate, // 完成率（百分比）
        uint256 createdTime
    ) {
        Course memory course = courses[courseId];
        uint256 rate = course.totalEnrollments > 0 
            ? (course.completionCount * 100) / course.totalEnrollments 
            : 0;
        
        return (
            course.totalEnrollments,
            course.completionCount,
            rate,
            course.createdTime
        );
    }
    
    /**
     * @dev 获取学生进度
     */
    function getStudentProgress(address student, string memory courseId) public view returns (
        uint256 startTime,
        uint256 completionTime,
        uint256 progress,
        bool isCompleted,
        bool rewardClaimed
    ) {
        StudentProgress memory sp = studentProgress[student][courseId];
        return (
            sp.startTime,
            sp.completionTime,
            sp.progress,
            sp.isCompleted,
            sp.rewardClaimed
        );
    }
    
    /**
     * @dev 获取所有课程ID
     */
    function getAllCourseIds() public view returns (string[] memory) {
        return courseIds;
    }
    
    /**
     * @dev 获取学生的所有课程
     */
    function getStudentCourses(address student) public view returns (string[] memory) {
        return studentCourses[student];
    }
    
    /**
     * @dev 获取课程的所有学生
     */
    function getCourseStudents(string memory courseId) public view returns (address[] memory) {
        return courseStudents[courseId];
    }
    
    /**
     * @dev 更新课程状态
     */
    function updateCourseStatus(string memory courseId, bool isActive) public onlyOwner {
        require(bytes(courses[courseId].courseId).length > 0, "Course does not exist");
        courses[courseId].isActive = isActive;
    }
    
    /**
     * @dev 获取活跃课程数量
     */
    function getActiveCourseCount() public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < courseIds.length; i++) {
            if (courses[courseIds[i]].isActive) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev 获取讲师的课程数量
     */
    function getInstructorCourseCount(address instructor) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < courseIds.length; i++) {
            if (courses[courseIds[i]].instructor == instructor) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev 获取作者发布的所有课程UUID
     */
    function getAuthorCourses(address author) public view returns (string[] memory) {
        return authorCourses[author];
    }
    
    /**
     * @dev 根据UUID获取课程作者
     */
    function getCourseAuthor(string memory uuid) public view returns (address) {
        return courseAuthors[uuid];
    }
    
    /**
     * @dev 获取课程价格
     */
    function getCoursePrice(string memory courseId) public view returns (uint256) {
        return courses[courseId].price;
    }
    
    /**
     * @dev 为合约充值YD代币用于奖励发放（仅限所有者）
     */
    function fundContract(uint256 amount) public onlyOwner {
        require(
            ydToken.transferFrom(msg.sender, address(this), amount),
            "Fund transfer failed"
        );
    }
    
    /**
     * @dev 提取合约中的YD代币（仅限所有者）
     */
    function withdrawTokens(uint256 amount) public onlyOwner {
        require(
            ydToken.transfer(msg.sender, amount),
            "Withdrawal failed"
        );
    }
    
    /**
     * @dev 查看合约的YD代币余额
     */
    function getContractTokenBalance() public view returns (uint256) {
        return ydToken.balanceOf(address(this));
    }
}
