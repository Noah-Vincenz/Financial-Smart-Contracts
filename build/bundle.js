(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _resources = require("./resources.mjs");

/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */
var abi;
var codeHex;
var smartContract; // this does not exist for Kovan chain

function unlockAccount() {
  return new Promise(function (resolve, reject) {
    web3.personal.unlockAccount(web3.eth.defaultAccount, "user", web3.toHex(0), function (err, result) {
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
  return new Promise(function (resolve, reject) {
    web3.eth.estimateGas({
      to: web3.eth.defaultAccount,
      data: dataIn
    }, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result * 2);
      }
    });
  });
}

function instantiateNew(dataIn, gasIn) {
  return new Promise(function (resolve, reject) {
    // web3.fromAscii
    // web3.toChecksumAddress
    // web3.toHex
    smartContract["new"]({
      data: dataIn,
      from: web3.eth.defaultAccount,
      gas: gasIn
    }, function (err, contractInstance) {
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
  unlockAccount().then(function () {
    // comment for Kovan chain
    estimateGas(codeHex).then(function (estimatedGas) {
      console.log("Gas for deployment: " + estimatedGas);
      instantiateNew(codeHex, estimatedGas).then(function (result) {
        waitForReceipt(result[1]).then(function (receipt) {
          console.log(receipt);
          console.log("RECEIPT ABOVE");
          console.log(receipt.contractAddress);
          console.log(result[0]);
          var smartContractInstance = smartContract.at(receipt.contractAddress);
          console.log("new instance");
          console.log(smartContractInstance);
          smartContractInstance.ownBalance(function (err, result) {
            if (err) {
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
  return new Promise(function (resolve, reject) {
    var filter = web3.eth.filter('latest');
    filter.watch(function (err, blockHash) {
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
  return new Promise(function (resolve, reject) {
    web3.eth.getTransactionReceipt(transactionHash, function (err, receipt) {
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
  return new Promise(function (resolve, reject) {
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
    abi = _resources.ABI; // abi needs to be JS array instead of string

    codeHex = web3.fromAscii(_resources.CODE_HEX);
    smartContract = web3.eth.contract(abi); //web3.eth.defaultAccount = '0x7f023262356b002a4b7deb7ce057eb8b1aabb427'; // dev net account

    web3.eth.defaultAccount = '0x004ec07d2329997267ec62b4166639513386f32e'; // dev net account with large funds
    //web3.eth.defaultAccount = '0x8ce40D9956E7B8A89A1D73f4D4850c760EA20A56'; // Kovan account

    deployContract(smartContract); // 1) DEPLOYING NEW SMART CONTRACT -- THIS SHOULD BE THE WAY -- DEPLOYING A NEW CONTRACT BETWEEN TWO EXISTING PARTIES
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
    console.log('No Web3 Detected... using HTTP Provider');
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); //window.web3.eth.defaultAccount = '0x004ec07d2329997267ec62b4166639513386f32e'; // account with large funds
    //window.web3.eth.personal.unlockAccount(web3.eth.defaultAccount, "user", web3.utils.toHex(0));
  }
});

function doGET(path, callback) {
  console.log("ICI");
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        console.log("1");
        console.log(xhr.status); // The request is done; did it work?

        if (xhr.status == 200) {
          console.log("2"); // Yes, use `xhr.responseText` to resolve the promise

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
} // Setting up default account
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
  smartContractTx.estimateGas({}, function (err, gas) {
    if (gas) {
      gas = Math.round(gas * 1.2);
      SmartContractTx.send({
        from: web3.eth.defaultAccount,
        gas: web3.utils.toHex(gas)
      }).on('error', function (error) {
        console.log(error);
      }).on('transactionHash', function (transactionHash) {
        console.log("transactionHash: " + transactionHash);
      }).on('receipt', function (receipt) {
        console.log("receipt.contractAddress: " + receipt.contractAddress); // contains the new contract address
      }).on('confirmation', function (confirmationNumber, receipt) {
        console.log("confirmationNumber: " + confirmationNumber + "\nreceipt.contractAddress: " + receipt.contractAddress);
      }).then(function (newContractInstance) {
        console.log("Contract successfully deployed.");
        console.log(newContractInstance.options.address); // instance with the new contract address

        transferEther('0x7f023262356b002a4b7deb7ce057eb8b1aabb427', "1.5");
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
} //var SmartContractTx = SmartContract.deploy({data: codeHex, from: web3.eth.defaultAccount, arguments: ["String"]});


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

  web3.eth.estimateGas({
    from: '0x7f023262356b002a4b7deb7ce057eb8b1aabb427',
    data: getData
  }, function (err, gas) {
    if (gas) {
      gas = Math.round(gas * 1.2);
      contract.methods.give().send({
        from: '0x7f023262356b002a4b7deb7ce057eb8b1aabb427',
        gas: web3.utils.toHex(gas)
      }).on('error', function (error) {
        console.log(error);
      }).on('transactionHash', function (transactionHash) {
        console.log("transactionHash: " + transactionHash);
      }).on('receipt', function (receipt) {
        console.log("receipt.contractAddress: " + receipt.contractAddress); // contains the new contract address
      }).on('confirmation', function (confirmationNumber, receipt) {
        console.log("confirmationNumber: " + confirmationNumber + "\nreceipt.contractAddress: " + receipt.contractAddress);
      }).then(function (newContractInstance) {
        console.log("Contract successfully deployed.");
        console.log(newContractInstance.options.address); // instance with the new contract address
      });
    } else {
      console.error(err);
    }
  }); //return inst.registerPlayer(1, {from: account, value: web3.toWei(5, "ether")});
}

function transferEther(toAddress, amount) {
  web3.eth.sendTransaction({
    to: toAddress,
    from: web3.eth.defaultAccount,
    gasPrice: "20000000000",
    gas: "210000",
    value: web3.toWei(amount, "ether")
  }, function (err, transactionHash) {
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

},{"./resources.mjs":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CODE_HEX = exports.ABI = void 0;
var ABI = [{
  "type": "function",
  "name": "balanceOf",
  "inputs": [{
    "name": "_owner",
    "type": "address"
  }],
  "outputs": [{
    "name": "returnValue0",
    "type": "uint256"
  }],
  "constant": true,
  "payable": false
}, {
  "type": "function",
  "name": "ownBalance",
  "inputs": [],
  "outputs": [{
    "name": "returnValue0",
    "type": "uint256"
  }],
  "constant": true,
  "payable": false
}, {
  "type": "function",
  "name": "give",
  "inputs": [{
    "name": "_to",
    "type": "address"
  }, {
    "name": "_amount",
    "type": "uint256"
  }],
  "outputs": [{
    "name": "returnValue0",
    "type": "bool"
  }],
  "constant": false,
  "payable": false
}, {
  "type": "function",
  "name": "one",
  "inputs": [],
  "outputs": [],
  "constant": false,
  "payable": false
}, {
  "type": "function",
  "name": "printLn",
  "inputs": [{
    "name": "input",
    "type": "uint256"
  }],
  "outputs": [{
    "name": "returnValue0",
    "type": "uint256"
  }],
  "constant": true,
  "payable": false
}, {
  "type": "event",
  "name": "SmartContract",
  "inputs": [{
    "name": "indexed_from",
    "type": "address",
    "indexed": true
  }, {
    "name": "_value",
    "type": "uint256",
    "indexed": false
  }]
}, {
  "type": "event",
  "name": "Transfer",
  "inputs": [{
    "name": "indexed_from",
    "type": "address",
    "indexed": true
  }, {
    "name": "indexed_to",
    "type": "address",
    "indexed": true
  }, {
    "name": "_value",
    "type": "uint256",
    "indexed": false
  }]
}, {
  "type": "constructor",
  "inputs": [{
    "name": "addr1",
    "type": "string"
  }, {
    "name": "addr2",
    "type": "string"
  }]
}];
exports.ABI = ABI;
var CODE_HEX = '0x0061736d0100000001410b60047f7f7f7f0060027f7f017f60017f017f60027f7f0060017f006000017f60000060057f7f7f7f7f0060037f7f7f0060057f7f7f7f7f017f60037f7f7f017f0296010a03656e760c73746f726167655f72656164000303656e760673656e646572000403656e760576616c7565000403656e760c696e7075745f6c656e677468000503656e760b66657463685f696e707574000403656e7603726574000303656e760570616e6963000303656e760d73746f726167655f7772697465000303656e7604656c6f67000003656e76066d656d6f727902010210034342060303030303070303030308030002030603080306030403060703060404040306010009040102000102090404040004030403030303060103060803030a0a0a0a0604050170010a0a0616037f01418080040b7f0041e88e040b7f0041e88e040b07740a066d656d6f72790200195f5f696e6469726563745f66756e6374696f6e5f7461626c6501000b5f5f686561705f6261736503010a5f5f646174615f656e640302066d656d63707900460463616c6c004a0463616c6c0042066d656d636d700049076d656d6d6f76650047066d656d7365740048090f010041010b092d303132362b2e2f350ad2584202000b2e01017f230041c0006b22022400200241206a2001100b2002200241206a100c20002002100d200241c0006a24000b9c0101017f230041c0006b22022400200241286a41106a200141106a280000360200200241286a41086a200141086a29000037030020022001290000370328200241086a200241286a100e200041086a200241086a41086a290300370000200041106a200241086a41106a290300370000200041186a200241086a41186a290300370000200241013a000820002002290308370000200241c0006a24000b7601047f230041206b22022400200241186a22034200370300200241106a22044200370300200241086a2205420037030020024200370300200120021000200041186a2003290300370000200041106a2004290300370000200041086a200529030037000020002002290300370000200241206a24000bea0101027f230041c0006b220241186a200141186a290000370300200241106a200141106a290000370300200241086a200141086a29000037030020022001290000370300200241206a41186a4200370300200241206a41106a4200370300200241206a41086a420037030020024200370320411f2101200241206a2103024003402001417f460d012003200220016a2d00003a00002001417f6a2101200341016a21030c000b0b20002002290320370300200041186a200241206a41186a290300370300200041106a200241206a41106a290300370300200041086a200241206a41086a2903003703000b7d01047f230041206b22022400200241186a22034200370300200241106a22044200370300200241086a22054200370300200242003703002002410c6a4114200141141016200041186a2003290300370000200041106a2004290300370000200041086a200529030037000020002002290300370000200241206a24000b39000240024020022001490d0020042002490d012000200220016b3602042000200320016a3602000f0b200120021010000b200220041011000b05001021000b05001021000b960301087f230041106b22022400024002402001280208220341206a2204200128020422054d0d00200041033a0001410121010c010b200141086a2004360200200241086a2003200420012802002005100f4100210120024100411c20022802082206200228020c2207100f20022802002203200228020422086a2109200321050240024002400340200320016a2104200920056b41034d0d0120042d00000d02200320016a220441016a2d00000d02200441026a2d00000d02200141046a2101200441046a2105200441036a2d0000450d000c020b0b200820016b210103402001450d022001417f6a210120042d00002103200441016a21042003450d000b0b41012101200041013a00010c010b02400240024002402007411d490d002007411d460d012007411f490d022007411f460d03200041046a200628001c22014118742001410874418080fc07717220014108764180fe037120014118767272360200410021010c040b411c20071013000b411d411d1013000b411e20071013000b411f411f1013000b200020013a0000200241106a24000b05001021000b2e01017f2000200220016b2202101520002000280208220320026a360208200320002802006a20022001200210160b9c0101037f02400240024020002802042202200028020822036b20014f0d00200320016a22012003490d0120024101742203200120012003491b22014100480d01024002402002450d0020002802002104200110172203450d042003200420012002200220014b1b10461a2004200210180c010b200110172203450d030b20002003360200200041046a20013602000b0f0b1019000b20014101101a000b1900024020012003470d0020002002200110461a0f0b1021000bb00101027f230041106b220124000240024002402000450d00200041036a4102762200417f6a220241ff014b0d01200241027441e886046a2202450d01200141e486043602042001200228020036020c200041012001410c6a200141046a41b08004102c21002002200128020c3602000c020b410121000c010b200141002802e4860436020820004101200141086a4180850441c88004102c2100410020012802083602e486040b200141106a240020000bad0101017f230041106b2202240002402000450d00200220003602042001450d000240200141036a410276417f6a220041ff014b0d00200041027441e886046a2200450d00200241e486043602082002200028020036020c200241046a2002410c6a200241086a41b0800410372000200228020c3602000c010b200241002802e4860436020c200241046a2002410c6a4180850441c8800410374100200228020c3602e486040b200241106a24000b090041e080041038000b040000000b0d0020002001200120026a10140b3e01017f02402001417f4c0d00024002402001450d002001101722020d0120014101101a000b410121020b20002001360204200020023602000f0b101d000b05001019000b100002402001450d002000200110180b0b4c02017f017e230041106b22012400200141086a4120101c20012903082102200041203602002000410c6a428080808010370200200041146a420037020020002002370204200141106a24000b800101047f230041106b2202240002402001410c6a22032802002001280200470d00200241086a2204200328020036020020022001290204370300200141146a2802002103200220012802102205200141186a280200101b200041086a20042802003602002000200229030037020020052003101e200241106a24000f0b1021000b05001029000b39000240024020022001490d0020042002490d012000200220016b3602042000200320016a3602000f0b200120021010000b200220041011000b4d01017f230041206b22022400200241086a41106a200141106a280000360200200241086a41086a200141086a290000370300200220012900003703082000200241086a100e200241206a24000b05001019000b6401037f230041206b22012400200141086a41106a22024100360200200141086a41086a2203420037030020014200370308200141086a1001200041106a2002280200360000200041086a200329030037000020002001290308370000200141206a24000be50101037f230041c0006b22012400200141186a4200370300200141106a4200370300200141086a42003703002001420037030020011002200141206a41186a4200370300200141206a41106a4200370300200141206a41086a420037030020014200370320411f2102200141206a2103024003402002417f460d012003200120026a2d00003a00002002417f6a2102200341016a21030c000b0b20002001290320370300200041186a200141206a41186a290300370300200041106a200141206a41106a290300370300200041086a200141206a41086a290300370300200141c0006a24000b5901037f024002400240024010032201450d002001417f4c0d02200110172202450d0320021004200121030c010b41002103410121020b2000200336020420002002360200200020013602080f0b1024000b20014101101a000b0900200020011005000b0900410041001006000b7002017f027e200041186a2100200141186a21024103210102400240024003402001417f460d01200141034b0d032000290300220320022903002204540d02200041786a2100200241786a21022001417f6a210120032004580d000b41010f0b41000f0b41ff010f0b200141041013000b920101027f230041106b2204240020042001280200220128020036020c200241026a220220026c220241801020024180104b1b220541042004410c6a4180850441988004102c21022001200428020c360200024002402002450d00200242003702042002200220054102746a410272360200410021010c010b410121010b2000200236020420002001360200200441106a24000b6b01027f230041106b22052400024020002001200220032004103322060d00200541086a200320002001200428020c1100004100210620052802080d00200528020c220620022802003602082002200636020020002001200220032004103321060b200541106a240020060b02000b040020010b040041000b7201017f41002104024002404100200241027422022003410374418080016a220320032002491b418780046a2202411076400022034110742003417f461b2203450d00200342003702042003200320024180807c716a4102723602000c010b410121040b20002003360204200020043602000b05004180040b040041010bc90301067f2001417f6a2105410020016b21062000410274210720022802002108200441106a2109024002400240024003402008450d012008210102400340200141086a210420012802082208410171450d0120042008417e71360200024002402001280204417c712208450d004100200820082d00004101711b21080c010b410021080b20011034024020012d0000410271450d00200820082802004102723602000b20022008360200200821010c000b0b02402001280200417c71220a20046b2007490d0020042003200020092802001101004102746a41086a200a20076b20067122084d0d03200428020021082005200471450d040b200220083602000c000b0b41000f0b20084100360200200841786a2208420037020020082001280200417c71360200024020012802002202417c712204450d0020024102710d00200420042802044103712008723602040b20082008280204410371200172360204200141086a22042004280200417e7136020020012001280200220441037120087222023602002004410271450d0120012002417d71360200200820082802004102723602000c010b20022008417c71360200200121080b20082008280200410172360200200841086a0b8f0101027f0240024020002802002201417c712202450d0020014102710d00200220022802044103712000280204417c7172360204200041046a21020c010b200041046a21020b024020022802002202417c712201450d00200120012802004103712000280200417c7172360200200028020421020b200041046a2002410371360200200020002802004103713602000b02000b02000bb80101017f200028020022044100360200200441786a22002000280200417e71360200024020022003280214110200450d0002402004417c6a280200417c712202450d0020022d00004101710d0020001034024020002d0000410271450d00200220022802004102723602000b0f0b20002802002202417c712203450d0020024102710d0020032d00004101710d0020042003280208417c71360200200320004101723602080f0b20042001280200360200200120003602000b05001021000b880402077f017e230041306b22022400200241106a41186a200141186a290300370300200241106a41106a200141106a290300370300200241106a41086a200141086a290300370300200220012903003703102000410c6a2201280200220341206a210402400240200341604f0d00200041046a2205412010152005280200200128020022066a21074100210102400340200720016a2105200141016a2208411f4b0d01200541003a0000200821010c000b0b200541003a0000200620016a41016a21010c010b4100210102400340200320016a41206a220520034f0d01200541016a2005490d01200141016a21010c000b0b200320016b21010b2000410c6a2001360200200241086a20032004200041046a28020020011022200241286a210541002108200228020c21072002280208210041032103410021010240024002400340200141034b0d01200220082007200020071022200341034b0d02200228020441074d0d03200141016a2101200228020020052903002209423886200942288642808080808080c0ff0083842009421886428080808080e03f8320094208864280808080f01f838484200942088842808080f80f832009421888428080fc07838420094228884280fe03832009423888848484370000200841086a2108200541786a21052003417f6a21030c000b0b200241306a24000f0b200341041013000b418080041038000b05001021000bf80202047f017e230041c0006b22022400200241186a2203200141186a290300370300200241106a200141106a290300370300200241086a200141086a29030037030020022001290300370300200241206a41186a4200370300200241206a41106a4200370300200241206a41086a42003703002002420037032041002101200241206a210441032105024002400340200141034b0d01200541034b0d02200420032903002206423886200642288642808080808080c0ff0083842006421886428080808080e03f8320064208864280808080f01f838484200642088842808080f80f832006421888428080fc07838420064228884280fe03832006423888848484370000200441086a21042005417f6a2105200341786a2103200141016a21010c000b0b20002002290320370000200041186a200241206a41186a290300370000200041106a200241206a41106a290300370000200041086a200241206a41086a290300370000200241c0006a24000f0b417f41041013000be50703017f017e087f230041306b22022400200241206a200110120240024002400240024020022903202203a741ff01714101470d00200041013a0000200020034208883c00010c010b200128020422042003422088a72205490d01200241003602182002200420056b3602142002200128020020056a360210200241206a200241106a1012024020022903202203a741ff01714101470d00200041013a0000200020034208883c00010c010b200241186a28020022012003422088a722046a22062001490d02200228021422052006490d03200228021020016a2105024002402004450d00200441796a4100200441074b1b2107410021010340024002400240024002400240200520016a22082d00002209411874411875220a4100480d002008410371450d01200141016a21010c050b200941fe82046a2d000022084104460d0220084103460d0120084102470d07200141016a220120044f0d07200520016a2d000041c00171418001460d030c070b0240200120074f0d000340200520016a220841046a280200200828020072418081828478710d01200141086a22012007490d000b0b200120044f0d030340200520016a2c00004100480d04200141016a22012004490d000c040b0b200141016a220820044f0d05200520086a2d0000210802400240200a4160470d00200841607141ff017141a001460d010b0240200841ff0171220941bf014b220b0d00200a411f6a41ff0171410b4b0d0020084118744118754100480d010b02402009419f014b0d00200a416d470d0020084118744118754100480d010b200b0d06200a41fe017141ee01470d06200841187441187541004e0d060b200141026a220120044f0d05200520016a2d000041c00171418001460d010c050b200141016a220820044f0d04200520086a2d0000210802400240200a4170470d00200841f0006a41ff0171412f4d0d010b0240200841ff0171220941bf014b0d00200a410f6a41ff017141024b0d0020084118744118754100480d010b2009418f014b0d05200a4174470d05200841187441187541004e0d050b200141026a220820044f0d04200520086a2d000041c00171418001470d04200141036a220120044f0d04200520016a2d000041c00171418001470d040b200141016a21010b20012004490d000b0b200241086a2004101c2002410036022820022002290308370320200241206a20052004101b2002280228210120022903202103200241186a200641206a2006411f7122056b200620051b360200200041046a20033702002000410c6a2001360200200041003a00000c010b200041810a3b01000b200241306a24000f0b200520041010000b200120061010000b200620051011000bc50201037f230041c0006b220224000240024002402001280208220341206a220420012802044d0d0020004181063b01000c010b200141086a2004360200200341604f0d0120012802002101200241386a4200370300200241306a4200370300200241206a41086a420037030020024200370320200120036a2104411f2101200241206a2103024003402001417f460d012003200420016a2d00003a00002001417f6a2101200341016a21030c000b0b200241186a2201200241206a41186a290300370300200241106a2203200241206a41106a290300370300200241086a2204200241206a41086a29030037030020022002290320370300200041003a0000200041206a2001290300370300200041186a2003290300370300200041106a2004290300370300200041086a20022903003703000b200241c0006a24000f0b200320041010000be906010d7f230041d0016b22022400024002402001280208220341206a2204200128020422054d0d00200241f0006a41176a20024190016a41176a290000370000200241f0006a41106a20024190016a41106a290300370300200241f0006a41086a20024190016a41086a2903003703002002200229039001370370200241306a41176a200241d0006a41176a290000370000200241306a41106a200241d0006a41106a290300370300200241306a41086a200241d0006a41086a29030037030020022002290350370330200041033a0001410121010c010b200141086a2004360200200241086a2003200420012802002005100f200228020c210420022802082103200241c8016a22064200370300200241b0016a41106a4200370300200241b0016a41086a4200370300200242003703b0014100210120024100412020032004100f200241b0016a412020022802002002280204101620024190016a41086a2204200241b0016a41096a220729000037030020024190016a41106a2203200241b0016a41116a220829000037030020024190016a41176a22052006290000370000200220022900b1013703900120022d00b0012109200241f0006a41176a220a2005290000370000200241f0006a41106a22052003290300370300200241f0006a41086a220b20042903003703002002200229039001370370200241d0006a41176a220c200a290000370000200241d0006a41106a220a2005290300370300200241d0006a41086a220d200b29030037030020022002290370370350200241306a41176a220e200c290000370000200241306a41106a220c200a290300370300200241306a41086a220a200d29030037030020022002290350370330200241106a41176a220d200e290000370000200241106a41106a220e200c290300370300200241106a41086a220c200a290300370300200220022903303703102007200c2903003700002008200e2903003700002006200d290000370000200220093a00b001200220022903103700b1012003410036020020044200370300200242003703900120024190016a4114200241bc016a4114101620052003280200360200200b20042903003703002002200229039001370370200041116a2005280200360000200041096a200b290300370000200020022903703700010b200020013a0000200241d0016a24000b930401067f230041c0016b22002400200041086a10272000280210210120002802082102200041e8006a102620004188016a41186a2203420037030020004188016a41106a2204420037030020004188016a41086a2205420037030020004200370388010240200041e8006a20004188016a10400d002000200136021c200020023602182000410036022020004188016a200041186a103c200041286a20004188016a104120004188016a200041186a103c200041386a20004188016a1041200041c8006a41186a4200370000200041c8006a41116a4200370000200041c8006a41096a420037000020004200370049200041013a00482003420037030020044200370300200542003703002000420037038801200041e8006a20004188016a103b200041c8006a200041e8006a1007200041e8006a41186a4200370000200041e8006a41116a4200370000200041e8006a41096a420037000020004200370069200041033a0068200041c8006a10252004410036020020054200370300200042003703880120004188016a4114200041c8006a41141016200041a8016a41106a2004280200360200200041a8016a41086a200529030037030020002000290388013703a80120004188016a200041a8016a100e200041e8006a20004188016a10072000280238200028023c101e2000280228200028022c101e2002200028020c101e200041c0016a24000f0b41c081041038000b0f0020002001102a41ff01714101460b3500024020012d00004101460d00200041086a2001410c6a2802003602002000200141046a2902003702000f0b20012d0001103a000b2f01017f230041206b22002400200041106a10272000200028021020002802181043200028020020002802081028000bd81802057f0b7e23004190036b2203240002400240024002400240024002400240024002400240200241034d0d000240024002400240024002400240200128000022044118742004410874418080fc07717220044108764180fe037120044118767272220441d1afdc8079460d0002400240024020044193c6f7a57d460d002002417c6a2102200141046a2101200441f7918e807f460d02200441f0faee9304460d01200441b184828507470d0b200341f0026a1026200341d0016a41186a22044200370300200341d0016a41106a22054200370300200341d0016a41086a22064200370300200342003703d001200341f0026a200341d0016a10400d0c200320023602b402200320013602b002200341003602b802200341d0016a200341b0026a103e200341d0026a200341d0016a1044200341f0026a200341d0026a100a200341d0026a101f2004200341f0026a41186a2903003703002005200341f0026a41106a2903003703002006200341f0026a41086a290300370300200320032903f0023703d001200341d0026a200341d0016a10392004200341d0026a41186a2802003602002005200341d0026a41106a2903003703002006200341d0026a41086a290300370300200320032903d0023703d0012000200341d0016a10200c140b200341f0026a1026200341d0016a41186a22044200370300200341d0016a41106a22014200370300200341d0016a41086a22024200370300200342003703d001200341f0026a200341d0016a10400d0c200341f0026a101f2004420037030020014200370300200342003703d801200342f0a2043703d001200341f0026a200341d0016a10392004200341f0026a41186a2802003602002001200341f0026a41106a2903003703002002200341f0026a41086a290300370300200320032903f0023703d0012000200341d0016a10200c130b200341f0026a1026200341d0016a41186a22044200370300200341d0016a41106a22054200370300200341d0016a41086a22064200370300200342003703d001200341f0026a200341d0016a10400d0c200320023602b402200320013602b002200341003602b802200341d0016a200341b0026a103d200341f0026a200341d0016a1045200341d0026a101f2004200341f0026a41186a2903003703002005200341f0026a41106a2903003703002006200341f0026a41086a290300370300200320032903f0023703d001200341d0026a200341d0016a10392004200341d0026a41186a2802003602002005200341d0026a41106a2903003703002006200341d0026a41086a290300370300200320032903d0023703d0012000200341d0016a10200c120b200341f0026a1026200341e8016a22054200370300200341e0016a22064200370300200341d8016a22074200370300200342003703d001200341f0026a200341d0016a10400d0c20032002360204200320013602004100210420034100360208200341d0016a2003103e200341106a200341d0016a1044200341d0016a2003103d200341286a200341d0016a1045200341c8006a1025200341e0006a200341c8006a100a20034180016a200341106a100a200542003703002006420037030020074200370300200342003703d001200341286a200341d0016a41201049450d0f200341e0006a200341286a102a41ff017141ff01460d0f200341106a200341c8006a41141049450d0120032903682208200329033022097d220a2008562101200329034021082003290338210b2003290378210c2003290370210d2003290360220e2003290328220f7d2210200e580d02200a427f7c220e200a5620016a21010c030b200341f0026a1026200341d0016a41186a4200370300200341e0016a4200370300200341d0016a41086a4200370300200342003703d001200341f0026a200341d0016a10400d0c200341d0016a41186a4200370000200341d0016a41116a4200370000200341d0016a41096a4200370000200342003700d101200341033a00d001200341d0026a200341d0016a100c200341b0026a200341d0026a100d200341d0026a41186a4200370000200341d0026a41116a4200370000200341d0026a41096a4200370000200342003700d102200341033a00d00220032903c802210d20032903c002210b20032903b802210802400240024020032903b002220c42017c220a200c5a0d00200842017c220c20085a0d01200b200c200854ad7c2208200b5a0d06200d2008200b54ad7c2209200d5a0d1241f880041038000b200d21092008210c0c010b200d21090b200b21080c0f0b410021040c0d0b200a210e0b200d200b7d220a200d5621042001450d01200a2001ad7d2211200a5620046a21040c020b200d21090c0b0b200a21110b200c20087d220d200c562101024002402004450d00200d2004ad7d2212200d5620016a0d010c090b200d21122001450d080b41f880041038000b419081041038000b41a881041038000b41c081041038000b41c081041038000b41c081041038000b41c081041038000b41c081041038000b200329038801220c20097c220a200c542101200329039801210c200329039001210d024002402003290380012209200f7c220f20095a0d00200a42017c2209200a5420016a21010c010b200a21090b200d200b7c220b200d542104024002402001450d00200b2001ad7c220d200b5420046a21040c010b200b210d0b200c20087c2208200c5421010240024002402004450d0020082004ad7c220b20085420016a0d010c020b2008210b2001450d010b41f880041038000b200341d0026a200341c8006a100b2003200e3703d801200320103703d001200320113703e001200320123703e801200341f0026a200341d0016a103b200341d0026a200341f0026a1007200341f0026a200341106a100b200320093703d8012003200f3703d0012003200d3703e0012003200b3703e801200341d0026a200341d0016a103b200341f0026a200341d0026a1007200341a0016a41106a200341c8006a41106a280200360200200341a0016a41086a200341c8006a41086a290300370300200320032903483703a001200341b8016a41106a200341106a41106a280200360200200341b8016a41086a200341106a41086a290300370300200320032903103703b801200342aaabaeb99afe98e2a17f3700ff0220034296d0d4d7d5a9fd91b37f37008703200341b0026a41106a2204200329008003370300200341e984c3c5063600f802200341fcef003b00fc022003418d013a00fe02200341b0026a41086a220120032900f802370300200341ef013a008f03200341b0026a41186a2202200329008803370300200342dde5cbeabac3b8e49b7f3700f002200342dde5cbeabac3b8e49b7f3703b002200341d0026a200341a0016a1023200341f0026a200341b8016a1023200341d0016a41186a2002290300370300200341d0016a41106a2004290300370300200341d0016a41086a2001290300370300200341f8016a200341d0026a41086a220529030037030020034180026a200341d0026a41106a220629030037030020034188026a200341d0026a41186a220729030037030020034198026a200341f0026a41086a2204290300370300200341a0026a200341f0026a41106a2201290300370300200341a8026a200341f0026a41186a2202290300370300200320032903b0023703d001200320032903d0023703f001200320032903f00237039002200341d0026a101f2002200341286a41186a2903003703002001200341286a41106a2903003703002004200341286a41086a290300370300200320032903283703f002200341d0026a200341f0026a1039200220072802003602002001200629030037030020042005290300370300200320032903d0023703f002200341b0026a200341f0026a1020200341d0016a410320032802b002220420032802b8021008200420032802b402101e410121040b200341d0026a101f20034187036a4200370000200341f0026a41106a4200370300200341f0026a41086a4200370300200342003703f002200320043a008f03200341d0026a410472200341f0026a20034190036a1014200341d0016a41186a200341d0026a41186a280200360200200341d0016a41106a200341d0026a41106a290300370300200341d0016a41086a200341d0026a41086a290300370300200320032903d0023703d0012000200341d0016a10200c010b2003200c3703d8012003200a3703d001200320083703e001200320093703e801200341f0026a200341d0016a103b200341d0026a200341f0026a100720004100360208200042013702000b20034190036a24000b4b01017f200141016a2102024020012d00004101460d0020002002290000370000200041106a200241106a280000360000200041086a200241086a2900003700000f0b20022d0000103a000b5500024020012d00004101460d00200041186a200141206a290300370300200041106a200141186a290300370300200041086a200141106a2903003703002000200141086a2903003703000f0b20012d0001103a000b3001017f410021030240034020022003460d01200020036a200120036a2d00003a0000200341016a21030c000b0b20000b6701017f02400240200120004f0d0003402002450d02200020026a417f6a200120026a417f6a2d00003a00002002417f6a21020c000b0b2000210303402002450d01200320012d00003a00002002417f6a2102200341016a2103200141016a21010c000b0b20000b2a01017f410021030240034020022003460d01200020036a20013a0000200341016a21030c000b0b20000b4801047f410021034100210402400340200420024f0d01200120046a2105200020046a2106200441016a210420062d0000220620052d00002205460d000b200620056b21030b20030b0e00103f41ec8e04419aeb0010050b0ba37a0400418080040bd801d800010020000000f800010062000000d3070000090000000100000000000000010000000200000003000000040000000500000004000000040000000600000007000000080000000900000000000000010000000200000003000000040000005a010100110000006b01010013000000f502000005000000800201001d0000009d0201005d00000029000000020000005203010012000000300301000a0000002a000000020000003a03010018000000300301000a0000002a00000002000000fa02010036000000300301000a0000002a000000020000000041d881040b8c05617373657274696f6e206661696c65643a2038203c3d206275662e6c656e28292f55736572732f6e6f61682d76696e63656e7a6e6f65682f2e636172676f2f72656769737472792f7372632f6769746875622e636f6d2d316563633632393964623965633832332f627974656f726465722d312e332e302f7372632f6c69622e72736361706163697479206f766572666c6f776c6962616c6c6f632f7261775f7665632e727301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000202020202020202020202020202020202020202020202020202020202020303030303030303030303030303030304040404040000000000000000000000000061726974686d65746963206f7065726174696f6e206f766572666c6f772f55736572732f6e6f61682d76696e63656e7a6e6f65682f2e636172676f2f72656769737472792f7372632f6769746875622e636f6d2d316563633632393964623965633832332f75696e742d302e352e302f7372632f6c69622e7273556e61626c6520746f206163636570742076616c756520696e206e6f6e2d70617961626c6520636f6e7374727563746f722063616c6c7372632f6c69622e7273496e76616c6964206d6574686f64207369676e6174757265496e76616c69642061626920696e766f6b650041e486040b840800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041ec8e040b9a6b0061736d0100000001410b60047f7f7f7f0060027f7f017f60017f017f60027f7f0060017f006000017f60000060057f7f7f7f7f0060037f7f7f0060057f7f7f7f7f017f60037f7f7f017f0296010a03656e760c73746f726167655f72656164000303656e760673656e646572000403656e760576616c7565000403656e760c696e7075745f6c656e677468000503656e760b66657463685f696e707574000403656e7603726574000303656e760570616e6963000303656e760d73746f726167655f7772697465000303656e7604656c6f67000003656e76066d656d6f727902010210034241060303030303070303030308030002030603080306030403060703060404040306010009040102000102090404040004030403030303060103060803030a0a0a0a04050170010a0a0616037f01418080040b7f0041e88e040b7f0041e88e040b07760a066d656d6f72790200195f5f696e6469726563745f66756e6374696f6e5f7461626c6501000b5f5f686561705f6261736503010a5f5f646174615f656e640302066d656d6370790046066465706c6f79003f0463616c6c0042066d656d636d700049076d656d6d6f76650047066d656d7365740048090f010041010b092d303132362b2e2f350ac3584102000b2e01017f230041c0006b22022400200241206a2001100b2002200241206a100c20002002100d200241c0006a24000b9c0101017f230041c0006b22022400200241286a41106a200141106a280000360200200241286a41086a200141086a29000037030020022001290000370328200241086a200241286a100e200041086a200241086a41086a290300370000200041106a200241086a41106a290300370000200041186a200241086a41186a290300370000200241013a000820002002290308370000200241c0006a24000b7601047f230041206b22022400200241186a22034200370300200241106a22044200370300200241086a2205420037030020024200370300200120021000200041186a2003290300370000200041106a2004290300370000200041086a200529030037000020002002290300370000200241206a24000bea0101027f230041c0006b220241186a200141186a290000370300200241106a200141106a290000370300200241086a200141086a29000037030020022001290000370300200241206a41186a4200370300200241206a41106a4200370300200241206a41086a420037030020024200370320411f2101200241206a2103024003402001417f460d012003200220016a2d00003a00002001417f6a2101200341016a21030c000b0b20002002290320370300200041186a200241206a41186a290300370300200041106a200241206a41106a290300370300200041086a200241206a41086a2903003703000b7d01047f230041206b22022400200241186a22034200370300200241106a22044200370300200241086a22054200370300200242003703002002410c6a4114200141141016200041186a2003290300370000200041106a2004290300370000200041086a200529030037000020002002290300370000200241206a24000b39000240024020022001490d0020042002490d012000200220016b3602042000200320016a3602000f0b200120021010000b200220041011000b05001021000b05001021000b960301087f230041106b22022400024002402001280208220341206a2204200128020422054d0d00200041033a0001410121010c010b200141086a2004360200200241086a2003200420012802002005100f4100210120024100411c20022802082206200228020c2207100f20022802002203200228020422086a2109200321050240024002400340200320016a2104200920056b41034d0d0120042d00000d02200320016a220441016a2d00000d02200441026a2d00000d02200141046a2101200441046a2105200441036a2d0000450d000c020b0b200820016b210103402001450d022001417f6a210120042d00002103200441016a21042003450d000b0b41012101200041013a00010c010b02400240024002402007411d490d002007411d460d012007411f490d022007411f460d03200041046a200628001c22014118742001410874418080fc07717220014108764180fe037120014118767272360200410021010c040b411c20071013000b411d411d1013000b411e20071013000b411f411f1013000b200020013a0000200241106a24000b05001021000b2e01017f2000200220016b2202101520002000280208220320026a360208200320002802006a20022001200210160b9c0101037f02400240024020002802042202200028020822036b20014f0d00200320016a22012003490d0120024101742203200120012003491b22014100480d01024002402002450d0020002802002104200110172203450d042003200420012002200220014b1b10461a2004200210180c010b200110172203450d030b20002003360200200041046a20013602000b0f0b1019000b20014101101a000b1900024020012003470d0020002002200110461a0f0b1021000bb00101027f230041106b220124000240024002402000450d00200041036a4102762200417f6a220241ff014b0d01200241027441e886046a2202450d01200141e486043602042001200228020036020c200041012001410c6a200141046a41b08004102c21002002200128020c3602000c020b410121000c010b200141002802e4860436020820004101200141086a4180850441c88004102c2100410020012802083602e486040b200141106a240020000bad0101017f230041106b2202240002402000450d00200220003602042001450d000240200141036a410276417f6a220041ff014b0d00200041027441e886046a2200450d00200241e486043602082002200028020036020c200241046a2002410c6a200241086a41b0800410372000200228020c3602000c010b200241002802e4860436020c200241046a2002410c6a4180850441c8800410374100200228020c3602e486040b200241106a24000b090041e080041038000b040000000b0d0020002001200120026a10140b3e01017f02402001417f4c0d00024002402001450d002001101722020d0120014101101a000b410121020b20002001360204200020023602000f0b101d000b05001019000b100002402001450d002000200110180b0b4c02017f017e230041106b22012400200141086a4120101c20012903082102200041203602002000410c6a428080808010370200200041146a420037020020002002370204200141106a24000b800101047f230041106b2202240002402001410c6a22032802002001280200470d00200241086a2204200328020036020020022001290204370300200141146a2802002103200220012802102205200141186a280200101b200041086a20042802003602002000200229030037020020052003101e200241106a24000f0b1021000b05001029000b39000240024020022001490d0020042002490d012000200220016b3602042000200320016a3602000f0b200120021010000b200220041011000b4d01017f230041206b22022400200241086a41106a200141106a280000360200200241086a41086a200141086a290000370300200220012900003703082000200241086a100e200241206a24000b05001019000b6401037f230041206b22012400200141086a41106a22024100360200200141086a41086a2203420037030020014200370308200141086a1001200041106a2002280200360000200041086a200329030037000020002001290308370000200141206a24000be50101037f230041c0006b22012400200141186a4200370300200141106a4200370300200141086a42003703002001420037030020011002200141206a41186a4200370300200141206a41106a4200370300200141206a41086a420037030020014200370320411f2102200141206a2103024003402002417f460d012003200120026a2d00003a00002002417f6a2102200341016a21030c000b0b20002001290320370300200041186a200141206a41186a290300370300200041106a200141206a41106a290300370300200041086a200141206a41086a290300370300200141c0006a24000b5901037f024002400240024010032201450d002001417f4c0d02200110172202450d0320021004200121030c010b41002103410121020b2000200336020420002002360200200020013602080f0b1024000b20014101101a000b0900200020011005000b0900410041001006000b7002017f027e200041186a2100200141186a21024103210102400240024003402001417f460d01200141034b0d032000290300220320022903002204540d02200041786a2100200241786a21022001417f6a210120032004580d000b41010f0b41000f0b41ff010f0b200141041013000b920101027f230041106b2204240020042001280200220128020036020c200241026a220220026c220241801020024180104b1b220541042004410c6a4180850441988004102c21022001200428020c360200024002402002450d00200242003702042002200220054102746a410272360200410021010c010b410121010b2000200236020420002001360200200441106a24000b6b01027f230041106b22052400024020002001200220032004103322060d00200541086a200320002001200428020c1100004100210620052802080d00200528020c220620022802003602082002200636020020002001200220032004103321060b200541106a240020060b02000b040020010b040041000b7201017f41002104024002404100200241027422022003410374418080016a220320032002491b418780046a2202411076400022034110742003417f461b2203450d00200342003702042003200320024180807c716a4102723602000c010b410121040b20002003360204200020043602000b05004180040b040041010bc90301067f2001417f6a2105410020016b21062000410274210720022802002108200441106a2109024002400240024003402008450d012008210102400340200141086a210420012802082208410171450d0120042008417e71360200024002402001280204417c712208450d004100200820082d00004101711b21080c010b410021080b20011034024020012d0000410271450d00200820082802004102723602000b20022008360200200821010c000b0b02402001280200417c71220a20046b2007490d0020042003200020092802001101004102746a41086a200a20076b20067122084d0d03200428020021082005200471450d040b200220083602000c000b0b41000f0b20084100360200200841786a2208420037020020082001280200417c71360200024020012802002202417c712204450d0020024102710d00200420042802044103712008723602040b20082008280204410371200172360204200141086a22042004280200417e7136020020012001280200220441037120087222023602002004410271450d0120012002417d71360200200820082802004102723602000c010b20022008417c71360200200121080b20082008280200410172360200200841086a0b8f0101027f0240024020002802002201417c712202450d0020014102710d00200220022802044103712000280204417c7172360204200041046a21020c010b200041046a21020b024020022802002202417c712201450d00200120012802004103712000280200417c7172360200200028020421020b200041046a2002410371360200200020002802004103713602000b02000b02000bb80101017f200028020022044100360200200441786a22002000280200417e71360200024020022003280214110200450d0002402004417c6a280200417c712202450d0020022d00004101710d0020001034024020002d0000410271450d00200220022802004102723602000b0f0b20002802002202417c712203450d0020024102710d0020032d00004101710d0020042003280208417c71360200200320004101723602080f0b20042001280200360200200120003602000b05001021000b880402077f017e230041306b22022400200241106a41186a200141186a290300370300200241106a41106a200141106a290300370300200241106a41086a200141086a290300370300200220012903003703102000410c6a2201280200220341206a210402400240200341604f0d00200041046a2205412010152005280200200128020022066a21074100210102400340200720016a2105200141016a2208411f4b0d01200541003a0000200821010c000b0b200541003a0000200620016a41016a21010c010b4100210102400340200320016a41206a220520034f0d01200541016a2005490d01200141016a21010c000b0b200320016b21010b2000410c6a2001360200200241086a20032004200041046a28020020011022200241286a210541002108200228020c21072002280208210041032103410021010240024002400340200141034b0d01200220082007200020071022200341034b0d02200228020441074d0d03200141016a2101200228020020052903002209423886200942288642808080808080c0ff0083842009421886428080808080e03f8320094208864280808080f01f838484200942088842808080f80f832009421888428080fc07838420094228884280fe03832009423888848484370000200841086a2108200541786a21052003417f6a21030c000b0b200241306a24000f0b200341041013000b418080041038000b05001021000bf80202047f017e230041c0006b22022400200241186a2203200141186a290300370300200241106a200141106a290300370300200241086a200141086a29030037030020022001290300370300200241206a41186a4200370300200241206a41106a4200370300200241206a41086a42003703002002420037032041002101200241206a210441032105024002400340200141034b0d01200541034b0d02200420032903002206423886200642288642808080808080c0ff0083842006421886428080808080e03f8320064208864280808080f01f838484200642088842808080f80f832006421888428080fc07838420064228884280fe03832006423888848484370000200441086a21042005417f6a2105200341786a2103200141016a21010c000b0b20002002290320370000200041186a200241206a41186a290300370000200041106a200241206a41106a290300370000200041086a200241206a41086a290300370000200241c0006a24000f0b417f41041013000be50703017f017e087f230041306b22022400200241206a200110120240024002400240024020022903202203a741ff01714101470d00200041013a0000200020034208883c00010c010b200128020422042003422088a72205490d01200241003602182002200420056b3602142002200128020020056a360210200241206a200241106a1012024020022903202203a741ff01714101470d00200041013a0000200020034208883c00010c010b200241186a28020022012003422088a722046a22062001490d02200228021422052006490d03200228021020016a2105024002402004450d00200441796a4100200441074b1b2107410021010340024002400240024002400240200520016a22082d00002209411874411875220a4100480d002008410371450d01200141016a21010c050b200941fe82046a2d000022084104460d0220084103460d0120084102470d07200141016a220120044f0d07200520016a2d000041c00171418001460d030c070b0240200120074f0d000340200520016a220841046a280200200828020072418081828478710d01200141086a22012007490d000b0b200120044f0d030340200520016a2c00004100480d04200141016a22012004490d000c040b0b200141016a220820044f0d05200520086a2d0000210802400240200a4160470d00200841607141ff017141a001460d010b0240200841ff0171220941bf014b220b0d00200a411f6a41ff0171410b4b0d0020084118744118754100480d010b02402009419f014b0d00200a416d470d0020084118744118754100480d010b200b0d06200a41fe017141ee01470d06200841187441187541004e0d060b200141026a220120044f0d05200520016a2d000041c00171418001460d010c050b200141016a220820044f0d04200520086a2d0000210802400240200a4170470d00200841f0006a41ff0171412f4d0d010b0240200841ff0171220941bf014b0d00200a410f6a41ff017141024b0d0020084118744118754100480d010b2009418f014b0d05200a4174470d05200841187441187541004e0d050b200141026a220820044f0d04200520086a2d000041c00171418001470d04200141036a220120044f0d04200520016a2d000041c00171418001470d040b200141016a21010b20012004490d000b0b200241086a2004101c2002410036022820022002290308370320200241206a20052004101b2002280228210120022903202103200241186a200641206a2006411f7122056b200620051b360200200041046a20033702002000410c6a2001360200200041003a00000c010b200041810a3b01000b200241306a24000f0b200520041010000b200120061010000b200620051011000bc50201037f230041c0006b220224000240024002402001280208220341206a220420012802044d0d0020004181063b01000c010b200141086a2004360200200341604f0d0120012802002101200241386a4200370300200241306a4200370300200241206a41086a420037030020024200370320200120036a2104411f2101200241206a2103024003402001417f460d012003200420016a2d00003a00002001417f6a2101200341016a21030c000b0b200241186a2201200241206a41186a290300370300200241106a2203200241206a41106a290300370300200241086a2204200241206a41086a29030037030020022002290320370300200041003a0000200041206a2001290300370300200041186a2003290300370300200041106a2004290300370300200041086a20022903003703000b200241c0006a24000f0b200320041010000be906010d7f230041d0016b22022400024002402001280208220341206a2204200128020422054d0d00200241f0006a41176a20024190016a41176a290000370000200241f0006a41106a20024190016a41106a290300370300200241f0006a41086a20024190016a41086a2903003703002002200229039001370370200241306a41176a200241d0006a41176a290000370000200241306a41106a200241d0006a41106a290300370300200241306a41086a200241d0006a41086a29030037030020022002290350370330200041033a0001410121010c010b200141086a2004360200200241086a2003200420012802002005100f200228020c210420022802082103200241c8016a22064200370300200241b0016a41106a4200370300200241b0016a41086a4200370300200242003703b0014100210120024100412020032004100f200241b0016a412020022802002002280204101620024190016a41086a2204200241b0016a41096a220729000037030020024190016a41106a2203200241b0016a41116a220829000037030020024190016a41176a22052006290000370000200220022900b1013703900120022d00b0012109200241f0006a41176a220a2005290000370000200241f0006a41106a22052003290300370300200241f0006a41086a220b20042903003703002002200229039001370370200241d0006a41176a220c200a290000370000200241d0006a41106a220a2005290300370300200241d0006a41086a220d200b29030037030020022002290370370350200241306a41176a220e200c290000370000200241306a41106a220c200a290300370300200241306a41086a220a200d29030037030020022002290350370330200241106a41176a220d200e290000370000200241106a41106a220e200c290300370300200241106a41086a220c200a290300370300200220022903303703102007200c2903003700002008200e2903003700002006200d290000370000200220093a00b001200220022903103700b1012003410036020020044200370300200242003703900120024190016a4114200241bc016a4114101620052003280200360200200b20042903003703002002200229039001370370200041116a2005280200360000200041096a200b290300370000200020022903703700010b200020013a0000200241d0016a24000b930401067f230041c0016b22002400200041086a10272000280210210120002802082102200041e8006a102620004188016a41186a2203420037030020004188016a41106a2204420037030020004188016a41086a2205420037030020004200370388010240200041e8006a20004188016a10400d002000200136021c200020023602182000410036022020004188016a200041186a103c200041286a20004188016a104120004188016a200041186a103c200041386a20004188016a1041200041c8006a41186a4200370000200041c8006a41116a4200370000200041c8006a41096a420037000020004200370049200041013a00482003420037030020044200370300200542003703002000420037038801200041e8006a20004188016a103b200041c8006a200041e8006a1007200041e8006a41186a4200370000200041e8006a41116a4200370000200041e8006a41096a420037000020004200370069200041033a0068200041c8006a10252004410036020020054200370300200042003703880120004188016a4114200041c8006a41141016200041a8016a41106a2004280200360200200041a8016a41086a200529030037030020002000290388013703a80120004188016a200041a8016a100e200041e8006a20004188016a10072000280238200028023c101e2000280228200028022c101e2002200028020c101e200041c0016a24000f0b41c081041038000b0f0020002001102a41ff01714101460b3500024020012d00004101460d00200041086a2001410c6a2802003602002000200141046a2902003702000f0b20012d0001103a000b2f01017f230041206b22002400200041106a10272000200028021020002802181043200028020020002802081028000bd81802057f0b7e23004190036b2203240002400240024002400240024002400240024002400240200241034d0d000240024002400240024002400240200128000022044118742004410874418080fc07717220044108764180fe037120044118767272220441d1afdc8079460d0002400240024020044193c6f7a57d460d002002417c6a2102200141046a2101200441f7918e807f460d02200441f0faee9304460d01200441b184828507470d0b200341f0026a1026200341d0016a41186a22044200370300200341d0016a41106a22054200370300200341d0016a41086a22064200370300200342003703d001200341f0026a200341d0016a10400d0c200320023602b402200320013602b002200341003602b802200341d0016a200341b0026a103e200341d0026a200341d0016a1044200341f0026a200341d0026a100a200341d0026a101f2004200341f0026a41186a2903003703002005200341f0026a41106a2903003703002006200341f0026a41086a290300370300200320032903f0023703d001200341d0026a200341d0016a10392004200341d0026a41186a2802003602002005200341d0026a41106a2903003703002006200341d0026a41086a290300370300200320032903d0023703d0012000200341d0016a10200c140b200341f0026a1026200341d0016a41186a22044200370300200341d0016a41106a22014200370300200341d0016a41086a22024200370300200342003703d001200341f0026a200341d0016a10400d0c200341f0026a101f2004420037030020014200370300200342003703d801200342f0a2043703d001200341f0026a200341d0016a10392004200341f0026a41186a2802003602002001200341f0026a41106a2903003703002002200341f0026a41086a290300370300200320032903f0023703d0012000200341d0016a10200c130b200341f0026a1026200341d0016a41186a22044200370300200341d0016a41106a22054200370300200341d0016a41086a22064200370300200342003703d001200341f0026a200341d0016a10400d0c200320023602b402200320013602b002200341003602b802200341d0016a200341b0026a103d200341f0026a200341d0016a1045200341d0026a101f2004200341f0026a41186a2903003703002005200341f0026a41106a2903003703002006200341f0026a41086a290300370300200320032903f0023703d001200341d0026a200341d0016a10392004200341d0026a41186a2802003602002005200341d0026a41106a2903003703002006200341d0026a41086a290300370300200320032903d0023703d0012000200341d0016a10200c120b200341f0026a1026200341e8016a22054200370300200341e0016a22064200370300200341d8016a22074200370300200342003703d001200341f0026a200341d0016a10400d0c20032002360204200320013602004100210420034100360208200341d0016a2003103e200341106a200341d0016a1044200341d0016a2003103d200341286a200341d0016a1045200341c8006a1025200341e0006a200341c8006a100a20034180016a200341106a100a200542003703002006420037030020074200370300200342003703d001200341286a200341d0016a41201049450d0f200341e0006a200341286a102a41ff017141ff01460d0f200341106a200341c8006a41141049450d0120032903682208200329033022097d220a2008562101200329034021082003290338210b2003290378210c2003290370210d2003290360220e2003290328220f7d2210200e580d02200a427f7c220e200a5620016a21010c030b200341f0026a1026200341d0016a41186a4200370300200341e0016a4200370300200341d0016a41086a4200370300200342003703d001200341f0026a200341d0016a10400d0c200341d0016a41186a4200370000200341d0016a41116a4200370000200341d0016a41096a4200370000200342003700d101200341033a00d001200341d0026a200341d0016a100c200341b0026a200341d0026a100d200341d0026a41186a4200370000200341d0026a41116a4200370000200341d0026a41096a4200370000200342003700d102200341033a00d00220032903c802210d20032903c002210b20032903b802210802400240024020032903b002220c42017c220a200c5a0d00200842017c220c20085a0d01200b200c200854ad7c2208200b5a0d06200d2008200b54ad7c2209200d5a0d1241f880041038000b200d21092008210c0c010b200d21090b200b21080c0f0b410021040c0d0b200a210e0b200d200b7d220a200d5621042001450d01200a2001ad7d2211200a5620046a21040c020b200d21090c0b0b200a21110b200c20087d220d200c562101024002402004450d00200d2004ad7d2212200d5620016a0d010c090b200d21122001450d080b41f880041038000b419081041038000b41a881041038000b41c081041038000b41c081041038000b41c081041038000b41c081041038000b41c081041038000b200329038801220c20097c220a200c542101200329039801210c200329039001210d024002402003290380012209200f7c220f20095a0d00200a42017c2209200a5420016a21010c010b200a21090b200d200b7c220b200d542104024002402001450d00200b2001ad7c220d200b5420046a21040c010b200b210d0b200c20087c2208200c5421010240024002402004450d0020082004ad7c220b20085420016a0d010c020b2008210b2001450d010b41f880041038000b200341d0026a200341c8006a100b2003200e3703d801200320103703d001200320113703e001200320123703e801200341f0026a200341d0016a103b200341d0026a200341f0026a1007200341f0026a200341106a100b200320093703d8012003200f3703d0012003200d3703e0012003200b3703e801200341d0026a200341d0016a103b200341f0026a200341d0026a1007200341a0016a41106a200341c8006a41106a280200360200200341a0016a41086a200341c8006a41086a290300370300200320032903483703a001200341b8016a41106a200341106a41106a280200360200200341b8016a41086a200341106a41086a290300370300200320032903103703b801200342aaabaeb99afe98e2a17f3700ff0220034296d0d4d7d5a9fd91b37f37008703200341b0026a41106a2204200329008003370300200341e984c3c5063600f802200341fcef003b00fc022003418d013a00fe02200341b0026a41086a220120032900f802370300200341ef013a008f03200341b0026a41186a2202200329008803370300200342dde5cbeabac3b8e49b7f3700f002200342dde5cbeabac3b8e49b7f3703b002200341d0026a200341a0016a1023200341f0026a200341b8016a1023200341d0016a41186a2002290300370300200341d0016a41106a2004290300370300200341d0016a41086a2001290300370300200341f8016a200341d0026a41086a220529030037030020034180026a200341d0026a41106a220629030037030020034188026a200341d0026a41186a220729030037030020034198026a200341f0026a41086a2204290300370300200341a0026a200341f0026a41106a2201290300370300200341a8026a200341f0026a41186a2202290300370300200320032903b0023703d001200320032903d0023703f001200320032903f00237039002200341d0026a101f2002200341286a41186a2903003703002001200341286a41106a2903003703002004200341286a41086a290300370300200320032903283703f002200341d0026a200341f0026a1039200220072802003602002001200629030037030020042005290300370300200320032903d0023703f002200341b0026a200341f0026a1020200341d0016a410320032802b002220420032802b8021008200420032802b402101e410121040b200341d0026a101f20034187036a4200370000200341f0026a41106a4200370300200341f0026a41086a4200370300200342003703f002200320043a008f03200341d0026a410472200341f0026a20034190036a1014200341d0016a41186a200341d0026a41186a280200360200200341d0016a41106a200341d0026a41106a290300370300200341d0016a41086a200341d0026a41086a290300370300200320032903d0023703d0012000200341d0016a10200c010b2003200c3703d8012003200a3703d001200320083703e001200320093703e801200341f0026a200341d0016a103b200341d0026a200341f0026a100720004100360208200042013702000b20034190036a24000b4b01017f200141016a2102024020012d00004101460d0020002002290000370000200041106a200241106a280000360000200041086a200241086a2900003700000f0b20022d0000103a000b5500024020012d00004101460d00200041186a200141206a290300370300200041106a200141186a290300370300200041086a200141106a2903003703002000200141086a2903003703000f0b20012d0001103a000b3001017f410021030240034020022003460d01200020036a200120036a2d00003a0000200341016a21030c000b0b20000b6701017f02400240200120004f0d0003402002450d02200020026a417f6a200120026a417f6a2d00003a00002002417f6a21020c000b0b2000210303402002450d01200320012d00003a00002002417f6a2102200341016a2103200141016a21010c000b0b20000b2a01017f410021030240034020022003460d01200020036a20013a0000200341016a21030c000b0b20000b4801047f410021034100210402400340200420024f0d01200120046a2105200020046a2106200441016a210420062d0000220620052d00002205460d000b200620056b21030b20030b0b810f0300418080040bd801d800010020000000f800010062000000d3070000090000000100000000000000010000000200000003000000040000000500000004000000040000000600000007000000080000000900000000000000010000000200000003000000040000005a010100110000006b01010013000000f502000005000000800201001d0000009d0201005d00000029000000020000005203010012000000300301000a0000002a000000020000003a03010018000000300301000a0000002a00000002000000fa02010036000000300301000a0000002a000000020000000041d881040b8c05617373657274696f6e206661696c65643a2038203c3d206275662e6c656e28292f55736572732f6e6f61682d76696e63656e7a6e6f65682f2e636172676f2f72656769737472792f7372632f6769746875622e636f6d2d316563633632393964623965633832332f627974656f726465722d312e332e302f7372632f6c69622e72736361706163697479206f766572666c6f776c6962616c6c6f632f7261775f7665632e727301010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000202020202020202020202020202020202020202020202020202020202020303030303030303030303030303030304040404040000000000000000000000000061726974686d65746963206f7065726174696f6e206f766572666c6f772f55736572732f6e6f61682d76696e63656e7a6e6f65682f2e636172676f2f72656769737472792f7372632f6769746875622e636f6d2d316563633632393964623965633832332f75696e742d302e352e302f7372632f6c69622e7273556e61626c6520746f206163636570742076616c756520696e206e6f6e2d70617961626c6520636f6e7374727563746f722063616c6c7372632f6c69622e7273496e76616c6964206d6574686f64207369676e6174757265496e76616c69642061626920696e766f6b650041e486040b84080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
exports.CODE_HEX = CODE_HEX;

},{}]},{},[1]);
