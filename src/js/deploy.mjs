/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import { CODE_HEX , ABI} from "../../resources.mjs";

var abi;
var codeHex;
var smartContract;

// this does not exist for Kovan chain
function unlockAccount(address) {
    return new Promise (function (resolve, reject) {
        web3.personal.unlockAccount(address, "user", web3.toHex(0), function(err, result) {
            if (err) {
              reject(err);
            } else {
              console.log("Account has been unlocked: " + JSON.stringify(result));
              resolve();
            }
        });
    });
}

function estimateGas(dataIn) {
    return new Promise (function (resolve, reject) {
        web3.eth.estimateGas({to: web3.eth.defaultAccount, data: dataIn}, function(err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result * 1.2);
            }
        });
    });
}

function getGasLimit() {
    return new Promise (function (resolve, reject) {
        web3.eth.getBlock("latest", function(err, block) {
            if (err) {
                reject(err);
            } else {
                resolve(block.gasLimit);
            }
        });
    });
}

function instantiateNew(dataIn, gasLimit) {
    return new Promise (function (resolve, reject) {
        // web3.fromAscii
        // web3.toChecksumAddress
        // web3.toHex

        // 4000000000 = 4 GWEI per gas consumed
        smartContract.new(['0x7f023262356b002a4b7deb7ce057eb8b1aabb427'], {data: dataIn, from: web3.eth.defaultAccount}, function (err, contractInstance) {
        //smartContract.new({data: dataIn, from: web3.eth.defaultAccount, gasPrice: 4000000000, gas: gasLimit}, function (err, contractInstance) {
            if (err) {
                reject(err);
            } else {
                var transactionHash = contractInstance.transactionHash;
                console.log("TransactionHash: " + transactionHash + " waiting to be mined...");
                resolve([contractInstance, transactionHash]);
            }
        });
    });
}

function deployContract(smartContract) {
    //unlockAccount(web3.eth.defaultAccount).then(function() { // comment for Kovan chain
        //estimateGas(codeHex).then(function(estimatedGas) {
            //console.log("Gas for deployment: " + estimatedGas);
            var estimatedGas = 2;
            instantiateNew(codeHex, estimatedGas).then(function(result) {
                waitForReceipt(result[1]).then(function(receipt) {
                    console.log(receipt);
                    var smartContractInstance = smartContract.at(receipt.contractAddress);
                    ownerAddress(smartContractInstance).then(function(address) {
                        console.log("Contract Owner: " + address);
                        print(smartContractInstance, 7).then(function(output) {
                            console.log("printLn");
                            console.log(output);
                            ownBalance(smartContractInstance).then(function(balance) {
                                console.log("ownBalance");
                                console.log(balance);
                                balanceOf(smartContractInstance, web3.eth.defaultAccount).then(function(bal) {
                                    console.log("balanceOf");
                                    console.log(bal);
                                    give(smartContractInstance, '0x7f023262356b002a4b7deb7ce057eb8b1aabb427', 10).then(function(outcome) {
                                        console.log("give");
                                        console.log(outcome);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        //});
    //}); // comment for Kovan chain
}

function print(smartContractInstance, input) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.printLn(7, function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(result.toString(10));
            }
        });
    });
}

function ownBalance(smartContractInstance) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.ownBalance(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  console.log(result);
                  console.log(result.toString(10));
                  console.log(web3.toHex(result));
                  console.log(web3.toHex(result.toString(10)));
                  resolve(result);
            }
        });
    });
}

function ownerAddress(smartContractInstance) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.ownerAddress(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(web3.toHex(result.toString(10)));
            }
        });
    });
}

function balanceOf(smartContractInstance, address) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.balanceOf(web3.fromAscii(address), function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(result);
            }
        });
    });
}


function setUpFilter(contractInstance, transactionHash) {
  return new Promise (function (resolve, reject) {
      var filter = web3.eth.filter('latest');
      filter.watch(function(err, blockHash) {
          if (err) {
              reject(err);
          } else {
              filter.stopWatching();
              resolve();
          }
      });
  });
}

function give(smartContractInstance, toAddress, amount) {
  return new Promise (function (resolve, reject) {
      smartContractInstance.give(toAddress, amount, function(err, result) {
          if (err) {
              reject(err);
          } else {
              resolve(result);
          }
      });
  });
}

function waitForReceipt(transactionHash) {
  return new Promise (function (resolve, reject) {
      web3.eth.getTransactionReceipt(transactionHash, function (err, receipt) {

            if (err) {
                reject(err);
            } else {
              if (receipt !== null) {
                // Transaction went through
                resolve(receipt);
              } else {
                // Try again in 1 second
                window.setTimeout(function () {
                  waitForReceipt(transactionHash);
                }, 1000);
              }
            }
      });
  });
}

window.addEventListener('load', function () {
    if (typeof web3 !== 'undefined') {

        console.log('Web3 Detected! ' + web3.currentProvider.constructor.name);

        console.log("Web3 Version: " + web3.version.api);
        abi = ABI; // abi needs to be JS array instead of string
        codeHex = web3.toHex(CODE_HEX); // or from Ascii if I am certain it is Ascii.. toHex uses String or Number as param
        smartContract = web3.eth.contract(abi);
        //web3.eth.defaultAccount = '0x7f023262356b002a4b7deb7ce057eb8b1aabb427'; // dev net account
        web3.eth.defaultAccount = '0x004ec07d2329997267ec62b4166639513386f32e'; // dev net account with large funds
        //web3.eth.defaultAccount = '0x8ce40D9956E7B8A89A1D73f4D4850c760EA20A56'; // Kovan account
        console.log("Balance:");
        web3.eth.getBalance(web3.eth.defaultAccount, function(err, result) {
          if (!err) {
            console.log(JSON.stringify(result));
          }
        });
        deployContract(smartContract);

        /*
        // Subscribe to the Transfer event
        smartContract.events.Transfer({
            from: web3.eth.defaultAccount // Filter transactions by sender
        }, function (err, event) {
            console.log(event);
        });
        */

    } else {
        console.log('No Web3 Detected... using HTTP Provider')
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

    }
});

//var SmartContractTx = SmartContract.deploy({data: codeHex, from: web3.eth.defaultAccount, arguments: ["String"]});



function callOne(contract, newContractInstance, gas) {
  //contract.methods.one().call({from: '0x7f023262356b002a4b7deb7ce057eb8b1aabb427', value: web3.utils.toWei("5", "ether")});

  var getData = contract.methods.give().encodeABI();
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
          gas = Math.round(gas * 1.2);
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

function transferEther(fromAddress, toAddress, amount) {
    web3.eth.sendTransaction({
      to: toAddress,
      from: fromAddress,
      gasPrice: "20000000000",
      gas: "210000",
      value: web3.toWei(amount, "ether")}, function(err, transactionHash) {
        if (!err) {
          console.log("Transferred ether.");
          console.log("TransactionHash: " + transactionHash);
        }
    });

}

function changeFunction(strFunction) {
    selectedFunction = strFunction;
}

function getSelectedFunction() {
    return document.getElementById("select-function").value;
}
