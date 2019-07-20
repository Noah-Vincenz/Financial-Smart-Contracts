/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import {
  cleanParens, addSpacing, addParens, openingParensAmount, closingParensAmount,
  lTrimWhiteSpace, rTrimWhiteSpace, lTrimParen, rTrimParen, lTrimDoubleQuotes,
  rTrimDoubleQuotes
} from "./stringmanipulation.mjs";

import {Contract, translateContract} from "./contract.mjs";

import {createContract, deposit, getSelectedMetaMaskAccount, holderBalance,
  counterPartyBalance, holderAddress, counterPartyAddress, balanceOfAddress,
  transfer, waitForReceipt
} from "./deploy/deploy.mjs"

// TODO: add status of transactions ie executed, or failed
// TODO: change contract string to be displayed with parenthesis in list

var numberOfContracts = 0;
var stringToAddToBeginning = ""; // string that is added to the beginning of the contract when outer most does not contain any conjunctions ie. 'truncate' will simply be added to contract string and rest will be decomposed
var contractsMap = new Map(); // map from contract id to contract object

$(function(){
    var $select = $(".custom_select");
    for (var i = 1; i <= 100; ++i){
        $select.append($('<option></option>').val(i).html(i));
    }
});

window.addEventListener('load', function() {  // commented for testing purposes
  /*
    document.getElementById("deposit_button1").disabled = true;
    document.getElementById("deposit_button2").disabled = true;
    document.getElementById("make_transaction_button").disabled = true;
    document.getElementById("select_deposit").disabled = true;
    document.getElementById("transaction_input").disabled = true;
    */
    // start timer
    update();
    runClock();
});

function update() {
    // loop through all contracts and check if their time == current time and if so check if get or not
    // if get: then execute
    // if not get: then disable acquire button
    for (var [key, value] of contractsMap) {
        if (value.horizonDate !== "instantaneous") {
            var horizonArr = value.horizonDate.split("-");
            var dateArr = horizonArr[0].split("/");
            var timeArr = horizonArr[1].split(":");
            // +01:00 to get BST from UTC
            var dateString = dateArr[2] + "-" + dateArr[1] + "-" + dateArr[0] + "T" + timeArr[0] + ":" + timeArr[1] + ":" + timeArr[2] + "+01:00";
            var contractDate = new Date(dateString);
            var todayDate = new Date();
            if (contractDate.getTime() <= todayDate.getTime()) {
                if (value.toBeExecutedAtHorizon === "yes") { // contract contains 'get'
                    executeContract(value);
                } else { // contract just contains 'truncate' and not 'get'
                    document.getElementById("acquire_button_" + key.toString()).disabled = true;
                    document.getElementById("td_status_" + key.toString()).innerHTML = "expired";
                    contractsMap.delete(key);
                    console.log("Contract " + key + " has expired.");
                }
            }
        }
    }
}

function runClock() {
    var now = new Date();
    var timeToNextTick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function() {
        update();
        runClock();
    }, timeToNextTick);
}

global.callDepositFunction = function(id) {
    var addr = "";
    if (id === 1) {
        addr = "holder_address";
    } else {
        addr = "counter_party_address";
    }
    if (getSelectedMetaMaskAccount().toUpperCase() === document.getElementById(addr).value.toUpperCase()) {
        deposit(id, getSelectedDeposit());
        document.getElementById("make_transaction_button").disabled = false;
        document.getElementById("transaction_input").disabled = false;
    } else {
        document.getElementById("create_contract_status").innerHTML = "Please change the currently selected MetaMask account to the one you would like to deposit to.";
    }
}

global.callCreateContractFunction = function() {
    var holderAddressValue = document.getElementById("holder_address").value;
    var counterPartyAddressValue = document.getElementById("counter_party_address").value;
    if (getSelectedMetaMaskAccount().toUpperCase() === holderAddressValue.toUpperCase()) {
        createContract(holderAddressValue, counterPartyAddressValue);
        document.getElementById("create_contract_button").disabled = true;
        document.getElementById("holder_address").disabled = true;
        document.getElementById("counter_party_address").disabled = true;
        document.getElementById("deposit_button1").disabled = false;
        document.getElementById("deposit_button2").disabled = false;
        document.getElementById("select_deposit").disabled = false;
    } else {
        document.getElementById("create_contract_status").innerHTML = "Please change the currently selected MetaMask account to the contract holder account.";
    }
}

