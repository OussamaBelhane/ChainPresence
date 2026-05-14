/**
 * ChainPresence — Express API Server
 */

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const cookieParser = require("cookie-parser");

const authRoutes     = require("./routes/auth");
const sessionRoutes  = require("./routes/sessions");
const reportRoutes   = require("./routes/reports");
const { syncRoles } = require("./utils/syncRoles");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// CORS must be early
app.use(cors({
  origin: true, // Allow any origin dynamically (reflects the request origin)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
}));

app.use(helmet({
  crossOriginResourcePolicy: false, // Help with image/asset loading if needed
}));
app.use(express.json());
app.use(cookieParser());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/auth",     authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/reports",  reportRoutes);
app.use("/api/enrollments", require("./routes/enrollments"));

// Root route - Redirect or help message
app.get("/", (_req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 40px; text-align: center; background: #0b0e1a; color: white; min-height: 100vh;">
      <h1 style="color: #00E5B3;">ChainPresence API is Running</h1>
      <p>To use the application, please visit the <b>Frontend</b> at:</p>
      <a href="http://localhost:5173" style="color: #00E5B3; font-size: 1.2rem;">http://localhost:5173</a>
      <p style="margin-top: 20px; color: #8892b0;">Backend Port: ${PORT}</p>
    </div>
  `);
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function start() {
  // Sync roles before starting server
  await syncRoles().catch(err => console.error("Role sync failed:", err));

  app.listen(PORT, () => {
    console.log(`\n🚀 ChainPresence server running on http://localhost:${PORT}`);
    console.log(`   Contract: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`   Ganache:  ${process.env.GANACHE_URL}\n`);
  });
}

start();

module.exports = app;
