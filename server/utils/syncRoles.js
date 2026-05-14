const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../abi/AttendanceManager.json"), "utf8"));
const ABI = artifact.abi || artifact;

// Constants for roles
const DEFAULT_ADMIN = "0x0000000000000000000000000000000000000000000000000000000000000000";

async function getContract() {
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://localhost:7546");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = ethers.getAddress(process.env.CONTRACT_ADDRESS);
    return new ethers.Contract(contractAddress, ABI, wallet);
}

/**
 * Onboards a specific wallet.
 * If forcedRole is provided, it uses that. 
 * Otherwise, it checks .env whitelist or defaults to STUDENT.
 */
async function onboardWallet(address, name = "", forcedRole = null) {
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://localhost:7545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contractAddress = ethers.getAddress(process.env.CONTRACT_ADDRESS);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);
    
    const addr = address.toLowerCase();

    const admins = (process.env.ADMIN_WALLETS || "").toLowerCase().split(",").map(a => a.trim());
    const professors = (process.env.PROFESSOR_WALLETS || "").toLowerCase().split(",").map(a => a.trim());

    const ADMIN_ROLE = await contract.ADMIN_ROLE();
    const PROFESSOR_ROLE = await contract.PROFESSOR_ROLE();
    const STUDENT_ROLE = await contract.STUDENT_ROLE();

    // Determine target role
    let targetRole = forcedRole;
    if (!targetRole) {
        if (admins.includes(addr)) targetRole = "ADMIN_ROLE";
        else if (professors.includes(addr)) targetRole = "PROFESSOR_ROLE";
        else targetRole = "STUDENT_ROLE";
    }

    const displayName = name || `${targetRole.replace('_ROLE', '')} User`;

    console.log(`📡 Onboarding ${targetRole}: ${addr} as ${displayName}`);
    try {
        const tx = await contract.provisionUser(addr, displayName, targetRole);
        await tx.wait();
        return targetRole;
    } catch (err) {
        console.error(`Failed to provision ${addr}:`, err.message);
        throw err;
    }
}

async function syncRoles() {
    console.log("🔄 Starting Initial Role Synchronization...");
    
    // 1. Sync from .env Whitelists
    const admins = (process.env.ADMIN_WALLETS || "").split(",").map(a => a.trim()).filter(a => ethers.isAddress(a));
    const professors = (process.env.PROFESSOR_WALLETS || "").split(",").map(a => a.trim()).filter(a => ethers.isAddress(a));

    for (const addr of admins) await onboardWallet(addr);
    for (const addr of professors) await onboardWallet(addr);

    // 2. Sync from approved requests (persistence across contract redeploys)
    try {
        const requestsFile = path.join(__dirname, "../data/requests.json");
        if (fs.existsSync(requestsFile)) {
            const requests = JSON.parse(fs.readFileSync(requestsFile, "utf-8"));
            const approved = requests.filter(r => r.status.toLowerCase() === "approved");
            
            console.log(`📡 Restoring ${approved.length} approved users to the new contract...`);
            for (const req of approved) {
                await onboardWallet(req.address, req.name, req.role);
            }
        }
    } catch (err) {
        console.warn("⚠️ Request sync skipped:", err.message);
    }

    console.log("✨ Initial Sync Complete.\n");
}

module.exports = { syncRoles, onboardWallet };
