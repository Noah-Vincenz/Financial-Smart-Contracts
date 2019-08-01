/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import {
  cleanParens, addSpacing, addParens, openingParensAmount, closingParensAmount,
  lTrimWhiteSpace, rTrimWhiteSpace, lTrimParen, rTrimParen, lTrimDoubleQuotes,
  rTrimDoubleQuotes, lTrimBrace, rTrimBrace, changeDateFormat, changeDateFormatBack
} from "./stringmanipulation.mjs";

import {Contract, translateContract} from "./contract.mjs";

import {depositCollateral, getSelectedMetaMaskAccount, holderBalance,
  counterPartyBalance, holderAddress, counterPartyAddress, balanceOfAddress,
  transfer, waitForReceipt, setDefaultAccount, setSmartContractInstance, instantiateNew
} from "./deploy/deploy.mjs"

import {Oracle, createOracles, getOracleByAddress} from "./oracles.mjs";

//TODO: add window for user to add definitions by typing 'c1 = give zero' then whenever parsing through string we replace every c1 with its value in the map
//TODO: add oracles
//TODO: add gas estimation of transfers
//TODO: go over conditionalEvaluation to check if correct for all cases

var numberOfContracts = 0;
var stringToAddToBeginning = ""; // string that is added to the beginning of the contract when outer most does not contain any conjunctions ie. 'truncate' will simply be added to contract string and rest will be decomposed
var contractsMap = new Map(); // map from contract id to contract object
var agreedOracleAddress;
var account1Deposited = false;
var account2Deposited = false;

