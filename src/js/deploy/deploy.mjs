/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import {CODE_HEX, ABI} from "./resources.mjs";

var abi;
var codeHex;
var smartContract;
var smartContractInstance;

/**
 * This is called when the web page is loaded and is used for initialising important system components.
 */
window.addEventListener('load', function () {

    // Modern DApp Browsers
    if (window.ethereum) {
       web3 = new Web3(window.ethereum);
       try {
          window.ethereum.enable().then(function() {
              // User has allowed account access to DApp...
              console.log("user has allowed account access to DApp");
              abi = ABI;
              codeHex = web3.toHex(CODE_HEX);
              smartContract = web3.eth.contract(abi);
          });
       } catch(e) {
          // User has denied account access to DApp...
          console.log("user has denied account access to DApp");
       }
    }
    // Legacy DApp Browsers
    else if (window.web3) {
        web3 = new Web3(web3.currentProvider);
        abi = ABI;
        codeHex = web3.toHex(CODE_HEX);
        smartContract = web3.eth.contract(abi);
    }
    // Non-DApp Browsers
    else {
        console.log('No Web3 Detected... using HTTP Provider')
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
});

/**
 * This returns the address of the currently selecte MetaMask account.
 */
export function getSelectedMetaMaskAccount() {
    return web3.eth.accounts[0];
}

/**
 * This returns the currently selected network.
 */
export function getSelectedNetwork() {
    return web3.version.network;
}

/**
 * This is used to set the default account of web3.
 */
export function setDefaultAccount(address) {
    web3.eth.defaultAccount = address;
}

/**
 * This is used to set the smartContractInstance variable.
 */
export function setSmartContractInstance(contractAddress) {
    smartContractInstance = smartContract.at(contractAddress);
}

/**
 * Unlocks accounts.
 * @param {string} address - The address specifying the account to be unlocked.
 */
export function unlockAccount(address) { // this does not exist for Kovan chain
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

/**
 * Instantiates a new Rust smart contract instance.
 * @param {string} holderAddress - The address specifying the contract holder.
 * @param {string} counterPartyAddress - The address specifying the contract counter-party.
 */
export function instantiateNew (holderAddress, counterPartyAddress) {
    return new Promise (function (resolve, reject) {
        smartContract.new(holderAddress, counterPartyAddress, {data: codeHex, from: web3.eth.defaultAccount}, function (err, contractInstance) {
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

/**
 * This transfers Ether between two addresses outside of our Rust contract.
 * @param {string} fromAddress - The address specifying the sender.
 * @param {string} toAddress - The address specifying the recipient.
 * @param {number} amount - The amount to be transferred.
 */
function transferEtherExternally(fromAddress, toAddress, amount) {
    web3.eth.sendTransaction({
        from: fromAddress,
        to: toAddress,
        value: web3.toWei(amount, "ether")
    }, function(error, hash) {
        if (error) {
            console.log(error);
        }
    });
}

/**
 * Deposits a given amount of Ether into a given account.
 * @param {string} senderAddress - The address specifying the account to be used for the deposit.
 * @param {number} amount - The amount to be deposited.
 */
export function depositCollateral(senderAddress, amount) {
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

/**
 * Used to retrieve the balance of the contract holder.
 */
export function holderBalance() {
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

/**
 * Used to retrieve the balance of the contract counter-party.
 */
export function counterPartyBalance() {
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

/**
 * Used to retrieve the address of the contract holder.
 */
export function holderAddress() {
    return new Promise (function (resolve, reject) {
        smartContractInstance.holderAddress(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  var unpaddedAddr = web3.toHex(result.toString(10));
                  // pad address to length of 42
                  var paddedAddr = unpaddedAddr.split("0x")[1].padStart(40, '0');
                  resolve("0x" + paddedAddr);
            }
        });
    });
}

/**
 * Used to retrieve the address of the contract counterparty.
 */
export function counterPartyAddress() {
    return new Promise (function (resolve, reject) {
        smartContractInstance.counterPartyAddress(function (err, result) {
            if(err) {
                  reject(err);
            } else {
                  var unpaddedAddr = web3.toHex(result.toString(10));
                  // pad address to length of 42
                  var paddedAddr = unpaddedAddr.split("0x")[1].padStart(40, '0');
                  resolve("0x" + paddedAddr);
            }
        });
    });
}

/**
 * Used to retrieve the balance of a given address.
 * @param {string} address - The address specifying the account balanced to be retrieved.
 */
export function balanceOfAddress(address) {
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

/**
 * Used to watch the TransferEvent defined in our Rust smart contract definition.
 */
export function watchTransferEvent() {
    return new Promise (function (resolve, reject) {
        smartContractInstance.TransferEvent({}, function (err, event) {
            if (err) {
                reject(err);
            } else {
                resolve(event.args.result); // returns ints regarding state of transfer
            }
        });
    });
}

/**
 * Used to transfer Ether between two accounts.
 * @param {string} fromAddress - The address specifying the sender.
 * @param {string} toAddress - The address specifying the recipient.
 * @param {string} amount - The amount of Ether to be transferred.
 */
export function transfer(fromAddress, toAddress, amount) {
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

/**
 * Used to wait for a transaction's receipt. This is useful when one needs
 * to respond to a Rust smart contract event and update the UI correspondingly.
 * @param {string} transactionHash - The hash specifying the transaction to be waited for.
 */
export function waitForReceipt(transactionHash) {
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
