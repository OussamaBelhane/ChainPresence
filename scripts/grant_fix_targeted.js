
const AttendanceManager = artifacts.require("AttendanceManager");

module.exports = async function(callback) {
  try {
    const targetAddress = "0x94b981D4010f331E63E79CEb65f456Db72d529A4";
    const userAddress = "0xB8a4106a5a0da869ED2aF2005974CF0C9277960A";
    const roleHash = "0x36a5c4aaacb6b388bbd448bf11096b7dafc5652bcc9046084fd0e95b1fb0b2cc";
    
    const instance = await AttendanceManager.at(targetAddress);
    
    console.log(`Targeting Contract: ${targetAddress}`);
    console.log(`Granting role ${roleHash} to ${userAddress}...`);
    
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0]; 
    
    await instance.grantRole(roleHash, userAddress, { from: admin });
    
    const hasRole = await instance.hasRole(roleHash, userAddress);
    console.log(`Success! User has role: ${hasRole}`);
    
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};
