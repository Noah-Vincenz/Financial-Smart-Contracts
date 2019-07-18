/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import { hello } from "./stringManipulation.mjs"; // or './module'

// TODO: add status of transactions ie executed, or failed
// TODO: change contract string to be displayed with parenthesis in list

var selectedDeposit = 0;
var numberOfContracts = 0;
var stringToAddToBeginning = ""; // string that is added to the beginning of the contract when outer most does not contain any conjunctions ie. 'truncate' will simply be added to contract string and rest will be decomposed
var contractsMap = new Map(); // map from contract id to contract object

$(function(){
    var $select = $(".custom_select");
    for (var i = 1; i <= 100; ++i){
        $select.append($('<option></option>').val(i).html(i))
    }
});

window.addEventListener('load', function() { /* // commented for testing purposes
    document.getElementById("deposit_button1").disabled = true;
    document.getElementById("deposit_button2").disabled = true;
    document.getElementById("make_transaction_button").disabled = true;
    document.getElementById("select_deposit").disabled = true;
    document.getElementById("transaction_input").disabled = true; */
    // start timer
    console.log("hi");
    console.log(hello());
    console.log("hi");
    update();
    runClock();
});

global.update = function() {
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
                console.log("Contract " + key + " has expired.");
                if (value.toBeExecutedAtHorizon === "yes") { // contract contains 'get'
                    executeContract(value);
                } else { // contract just contains 'truncate' and not 'get'
                    document.getElementById("acquire_button_" + key.toString()).disabled = true;
                    contractsMap.delete(key.toString());
                }
            }
        }
    }
}

global.runClock = function() {
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
        window.alert("Please change the currently selected MetaMask account to the one you would like to deposit to.");
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
        window.alert("Please change the currently selected MetaMask account to the contract holder account.");
    }
}

global.getSelectedDeposit = function() {
    return document.getElementById("select_deposit").value;
}

global.getInputString = function() {
    return document.getElementById("transaction_input").value;
}

global.addSpacing = function(string) {
    const regex1 = /(.*\S)(\()(.*)/;
    var matchObj = regex1.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + " " + matchObj[2] + matchObj[3];
        matchObj = regex1.exec(string)
    }
    const regex2 = /(.*\S)(\))(.*)/;
    matchObj = regex2.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + " " + matchObj[2] + matchObj[3];
        matchObj = regex2.exec(string)
    }
    const regex3 = /(.*)(\()(\S.*)/;
    matchObj = regex3.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + matchObj[2] + " " + matchObj[3];
        matchObj = regex3.exec(string)
    }
    const regex4 = /(.*)(\))(\S.*)/;
    matchObj = regex4.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + matchObj[2] + " " + matchObj[3];
        matchObj = regex4.exec(string)
    }
    return string;
}

global.furtherCleanUp = function(string) {
    const regex1 = /(.*)(\( one \))(.*)/;
    var matchObj = regex1.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + "one" + matchObj[3];
        matchObj = regex1.exec(string)
    }
    const regex2 = /(.*)(\( give one \))(.*)/;
    matchObj = regex2.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + "give one" + matchObj[3];
        matchObj = regex2.exec(string)
    }
    const regex3 = /(.*)(\( zero \))(.*)/;
    matchObj = regex3.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + "zero" + matchObj[3];
        matchObj = regex3.exec(string)
    }
    const regex4 = /(.*)(\( give zero \))(.*)/;
    matchObj = regex4.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + "give zero" + matchObj[3];
        matchObj = regex4.exec(string)
    }
    return string;
}

