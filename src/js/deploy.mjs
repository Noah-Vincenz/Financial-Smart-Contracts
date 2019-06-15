/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import { CODE_HEX , ABI} from "./resources.mjs";

var abi;
var codeHex;
var smartContract;

// this does not exist for Kovan chain
function unlockAccount() {
    return new Promise (function (resolve, reject) {
        web3.personal.unlockAccount(web3.eth.defaultAccount, "user", web3.toHex(0), function(err, result) {
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
              resolve(result * 2);
            }
        });
    });
}

function instantiateNew(dataIn, gasIn) {
    return new Promise (function (resolve, reject) {
        // web3.fromAscii
        // web3.toChecksumAddress
        // web3.toHex
        smartContract.new({data: dataIn, from: web3.eth.defaultAccount, gas: gasIn}, function (err, contractInstance) {
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
    unlockAccount().then(function() { // comment for Kovan chain
        estimateGas(codeHex).then(function(estimatedGas) {
            console.log("Gas for deployment: " + estimatedGas);
            instantiateNew(codeHex, estimatedGas).then(function(result) {
                waitForReceipt(result[1]).then(function(receipt) {
                    console.log(receipt);
                    console.log("RECEIPT ABOVE");
                    console.log(receipt.contractAddress);
                    console.log(result[0]);
                    var smartContractInstance = smartContract.at(receipt.contractAddress);
                    console.log("new instance");
                    console.log(smartContractInstance);
                    smartContractInstance.ownBalance(function (err, result) {
                        if(err) {
                              console.error(err);
                              return;
                        } else {
                              console.log("3: " + result);
                        }
                    });
                });
                /*
                waitForReceipt(result[1], function (receipt) {
                    console.log(receipt);
                    console.log("RECEIPT ABOVE");
                    console.log(result[0]);
                });
                */
                /*
                console.log("Initial Contract Instance:")
                console.log(result[0]);
                var contractInstance = result[0];
                var transactionHash = result[1];
                setUpFilter(contractInstance, transactionHash).then(function() {
                    getTransactionReceipt(transactionHash, contractInstance).then(function(newContractInstance) {
                        console.log("Final Contract Instance:")
                        console.log(newContractInstance);

                    });
                });
                */
            });
        });
    }); // comment for Kovan chain
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

function getTransactionReceipt(transactionHash, contractInstance) {
  return new Promise (function (resolve, reject) {
      web3.eth.getTransactionReceipt(transactionHash, function(err, receipt) {
            if (err) {
                reject(err);
            } else {
                contractInstance.address = web3.toChecksumAddress(receipt.contractAddress);
                resolve(contractInstance);
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

/*
function waitForReceipt(transactionHash, callback) {
  web3.eth.getTransactionReceipt(hash, function (err, receipt) {
    if (err) {
      error(err);
    }

    if (receipt !== null) {
      // Transaction went through
      if (callback) {
        callback(receipt);
      }
    } else {
      // Try again in 1 second
      window.setTimeout(function () {
        waitForReceipt(hash, callback);
      }, 1000);
    }
  });
}
*/
           /*

           var callData = contract.functionName.getData(functionParameters);
            var result = web3.eth.call({
               to: "0x692a70d2e424a56d2c6c27aa97d1a86395877b3a",
               data: callData
            });

                   smartContractInstance.printLn(7, {from: web3.eth.defaultAccount}, function (err, result) {
                     if(err) {
                           console.error(err);
                           return;
                     } else {
                           console.log("3: " + result);
                     }
                   });
                   smartContractInstance.ownBalance.call({from: web3.eth.defaultAccount}, function (err, result) {
                     if(err) {
                           console.error(err);
                           return;
                     } else {
                           console.log("3: " + result);
                     }
                   });
                   smartContractInstance.ownBalance({from: web3.eth.defaultAccount}, function (err, result) {
                     if(err) {
                           console.error(err);
                           return;
                     } else {
                           console.log("3: " + result);
                     }
                   });

                 } else {
                   console.error(err);
                 }
           });
      } else {
        console.error(err);
      }
  });
}
*/
window.addEventListener('load', function () {
    if (typeof web3 !== 'undefined') {

        console.log('Web3 Detected! ' + web3.currentProvider.constructor.name);

        console.log("Web3 Version: " + web3.version.api);
        abi = ABI; // abi needs to be JS array instead of string
        codeHex = web3.fromAscii(CODE_HEX);
        smartContract = web3.eth.contract(abi);

        //web3.eth.defaultAccount = '0x7f023262356b002a4b7deb7ce057eb8b1aabb427'; // dev net account
        web3.eth.defaultAccount = '0x004ec07d2329997267ec62b4166639513386f32e'; // dev net account with large funds
        //web3.eth.defaultAccount = '0x8ce40D9956E7B8A89A1D73f4D4850c760EA20A56'; // Kovan account
        deployContract(smartContract);



        // 1) DEPLOYING NEW SMART CONTRACT -- THIS SHOULD BE THE WAY -- DEPLOYING A NEW CONTRACT BETWEEN TWO EXISTING PARTIES
//-----------------
        //var SmartContractInstance = SmartContract.new({data: codeHex, gas: gas, from: web3.eth.defaultAccount});
        /*
        SmartContract.new({data: codeHex, from: web3.eth.defaultAccount, gas: gas}, function (err, contract) {
          if(err) {
                console.error(err);
                return;
          } else if (!err) {
                if(!contract.address) {
                   console.log("TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                 }
          }
        });
*/

        /*
        var filter = web3.eth.filter('latest');
        filter.watch(function(error, result){
         if (!error)
           //console.log("balance: " + web3.eth.getBalance(web3.eth.defaultAccount).toString(10));
           SmartContractInstance = SmartContract.at(result);
           console.log("Contract mined! Address: " + result);
           console.log(SmartContractInstance.address);
           //console.log(SmartContractInstance.printLn(7).toString(10));
           console.log("1: " + SmartContractInstance.printLn(7).toString(10));
           console.log("2: " + SmartContractInstance.ownBalance().toString(10));
           SmartContractInstance.ownBalance.call({from: web3.eth.defaultAccount}, function (err, result) {
             if(err) {
                   console.error(err);
                   return;
             } else {
                   console.log("3: " + result);
             }
           });
           SmartContractInstance.printLn.call(7, {from: '0x004ec07d2329997267ec62b4166639513386f32e'}, function (err, result) {
             if(err) {
                   console.error(err);
                   return;
             } else {
                   console.log("6: " + result);
             }
           });
        });
        */


/*
                // 2) USING DEFAULT ACCOUNT AS CONTRACT
                //var SmartContractInstance = SmartContract.at(web3.eth.defaultAccount);
*/
/*
                console.log("Address: " + SmartContractInstance.address);

                console.log("1: " + SmartContractInstance.printLn(7).toString(10));
                console.log("balance: " + web3.eth.getBalance(web3.eth.defaultAccount));
//-----------------

                console.log("2: " + SmartContractInstance.ownBalance().toString(10));

                SmartContractInstance.ownBalance.call({from: web3.eth.defaultAccount}, function (err, result) {
                  if(err) {
                        console.error(err);
                        return;
                  } else {
                        console.log("3: " + result);
                  }
                });

                SmartContractInstance.ownBalance.sendTransaction({from: web3.eth.defaultAccount, gas: 1000000}, function (err, result) {
                  if(err) {
                        console.error(err);
                        return;
                  } else {
                        console.log("4: " + result);
                  }
                });
                */
/*
//---------------
                console.log("5: " + SmartContractInstance.printLn(7).toString(10));

                SmartContractInstance.printLn.call(7, {from: web3.eth.defaultAccount}, function (err, result) {
                  if(err) {
                        console.error(err);
                        return;
                  } else {
                        console.log("6: " + result);
                  }
                });

                SmartContractInstance.printLn.sendTransaction(['7'], {from: web3.eth.defaultAccount, gas: 1000000}, function (err, result) {
                  if(err) {
                        console.error(err);
                        return;
                  } else {
                        console.log("7: " + result);
                  }
                });

*/
                // BALANCE
                /*
                //SmartContractInstance.balance({value: 200, gas: 2000});
                // Automatically determines the use of call or sendTransaction based on the method type
                //console.log(web3.fromHex(web3.eth.defaultAccount));
                console.log(SmartContractInstance.address);
                var balance = SmartContractInstance.ownBalance();
                console.log("balance: " + balance);
                //var balance = SmartContractInstance.balanceOf(web3.fromAscii(web3.eth.defaultAccount));
                //console.log("balance: " + balance);
                SmartContractInstance.ownBalance({from: web3.eth.defaultAccount, gas: 1000000}, function (error, result) {
                  if(error) {
                        console.error(error);
                        return;
                  } else if (!error) {
                        console.log(result.toString(10));
                        if(!result.address) {
                           console.log("Balance TransactionHash: " + result.transactionHash + " waiting to be mined...");
                         }
                  }
                });
                */

                // GIVE -- txHash = undefined
                /*
                var result = web3.eth.estimateGas({
                   to: '0x7f023262356b002a4b7deb7ce057eb8b1aabb427',
                   from: web3.eth.defaultAccount
                });
                var gas = Math.round(result * 1.2);
                console.log("Gas: " + gas);
                SmartContractInstance.give('0x7f023262356b002a4b7deb7ce057eb8b1aabb427', 10000000000, {from: web3.eth.defaultAccount, gas: gas}, function (err, contract) {
                  if(err) {
                        console.error(err);
                        return;
                  } else if (!err) {
                        if(!contract.address) {
                           console.log("TransactionHash: " + contract.transactionHash + " waiting to be mined...");
                         }
                  }
                });
                */


                /*
                // Subscribe to the Transfer event
                SmartContract.events.Transfer({
                    from: web3.eth.defaultAccount // Filter transactions by sender
                }, function (err, event) {
                    console.log(event);
                });
                */

                //transferEther('0x7f023262356b002a4b7deb7ce057eb8b1aabb427', "1.5")

        //var SmartContract = new web3.eth.Contract(abi);
        //var SmartContract = web3.eth.contract(abi);
        // TODO: args below must be vector of ints
        //console.log(abi);
        //var SmartContractInstance = SmartContract.at('0x004ec07d2329997267ec62b4166639513386f32e');

        //var SmartContractTx = SmartContract.deploy({data: codeHex, from: web3.eth.defaultAccount, arguments: ["this is the user input"]});
        //deploy(SmartContractTx);

        // call constant function
        //var result = SmartContractInstance.balance();
        //console.log(result) // '0x25434534534'
        // send a transaction to a function
        //myContractInstance.myStateChangingMethod('someParam1', 23, {value: 200, gas: 2000});
        // short hand style
        //web3.eth.contract(abi).at(address).myAwesomeMethod(...);
        // create filter

   /*
   {
       address: '0x8718986382264244252fc4abd0339eb8d5708727',
       topics: "0x12345678901234567890123456789012", "0x0000000000000000000000000000000000000000000000000000000000000005",
       data: "0x0000000000000000000000000000000000000000000000000000000000000001",
       ...
   }
   */
    } else {
        console.log('No Web3 Detected... using HTTP Provider')
        window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        //window.web3.eth.defaultAccount = '0x004ec07d2329997267ec62b4166639513386f32e'; // account with large funds
        //window.web3.eth.personal.unlockAccount(web3.eth.defaultAccount, "user", web3.utils.toHex(0));

    }
});

function doGET(path, callback) {
    console.log("ICI");
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                console.log("1");
                console.log(xhr.status);
                // The request is done; did it work?
                if (xhr.status == 200) {
                    console.log("2");
                    // Yes, use `xhr.responseText` to resolve the promise
                    resolve(xhr.responseText);
                } else {
                    // No, reject the promise
                    reject(xhr);
                }
             }
        };
        xhr.open("GET", path);
        xhr.send();
    });
}

// Setting up default account
//web3.eth.defaultAccount = '0x004ec07d2329997267ec62b4166639513386f32e'; // account with large funds

//web3.eth.personal.unlockAccount(web3.eth.defaultAccount, "user", web3.utils.toHex(0));

//module.exports = function (n) { return n * 111 }


// reading JSON ABI
//var abi = JSON.parse(fs.readFileSync("./target/json/SmartContract.json"));

// converting Wasm binary to hex format
//var codeHex = '0x' + fs.readFileSync("./target/pwasm_contract.wasm").toString('hex');

// TODO: fs wont work if I am running something on browser, need to copy wasm contents & json into a js variable string

// Creating DonationContract

function deploy(smartContractTx) {
  smartContractTx.estimateGas({}, (err, gas) => {
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
              */
              /*
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
}

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

function transferEther(toAddress, amount) {
    web3.eth.sendTransaction({
      to: toAddress,
      from: web3.eth.defaultAccount,
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
