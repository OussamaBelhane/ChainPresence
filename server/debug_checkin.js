const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

async function debugCheckIn() {
    console.log("🛠️  DEBUGGING CHECK-IN REVERT...");
    
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://localhost:7545");
    const sessionId = 6; // From user logs
    const studentAddress = "0xB8a4106a5a0da869ED2aF2005974CF0C9277960A";

    const artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../server/abi/AttendanceManager.json"), "utf8"));
    const ABI = artifact.abi || artifact;
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);

    try {
        console.log("\n--- SESSION DATA ---");
        const session = await contract.sessions(sessionId);
        console.log(`Session #${sessionId}:`);
        console.log(`- Course: ${session.courseName}`);
        console.log(`- isOpen: ${session.isOpen}`);
        console.log(`- isActivated: ${session.isActivated}`);
        console.log(`- openedAt: ${new Date(Number(session.openedAt) * 1000).toLocaleString()}`);
        console.log(`- Duration: ${session.duration} mins`);
        
        const now = Math.floor(Date.now() / 1000);
        const expiry = Number(session.openedAt) + (Number(session.duration) * 60);
        console.log(`- Current Time: ${new Date(now * 1000).toLocaleString()}`);
        console.log(`- Expiry Time:  ${new Date(expiry * 1000).toLocaleString()}`);
        console.log(`- Is Expired: ${now > expiry}`);

        console.log("\n--- STUDENT STATUS ---");
        const hasCheckedIn = await contract.hasCheckedIn(studentAddress, sessionId);
        console.log(`- Already Checked In: ${hasCheckedIn}`);

        console.log("\n--- SIGNER STATUS ---");
        const gpsSigner = await contract.gpsSigner();
        console.log(`- Contract Signer: ${gpsSigner}`);
        
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
        console.log(`- Backend Wallet: ${wallet.address}`);

        // Try a manual call simulation (staticCall)
        console.log("\n--- SIMULATING TRANSACTION ---");
        const signature = "0x1f53693fa6df18635c757c36dde72e9f4a8d45899a48220213ccde89182c045193b2a756114a334a706379db48cf3920deff68d8c69c563a5bac8b99c504b09ea1c";
        
        try {
            await contract.checkIn.staticCall(sessionId, signature, { from: studentAddress });
            console.log("✅ SIMULATION SUCCESS! (The transaction SHOULD work)");
        } catch (simErr) {
            console.log("❌ SIMULATION FAILED!");
            console.log("Reason:", simErr.reason || simErr.message);
            if (simErr.data) console.log("Data:", simErr.data);
        }

    } catch (err) {
        console.error("❌ Debug failed:", err.message);
    }
}

debugCheckIn();
