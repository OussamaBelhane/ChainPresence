const { ethers } = require("ethers");
require("dotenv").config({ path: "../../server/.env" });
const abi = require("../../server/abi/AttendanceManager.json");

async function setup() {
  const provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL || "http://localhost:7545");
  // Use the first admin account from the PRIVATE_KEY or similar
  // Actually, truffle uses the first account by default.
  // I'll use a hardcoded private key from Ganache if I knew it, or just ask the user.
  // Wait, I can use the PRIVATE_KEY from .env if it has funds.
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

  console.log(`Setting GPS Signer to: ${wallet.address}`);
  try {
    const tx = await contract.setGpsSigner(wallet.address);
    await tx.wait();
    console.log("✅ GPS Signer set successfully!");
  } catch (err) {
    console.error("❌ Failed to set GPS Signer:", err.message);
  }
}

setup();
