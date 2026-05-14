module.exports = async function(callback) {
  const accounts = await web3.eth.getAccounts();
  console.log(JSON.stringify(accounts, null, 2));
  callback();
}
