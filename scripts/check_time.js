module.exports = async function(callback) {
  const block = await web3.eth.getBlock('latest');
  console.log("Real Time:", Date.now() / 1000);
  console.log("Blockchain Time:", block.timestamp);
  callback();
}
