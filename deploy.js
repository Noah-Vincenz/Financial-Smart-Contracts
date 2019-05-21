var Web3 = require("web3");
var fs = require('fs');
// Connecting to a local node
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// Setting up default account
web3.eth.defaultAccount = '0x004ec07d2329997267ec62b4166639513386f32e'; // account with large funds

web3.eth.personal.unlockAccount(web3.eth.defaultAccount, "user", web3.utils.toHex(0));

// reading JSON ABI
var abi = JSON.parse(fs.readFileSync("./target/json/SmartContract.json"));

// converting Wasm binary to hex format
var codeHex = '0x' + fs.readFileSync("./target/pwasm_contract.wasm").toString('hex');

// TODO: fs wont work if I am running something on browser, need to copy wasm contents & json into a js variable string

// Creating DonationContract
var SmartContract = new web3.eth.Contract(abi);
var SmartContractTx = SmartContract.deploy({data: codeHex, from: web3.eth.defaultAccount, arguments: ["String"]});

SmartContractTx.estimateGas({}, (err, gas) => {
  if (gas) {
    gas = Math.round(gas * 1.2);
        SmartContractTx.send({from: web3.eth.defaultAccount, gas: web3.utils.toHex(gas)})
        .on('error', (error) => { console.log(error) })
        .on('transactionHash', (transactionHash) => { console.log("transactionHash: " + transactionHash) })
        .on('receipt', (receipt) => {
           console.log("receipt.contractAddress: " + receipt.contractAddress) // contains the new contract address
        })
        .on('confirmation', (confirmationNumber, receipt) => {
            console.log("confirmationNumber: " + confirmationNumber + "\nreceipt.contractAddress: " + receipt.contractAddress) })
        .then((newContractInstance) => {
            console.log("Contract successfully deployed.")
            console.log(newContractInstance.options.address) // instance with the new contract address
            transferEther('0x7f023262356b002a4b7deb7ce057eb8b1aabb427', "1.5")
            /*
            SmartContract.methods.one()
            .call({from: '0x7f023262356b002a4b7deb7ce057eb8b1aabb427'}, (error, result) => {
              console.log(result)
            });
            SmartContract.methods.balance()
            .call({from:'0x7f023262356b002a4b7deb7ce057eb8b1aabb427'}, function(error, result) {
            console.log('error: ' + error);
            console.log(result);
            })
            .then(console.log);
            */
            //callOne(SmartContract, newContractInstance, gas);
            //myContract.methods.myMethod(123).call({from: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe'}, (error, result) => {});
        });
  } else {
    console.error(err);
  }
});

function callOne(contract, newContractInstance, gas) {
  //contract.methods.one().call({from: '0x7f023262356b002a4b7deb7ce057eb8b1aabb427', value: web3.utils.toWei("5", "ether")});
  //

  var getData = contract.methods.give().encodeABI();
  console.log("SKRT")
  /*
  var SmartContractTx = contract.methods.give({data: getData, from: '0x7f023262356b002a4b7deb7ce057eb8b1aabb427', to: contract.options.address, arguments: []})
  .call().then(function(res){
    console.log(res);
  }).catch(function(err) {
    console.log(err);
  });
  SmartContractTx.estimateGas({}, (err, gas) => {
    */

  web3.eth.estimateGas({from:'0x7f023262356b002a4b7deb7ce057eb8b1aabb427', data: getData}, (err, gas) => {
    if (gas) {
          console.log("SKRT2")
          gas = Math.round(gas * 1.2);
          console.log(gas)

          contract.methods.give().send({from: '0x7f023262356b002a4b7deb7ce057eb8b1aabb427', gas: web3.utils.toHex(gas)})
          .on('error', (error) => { console.log(error) })
          .on('transactionHash', (transactionHash) => { console.log("transactionHash: " + transactionHash) })
          .on('receipt', (receipt) => {
             console.log("receipt.contractAddress: " + receipt.contractAddress) // contains the new contract address
          })
          .on('confirmation', (confirmationNumber, receipt) => {
              console.log("confirmationNumber: " + confirmationNumber + "\nreceipt.contractAddress: " + receipt.contractAddress) })
          .then((newContractInstance) => {
              console.log("Contract successfully deployed.")
              console.log(newContractInstance.options.address) // instance with the new contract address
          });
    } else {
      console.error(err);
    }
  });

  //return inst.registerPlayer(1, {from: account, value: web3.toWei(5, "ether")});
}

function transferEther(toAddress, amount) {
    web3.eth.sendTransaction( {
      to: toAddress,
      from: web3.eth.defaultAccount,
      gasPrice: "20000000000",
      gas: "210000",
      value: web3.utils.toWei(amount, "ether")})
    .catch(error => {console.log(error) })
    .then(console.log)
    .then(console.log("Transferred ether."));
}

/*
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// We need to wait until any miner has included the transaction
// in a block to get the address of the contract
async function waitBlock() {
  while (true) {
    let receipt = web3.eth.getTransactionReceipt(DonationContract.transactionHash);
    if (receipt && receipt.contractAddress) {
      console.log("Your contract has been deployed." + receipt.contractAddress);
      console.log("Note that it might take 30 - 90 sceonds for the block to propagate befor it's visible in etherscan.io");
      console.log("Sending Transaction");
      web3.eth.sendTransaction({to:"0x8ce40d9956e7b8a89a1d73f4d4850c760ea20a56", from:web3.eth.defaultAccount, value:web3.utils.toWei("0.1", "ether")}).catch(error => {console.log(error) });
      break;
    }
    //console.log("Waiting a mined block to include your contract... currently in block " + web3.eth.getBlockNumber(function(error, result){ promise.then(function(result) {console.log(result)} ) }));
    await sleep('0x00000000000000000000000000000000000000000000000000000000004000').catch(error => {console.log(error)});
  }
}

waitBlock();
*/
