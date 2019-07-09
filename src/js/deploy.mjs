/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import { CODE_HEX , ABI} from "../../resources.mjs";

var abi;
var codeHex;
var smartContract;

// this does not exist for Kovan chain
global.unlockAccount = function(address) {
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

global.estimateGas = function(dataIn) {
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

global.getGasLimit = function() {
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

global.instantiateNew = function(dataIn, stringArr) {
    return new Promise (function (resolve, reject) {

        // 4000000000 = 4 GWEI per gas consumed
        smartContract.new(web3.toChecksumAddress('0x7f023262356b002a4b7deb7ce057eb8b1aabb427'), stringArr, {data: dataIn, from: web3.eth.defaultAccount}, function (err, contractInstance) {
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

global.stringToBin = function(str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
        result.push(str.charCodeAt(i));
    }
    return result;
}

global.deployContract = function(smartContract) {
    unlockAccount(web3.eth.defaultAccount).then(function() { // comment for Kovan chain
        instantiateNew(codeHex, stringToBin("scaleK 10 give one")).then(function(instantiateTxHash) {
            waitForReceipt(instantiateTxHash).then(function(instantiationReceipt) {
                var smartContractInstance = smartContract.at(instantiationReceipt.contractAddress);
                holderAddress(smartContractInstance).then(function(holderAddress) {
                    console.log("Contract Holder: " + holderAddress);
                    holderBalance(smartContractInstance).then(function(hBalance1) {
                        console.log("holderBalance: " + hBalance1);
                        counterPartyBalance(smartContractInstance).then(function(cBalance1) {
                            console.log("counterPartyBalance: " + cBalance1);
                            depositCollateral(smartContractInstance, '0x004ec07d2329997267Ec62b4166639513386F32E', 20).then(function(depositTxHash) {
                                waitForReceipt(depositTxHash).then(function(_) {
                                    console.log("Collateral of 20 Ether has been added to holder account.");
                                    holderBalance(smartContractInstance).then(function(hBalance2) {
                                        console.log("holderBalance: " + hBalance2);
                                        counterPartyBalance(smartContractInstance).then(function(cBalance2) {
                                            console.log("counterPartyBalance: " + cBalance2);
                                            /*
                                            transfer(smartContractInstance, '0x004ec07d2329997267Ec62b4166639513386F32E', '0x7f023262356b002a4b7deb7ce057eb8b1aabb427', 5).then(function(transferTxHash) {
                                                waitForReceipt(transferTxHash).then(function(_) {
                                                    console.log("Holder has transferred 5 Ether to counter party.");
                                                    holderBalance(smartContractInstance).then(function(hBalance3) {
                                                        console.log("holderBalance: " + hBalance3);
                                                        counterPartyBalance(smartContractInstance).then(function(cBalance3) {
                                                            console.log("counterPartyBalance: " + cBalance3);
                                                        });
                                                    });
                                                });
                                            });*/
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }); // comment for Kovan chain
}

global.print = function(smartContractInstance, input) {
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

global.depositCollateral = function(smartContractInstance, senderAddress, amount) {
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

global.holderBalance = function(smartContractInstance) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.holderBalance(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(web3.toDecimal(result));
            }
        });
    });
}

global.counterPartyBalance = function(smartContractInstance) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.counterPartyBalance(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(web3.toDecimal(result));
            }
        });
    });
}

global.holderAddress = function(smartContractInstance) {
    return new Promise (function (resolve, reject) {
        smartContractInstance.holderAddress(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  resolve(web3.toHex(result.toString(10)));
            }
        });
    });
}

global.balanceOfAddress = function(smartContractInstance, address) {
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


global.setUpFilter = function(contractInstance, transactionHash) {
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

global.transfer = function(smartContractInstance, fromAddress, toAddress, amount) {
  return new Promise (function (resolve, reject) {
      smartContractInstance.transfer(fromAddress, toAddress, amount, function(err, result) {
          if (err) {
              reject(err);
          } else {
              resolve(result);
          }
      });
  });
}

global.waitForReceipt = function(transactionHash) {
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


        // TODO: read user input and deploy contract on pressing deploy button
        // TODO: convert user's pressed boxes into contract definition
        // TODO: add translation into English - ie Transfer 10 Eth from a to b
        // TODO: remove parenthesis from user string


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

global.transferEther = function(fromAddress, toAddress, amount) {
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
