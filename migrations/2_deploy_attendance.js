const AttendanceManager = artifacts.require("AttendanceManager");

module.exports = async function (deployer, network, accounts) {
  const admin = accounts[0];
  const setupSecret = "3SIai@$nCa2*^Vb2";
  const secretHash = web3.utils.keccak256(setupSecret);

  console.log("─────────────────────────────────────────");
  console.log("  Deploying AttendanceManager");
  console.log("  Admin (accounts[0]):", admin);
  console.log("  Setup Secret:      ", setupSecret);
  console.log("─────────────────────────────────────────");

  await deployer.deploy(AttendanceManager, admin, secretHash);

  const instance = await AttendanceManager.deployed();

  console.log("✅ AttendanceManager deployed at:", instance.address);
  console.log("─────────────────────────────────────────");
  console.log("ACTION REQUIRED:");
  console.log("  Copy the address above into:");
  console.log("  → server/.env   → CONTRACT_ADDRESS");
  console.log("  → client/.env   → VITE_CONTRACT_ADDRESS");
  console.log("─────────────────────────────────────────");
};
