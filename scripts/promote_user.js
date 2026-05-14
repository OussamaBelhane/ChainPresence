const AttendanceManager = artifacts.require("AttendanceManager");

module.exports = async function(callback) {
  try {
    const instance = await AttendanceManager.deployed();
    const admin = (await web3.eth.getAccounts())[0];
    const userAddr = "0xB8a4106a5a0da869ED2aF2005974CF0C9277960A";
    
    console.log(`Force Provisioning ${userAddr} as PROFESSOR via Admin...`);
    await instance.provisionUser(userAddr, "Dr. Claude Shannon", "PROFESSOR", { from: admin });
    
    const currentRole = await instance.userRole(userAddr);
    console.log(`New Role: ${currentRole}`);
    
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
}
