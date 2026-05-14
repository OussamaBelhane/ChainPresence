const { Router } = require("express");
const { SiweMessage, generateNonce } = require("siwe");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const rateLimit = require("express-rate-limit");
const { addRequest, getRequests, updateRequestStatus } = require("../utils/requestStore");
const { onboardWallet } = require("../utils/syncRoles");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = Router();
const artifact = require("../abi/AttendanceManager.json"); 
const contractABI = artifact.abi || artifact; 

// In-memory nonce store
const nonces = new Map();

// Rate limiting for registration requests
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { error: "Too many registration requests. Please try again later." }
});

/**
 * GET /api/auth/nonce
 */
router.get("/nonce", (req, res) => {
  const nonce = generateNonce();
  const address = req.query.address?.toLowerCase();
  
  if (address) {
    nonces.set(address, { 
      nonce, 
      expiresAt: Date.now() + 5 * 60 * 1000 
    });
  }
  
  res.send(nonce);
});

/**
 * POST /api/auth/verify
 */
router.post("/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    
    // 1. Verify Nonce
    const stored = nonces.get(siweMessage.address.toLowerCase());
    if (!stored || stored.nonce !== siweMessage.nonce || Date.now() > stored.expiresAt) {
       return res.status(422).json({ error: "Invalid or expired nonce." });
    }

    nonces.delete(siweMessage.address.toLowerCase());

    // 2. Verify Signature
    const { data: fields } = await siweMessage.verify({ signature });

    // 3. Check On-chain Role
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
    
    const roleStr = await contract.userRole(fields.address).catch(() => "UNKNOWN");
    const isBlocked = await contract.blockedUsers(fields.address).catch(() => false);

    if (isBlocked) {
      return res.status(403).json({ error: "Account blocked." });
    }

    const normalizedRole = roleStr ? roleStr.replace('_ROLE', '') : "UNKNOWN";

    // 4. Issue JWT
    const token = jwt.sign(
      { address: fields.address, role: normalizedRole },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ success: true, address: fields.address, role: normalizedRole });
  } catch (err) {
    console.error("❌ Auth Error Details:", {
      message: err.message,
      stack: err.stack,
      body: req.body
    });
    res.status(400).json({ error: `Signature verification failed: ${err.message}` });
  }
});

/**
 * POST /api/auth/register-request
 */
router.post("/register-request", registrationLimiter, async (req, res) => {
  const { address, name, studentId, role } = req.body;
  if (!address || !name || !role) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const request = addRequest(address, name, studentId, role);
  res.json({ success: true, request });
});

/**
 * GET /api/auth/status
 */
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);
    const freshRole = await contract.userRole(req.user.address).catch(() => "UNKNOWN");
    const normalizedRole = freshRole ? freshRole.replace('_ROLE', '') : "UNKNOWN";
    const user = { ...req.user, role: normalizedRole };
    res.json({ user });
  } catch (err) {
    res.json({ user: req.user });
  }
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

// --- ADMIN PROTECTED ROUTES ---

router.get("/requests", authenticateToken, authorizeRoles("ADMIN"), (req, res) => {
  res.json(getRequests());
});

router.post("/requests/:address/approve", authenticateToken, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const { address } = req.params;
    const requests = getRequests();
    const request = requests.find(r => r.address.toLowerCase() === address.toLowerCase());
    
    if (!request) return res.status(404).json({ error: "Request not found." });

    await onboardWallet(address, request.name, request.role);
    updateRequestStatus(address, "approved");

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