$(function(){
    var $select = $(".custom_select");
    for (var i = 1; i <= 100; ++i) {
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
    createOracles();

    // start timer
    update();
    runClock();
});

function update() {
    // loop through all contracts and check if their time == current time and if so check if get or not
    // if get: then execute
    // if not get: then disable acquire button
    for (var [key, value] of contractsMap) {
        if (value.horizonDate !== "infinite") {
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

function updateBalances() {
    retrieveBalances();
}

global.callDepositFunction = function(id) {
    document.getElementById("create_contract_status").innerHTML = "";
    var addr = "";
    if (id === 1) {
        addr = "holder_address";
    } else {
        addr = "counter_party_address";
    }
    var depositAmount = getSelectedDeposit();
    var senderAddress = document.getElementById(addr).value;
    if (getSelectedMetaMaskAccount().toUpperCase() === senderAddress.toUpperCase()) {
        depositCollateral(senderAddress, depositAmount).then(holderDepositTxHash => {
            waitForReceipt(holderDepositTxHash).then(_ => {
                console.log("Deposit of " + depositAmount + " Ether has been added to " + addr + " account.");
                if (id === 1) {
                    account1Deposited = true;
                } else {
                    account2Deposited = true;
                }
                if (account1Deposited && account2Deposited) {
                    document.getElementById("make_transaction_button").disabled = false;
                    document.getElementById("transaction_input").disabled = false;
                }
                retrieveBalances();
            });
        });
    } else {
        document.getElementById("create_contract_status").innerHTML = "Please change the currently selected MetaMask account to the one you would like to deposit to.";
    }
}

global.createContractFunction = function() {
    document.getElementById("create_contract_status").innerHTML = "";
    var holderAddressValue = document.getElementById("holder_address").value;
    var counterPartyAddressValue = document.getElementById("counter_party_address").value;
    if (getSelectedMetaMaskAccount().toUpperCase() === holderAddressValue.toUpperCase()) {
        setDefaultAccount(holderAddressValue);
        instantiateNew(holderAddressValue, counterPartyAddressValue).then(instantiationTxHash => {
            waitForReceipt(instantiationTxHash).then(instantiationReceipt => {
                setSmartContractInstance(instantiationReceipt.contractAddress);
                document.getElementById("create_contract_button").disabled = true;
                document.getElementById("select_oracle").disabled = true;
                document.getElementById("holder_address").disabled = true;
                document.getElementById("counter_party_address").disabled = true;
                document.getElementById("deposit_button1").disabled = false;
                document.getElementById("deposit_button2").disabled = false;
                document.getElementById("select_deposit").disabled = false;
                agreedOracleAddress = getSelectedOracle();
            });
        });
    } else {
        document.getElementById("create_contract_status").innerHTML = "Please change the currently selected MetaMask account to the contract holder account.";
    }
}

function getSelectedDeposit() {
    return document.getElementById("select_deposit").value;
}

function getSelectedOracle() {
    return document.getElementById("select_oracle").value;
}

global.getInputString = function() {
    return document.getElementById("transaction_input").value;
};

// split string into '(...)', '{...}', '{...}' (if contains else)
// split by outermost comparison operator
// find horizon of each contract - check if date is later
// replace if clause by contract either {true} or {false} contract
function evaluateConditionals(inputString) {
    var openingParens = 0;
    var closingParens = 0;
    var stack = [];
    var ifsStack = []; // keeping stack of leftover opening parenthesis in from previous ifs
    var ifCondition = "";
    var ifsToBeMatched = 0; // keeps track of how many ifs have been read ie. how nested clause is
    var termArr = inputString.split(" ");
    for (var i = 0; i < termArr.length; ++i) {
        var term = termArr[i];
        var nextTerm = termArr[i + 1]; // for syntax checking
        stack.push(term);
        if (term === "if" && i < termArr.length - 3) {
            if (nextTerm !== "(") {
                console.error("syntax error at term " + (i + 1).toString() + ": " + nextTerm);
                return "error";
            }
            ++ifsToBeMatched;
            ifsStack.push(openingParens - closingParens);
        } else if (term === "(" && i < termArr.length - 3) {
            if (nextTerm === ")" || nextTerm === ">" || nextTerm === "<"
              || nextTerm === ">=" || nextTerm === "<=" || nextTerm === "=="
              || nextTerm === "&&" || nextTerm === "||" || nextTerm === "{"
              || nextTerm === "}") {
                console.error("syntax error at term " + (i + 1).toString() + ": " + nextTerm);
                return "error";
            }
            ++openingParens;
        } else if (term === ")") {
            if (i < termArr.length - 1 && ( nextTerm === "if" || nextTerm === "(" || nextTerm === "}") ) {
                console.error("syntax error at term " + (i + 1).toString() + ": " + nextTerm);
                return "error";
            }
            ++closingParens;
            //if (openingParens - ifsStack[ifsStack.length - 1] === closingParens) {
            if ( ( ifsStack.length === 0 && openingParens === closingParens && ifsToBeMatched !== 0 ) || ( openingParens - ifsStack[ifsStack.length - 1] === closingParens ) ) {

                // pop from stack until we have read 'if'
                // --ifsRead
                while (stack[stack.length - 1] !== "if") {
                    if (ifCondition === "") {
                        ifCondition = stack.pop();
                    } else {
                        ifCondition = stack.pop() + " " + ifCondition;
                    }
                }
                console.log("if condition: " + ifCondition);
                stack.pop(); // popping 'if' off stack
                --ifsToBeMatched;
                // performance is good here: not parsing {}{} stuff
                var leftOverArr = termArr.slice(i + 1);
                var firstIndexClosingBrack = leftOverArr.indexOf("}");
                var action1Arr = leftOverArr.slice(1, firstIndexClosingBrack);
                var action1 = action1Arr.join(" ");
                console.log("action1: " + action1);
                var action2Arr = [];
                var action2 = "";
                if (leftOverArr[firstIndexClosingBrack + 1] === "else") {
                    leftOverArr = leftOverArr.slice(firstIndexClosingBrack + 2); // + 2 because of 'else'
                    firstIndexClosingBrack = leftOverArr.indexOf("}");
                    action2Arr = leftOverArr.slice(1, firstIndexClosingBrack);
                    action2 = action2Arr.join(" ");
                }
                console.log("action2: " + action2);
                var bool = conditionalEvaluation(rTrimWhiteSpace(lTrimWhiteSpace(rTrimParen(lTrimParen(ifCondition)))));
                console.log("bool: " + bool);
                if (stack[stack.length - 1] === "(" && leftOverArr[firstIndexClosingBrack + 1] === ")") {
                    stack.pop(); // get rid of previous '('
                    ++i; // skip next previous ')'
                    leftOverArr.splice(firstIndexClosingBrack + 1, 1); // for check in action=="" part
                    ++closingParens;
                }

                if (bool) { // if the if clause succeeds then execute action1
                    stack.push(lTrimBrace(rTrimBrace(action1)));
                } else {
                    if (action2 == "") {
                        if (stack[stack.length - 1] === "and" || stack[stack.length - 1] === "or") {
                            stack.pop();
                        }
                        if (leftOverArr[firstIndexClosingBrack + 1] === "and" || leftOverArr[firstIndexClosingBrack + 1] === "or") {
                            ++i;
                        }
                    }
                    stack.push(lTrimBrace(rTrimBrace(action2)));
                }
                console.log("stack:");
                console.log(stack);
                // skip next terms until end of conditional clause is reached
                i = i + action1Arr.length + 2;
                if (action2Arr.length !== 0) {
                    i = i + 1 + action2Arr.length + 2;
                }

            }
            ifsStack.pop();
            ifCondition = "";
        } else if (term !== "give" && term !== "truncate" && term !== "get" && term !== "one"
          && term !== "zero" && term !== "scaleK" && term !== "one" && term !== "=="
          && term !== ">=" && term !== "<=" && term !== "<" && term !== ">" && term !== "&&"
          && term !== "||" && !parseInt(term) && !isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(term))) && term !== "else" && term !== "}"
          && term !== "{" && term !== "and" && term !== "or" && term !== "libor3m" && term !== "tempInLondon") {
            // give error
            console.error("syntax error at term " + i.toString() + ": " + term);
            return "error";
        }
    }
    var contractString = "";
    while (stack.length !== 0) {
        contractString = stack.pop() + " " + contractString;
    }
    return lTrimWhiteSpace(rTrimWhiteSpace(contractString));
}

function conditionalEvaluation(inputString) {
    var strArr = inputString.split(" ");
    var openingParens = 0;
    for (var i = 0; i < strArr.length; ++i) {
        var term = strArr[i];
        if (term === "(") {
            ++openingParens;
        } else if (term === ")") {
            --openingParens;
        } else if (openingParens === 0) {
            if (term === "||" || term === "&&") {
                var part1 = strArr.slice(0, i).join(" ");
                var part2 = strArr.slice(i + 1).join(" ");
                var bool1 = conditionalEvaluation(lTrimWhiteSpace(rTrimWhiteSpace(lTrimParen(rTrimParen(part1)))));
                var bool2 = conditionalEvaluation(lTrimWhiteSpace(rTrimWhiteSpace(lTrimParen(rTrimParen(part2)))));
                if (term === "||") {
                    return bool1 || bool2;
                } else if (term === "&&") {
                    return bool1 && bool2;
                }
            }
            else if (term === ">" || term === "<" || term === "==" || term === ">=" || term === "<=") {
                // can only compare two contracts - so we cannot have (a & b) > (c | d), cannot have  a & b or  a | b
                // TODO: allow comparison of numbers - need parser to parse (1 * 7) > 5
                //if no truncate included then horizon is infinite, else find truncate with max date
                var part1 = strArr.slice(0, i).join(" ");
                var part2 = strArr.slice(i + 1).join(" ");
                var horizon1 = getHorizon(part1);
                var horizon2 = getHorizon(part2);
                console.log("horizon obtained 1");
                console.log(horizon1);
                console.log("horizon obtained 2");
                console.log(horizon2);
                if (term === ">=") {
                    if (horizon1 === "infinite" || horizon2 === "infinite") {
                        if (horizon1 === "infinite" && horizon2 === "infinite") {
                            return true;
                        } else {
                            if (horizon1 === "infinite") {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    }
                    return greaterDate(horizon1, horizon2) || equalDates(horizon1, horizon2);
                } else if (term === ">") {
                    if (horizon1 === "infinite" || horizon2 === "infinite") {
                        if (horizon1 === "infinite" && horizon2 === "infinite") {
                            return false;
                        } else {
                            if (horizon1 === "infinite") {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    }
                    return greaterDate(horizon1, horizon2);
                } else if (term === "<=") {
                    if (horizon1 === "infinite" || horizon2 === "infinite") {
                        if (horizon1 === "infinite" && horizon2 === "infinite") {
                            return true;
                        } else {
                            if (horizon1 === "infinite") {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    }
                    return !greaterDate(horizon1, horizon2) || equalDates(horizon1, horizon2);
                } else if (term === "<") {
                    if (horizon1 === "infinite" || horizon2 === "infinite") {
                        if (horizon1 === "infinite" && horizon2 === "infinite") {
                            return false;
                        } else {
                            if (horizon1 === "infinite") {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    }
                    return !greaterDate(horizon1, horizon2);
                } else if (term === "==") {
                    if (horizon1 === "infinite" || horizon2 === "infinite") {
                        if (horizon1 === "infinite" && horizon2 === "infinite") {
                            return true;
                        } else {
                            return false;
                        }
                    }
                    return equalDates(horizon1, horizon2);
                }
            }
        }
    }
}

function getHorizon(contractString) {
    // Loops through the whole contract to find the largest horizon
    if (!contractString.includes("truncate")) {
        return "infinite";
    } else {
        var strArr = contractString.split(" ");
        var indexOfFirstTruncate = strArr.indexOf("truncate");
        var substringArr = strArr.slice(indexOfFirstTruncate + 1);
        var maxHorizon = substringArr[0]; // setting first horizon as maxHorizon
        var comeAcrossTruncate = false;
        for (var i = 0; i < strArr.length; ++i) {
            if(strArr[i] === "truncate") {
                comeAcrossTruncate = true;
                if (greaterDate(strArr[i + 1], maxHorizon)) {
                    maxHorizon = strArr[i + 1];
                }
                ++i;
            } else if (strArr[i] === "and" || strArr[i] === "or") { // have reached end of subcontract
                if (!comeAcrossTruncate) { // if we have not come across a "truncate" then this subcontract's horizon is infinite
                    return "infinite";
                }
                comeAcrossTruncate = false;
            }
        }
        return maxHorizon;
    }
}



global.decomposeContract = function(inputString) {
    document.getElementById("transaction_status").innerHTML = "";
    if (inputString === "") {
        document.getElementById("transaction_status").innerHTML = "Please provide some contract input.";
        return;
    }
    if (openingParensAmount(inputString) !== closingParensAmount(inputString)) {
        console.error("Parenthesis mismatch: The contract is not constructed properly.");
        document.getElementById("transaction_status").innerHTML = "Parenthesis mismatch: The contract is not constructed properly.";
        return;
    }
    console.log(inputString);
    inputString = changeDateFormat(inputString);
    console.log(inputString);
    // remove linebreaks
    inputString = inputString.replace(/(\r\n|\n|\r)/gm," ");
    // remove multiple whitespaces
    inputString = inputString.replace(/  +/g, ' ');
    // add spacing before and after parenthesis
    inputString = addSpacing(inputString);

    // repeat replacing the if clause while string includes if
    inputString = evaluateConditionals(inputString);
    if (inputString === "") {
        return;
    }
    if (inputString === "error") {
        document.getElementById("transaction_status").innerHTML = "Syntax error: The contract is not constructed properly.";
        return;
    }

    inputString = rTrimWhiteSpace(lTrimWhiteSpace(inputString));

    if (inputString.includes("get") && !inputString.includes("truncate")) {
        console.error("The contract is not constructed properly. Contract strings cannot include 'get' without 'truncate'.");
        document.getElementById("transaction_status").innerHTML = "The contract is not constructed properly. Contract strings cannot include 'get' without 'truncate'.";
        return;
    }

    removeChildren("button_choices_container");
    stringToAddToBeginning = "";
    var noOfOpeningParens = 0;
    var noOfClosingParens = 0;
    var contractString = "";
    var contractsStack = [];
    var conjunctionsStack = [];
    stringToAddToBeginning = "";

    // check if inputstring contains 'or' else execute right away

    var matches = inputString.match(/^(.*)\sor\s(.*)$/);
    if (matches !== null) {
    //if (inputString.includes("or")) {
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
               console.error("Parenthesis mismatch: The contract is not constructed properly.");
               document.getElementById("transaction_status").innerHTML = "Parenthesis mismatch: The contract is not constructed properly.";
               return;
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
    // we want to split by 'or' occurrence with only 1 difference between |openingParens| and |closingParen|
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
    if (conj === "or") {
        createSection();
        createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract2)), 1);
        createOrLabel();
        createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract1)), 2);
    }
}

function parse(inputString) {
    var recipient = 0; // by default the contract holder is the recipient
    var amount = "1";
    if (inputString.includes("zero")) {
        amount = "0";
    }
    var horizonDate = "infinite";
    var acquireAtHorizon = "no"; // used for get, ie if get is discovered then this is set to true
    var newStr = inputString.replace(/[()]/g, ''); // removing parenthesis
    var strArr = newStr.split(" ");
    for (var i = 0; i < strArr.length; ++i) {
        var str = strArr[i];
        if (str === "give") {
            recipient = 1;
        } else if (str === "scaleK" && !inputString.includes("zero")) {
            if (strArr.length > i + 1 && (parseInt(strArr[i + 1]))) {
                amount = ( parseInt(amount) * parseInt(strArr[i + 1]) ).toString();
                ++i;
            } else if (strArr.length > i + 1 && ( strArr[i + 1] === "tempInLondon" || strArr[i + 1] === "libor3m" ) ) {
                amount = strArr[i + 1];
                ++i;
            } else {
                console.error("Syntax error: scaleK should be followed by an integer or an observable.");
                return;
            }
        } else if (str === "truncate") {
            if (strArr.length > i + 1 && isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(strArr[i + 1])))) {
                horizonDate = strArr[i + 1];
                ++i;
            } else {
                console.error("Syntax error: truncate should be followed by a date in the following pattern: 'dd/mm/yyyy hh:mm:ss'.");
                return;
            }
        } else if (str === "get") {
            acquireAtHorizon = "yes";
        }
    }
    horizonDate = lTrimDoubleQuotes(rTrimDoubleQuotes(horizonDate));
    const contract = new Contract(numberOfContracts, amount, recipient, inputString,
       translateContract(recipient, amount, horizonDate, acquireAtHorizon),
       horizonDate, acquireAtHorizon, "waiting to be executed");

    createTableRow(contract);

    if (horizonDate !== "infinite" && beforeCurrentDate(contract)) {
        // add expired label & disable acquire button
        document.getElementById("td_status_" + contract.id.toString()).innerHTML = "expired";
        document.getElementById("acquire_button_" + contract.id.toString()).disabled = true;
    } else {
        contractsMap.set(numberOfContracts, contract);
        document.getElementById("td_status_" + contract.id.toString()).innerHTML = "waiting to be executed";
    }
    ++numberOfContracts;
}

function computeDateString(dateString) {
    var horizonArr = dateString.split("-");
    var dateArr = horizonArr[0].split("/");
    var timeArr = horizonArr[1].split(":");
    // +01:00 to get BST from UTC
    var finalDateString = dateArr[2] + "-" + dateArr[1] + "-"
    + dateArr[0] + "T" + timeArr[0] + ":" + timeArr[1] + ":"
    + (parseInt(timeArr[2]) + 15).toString() + "+01:00"; // adding 15 seconds to the contract's expiry date to allow it to execute
    return finalDateString;
}

function beforeCurrentDate(contract) {
    var contractDate = new Date(computeDateString(contract.horizonDate));
    var todayDate = new Date();
    if (contractDate.getTime() <= todayDate.getTime()) {
        return true;
    } else {
        return false;
    }
}

function equalDates(dateString1, dateString2) {
    // for first date
    var contractDate1 = new Date(computeDateString(dateString1));
    // for second date
    var contractDate2 = new Date(computeDateString(dateString2));

    if (contractDate1.getTime() === contractDate2.getTime()) {
        return true;
    } else {
        return false;
    }
}

function greaterDate(dateString1, dateString2) {
    // returns true if dateString1 > dateString2
    // for first date
    var contractDate1 = new Date(computeDateString(dateString1));
    // for second date
    var contractDate2 = new Date(computeDateString(dateString2));

    if (contractDate1.getTime() > contractDate2.getTime()) {
        return true;
    } else {
        return false;
    }
}

function executeContract(contract) {
    if (contract.horizonDate !== "infinite") {
        if (beforeCurrentDate(contract)) {
            window.alert("The contract " + contract.id + " has expired.");
            document.getElementById("td_status_" + contract.id.toString()).innerHTML = "expired";
            contractsMap.delete(contract.id);
            return;
        }
    }
    if (contract.amount === "tempInLondon") {
        contract.amount = getOracleByAddress(agreedOracleAddress).getTempInLondon().toString();
    }
    if (contract.amount === "libor3m") {
        contract.amount = getOracleByAddress(agreedOracleAddress).getLiborSpotRate().toString();
    }
    //newStr = convertObservables(newStr);

    holderAddress().then(holderAddress => {
        counterPartyAddress().then(counterPartyAddress => {
            if (contract.recipient == 0) { // owner receives
                createMoveFile(counterPartyAddress, holderAddress, parseFloat(contract.amount));
                callTransferFunction(contract, counterPartyAddress, holderAddress);
            } else { // counter party receives
                createMoveFile(holderAddress, counterPartyAddress, parseFloat(contract.amount));
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
        if (balance >= parseFloat(contract.amount)) {
            transfer(fromAddress, toAddress, parseFloat(contract.amount)).then(transferTxHash => {
                waitForReceipt(transferTxHash).then( _ => {
                    console.log(fromAddress + " has transferred " + contract.amount + " Ether to " + toAddress);
                    document.getElementById("td_status_" + contract.id.toString()).innerHTML = "successful";
                    document.getElementById("acquire_button_" + contract.id.toString()).disabled = true;
                    contractsMap.delete(contract.id);
                    updateBalances();
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
        document.getElementById("holder_balance_p").innerHTML = "Balance: " + hBalance + "ETH";
        counterPartyBalance().then(function(cBalance) {
            document.getElementById("counter_party_balance_p").innerHTML = "Balance: " + cBalance + "ETH";
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
    td.innerHTML = changeDateFormatBack(contract.contractString);
    tr.appendChild(td = document.createElement("td"));
    td.innerHTML = changeDateFormatBack(contract.meaningOfContractString);
    tr.appendChild(td = document.createElement("td"));
    td.innerHTML = changeDateFormatBack(contract.horizonDate);
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
    if (contract.toBeExecutedAtHorizon === "yes") {
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
