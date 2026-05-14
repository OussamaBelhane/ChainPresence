const AttendanceManager = artifacts.require("AttendanceManager");

module.exports = async function(callback) {
  try {
    const instance = await AttendanceManager.deployed();
    const addr = "0xB8a4106a5a0da869ED2aF2005974CF0C9277960A";
    const role = await instance.userRole(addr);
    const name = await instance.userNames(addr);
    console.log(`Address: ${addr}`);
    console.log(`Role: ${role || "NONE"}`);
    console.log(`Name: ${name || "NONE"}`);
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
}
