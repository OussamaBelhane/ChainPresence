const AM = artifacts.require('AttendanceManager');
module.exports = async function(callback) {
  const i = await AM.deployed();
  const p = await i.getRegisteredProfessors();
  console.log('Professor:', p[0]);
  callback();
}
