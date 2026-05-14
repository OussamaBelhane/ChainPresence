# 🛡️ ChainPresence — Academic Audit Protocol

**Elite Swiss-Designed Attendance Analytics on the Ethereum Ledger.**

ChainPresence is a next-generation academic audit engine. It replaces archaic QR scans with **Cryptographic Proof-of-Presence** (PIN + GPS Geofencing) and provides institution-grade analytics with an elite minimalist aesthetic.

---

## 🏛️ System Architecture

- **Blockchain**: Solidity 0.8.19 (AccessControl, ECDSA Verification)
- **Engine**: Node.js + Express.js (Sync Engine, JWT Auth)
- **Interface**: React 18 (Elite Swiss Design, Glassmorphism, 60fps Animations)
- **Verification**: PIN-based challenge-response + GPS Geofencing (50m radius)

---

## 🚀 One-Click Setup (The Easy Way)

Follow these 5 steps to get the system running for a jury presentation in under 3 minutes:

### 1. Prerequisites
- **Node.js 18+**
- **Ganache GUI** (Running on port **7545**)
- **MetaMask** Browser Extension

### 2. Core Installation
```bash
# Clone and install dependencies
npm install
cd client && npm install
cd ../server && npm install
```

### 3. Smart Contract Deployment
```bash
# In the root folder
npx truffle migrate --reset
```
*Note the "AttendanceManager deployed at" address.*

### 4. Environment Synchronization
Update the contract address in both `.env` files:
- `client/.env` → `VITE_CONTRACT_ADDRESS=0x...`
- `server/.env` → `CONTRACT_ADDRESS=0x...`

### 5. Instant Analytics (Seeding)
Run the professional seeding script to populate the dashboard with 18 mock sessions and analytics:
```bash
npx truffle exec scripts/seed_demo_data.js
```

---

## 🖥️ Launch Protocol

Open three terminals in the root directory:

1. **Backend**: `cd server && npm start`
2. **Frontend**: `cd client && npm run dev`
3. **Admin Sync**: `npx truffle exec scripts/promote_user.js` *(Promotes your MetaMask wallet to Professor automatically)*

Access the platform at: **[http://localhost:5173](http://localhost:5173)**

---

## 👥 User Operation Guide

### 👨‍🏫 For Professors (Audit Control)
1. **Control Panel**: Overview of all academic sessions and global attendance consistency.
2. **Session Creation**: Set the course, duration, and PIN code.
3. **Activation**: Trigger the GPS anchor once in the classroom to allow check-ins.
4. **Academic Audit**: Detailed analytics engine. Export full CSV reports of student performance.

### 🎓 For Students (Proof of Presence)
1. **Automatic Detection**: Live sessions appear automatically on your dashboard when they begin.
2. **One-Click Check-in**: Enter the classroom PIN. The system verifies your identity and GPS location on-chain.
3. **Personal Records**: Track your attendance rate and consistency score in real-time.

---

## 💎 Elite Swiss Aesthetics
The UI follows strict Swiss Design principles:
- **Materials**: 24px backdrop-blur (Glassmorphism) with architectural grain textures.
- **Typography**: Ultra-bold display headers (900-weight) vs. wide-spaced metadata.
- **Precision**: 64px institutional grid alignment across all modules.

---

## 🛡️ Security Protocol
- **On-Chain Identity**: Roles (Admin, Professor, Student) are hard-coded on the Ethereum ledger.
- **Location Spoofing Prevention**: Cross-verifies device coordinates against the Professor's GPS anchor.
- **Atomic Transactions**: Attendance records are immutable once confirmed on the blockchain.

---

**ChainPresence 2024 — Secure Academic Ledger.**