function getSelectedDeposit() {
    return document.getElementById("select_deposit").value;
}

global.getInputString = function() {
    return document.getElementById("transaction_input").value;
};

global.decomposeContract = function(inputString) {
    document.getElementById("transaction_status").innerHTML = "";
    if (inputString === "") {
        document.getElementById("transaction_status").innerHTML = "Please provide some contract input.";
        return;
    }
    if (openingParensAmount(inputString) !== closingParensAmount(inputString)) {
        console.error("The contract is not constructed properly.");
        document.getElementById("transaction_status").innerHTML = "The contract is not constructed properly.";
        return;
    }
    // remove linebreaks
    inputString = inputString.replace(/(\r\n|\n|\r)/gm,"");
    // remove multiple whitespaces
    inputString = inputString.replace(/  +/g, ' ');
    // add spacing before and after parenthesis
    inputString = addSpacing(inputString);
    removeChildren("button_choices_container");
    stringToAddToBeginning = "";
    var noOfOpeningParens = 0;
    var noOfClosingParens = 0;
    var contractString = "";
    var contractsStack = [];
    var conjunctionsStack = [];
    stringToAddToBeginning = "";

    // check if inputstring contains 'or' else execute right away
    if (inputString.includes("or")) {
        var firstOpeningParenOcc = inputString.indexOf("(");
        var firstSubstring = inputString.slice(0, firstOpeningParenOcc);
        if (!firstSubstring.includes("or")) {
            inputString = inputString.slice(firstOpeningParenOcc, inputString.length);
            stringToAddToBeginning = firstSubstring;
        }
        var strArr = inputString.split(" ");
        var indexOfMostBalancedOr = strArr.length - 1;
        var mostBalancedOr = strArr.length - 1;
        for (var i = 0; i < strArr.length; ++i) {
            var term = strArr[i];
            if (term === "or") {
               if (noOfOpeningParens === noOfClosingParens) { // found outer most conjunct
                   conjunctionsStack.push(term);
                   contractsStack.push(contractString);
                   contractsStack.push(strArr.slice(i + 1).join(' '));
                   break;
               } else if (noOfOpeningParens > noOfClosingParens) {
                   contractString = contractString + " " + term;
                   if ( (noOfOpeningParens - noOfClosingParens) < mostBalancedOr ) {
                      mostBalancedOr = noOfOpeningParens - noOfClosingParens;
                      indexOfMostBalancedOr = i;
                   }
               }
           } else {
                if (contractString === "") {
                   contractString = term;
                } else {
                   contractString = contractString + " " + term;
                }
                if (term === "(") {
                    ++noOfOpeningParens;
                } else if (term === ")") {
                    ++noOfClosingParens;
                    if (i === strArr.length - 1) {
                        contractsStack.push(contractString);
                    }
                }
           }
           if (noOfClosingParens > noOfOpeningParens) {
               console.error("The contract is not constructed properly.");
               document.getElementById("transaction_status").innerHTML = "The contract is not constructed properly.";
               break;
           }
        }
        if (contractsStack.length === 1 && contractsStack[0].includes("or")) {
            conjunctionsStack.push("or");
            contractsStack = splitContract(strArr, indexOfMostBalancedOr);
        }
        combineContracts(contractsStack, conjunctionsStack);

    } else {
        // String does not include "or": execute right away
        var outputStrings = inputString.split("and");
        for (var i = 0; i < outputStrings.length; ++i) {
            parse(cleanParens(outputStrings[i]));
        }
    }
};

function splitContract(contractStringArr, indexOfMostBalancedOr) {
    // do not split by "or" because this will split by first 'or' occurence
    // we want to split by 'or' occurrence with only 1 difference between |openingParen| and |closingParen|
    var newStack = [];
    newStack[0] = cleanParens(contractStringArr.slice(0, indexOfMostBalancedOr).join(' '));
    newStack[1] = cleanParens(contractStringArr.slice(indexOfMostBalancedOr + 1, contractStringArr.length - 1).join(' '));
    if (openingParensAmount(newStack[0]) > closingParensAmount(newStack[0])) {
        newStack[0] = newStack[0] + " )";
    }
    if (closingParensAmount(newStack[1]) > openingParensAmount(newStack[1])) {
        newStack[1] = "( " + newStack[1];
    }
    return newStack;
}

