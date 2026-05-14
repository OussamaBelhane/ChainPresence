const AttendanceManager = artifacts.require("AttendanceManager");

module.exports = async function(callback) {
  try {
    const instance = await AttendanceManager.deployed();
    const count = await instance.sessionCount();
    console.log("Total sessions on-chain:", count.toString());
    
    const all = await instance.getAllSessions();
    console.log("Sessions data length:", all.length);
    
    if (all.length > 0) {
      console.log("First session professor:", all[0].professor);
    }
    
    const students = await instance.getRegisteredStudents();
    console.log("Registered students:", students.length);
    
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
}
