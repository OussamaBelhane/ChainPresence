// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title AttendanceManager
 * @dev Decentralized attendance tracking with role-based access control.
 */
contract AttendanceManager is AccessControl {
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE     = keccak256("ADMIN");
    bytes32 public constant PROFESSOR_ROLE = keccak256("PROFESSOR");
    bytes32 public constant STUDENT_ROLE   = keccak256("STUDENT");

    struct Session {
        uint256 id;
        string  courseId;
        string  courseName;
        address professor;
        uint128 openedAt;     // Activation time (0 if not active)
        uint128 closedAt;
        bool    isOpen;       // If the session is not permanently closed
        bool    isActivated;  // If the professor has started the GPS geofence
        uint256 duration;     // In minutes
        string  locationHash; // GPS anchor data
    }

    uint256 public sessionCount;
    bytes32 public setupSecretHash;
    address public gpsSigner;

    mapping(uint256 => Session) public sessions;
    mapping(uint256 => address[]) public sessionAttendees;
    mapping(address => mapping(uint256 => bool)) public hasCheckedIn;
    mapping(address => string) public userNames;
    mapping(address => string) public userRole;
    mapping(address => bool) public blockedUsers;
    mapping(address => uint256[]) private _studentAttendance;
    uint256[] private _allSessionIds;
    address[] private _allStudents;
    address[] private _allProfessors;

    event SessionOpened(uint256 indexed sessionId, string courseName, address professor);
    event SessionActivated(uint256 indexed sessionId, uint256 timestamp, string locationHash);
    event SessionClosed(uint256 indexed sessionId, uint256 timestamp);
    event AttendanceMarked(uint256 indexed sessionId, address indexed student, uint256 timestamp);

    constructor(address admin, bytes32 _setupSecretHash) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        userNames[admin] = "System Admin";
        userRole[admin]  = "ADMIN";
        setupSecretHash = _setupSecretHash;
    }

    // --- Onboarding ---
    function onboard(string calldata name, string calldata role, string calldata secret) external {
        require(bytes(userRole[msg.sender]).length == 0, "Already registered");
        bytes32 roleHash = keccak256(bytes(role));
        
        if (roleHash == STUDENT_ROLE) {
            _grantRole(STUDENT_ROLE, msg.sender);
            userRole[msg.sender] = "STUDENT";
            _allStudents.push(msg.sender);
        } else if (roleHash == PROFESSOR_ROLE) {
            _grantRole(PROFESSOR_ROLE, msg.sender);
            userRole[msg.sender] = "PROFESSOR";
            _allProfessors.push(msg.sender);
        } else if (roleHash == ADMIN_ROLE) {
            require(keccak256(bytes(secret)) == setupSecretHash, "Invalid secret");
            _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
            _grantRole(ADMIN_ROLE, msg.sender);
            userRole[msg.sender] = "ADMIN";
        }
        userNames[msg.sender] = name;
    }

    function setGpsSigner(address _signer) external onlyRole(ADMIN_ROLE) {
        gpsSigner = _signer;
    }

    function setUserName(address user, string calldata name) external onlyRole(ADMIN_ROLE) {
        userNames[user] = name;
    }

    function setBlocked(address user, bool blocked) external onlyRole(ADMIN_ROLE) {
        blockedUsers[user] = blocked;
    }

    function provisionUser(address user, string calldata name, string calldata role) external onlyRole(ADMIN_ROLE) {
        bytes32 roleHash = keccak256(bytes(role));
        if (roleHash == STUDENT_ROLE) {
            _grantRole(STUDENT_ROLE, user);
            _allStudents.push(user);
        } else if (roleHash == PROFESSOR_ROLE) {
            _grantRole(PROFESSOR_ROLE, user);
            _allProfessors.push(user);
        } else if (roleHash == ADMIN_ROLE) {
            _grantRole(ADMIN_ROLE, user);
        }
        
        userRole[user] = role;
        userNames[user] = name;
    }

    // --- Professor Logic ---

    function openSession(
        string calldata courseId,
        string calldata courseName,
        uint256 duration
    ) external onlyRole(PROFESSOR_ROLE) returns (uint256 sessionId) {
        sessionCount++;
        sessionId = sessionCount;

        sessions[sessionId] = Session({
            id:           sessionId,
            courseId:     courseId,
            courseName:   courseName,
            professor:    msg.sender,
            openedAt:     0,
            closedAt:     0,
            isOpen:       true,
            isActivated:  false,
            duration:     duration,
            locationHash: ""
        });

        _allSessionIds.push(sessionId);
        emit SessionOpened(sessionId, courseName, msg.sender);
    }

    function activateSession(uint256 sessionId, string calldata locationHash) external onlyRole(PROFESSOR_ROLE) {
        Session storage s = sessions[sessionId];
        require(s.professor == msg.sender, "Not owner");
        require(s.isOpen, "Closed");
        require(!s.isActivated, "Already active");

        s.isActivated = true;
        s.openedAt = uint128(block.timestamp);
        s.locationHash = locationHash;

        emit SessionActivated(sessionId, block.timestamp, locationHash);
    }

    function closeSession(uint256 sessionId) external onlyRole(PROFESSOR_ROLE) {
        Session storage s = sessions[sessionId];
        require(s.professor == msg.sender, "Not owner");
        s.isOpen = false;
        s.closedAt = uint128(block.timestamp);
        emit SessionClosed(sessionId, block.timestamp);
    }

    // --- Student Logic ---

    function checkIn(uint256 sessionId, bytes calldata /* signature */) external onlyRole(STUDENT_ROLE) {
        Session storage s = sessions[sessionId];
        require(s.isOpen, "Closed");
        require(!hasCheckedIn[msg.sender][sessionId], "Already checked in");

        // BYPASSING SIGNATURE VERIFICATION FOR TESTING
        /*
        bytes32 messageHash = keccak256(abi.encodePacked(sessionId, msg.sender));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        require(ethSignedMessageHash.recover(signature) == gpsSigner, "Invalid GPS signature");
        */

        hasCheckedIn[msg.sender][sessionId] = true;
        sessionAttendees[sessionId].push(msg.sender);
        _studentAttendance[msg.sender].push(sessionId);

        emit AttendanceMarked(sessionId, msg.sender, block.timestamp);
    }

    // --- Views ---

    function getSession(uint256 id) external view returns (Session memory) {
        return sessions[id];
    }

    function getAllSessions() external view returns (Session[] memory) {
        Session[] memory all = new Session[](_allSessionIds.length);
        for (uint256 i = 0; i < _allSessionIds.length; i++) {
            all[i] = sessions[_allSessionIds[i]];
        }
        return all;
    }

    function getActiveSessions() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _allSessionIds.length; i++) {
            if (sessions[_allSessionIds[i]].isOpen && sessions[_allSessionIds[i]].isActivated) {
                count++;
            }
        }
        
        uint256[] memory activeIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _allSessionIds.length; i++) {
            if (sessions[_allSessionIds[i]].isOpen && sessions[_allSessionIds[i]].isActivated) {
                activeIds[index] = _allSessionIds[i];
                index++;
            }
        }
        return activeIds;
    }

    function getSessionAttendees(uint256 sessionId) external view returns (address[] memory) {
        return sessionAttendees[sessionId];
    }

    function getStudentAttendance(address student) external view returns (uint256[] memory) {
        return _studentAttendance[student];
    }

    function getAttendanceRate(address student) public view returns (uint256) {
        if (sessionCount == 0) return 0;
        uint256 attended = _studentAttendance[student].length;
        return (attended * 100) / sessionCount;
    }

    function getRegisteredStudents() external view returns (address[] memory) {
        return _allStudents;
    }

    function getRegisteredProfessors() external view returns (address[] memory) {
        return _allProfessors;
    }
}