function combineContracts(contractsStack, conjunctionStack) {
    var contract1 = contractsStack.pop();
    var contract2 = contractsStack.pop();
    var conj = conjunctionStack.pop();
    console.log("Combining leftover contracts...");
    if (conj === "or") {
        createSection();
        createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract2)), 1);
        createOrLabel();
        createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract1)), 2);
    }
}

function parse(inputString) {
    var recipient = 0; // by default the contract holder is the recipient
    var amount = 1;
    var horizonDate = "instantaneous";
    var acquireAtHorizon = "no"; // used for get, ie if get is discovered then this is set to true
    var newStr = inputString.replace(/[()]/g, ''); // removing parenthesis
    var strArr = newStr.split(" ");
    for (var i = 0; i < strArr.length; ++i) {
        var str = strArr[i];
        if (str === "give") {
            recipient = 1;
        } else if (str === "one") {
            amount *= 1;
        } else if (str === "zero") {
            amount *= 0;
        } else if (str === "scaleK") {
            if (strArr.length > i + 1 && (parseInt(strArr[i + 1]))) {
                amount = amount * parseInt(strArr[i + 1]);
                ++i;
            } else {
                console.log("'scaleK' should be followed by an integer.");
                break;
            }
        } else if (str === "truncate") {
            if (strArr.length > i + 1 && isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(strArr[i + 1])))) {
                horizonDate = strArr[i + 1];
                ++i;
            } else {
                console.log("truncate should be followed by a date in the following pattern: 'dd/mm/yyyy-hh:mm:ss'.");
                break;
            }
        } else if (str === "get") {
            acquireAtHorizon = "yes";
        }
    }
    if (horizonDate === "instantaneous") {
        acquireAtHorizon = "yes";
    }
    horizonDate = lTrimDoubleQuotes(rTrimDoubleQuotes(horizonDate));
    const contract = new Contract(numberOfContracts, amount, recipient, inputString,
       translateContract(recipient, amount, horizonDate, acquireAtHorizon),
       horizonDate, acquireAtHorizon, "waiting to be executed");

    createTableRow(contract);

    if (horizonDate === "instantaneous") {
        executeContract(contract);
    } else {
        if (beforeCurrentDate(contract)) {
            // add expired label & disable acquire button
            console.log("It is before current date!");
            document.getElementById("td_status_" + contract.id.toString()).innerHTML = "expired";
            document.getElementById("acquire_button_" + contract.id.toString()).disabled = true;
        } else {
            console.log("It is not before current date!");
            contractsMap.set(numberOfContracts, contract);
            document.getElementById("td_status_" + contract.id.toString()).innerHTML = "waiting to be executed";
        }
    }
    ++numberOfContracts;
}

function beforeCurrentDate(contract) {
    var horizonArr = contract.horizonDate.split("-");
    var dateArr = horizonArr[0].split("/");
    var timeArr = horizonArr[1].split(":");
    // +01:00 to get BST from UTC
    var dateString = dateArr[2] + "-" + dateArr[1] + "-"
    + dateArr[0] + "T" + timeArr[0] + ":" + timeArr[1] + ":"
    + (parseInt(timeArr[2]) + 15).toString() + "+01:00"; // adding 15 seconds to the contract's expiry date to allow it to execute
    var contractDate = new Date(dateString);
    var todayDate = new Date();
    if (contractDate.getTime() <= todayDate.getTime()) {
        return true;
    } else {
        return false;
    }
}

function executeContract(contract) {
    if (contract.horizonDate !== "instantaneous") {
        if (beforeCurrentDate(contract)) {
            window.alert("The contract " + contract.id + " has expired.");
            document.getElementById("td_status_" + contract.id.toString()).innerHTML = "expired";
            contractsMap.delete(contract.id);
            return;
        }
    }
    holderAddress().then(holderAddress => {
        counterPartyAddress().then(counterPartyAddress => {
            if (contract.recipient == 0) { // owner receives
                createMoveFile(counterPartyAddress, holderAddress, contract.amount);
                callTransferFunction(contract, counterPartyAddress, holderAddress);
            } else { // counter party receives
                createMoveFile(holderAddress, counterPartyAddress, contract.amount);
                callTransferFunction(contract, holderAddress, counterPartyAddress);
            }
            if (document.getElementById("td_status_" + contract.id.toString()).innerHTML !== "successful") {
                document.getElementById("td_status_" + contract.id.toString()).innerHTML = "not accepted by user";
            }
        });
    });
}

