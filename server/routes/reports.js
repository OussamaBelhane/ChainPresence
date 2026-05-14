/**
 * routes/reports.js
 * GET /api/reports/student/:address
 * GET /api/reports/session/:sessionId/pdf
 */

const { Router } = require("express");
const { ethers } = require("ethers");
const { generateSessionPDF } = require("../utils/pdfGenerator");

const contractABI = require("../abi/AttendanceManager.json");

const router = Router();

function getContract() {
  const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
  return new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractABI,
    provider
  );
}

/**
 * GET /api/reports/student/:address
 * Returns: { address, name, role, attendedSessions, totalClosed, rate, absences }
 */
router.get("/student/:address", async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }

    const contract = getContract();

    const [name, roleStr, attendedIds, allSessions, rate] = await Promise.all([
      contract.userNames(address),
      contract.userRole(address),
      contract.getStudentAttendance(address),
      contract.getAllSessions(),
      contract.getAttendanceRate(address),
    ]);

    const closedSessions = allSessions.filter((s) => !s.isOpen);
    const attendedSet    = new Set(attendedIds.map((id) => Number(id)));

    const sessionReports = closedSessions.map((s) => ({
      id:         Number(s.id),
      courseId:   s.courseId,
      courseName: s.courseName,
      professor:  s.professor,
      openedAt:   Number(s.openedAt),
      closedAt:   Number(s.closedAt),
      attended:   attendedSet.has(Number(s.id)),
    }));

    const absences = sessionReports.filter((s) => !s.attended).length;

    return res.json({
      address,
      name,
      role:             roleStr || "UNKNOWN",
      attendedSessions: sessionReports.filter((s) => s.attended),
      absences:         sessionReports.filter((s) => !s.attended),
      totalClosed:      closedSessions.length,
      rate:             Number(rate),
    });
  } catch (err) {
    console.error("student report error:", err.message);
    res.status(500).json({ error: "Failed to fetch student report" });
  }
});

/**
 * GET /api/reports/session/:sessionId/pdf
 * Returns a PDF file download with the session's attendance list.
 */
router.get("/session/:sessionId/pdf", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    const contract = getContract();

    const [session, attendeeAddresses] = await Promise.all([
      contract.getSession(sessionId),
      contract.getSessionAttendees(sessionId),
    ]);

    // Fetch names for each attendee
    const attendees = await Promise.all(
      attendeeAddresses.map(async (addr) => {
        const name = await contract.userNames(addr).catch(() => "Unknown");
        return { address: addr, name };
      })
    );

    const sessionData = {
      id:         Number(session.id),
      courseId:   session.courseId,
      courseName: session.courseName,
      professor:  session.professor,
      openedAt:   Number(session.openedAt),
      closedAt:   Number(session.closedAt),
      duration:   Number(session.duration),
      isOpen:     session.isOpen,
      attendees,
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="session-${sessionId}-attendance.pdf"`
    );

    generateSessionPDF(sessionData, res);
  } catch (err) {
    console.error("PDF generation error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
});

module.exports = router;
