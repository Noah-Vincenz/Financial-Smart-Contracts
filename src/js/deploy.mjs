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

        // 4000000000 = 4 GWEI per gas consumed
        smartContract.new(web3.toChecksumAddress('0x7f023262356b002a4b7deb7ce057eb8b1aabb427'), {data: dataIn, from: web3.eth.defaultAccount}, function (err, contractInstance) {
        //smartContract.new({data: dataIn, from: web3.eth.defaultAccount, gasPrice: 4000000000, gas: gasLimit}, function (err, contractInstance) {
            if (err) {
                reject(err);
            } else {
                var transactionHash = contractInstance.transactionHash;
                console.log("TransactionHash: " + transactionHash + " waiting to be mined...");
                resolve(transactionHash);
            }
        });
    });
}

function deployContract(smartContract) {
    unlockAccount(web3.eth.defaultAccount).then(function() { // comment for Kovan chain
        //estimateGas(codeHex).then(function(estimatedGas) {
            //console.log("Gas for deployment: " + estimatedGas);
            var estimatedGas = 2;
            instantiateNew(codeHex, estimatedGas).then(function(instantiateTxHash) {
                waitForReceipt(instantiateTxHash).then(function(instantiationReceipt) {
                    var smartContractInstance = smartContract.at(instantiationReceipt.contractAddress);
                    ownerAddress(smartContractInstance).then(function(ownerAddress) {
                        console.log("Contract Owner: " + ownerAddress);
                        ownerBalance(smartContractInstance).then(function(oBalance1) {
                            console.log("ownerBalance: " + oBalance1);
                            recipientBalance(smartContractInstance).then(function(rBalance1) {
                                console.log("recipientBalance: " + rBalance1);
                                depositCollateral(smartContractInstance, '0x004ec07d2329997267Ec62b4166639513386F32E', 20).then(function(res) {
                                    waitForReceipt(res).then(function(_) {
                                        console.log("Collateral of 20 Ether has been added to owner account.");
                                        ownerBalance(smartContractInstance).then(function(oBalance2) {
                                            console.log("ownerBalance: " + oBalance2);
                                            recipientBalance(smartContractInstance).then(function(rBalance2) {
                                                console.log("recipientBalance: " + rBalance2);
                                                transfer(smartContractInstance, '0x004ec07d2329997267Ec62b4166639513386F32E', '0x7f023262356b002a4b7deb7ce057eb8b1aabb427', 5).then(function(giveTxHash) {
                                                    waitForReceipt(giveTxHash).then(function(_) {
                                                        console.log("Owner has transferred 5 Ether to recipient.");
                                                        ownerBalance(smartContractInstance).then(function(oBalance3) {
                                                            console.log("ownerBalance: " + oBalance3);
                                                            recipientBalance(smartContractInstance).then(function(rBalance3) {
                                                                console.log("recipientBalance: " + rBalance3);
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        //});
    }); // comment for Kovan chain
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

function depositCollateral(smartContractInstance, senderAddress, amount) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.depositCollateral(amount, {from: senderAddress, value: web3.toWei(amount, "ether")}, function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(result.toString(10));
            }
        });
    });
}

function ownerBalance(smartContractInstance) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.ownerBalance(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(web3.toDecimal(result));
            }
        });
    });
}

function recipientBalance(smartContractInstance) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.recipientBalance(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(web3.toDecimal(result));
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

function balanceOfAddress(smartContractInstance, address) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.balanceOfAddress(web3.toChecksumAddress(address), function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(web3.toDecimal(result));
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

function transfer(smartContractInstance, fromAddress, toAddress, amount) {
  return new Promise (function (resolve, reject) {
      smartContractInstance.transfer(fromAddress, toAddress, amount, function(err, result) {
          if (err) {
              reject(err);
          } else {
              console.log(result.toString(10));
              console.log(web3.toHex(result));
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
        web3.eth.defaultAccount = '0x004ec07d2329997267Ec62b4166639513386F32E'; // dev net account with large funds
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
