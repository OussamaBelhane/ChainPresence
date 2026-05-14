const { Router } = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { authenticateToken } = require("../middleware/auth");

const router = Router();
const DATA_FILE = path.join(__dirname, "../data/enrollments.json");

// Ensure data file exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helper to read/write
const getEnrollments = () => JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
const saveEnrollments = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

/**
 * Apply for a course
 * POST /api/enrollments/apply
 */
router.post("/apply", authenticateToken, (req, res) => {
  const { courseId, courseName, professorAddress, studentName } = req.body;
  const studentAddress = req.user.address;

  if (!courseId || !professorAddress) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const enrollments = getEnrollments();

  // Check if already applied
  const existing = enrollments.find(e => 
    e.studentAddress.toLowerCase() === studentAddress.toLowerCase() && 
    e.courseId === courseId
  );

  if (existing) {
    return res.status(400).json({ error: `Already applied. Status: ${existing.status}` });
  }

  const newEnrollment = {
    id: crypto.randomUUID(),
    studentAddress,
    studentName: studentName || "Anonymous Student",
    courseId,
    courseName: courseName || courseId,
    professorAddress,
    status: "PENDING",
    appliedAt: Date.now()
  };

  enrollments.push(newEnrollment);
  saveEnrollments(enrollments);

  res.status(201).json({ success: true, enrollment: newEnrollment });
});

/**
 * Get student's enrollments
 * GET /api/enrollments/student/:address
 */
router.get("/student/:address", authenticateToken, (req, res) => {
  const { address } = req.params;
  
  if (req.user.address.toLowerCase() !== address.toLowerCase() && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized access to enrollments" });
  }

  const enrollments = getEnrollments().filter(
    e => e.studentAddress.toLowerCase() === address.toLowerCase()
  );
  
  res.json({ enrollments });
});

/**
 * Get enrollments for a professor's courses
 * GET /api/enrollments/professor/:address
 */
router.get("/professor/:address", authenticateToken, (req, res) => {
  const { address } = req.params;
  
  if (req.user.address.toLowerCase() !== address.toLowerCase() && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized access to enrollments" });
  }

  const enrollments = getEnrollments().filter(
    e => e.professorAddress.toLowerCase() === address.toLowerCase()
  );
  
  res.json({ enrollments });
});

/**
 * Update enrollment status
 * PUT /api/enrollments/:id/status
 */
router.put("/:id/status", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // APPROVED or REJECTED

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const enrollments = getEnrollments();
  const index = enrollments.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Enrollment not found" });
  }

  // Ensure only the professor of this course (or admin) can approve
  if (
    enrollments[index].professorAddress.toLowerCase() !== req.user.address.toLowerCase() &&
    req.user.role !== "ADMIN"
  ) {
    return res.status(403).json({ error: "Unauthorized to update this enrollment" });
  }

  enrollments[index].status = status;
  enrollments[index].updatedAt = Date.now();
  
  saveEnrollments(enrollments);

  res.json({ success: true, enrollment: enrollments[index] });
});

/**
 * Get enrollments for a specific course
 * GET /api/enrollments/course/:courseId
 */
router.get("/course/:courseId", authenticateToken, (req, res) => {
  const { courseId } = req.params;
  
  const enrollments = getEnrollments().filter(
    e => (e.courseId || '').trim().toLowerCase() === courseId.trim().toLowerCase()
  );
  
  res.json({ enrollments });
});

module.exports = router;
