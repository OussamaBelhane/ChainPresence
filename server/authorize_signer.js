const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../server/.env") });

async function authorize() {
    console.log("🔐 AUTHORIZING BACKEND SIGNER...");
    
    const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://localhost:7545");
    const adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const backendAddress = adminWallet.address;

    const artifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../server/abi/AttendanceManager.json"), "utf8"));
    const ABI = artifact.abi || artifact;
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, adminWallet);

    console.log(`- Contract: ${process.env.CONTRACT_ADDRESS}`);
    console.log(`- Backend/Admin Address: ${backendAddress}`);

    try {
        const currentSigner = await contract.gpsSigner();
        console.log(`- Current Registered Signer: ${currentSigner}`);

        if (currentSigner.toLowerCase() !== backendAddress.toLowerCase()) {
            console.log("⚙️  Updating GPS Signer on-chain...");
            const tx = await contract.setGpsSigner(backendAddress);
            await tx.wait();
            console.log("✅ GPS Signer UPDATED successfully!");
        } else {
            console.log("✅ GPS Signer is already correct.");
        }
    } catch (err) {
        console.error("❌ Authorization failed:", err.message);
    }
}

authorize();
