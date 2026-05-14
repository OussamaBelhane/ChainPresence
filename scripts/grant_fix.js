
const AttendanceManager = artifacts.require("AttendanceManager");

module.exports = async function(callback) {
  try {
    const instance = await AttendanceManager.deployed();
    const userAddress = "0xB8a4106a5a0da869ED2aF2005974CF0C9277960A";
    
    // We know from the error message it's looking for keccak256("STUDENT")
    const roleToGrant = web3.utils.keccak256("STUDENT");
    
    console.log(`Contract Address: ${instance.address}`);
    console.log(`Granting role ${roleToGrant} to ${userAddress}...`);
    
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0]; // Assuming account 0 is admin
    
    await instance.grantRole(roleToGrant, userAddress, { from: admin });
    
    const hasRole = await instance.hasRole(roleToGrant, userAddress);
    console.log(`Success! User has role: ${hasRole}`);
    
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};