global.decomposeContract = function(inputString) {
    if (inputString === "") {
        return;
    }
    // remove linebreaks
    inputString = inputString.replace(/(\r\n|\n|\r)/gm,"");
    // remove multiple whitespaces
    inputString = inputString.replace(/  +/g, ' ');
    // add spacing before and after parenthesis
    inputString = addSpacing(inputString);
    inputString = furtherCleanUp(inputString); // to be able to handle '( scaleK 10 ( one ) or zero )'
    removeChildren("button_choices_container");
    stringToAddToBeginning = "";
    // check if inputstring contains 'or' else execute right away
    if (inputString.includes("or")) {
        var firstOpeningParenOcc = inputString.indexOf("(");
        var firstSubstring = inputString.slice(0, firstOpeningParenOcc);
        if (!firstSubstring.includes("or")) {
            inputString = inputString.slice(firstOpeningParenOcc, inputString.length);
            stringToAddToBeginning = firstSubstring;
        }
        var stack = [];
        var currentTerm = ""; //keeps track of the term ie and,give,one when initially looping through input & is used to add these to stack
        var currentConj = "";
        var conjunctionStack = []; // whenever stack is empty then conjunctionStack will be popped and used
        var contractString = ""; // used to accumulate the complete contract from its parts one by one when popping off the stack
        var contractsStack = [];
        var firstPartOfConjunction = "";
        var lastClosingParenPushedIndex = -1;
        var strArr = rTrimWhiteSpace(lTrimWhiteSpace(inputString)).split("");
        for (var i = 0; i < strArr.length; ++i) {
              console.log("ContractString = " + contractString);
              var str = strArr[i];
              console.log("iteration through array: " + i + ". Symbol: " + str);
              if (str === ")" || i === strArr.length - 1) { // i === strArr.length - 1 so that it also handles case where input does not end with ')'
                  if (i === strArr.length - 1 && str !== ")" && currentTerm !== " ") { // for 'give one or zero' case, ie when input does not end with closing paren
                      currentTerm += str;
                      console.log("Pushing last term - " + currentTerm + " - on stack.");
                      stack.push(currentTerm);
                  } else if (str === ")") {
                      // storing parenthesis and only appending at the end to avoid adding creating too many parenthesis in middle and leaving end one out
                      if (lastClosingParenPushedIndex !== -1
                       && openingParensAmount(inputString.slice(0, i + 1)) === closingParensAmount(inputString.slice(0, i + 1))
                       && lastClosingParenPushedIndex < strArr.length - 2
                       && (strArr[lastClosingParenPushedIndex + 2] === "a" || strArr[lastClosingParenPushedIndex + 2] === "o")) {
                      } else {
                          if (contractString !== "( ") {
                              contractString += " )";
                              console.log("contractString now: " + contractString);
                          }
                      }
                      lastClosingParenPushedIndex = i;
                  }
                  currentTerm = "";
                  // pop while items off stack until discovered |)| == popped |(|
                  console.log("contractString initially: " + contractString);

                  if (contractString === "( ") {
                      contractString = ")";
                  }
                  while (stack.length > 0) {

                      var term = stack.pop();
                      console.log("Stack popping 1 - term: " + term);
                      if (term === "and" || term === "or") {
                          console.log("And / Or is being popped");
                          console.log(firstPartOfConjunction);
                          // if already have first and part then add it to it, else only add this to contractsStack
                          if (firstPartOfConjunction !== "") { //changed order -- this used to be third if clause
                              currentConj = "";
                              var s = stringToAddToBeginning + firstPartOfConjunction + " " + conjunctionStack.pop() + " " + contractString;
                              console.log("0.5: Pushing " + s + " to contractsStack");
                              contractsStack.push(addParens(s)); //
                              stringToAddToBeginning = "";
                              firstPartOfConjunction = "";
                              if (strArr.length > i + 2
                                && openingParensAmount(inputString.slice(0, i + 3)) === closingParensAmount(inputString.slice(0, i + 3))
                                && conjunctionStack.length !== 0) {
                                  var con2 = contractsStack.pop();
                                  var con1 = contractsStack.pop();
                                  var s = con1 + " " + conjunctionStack.pop() + " " + con2;
                                  contractsStack.push(s);
                              }

                          } else if (i == strArr.length - 1 && stack.length == 0) {
                              currentConj = "";
                              console.log("0.125: Pushing " + contractString + " to contractsStack");
                              contractsStack.push(contractString);

                          } else if ((stack.length == 0 || (stack.length == 1 && stack[0] === "(")) && conjunctionStack.length !== 0) { // add contractString to contractsStack.pop()
                              currentConj = "";
                              var s = contractsStack.pop() + " " + conjunctionStack.pop() + " " + contractString;
                              console.log("0.25: Pushing " + s + " to contractsStack");
                              contractsStack.push(s);

                          } else {
                              currentConj = term;
                              if (!contractString.includes("one") && !contractString.includes("zero")) {
                                  break;
                              }
                              console.log("1: Pushing " + contractString + " to contractsStack");
                              contractsStack.push(contractString);
                          }
                          contractString = "";

                      } else if (term === "(") { // stop popping
                          contractString = term + " " + contractString;
                          console.log("currentConj: " + currentConj);
                          if (stack.length !== 0 && currentConj !== "") { // contracts string should be pushed to contracts stack not the combined string
                              var s = contractString + " " + conjunctionStack.pop() + " " + contractsStack.pop();
                              console.log("1.5: Pushing " + s + " to contractsStack");
                              contractsStack.push(s);
                              currentConj = "";
                              contractString = "";

                              if (strArr.length > (i + 2)
                                && openingParensAmount(inputString.slice(0, i + 3)) === closingParensAmount(inputString.slice(0, i + 3))
                                && conjunctionStack.length !== 0) {
                                  var con2 = contractsStack.pop();
                                  var con1 = contractsStack.pop();
                                  var s = "( " + con1 + " " + conjunctionStack.pop() + " " + con2 + " )";
                                  console.log("1.65: Pushing " + s + " to contractsStack");
                                  contractsStack.push(s);
                              }
                          }
                          console.log("Current contractString: " + contractString);
                          break; //stop popping

                      } else if (term === "zero" || term === "one") { //then add current contractString to contractsStack and start from empty contractString
                          if (contractString.includes("zero") || contractString.includes("one")) { // for '((give one) or give zero)' case
                              firstPartOfConjunction = rTrimParen(contractString);
                              contractString = term + " )";
                              console.log("ContractString already includes zero / one");
                              console.log(firstPartOfConjunction);
                              console.log(contractString);
                          } else {
                              contractString = term + " " + contractString;
                          }
                      } else {
                          contractString = term + " " + contractString;
                      }
                  }
                  console.log("contractString now = " + contractString);
                  printStack(stack, "termStack");
                  printStack(conjunctionStack, "conjunctionStack");
                  printStack(contractsStack, "contractsStack");

                  if (stack.length == 0 && contractString !== "" && contractString !== "( ") {
                     if (currentConj !== "" && i !== strArr.length - 1) {
                          var s = contractString + " " + conjunctionStack.pop() + " " + contractsStack.pop();
                          console.log("1.75: Pushing " + s + " to contractsStack");
                          contractsStack.push(s);
                          currentConj = "";

                      } else { // if there is no currConj then we can just add this one
                          console.log("2: Pushing " + contractString + " to contractsStack");
                          contractsStack.push(contractString);
                      }
                      contractString = "";
                  }

              } else if (str === " ") {
                  // push term
                  if (currentTerm !== "") { // not needed
                      if (currentTerm === "and" || currentTerm === "or") {
                          conjunctionStack.push(currentTerm);
                          if (parseInt(stack[stack.length - 1])) {
                              contractString = stack.pop() + " " + contractString;
                              contractString = stack.pop() + " " + contractString;
                              console.log("z32");
                          }
                      }
                      console.log("Pushing last term - " + currentTerm + " - on stack.");
                      stack.push(currentTerm);
                      currentTerm = "";
                  }
              } else if (str === "(") {
                  stack.push(str);
              } else {
                 // its part of term
                 currentTerm += str;
              }
              console.log("contractString now 2 = " + contractString);
          }

          if (stack.length > 0 && (stack.includes("one") || stack.includes("zero"))) {
              while (stack.length > 0) {
                  var term = stack.pop();
                  console.log("Stack popping 2 - term: " + term);
                  if (term === "and" || term === "or") {
                      currentConj = term;
                      contractString = ""; // to print out the whole contract when all its parts have been discovered
                  } else {
                      contractString = term + " " + contractString;
                  }
              }
              console.log("Contract string just before end: " + contractString);
              if (contractString !== "") {
                  console.log("6: Pushing " + contractString + " to contractsStack");
                  contractsStack.push(contractString);
              }
        }
        printStack(stack, "termStack");
        printStack(conjunctionStack, "conjunctionStack");
        printStack(contractsStack, "contractsStack");
        var res = contractsStack.length / conjunctionStack.length;
        if (conjunctionStack.length >= 1 && contractsStack.length >= 2 && res === 2) {
            combineContracts(contractsStack, conjunctionStack);
        }

        // TODO: get rid of this
        if (conjunctionStack.length == 0 && contractsStack.length === 1 && (!stack.includes("zero") || !stack.includes("one"))) {
            var newContractsStack = contractsStack[0].split("or");
            combineContracts(newContractsStack, ["or"]);
        }

    } else {
        // String does not include "or" -> execute right away
        var outputStrings = inputString.split("and");
        for (var i = 0; i < outputStrings.length; ++i) {
            parse(outputStrings[i]);
        }
    }
}

