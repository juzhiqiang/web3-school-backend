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
    
    // 课程详细信息结构（简化版）
    struct CourseMetadata {
        string imageUrl;        // 课程封面图片
        string category;        // 课程分类
        string difficulty;      // 难度级别
        uint256 estimatedHours; // 预计学习时间
    }
    
    // 课程结构
    struct Course {
        string courseId;
        string title;
        string description;
        address instructor;
        uint256 rewardAmount;
        uint256 duration; // 课程时长（秒）
        bool isActive;
        uint256 createdTime;
        string[] prerequisites; // 前置课程要求
        CourseMetadata metadata; // 扩展的课程信息
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
    
    // 课程章节结构
    struct Lesson {
        string lessonId;
        string courseId;
        string title;
        string content;
        uint256 order;
        bool isActive;
    }
    
    // 存储映射
    mapping(string => Course) public courses;
    mapping(address => mapping(string => StudentProgress)) public studentProgress;
    mapping(string => Lesson[]) public courseLessons;
    mapping(address => string[]) public studentCourses; // 学生注册的课程
    mapping(string => address[]) public courseStudents; // 课程的学生列表
    mapping(address => bool) public authorizedInstructors;
    
    // 课程列表
    string[] public courseIds;
    
    // 事件定义
    event CourseCreated(string indexed courseId, string title, address instructor);
    event StudentEnrolled(address indexed student, string indexed courseId);
    event CourseCompleted(address indexed student, string indexed courseId, uint256 rewardAmount);
    event InstructorAuthorized(address indexed instructor, bool authorized);
    event CourseMetadataUpdated(string indexed courseId, address updatedBy);
    
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
     * @dev 创建新课程（增强版本，包含详细信息）
     */
    function createCourse(
        string memory courseId,
        string memory title,
        string memory description,
        uint256 rewardAmount,
        uint256 duration,
        string[] memory prerequisites,
        CourseMetadata memory metadata
    ) public {
        require(
            authorizedInstructors[msg.sender] || msg.sender == owner(),
            "Only authorized instructors can create courses"
        );
        require(bytes(courseId).length > 0, "Course ID cannot be empty");
        require(bytes(courses[courseId].courseId).length == 0, "Course already exists");
        
        courses[courseId] = Course({
            courseId: courseId,
            title: title,
            description: description,
            instructor: msg.sender,
            rewardAmount: rewardAmount,
            duration: duration,
            isActive: true,
            createdTime: block.timestamp,
            prerequisites: prerequisites,
            metadata: metadata,
            totalEnrollments: 0,
            completionCount: 0
        });
        
        courseIds.push(courseId);
        
        emit CourseCreated(courseId, title, msg.sender);
    }
    
    /**
     * @dev 创建简化课程（向后兼容）
     */
    function createSimpleCourse(
        string memory courseId,
        string memory title,
        string memory description,
        uint256 rewardAmount,
        uint256 duration,
        string[] memory prerequisites
    ) public {
        // 创建空的元数据
        CourseMetadata memory emptyMetadata = CourseMetadata({
            imageUrl: "",
            category: "",
            difficulty: "",
            estimatedHours: 0
        });
        
        createCourse(courseId, title, description, rewardAmount, duration, prerequisites, emptyMetadata);
    }
    
    /**
     * @dev 添加课程章节
     */
    function addLesson(
        string memory courseId,
        string memory lessonId,
        string memory title,
        string memory content,
        uint256 order
    ) public {
        require(bytes(courses[courseId].courseId).length > 0, "Course does not exist");
        require(
            courses[courseId].instructor == msg.sender || msg.sender == owner(),
            "Only course instructor can add lessons"
        );
        
        courseLessons[courseId].push(Lesson({
            lessonId: lessonId,
            courseId: courseId,
            title: title,
            content: content,
            order: order,
            isActive: true
        }));
    }
    
    /**
     * @dev 学生注册课程
     */
    function enrollInCourse(string memory courseId) public {
        require(bytes(courses[courseId].courseId).length > 0, "Course does not exist");
        require(courses[courseId].isActive, "Course is not active");
        require(
            studentProgress[msg.sender][courseId].startTime == 0,
            "Already enrolled in this course"
        );
        
        // 检查前置课程要求
        string[] memory prerequisites = courses[courseId].prerequisites;
        for (uint256 i = 0; i < prerequisites.length; i++) {
            require(
                studentProgress[msg.sender][prerequisites[i]].isCompleted,
                "Prerequisites not completed"
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
        
        emit StudentEnrolled(msg.sender, courseId);
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
     * @dev 获取课程基本信息（向后兼容）
     */
    function getCourse(string memory courseId) public view returns (
        string memory title,
        string memory description,
        address instructor,
        uint256 rewardAmount,
        uint256 duration,
        bool isActive
    ) {
        Course memory course = courses[courseId];
        return (
            course.title,
            course.description,
            course.instructor,
            course.rewardAmount,
            course.duration,
            course.isActive
        );
    }
    
    /**
     * @dev 获取课程元数据
     */
    function getCourseMetadata(string memory courseId) public view returns (
        CourseMetadata memory
    ) {
        return courses[courseId].metadata;
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
     * @dev 批量获取课程基本信息
     */
    function getMultipleCoursesBasic(string[] memory courseIdList) public view returns (
        string[] memory titles,
        bool[] memory isActiveList
    ) {
        titles = new string[](courseIdList.length);
        isActiveList = new bool[](courseIdList.length);
        
        for (uint256 i = 0; i < courseIdList.length; i++) {
            Course memory course = courses[courseIdList[i]];
            titles[i] = course.title;
            isActiveList[i] = course.isActive;
        }
    }
    
    /**
     * @dev 根据分类获取课程数量
     */
    function getCourseCountByCategory(string memory category) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < courseIds.length; i++) {
            if (keccak256(bytes(courses[courseIds[i]].metadata.category)) == keccak256(bytes(category))) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev 根据难度获取课程数量
     */
    function getCourseCountByDifficulty(string memory difficulty) public view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < courseIds.length; i++) {
            if (keccak256(bytes(courses[courseIds[i]].metadata.difficulty)) == keccak256(bytes(difficulty))) {
                count++;
            }
        }
        return count;
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
     * @dev 获取课程章节列表
     */
    function getCourseLessons(string memory courseId) public view returns (Lesson[] memory) {
        return courseLessons[courseId];
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
     * @dev 更新课程元数据
     */
    function updateCourseMetadata(
        string memory courseId,
        CourseMetadata memory newMetadata
    ) public {
        require(bytes(courses[courseId].courseId).length > 0, "Course does not exist");
        require(
            courses[courseId].instructor == msg.sender || msg.sender == owner(),
            "Only course instructor can update metadata"
        );
        
        courses[courseId].metadata = newMetadata;
        
        emit CourseMetadataUpdated(courseId, msg.sender);
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
     * @dev 检查学生是否有权限访问课程
     */
    function canAccessCourse(address student, string memory courseId) public view returns (bool) {
        // 检查课程是否存在且活跃
        if (bytes(courses[courseId].courseId).length == 0 || !courses[courseId].isActive) {
            return false;
        }
        
        // 检查前置课程要求
        string[] memory prerequisites = courses[courseId].prerequisites;
        for (uint256 i = 0; i < prerequisites.length; i++) {
            if (!studentProgress[student][prerequisites[i]].isCompleted) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev 获取推荐课程数量（基于学生完成的课程）
     */
    function getRecommendedCourseCount(address student) public view returns (uint256) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < courseIds.length; i++) {
            string memory courseId = courseIds[i];
            if (canAccessCourse(student, courseId) && 
                studentProgress[student][courseId].startTime == 0) {
                count++;
            }
        }
        
        return count;
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