function callTransferFunction(contract, fromAddress, toAddress) {
    balanceOfAddress(fromAddress).then(balance => {
        if (balance >= contract.amount) {
            transfer(fromAddress, toAddress, contract.amount).then(transferTxHash => {
                waitForReceipt(transferTxHash).then( _ => {
                    console.log(fromAddress + " has transferred " + contract.amount + " Ether to " + toAddress);
                    document.getElementById("td_status_" + contract.id.toString()).innerHTML = "successful";
                    document.getElementById("acquire_button_" + contract.id.toString()).disabled = true;
                    contractsMap.delete(contract.id);
                    retrieveBalances();
                });
            });
        } else {
            window.alert("The sender address does not have enough Ether for this transfer. Please deposit more Ether into the account.");
            document.getElementById("td_status_" + contract.id.toString()).innerHTML = "insufficient funds";
        }
    });
}

function createMoveFile(sender_address, recipient_address, amount) {
    var textToWrite = "//! no-execute\n" +
    "import 0x0.LibraAccount;\n" +
    "import 0x0.LibraCoin;\n \n" +
    "main(payee: address) {\n" +
      "\t let coin: R#LibraCoin.T;\n" +
      "\t let account_exists: bool;\n" +
      "\t let recipient: address;\n" +
      "\t let sender: address;\n" +
      "\t sender = " + sender_address + ";\n" +
      "\t recipient = " + recipient_address + ";\n" +
      "\t coin = LibraAccount.withdraw_from_sender(" + amount + ");\n" +
      "\t account_exists = LibraAccount.exists(copy(recipient));\n" +
      "\t if (!move(account_exists)) {\n" +
      "\t \t create_account(copy(recipient));\n" +
      "\t }\n" +
      "\t LibraAccount.deposit(move(recipient), move(coin));\n" +
      "\t return;\n" +
    "}";

    var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
    var downloadLink = document.createElement("a");
    downloadLink.download = "script.mvir";
    downloadLink.innerHTML = "Download Move File";
    if (window.webkitURL != null) {
        // Chrome allows the link to be clicked
        // without actually adding it to the DOM.
        downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    }
    else {
        // Firefox requires the link to be added to the DOM
        // before it can be clicked.
        downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
    }
    //downloadLink.click(); // commented for testing purposes
    console.log("Created and downloaded .mvir file.");
}

function retrieveBalances() {
    holderBalance().then(function(hBalance) {
        console.log("Holder Balance: " + hBalance);
        counterPartyBalance().then(function(cBalance) {
            console.log("Counter-Party Balance: " + cBalance);
        });
    });
}

function printStack(stack, name) {
    console.log(name + ": " + stack.length);
    var x;
    for (var x = 0; x < stack.length; ++x) {
        console.log(name + " - " + x + ": " + stack[x]);
    }
}

function createTableRow(contract) {

    var table = document.getElementById("my_table");
    let tr = table.insertRow(1);
    var td;
    tr.appendChild(td = document.createElement("td"));
    td.innerHTML = contract.id;
    tr.appendChild(td = document.createElement("td"));
    td.innerHTML = contract.contractString;
    tr.appendChild(td = document.createElement("td"));
    td.innerHTML = contract.meaningOfContractString;
    tr.appendChild(td = document.createElement("td"));
    td.innerHTML = contract.horizonDate;
    tr.appendChild(td = document.createElement("td"));
    td.innerHTML = contract.toBeExecutedAtHorizon;
    tr.appendChild(td = document.createElement("td"));
    var btn = document.createElement('input');
    btn.type = "button";
    btn.className = "acquire_button";
    btn.id = "acquire_button_" + contract.id;
    btn.value = "acquire";
    btn.onclick = _ => {
        executeContract(contract);
    };
    td.appendChild(btn);
    if (contract.toBeExecutedAtHorizon === "yes" || contract.horizonDate === "instantaneous") {
        btn.disabled = true;
    }
    tr.appendChild(td = document.createElement("td"));
    td.id = "td_status_" + contract.id;
    td.innerHTML = contract.status;
}

function createButton (contractString, buttonId) {
  var button = document.createElement("button");
  button.id = "choices_button_" + buttonId;
  button.className = "choices_button";
  button.innerHTML = cleanParens(contractString);
  // 2. Append somewhere
  var bottomContainer = document.getElementById("button_choices_container");
  bottomContainer.appendChild(button);
  // 3. Add event handler
  button.addEventListener ("click", function() {
      console.log("Pressed button");
      console.log(stringToAddToBeginning + button.innerHTML);
      decomposeContract(stringToAddToBeginning + button.innerHTML);
  });
}

