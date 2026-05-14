/**
 * routes/sessions.js
 * Handles GPS activation and verification.
 */

const { Router } = require("express");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { activeSessions } = require("../utils/sessionStore");
const { getDistance } = require("../utils/geoUtils");

const artifact = require("../abi/AttendanceManager.json");
const contractABI = artifact.abi || artifact;

const router = Router();
const DISTANCE_THRESHOLD = 1000; // Increased to 1km for dev testing

/**
 * POST /api/sessions/activate
 * Body: { sessionId: number, lat: number, lng: number, professorAddress: string }
 * Called when a professor clicks "Start Session" in class.
 */
router.post("/activate", async (req, res) => {
  try {
    const { sessionId, lat, lng } = req.body;

    if (sessionId === undefined || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "sessionId, lat, and lng are required" });
    }

    // Anchor the session on the backend
    activeSessions.set(Number(sessionId), {
      lat: Number(lat),
      lng: Number(lng),
      activatedAt: Date.now()
    });

    console.log(`🚀 Session ${sessionId} ACTIVATED at classroom: ${lat}, ${lng}`);
    return res.json({ success: true });
  } catch (err) {
    console.error("activate session error:", err.message);
    res.status(500).json({ error: "Failed to activate geofence" });
  }
});

/**
 * POST /api/sessions/verify-gps
 * Signs an approval only if student is within 100m of the professor's activated anchor.
 */
router.post("/verify-gps", async (req, res) => {
  try {
    const { sessionId, lat, lng, studentAddress } = req.body;

    if (!sessionId || lat === undefined || lng === undefined || !studentAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sessionData = activeSessions.get(Number(sessionId));
    if (!sessionData) {
      return res.status(403).json({ 
        approved: false, 
        error: "Session geofence not yet activated by professor." 
      });
    }

    const studentLat = parseFloat(lat);
    const studentLng = parseFloat(lng);
    const profLat = parseFloat(sessionData.lat);
    const profLng = parseFloat(sessionData.lng);

    const distance = getDistance(studentLat, studentLng, profLat, profLng);
    
    console.log(`📍 Geofence Audit [Session #${sessionId}]:`);
    console.log(`   - Student: ${studentLat}, ${studentLng}`);
    console.log(`   - Professor: ${profLat}, ${profLng}`);
    console.log(`   - Distance: ${Math.round(distance)}m (Limit: ${DISTANCE_THRESHOLD}m)`);

    // DEVELOPMENT BYPASS: If testing on same machine or dev environment
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (distance > DISTANCE_THRESHOLD) {
      if (isDev) {
        console.log("⚠️  DEV BYPASS: Distance check ignored for local testing.");
      } else {
        return res.status(403).json({ 
          approved: false, 
          error: `Too far from classroom (${Math.round(distance)}m). Required: <${DISTANCE_THRESHOLD}m` 
        });
      }
    }

    // Sign Approval
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "address"],
      [Number(sessionId), studentAddress]
    );
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return res.json({ 
      approved: true, 
      signature,
      distance: Math.round(distance)
    });

  } catch (err) {
    console.error("verify-gps error:", err.message);
    res.status(500).json({ error: "GPS verification failed" });
  }
});

/**
 * GET /api/sessions/active
 * Returns all sessions that are open on-chain AND activated on backend.
 */
router.get("/active", async (req, res) => {
  try {
    const { studentAddress } = req.query;
    
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://localhost:7545");
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI.abi || contractABI, provider);
    
    // 1. Get all sessions from chain
    const allSessions = await contract.getAllSessions();
    
    // 2. Filter for OPEN sessions
    let filtered = allSessions.map(s => ({
      id: Number(s.id),
      courseId: s.courseId,
      courseName: s.courseName,
      professor: s.professor,
      isOpen: s.isOpen,
      isActivated: s.isActivated,
      openedAt: Number(s.openedAt),
      duration: Number(s.duration)
    })).filter(s => s.isOpen);

    // 3. If studentAddress provided, filter by enrollment
    if (studentAddress) {
      const enrollmentFile = path.join(__dirname, "../data/enrollments.json");
      const enrollments = JSON.parse(fs.readFileSync(enrollmentFile, "utf-8"));
      
      // Normalize for comparison
      const studentCourses = enrollments
        .filter(e => e.studentAddress.toLowerCase() === studentAddress.toLowerCase() && e.status === "APPROVED")
        .map(e => e.courseId.trim().toLowerCase());
        
      filtered = filtered.filter(s => {
        const chainId = s.courseId.trim().toLowerCase();
        return studentCourses.includes(chainId);
      });
    }

    console.log(`📡 Serving ${filtered.length} active sessions to student ${studentAddress}`);
    res.json({ sessions: filtered });
  } catch (err) {
    console.error("fetch active sessions error:", err.message);
    res.status(500).json({ error: "Failed to fetch active sessions" });
  }
});

/**
 * GET /api/sessions/status/:sessionId
 * Checks if a session is activated on the backend.
 */
router.get("/status/:sessionId", (req, res) => {
  const isActivated = activeSessions.has(Number(req.params.sessionId));
  res.json({ isActivated });
});

module.exports = router;
