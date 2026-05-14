const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const artifact = require('../abi/AttendanceManager.json');
const contractABI = artifact.abi || artifact;

const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Session expired or not found. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Optional: Double check on-chain if user was blocked in the last few minutes
    // To save gas/rpc calls, we can do this only for sensitive actions or once per 5 mins
    
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
    
    const isBlocked = await contract.blockedUsers(decoded.address).catch(() => false);
    if (isBlocked) {
      res.clearCookie('token');
      return res.status(403).json({ error: 'Account blocked. Access denied.' });
    }

    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(403).json({ error: 'Invalid or expired session.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role || "UNKNOWN";
    // Check if user has the role OR the _ROLE version of it
    const hasPermission = roles.some(r => 
      userRole === r || userRole === `${r}_ROLE` || r === `${userRole}_ROLE`
    );

    if (!hasPermission) {
      console.log(`🚫 Access Denied for ${req.user.address}: Has role [${userRole}], but needs [${roles.join(',')}]`);
      return res.status(403).json({ error: `Access denied. ${userRole} role required.` });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