function createSection() {
    var para = document.createElement("p");
    var node = document.createTextNode("Contract choice:");
    para.appendChild(node);
    var bottomContainer = document.getElementById("button_choices_container");
    bottomContainer.appendChild(para);
}

function createOrLabel() {
    var para = document.createElement("p");
    para.className = "p_small";
    var node = document.createTextNode("OR");
    para.appendChild(node);
    var bottomContainer = document.getElementById("button_choices_container");
    bottomContainer.appendChild(para);
}

function removeChildren(containerString) {
    var e = document.getElementById(containerString);
    var child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
}

function isDate(stringInput) {
    var matches = stringInput.match(/^((0?[1-9])|([12][0-9])|(3[01]))\/((0?[1-9])|(1[0-2]))\/(\d\d\d\d)-((0[0-9])|(1[0-9])|(2[0-3])):([0-5][0-9]):([0-5][0-9])$/);
    if (matches === null) {
        return false;
    } else if (matches[0] === stringInput) {
        return true;
    } else {
        return false;
    }
}

global.testReachability = function() {
    decomposeContract("( scaleK 50 ( get ( truncate \"24/12/2019-23:33:33\" ( give one ) ) ) ) or ( zero and truncate \"26/12/2019-23:33:33\" ( give zero ) )");
    removeChildren("button_choices_container");
    decomposeContract("( scaleK 50 ( get ( truncate \"24/12/2019-23:33:33\" ( give one ) ) ) ) or ( zero or truncate \"26/12/2019-23:33:33\" ( give zero ) )");
    removeChildren("button_choices_container");
    decomposeContract("( scaleK 50 ( get ( truncate \"24/12/2019-23:33:33\" ( give one ) ) ) ) or zero");
    removeChildren("button_choices_container");
    decomposeContract("zero or give one");
    removeChildren("button_choices_container");
    decomposeContract("( ( zero or give one ) or scaleK 10 ( one ) ) or zero");
    removeChildren("button_choices_container");
    decomposeContract("( zero or give one ) or ( scaleK 10 one or zero )");
    removeChildren("button_choices_container");
    decomposeContract("( zero or one ) or scaleK 10 ( one )");
    removeChildren("button_choices_container");
    decomposeContract("give one or ( ( truncate \"24/12/2019-23:33:33\" ( give zero ) ) and give zero )");
    removeChildren("button_choices_container");
    decomposeContract("( zero or give one ) or ( ( scaleK 10 one ) or zero )");
    removeChildren("button_choices_container");
    decomposeContract("( zero or give one ) or ( ( scaleK 10 ( one ) ) or zero )");
    removeChildren("button_choices_container");
    decomposeContract("give one or ( ( truncate \"24/12/2019-23:33:33\" ( give zero ) ) or give zero )");
    removeChildren("button_choices_container");
    decomposeContract("truncate \"24/12/2019-23:33:33\" ( one or give zero )");
    removeChildren("button_choices_container");
    decomposeContract("truncate \"24/12/2019-23:33:33\" ( one ) or truncate \"24/12/2019-23:33:33\" ( zero )");
    removeChildren("button_choices_container");
    decomposeContract("( scaleK 101 ( get ( truncate \"24/01/2019-23:33:33\" ( one ) ) ) and scaleK 102 ( get ( truncate \"24/02/2019-23:33:33\" ( give one ) ) ) ) or ( ( scaleK 103 ( get ( truncate \"24/03/2019-23:33:33\" ( one ) ) ) and scaleK 104 ( get ( truncate \"24/04/2019-23:33:33\" ( give one ) ) ) ) or ( scaleK 105 ( get ( truncate \"24/05/2019-23:33:33\" ( one ) ) ) and scaleK 106 ( get ( truncate \"24/06/2019-23:33:33\" ( give one ) ) ) ) )");
    removeChildren("button_choices_container");
    decomposeContract("( scaleK 100 one and scaleK 101 one ) or ( ( scaleK 102 one and scaleK 103 one ) or ( scaleK 104 one and scaleK 105 one ) )");
    removeChildren("button_choices_container");
    decomposeContract("( one and give one ) or ( ( zero and give zero ) or ( give one and give zero ) )");
    removeChildren("button_choices_container");
    decomposeContract("( zero or give one ) or ( scaleK 10 ( one ) or zero )");
    removeChildren("button_choices_container");
};