global.combineContracts = function(contractsStack, conjunctionStack) {
    var contract1 = contractsStack.pop();
    var contract2 = contractsStack.pop();
    var conj = conjunctionStack.pop();
    console.log("Combining leftover contracts...");
    console.log(contract1 + " " + conj + " " + contract2);
    if (conj === "or") {
        createSection();
        createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract2)), 1);
        createOrLabel();
        createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract1)), 2);
    }
}

global.parse = function(inputString) {
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
            if (strArr.length > i + 1 && date(lTrimDoubleQuotes(rTrimDoubleQuotes(strArr[i + 1])))) {
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
    console.log("amount: " + amount);
    horizonDate = lTrimDoubleQuotes(rTrimDoubleQuotes(horizonDate));
    const contract = new Contract(numberOfContracts, amount, recipient, newStr,
       translateContract(recipient, amount, horizonDate, acquireAtHorizon),
       horizonDate, acquireAtHorizon);

    createTableRow(contract);
    if (horizonDate !== "instantaneous") {
        contractsMap.set(numberOfContracts, contract);
    } else if (horizonDate === "instantaneous" && amount !== 0) {
        executeContract(contract);
    }
    ++numberOfContracts;
}

global.createTableRow = function(contract) {
    console.log("Creating row:");
    console.log(contract.contractString);
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
    btn.onclick = function() { executeContract(contract) }; // try _ =>
    td.appendChild(btn);
    if (contract.toBeExecutedAtHorizon === "yes" || contract.amount === 0) {
        btn.disabled = true;
    }
}

global.executeContract = function(contract) {
    if (contract.horizonDate !== "instantaneous") {
        var horizonArr = contract.horizonDate.split("-");
        var dateArr = horizonArr[0].split("/");
        var timeArr = horizonArr[1].split(":");
        // +01:00 to get BST from UTC
        var dateString = dateArr[2] + "-" + dateArr[1] + "-"
        + dateArr[0] + "T" + timeArr[0] + ":" + timeArr[1] + ":"
        + (parseInt(timeArr[2]) + 45).toString() + "+01:00"; // adding 45 seconds to the contract's expiry date to allow it to execute
        var contractDate = new Date(dateString);
        var todayDate = new Date();
        if (todayDate.getTime() >= contractDate.getTime()) {
            window.alert("The contract " + contract.id + " has expired.");
            document.getElementById("acquire_button_" + contract.id).disabled = true;
            contractsMap.delete(contract.id);
            return;
        }
    }
    holderAddress().then(holderAddress => {
        counterPartyAddress().then(counterPartyAddress => {
            if (contract.amount != 0) {
                if (contract.recipient == 0) { // owner receives
                    createMoveFile(counterPartyAddress, holderAddress, contract.amount);
                    callTransferFunction(counterPartyAddress, holderAddress, contract.amount);
                } else { // counter party receives
                    createMoveFile(holderAddress, counterPartyAddress, contract.amount);
                    callTransferFunction(holderAddress, counterPartyAddress, contract.amount);
                }
                document.getElementById("acquire_button_" + contract.id).disabled = true;
                contractsMap.delete(contract.id);
            }
        });
    });
}

global.translateContract = function(recipient, amount, horizonDate, acquireAtHorizon) {
    var to = " owner ";
    var from = " counter-party ";
    var hDate = " instantaneously ";
    if (recipient === 1) {
        to = " counter-party ";
        from = " owner ";
    }
    if (horizonDate !== "instantaneous") {
        if (acquireAtHorizon === "yes") {
            hDate = " at " + horizonDate;
        } else {
            hDate = " before " + horizonDate;
        }
    }
    return amount + " Ether are transferred from the contract " + from + " address to the contract " + to + " address " + hDate + ".";
}

global.callTransferFunction = function(fromAddress, toAddress, amount) {
    balanceOfAddress(fromAddress).then(balance => {
        if (balance >= amount) {
            transfer(fromAddress, toAddress, amount).then(transferTxHash => {
                waitForReceipt(transferTxHash).then(_ => {
                    console.log(fromAddress + " has transferred " + amount + " Ether to " + toAddress);
                    retrieveBalances();
                });
            });
        } else {
            // TODO: add status 'failed' label to list
            window.alert("The sender address does not have enough Ether for this transfer. Please deposit more Ether into the account.");
        }
    });
}

global.createMoveFile = function(sender_address, recipient_address, amount) {
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
    downloadLink.click();
    console.log("Created and downloaded .mvir file.");
}

global.retrieveBalances = function() {
    holderBalance().then(function(hBalance) {
        console.log("Holder Balance: " + hBalance);
        counterPartyBalance().then(function(cBalance) {
            console.log("Counter-Party Balance: " + cBalance);
        });
    });
}

global.printStack = function(stack, name) {
    console.log(name + ": " + stack.length);
    var x;
    for (var x = 0; x < stack.length; ++x) {
        console.log(name + " - " + x + ": " + stack[x]);
    }
}

global.createButton = function(contractString, buttonId) {
  var button = document.createElement("button");
  button.id = "choices_button_" + buttonId;
  button.className = "choices_button";
  button.innerHTML = cleanContractParens(contractString); // cleanContractParens(cleanDoubleLeadingOrEndingParens(contractString));
  // 2. Append somewhere
  var bottomContainer = document.getElementById("button_choices_container");
  bottomContainer.appendChild(button);
  // 3. Add event handler
  button.addEventListener ("click", function() {
      console.log("Pressed button");
      console.log(stringToAddToBeginning + button.innerHTML);
      // disable buttons
      var allButtons = bottomContainer.getElementsByTagName('button');
      var inp, i = 0;
      while(inp = allButtons[++i]) {
          inp.disabled = true;
      }
      decomposeContract(stringToAddToBeginning + button.innerHTML);
  });
}

global.cleanContractParens = function(contractString) {
    if (contractString[contractString.length - 1] === "(") {
        contractString = contractString.slice(0, -1);
    }
    if (contractString[0] === ")") {
        contractString = contractString.substring(1);
    }
    if (openingParensAmount(contractString) > closingParensAmount(contractString)) {
        contractString = lTrimParen(contractString);
    } else if (openingParensAmount(contractString) < closingParensAmount(contractString)) {
        contractString = rTrimParen(contractString);
    }
    return contractString;
}

global.addParens = function(contractString) {
    console.log("ADDING PARENS");
    if (openingParensAmount(contractString) > closingParensAmount(contractString)) {
        console.log("more opening");
        contractString = contractString + " )";
    } else if (openingParensAmount(contractString) < closingParensAmount(contractString)) {
        console.log("more closing");
        contractString = "( " + contractString;
    }
    console.log("After: " + contractString);
    return contractString;
}

global.openingParensAmount = function(string) {
    return string.split("(").length - 1;
}

global.closingParensAmount = function(string) {
    return string.split(")").length - 1;
}

global.createSection = function() {
    var para = document.createElement("p");
    var node = document.createTextNode("Contract choice:");
    para.appendChild(node);
    var bottomContainer = document.getElementById("button_choices_container");
    bottomContainer.appendChild(para);
}

global.createOrLabel = function() {
    var para = document.createElement("p");
    para.className = "p_small";
    var node = document.createTextNode("OR");
    para.appendChild(node);

    var bottomContainer = document.getElementById("button_choices_container");
    bottomContainer.appendChild(para);
}

global.removeChildren = function(containerString) {
    var e = document.getElementById(containerString);
    var child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
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
}

class Contract {
    constructor(id, amount, recipient, contractString, meaningOfContractString, horizonDate, toBeExecutedAtHorizon) {
        this.id = id;
        this.amount = amount;
        this.recipient = recipient;
        this.contractString = contractString;
        this.meaningOfContractString = meaningOfContractString;
        this.horizonDate = horizonDate;
        this.toBeExecutedAtHorizon = toBeExecutedAtHorizon;
    }
}

global.date = function(stringInput) {
    var matches = stringInput.match(/^((0?[1-9])|([12][0-9])|(3[01]))\/((0?[1-9])|(1[0-2]))\/(\d\d\d\d)-((0[0-9])|(1[0-9])|(2[0-3])):([0-5][0-9]):([0-5][0-9])$/);
    if (matches === null) {
        return false;
    } else if (matches[0] === stringInput) {
        return true;
    } else {
        return false;
    }
}

global.lTrimWhiteSpace = function(str) {
  if (str == null) return str;
  return str.replace(/^\s+/g, '');
}

global.rTrimWhiteSpace = function(str) {
  if (str == null) return str;
  return str.replace(/\s$/g, '');
}

global.lTrimParen = function(str) {
  if (str == null) return str;
  return str.replace(/^\(+/g, '');
}

global.rTrimParen = function(str) {
  if (str == null) return str;
  return str.replace(/\)$/g, '');
}

global.lTrimDoubleQuotes = function(str) {
  if (str == null) return str;
  return str.replace(/^\"+/g, '');
}

global.rTrimDoubleQuotes = function(str) {
  if (str == null) return str;
  return str.replace(/\"$/g, '');
}
