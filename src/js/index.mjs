/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import {
  cleanParens, addSpacing, addParens, openingParensAmount, closingParensAmount,
  lTrimWhiteSpace, rTrimWhiteSpace, lTrimParen, rTrimParen, lTrimDoubleQuotes,
  rTrimDoubleQuotes, lTrimBrace, rTrimBrace
} from "./stringmanipulation.mjs";

import {Contract, translateContract} from "./contract.mjs";

import {createContract, deposit, getSelectedMetaMaskAccount, holderBalance,
  counterPartyBalance, holderAddress, counterPartyAddress, balanceOfAddress,
  transfer, waitForReceipt
} from "./deploy/deploy.mjs"


//TODO: add window for user to add definitions by typing 'c1 = give zero' then whenever parsing through string we replace every c1 with its value in the map

// TODO: no truncate means infinite horizon!!!!!!!!!!!

// TODO: PROBLEM: cannot just use max truncate because if there is contract without truncate then max will be infinite


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


// TODO: add conditionals
// - check if contains 'if' --> evaluate conditional first -- does not matter if it is nested somewhere
// start from '(' after if and find next ')' WHERE noOfOpening == 1
// split string into '(...)', '{...}', '{...}' (if contains else)
// split by outermost comparison operator
// find horizon of each contract - check if date is later
// replace if clause by contract either {true} or {false} contract
// TODO: add option for nested condition ie (x > y) && (a < b || c > b)
function findAndEvaluateLeastBalancedIf(inputString) {
    var openingParens = 0;
    var symbolArr = inputString.split("");
    var leastBalancedIfParens = -1;
    var leastBalancedIfIndex = 0;
    var ifCondition = "";
    // finding least balanced if
    for (var i = 0; i < symbolArr.length; ++i) {
        var symbol = symbolArr[i];
        if (symbol === "(") {
            console.log("opening");
            ++openingParens;
        } else if (symbol === ")") {
          console.log("closing");
            --openingParens;
        } else if (symbol === "i" && symbolArr[i + 1] === "f" && openingParens > leastBalancedIfParens) {
            console.log("found new leastBalancedIfIndex");
            leastBalancedIfIndex = i;
            leastBalancedIfParens = openingParens;
        }
    }
    openingParens = 0;
    var j = 0;
    console.log(leastBalancedIfIndex);
    // finding the whole if condition
    for (j = leastBalancedIfIndex; j < symbolArr.length; ++j) {
        var symbol = symbolArr[j];
        if (symbol === "(") {
            ++openingParens;
        } else if (symbol === ")") {
            --openingParens;
            console.log("openingParens: " + openingParens);
            if (openingParens === 0) {
                // have found the whole condition
                console.log(inputString.charAt(j + 1));
                console.log(inputString.charAt(j + 2));
                console.log(inputString.charAt(j + 3));
                if (inputString.charAt(j + 2) !== "{") {
                    console.error("if statements should be followed by curly braces.");
                }
                ifCondition = inputString.substring(leastBalancedIfIndex + 5, j - 1);
                console.log("Found end of if");
                break;
            }
        }
    }
    var start = "";
    start = inputString.substring(0, leastBalancedIfIndex - 1);
    /*
    if (inputString.charAt(leastBalancedIfIndex - 2) === "(") {
        start = inputString.substring(0, leastBalancedIfIndex - 3);
    } else {
        start = inputString.substring(0, leastBalancedIfIndex - 1);
    }
    */

    console.log("START");
    console.log(start);
    console.log(ifCondition);
    console.log(symbolArr.length);
    console.log(inputString);
    var endWithActions = inputString.substring(j + 2);
    console.log(endWithActions);
    var bool = conditionalEvalution(rTrimWhiteSpace(lTrimWhiteSpace(ifCondition)));
    //var bool = conditionalEvalution(rTrimWhiteSpace(lTrimWhiteSpace(rTrimParen(lTrimParen(ifCondition)))));
    if (!endWithActions.includes("}")) {
        console.error("no closing curly brace found after if clause");
    }
    console.log("bool: " + bool);
    var indexOfFirstClosingCurlyBrace = endWithActions.indexOf("}");
    var action1 = endWithActions.substring(0, indexOfFirstClosingCurlyBrace);
    var action2 = "";
    var substring2 = "";
    if (indexOfFirstClosingCurlyBrace !== endWithActions.length - 1 && indexOfFirstClosingCurlyBrace !== endWithActions.length - 2) {
        substring2 = endWithActions.substring(indexOfFirstClosingCurlyBrace + 2);
    }
    /*
    if (endWithActions.charAt(indexOfFirstClosingCurlyBrace + 2) === "e") { // conditional contains else
        substring2 = endWithActions.substring(indexOfFirstClosingCurlyBrace + 2);
    } else {
        substring2 = endWithActions.substring(indexOfFirstClosingCurlyBrace + 4);
    }
    */
    var end = substring2;
    console.log("END");
    console.log(end);
    var substring2Arr = substring2.split(" "); // check if can check for start of string more efficiently
    // if next symbole after indexOfFirstClosingCurlyBrace is else then we split again
    if (substring2Arr[0] === "else") {
        if (substring2Arr[1] !== "{") {
            console.error("else should be followed by curly braces.");
        }
        indexOfFirstClosingCurlyBrace = substring2.indexOf("}");
        action2 = substring2.substring(5, indexOfFirstClosingCurlyBrace);
        end = substring2.substring(indexOfFirstClosingCurlyBrace + 2);
    }
    console.log(bool);
    var startArr = start.split(" ");
    var endArr = end.split(" ");
    if (startArr[startArr.length - 1] === "(" && endArr[0] === ")") {
        var firstIndex = end.indexOf(" ");
        var lastIndex = start.lastIndexOf(" ");
        start = start.substring(0, lastIndex);
        end = end.substring(firstIndex + 1);
        startArr = start.split(" ");
        endArr = end.split(" ");
    }
    if (bool) { // if the if clause succeeds then execute action1
        console.log("action1");
        console.log(action1);
        return start + lTrimBrace(rTrimBrace(action1)) + end;
    } else { // if no 'else' then return zero TODO: cannot do that as in nested one this will mess with clause
        if (action2 == "") {
            console.log("No else clause given");
            // check if first/last word is and/or

            console.log(startArr[startArr.length - 1]);
            console.log(start);
            console.log(end);
            if (startArr[startArr.length - 1] === "and" || startArr[startArr.length - 1] === "or") {
                var lastIndex = start.lastIndexOf(" ");
                start = start.substring(0, lastIndex);
            }
            console.log(endArr[0]);
            console.log(end);
            if (endArr[0] === "and" || endArr[0] === "or") {
                var firstIndex = end.indexOf(" ");
                end = end.substring(firstIndex + 1);
            }
            console.log("YAS");
            console.log(start);
            console.log(end);
            return start + " " + end;
        }
        console.log("action2");
        console.log(action2);
        console.log(action2.length);
        return start + lTrimBrace(rTrimBrace(action2)) + end;
    }
}


function conditionalEvalution(inputString) {
    console.log("inputstring " + inputString);
    var strArr = inputString.split("");
    var openingParens = 0;
    for (var i = 0; i < strArr.length; ++i) {
        var term = strArr[i];
        console.log("term: " + term);
        if (term === "(") {
            ++openingParens;
        } else if (term === ")") {
            --openingParens;
        } else if (openingParens === 0) {
            if (term === "|" || term === "&") {
                console.log("found " + term);
                var part1 = inputString.substring(0, i - 1);
                var part2 = inputString.substring(i + 2, inputString.length + 1);
                console.log("ici1");
                console.log(part1);
                console.log(part2);
                if (term === "|") {
                    var x = conditionalEvalution(part1);
                    var y = conditionalEvalution(part2);
                    console.log("COND EVAL");
                    console.log(x);
                    console.log(y);
                    console.log(x || y);
                    var bool = x || y;
                    return bool;
                } else if (term === "&") {
                    var bool = conditionalEvalution(part1) && conditionalEvalution(part2);
                    return bool;
                }
            }
            else if (term === ">" || term === "<" || term === "=") {
                // can only compare two contracts - so we cannot have (a & b) > (c | d), cannot have  a & b or  a | b
                // TODO: allow comparison of numbers - need parser to parse (1 * 7) > 5
                //if no truncate included then horizon is infinite, else find truncate with max date

                var part1 = inputString.substring(0, i - 1);
                var part2 = "";
                // TODO: add <= , >=, ==
                if (strArr[i + 1] === "=") {
                    part2 = inputString.substring(i + 3, inputString.length - 1);
                } else {
                    part2 = inputString.substring(i + 2, inputString.length + 1);
                }
                console.log("ici2");
                console.log(part1);
                console.log(part2);
                var horizon1 = getHorizon(part1);
                var horizon2 = getHorizon(part2);
                console.log("horizon obtained 1");
                console.log(horizon1);
                console.log("horizon obtained 2");
                console.log(horizon2);
                if (term === ">") {
                    if (strArr[i + 1] !== "=") {
                        console.log("greater than");
                        if (horizon1 === "infinite" || horizon2 === "infinite") {
                            if (horizon1 === "infinite" && horizon2 === "infinite") {
                                console.log("both are infinite");
                                return false;
                            } else {
                                if (horizon1 === "infinite") {
                                    console.log("hor1 is infinite");
                                    return true;
                                } else {
                                    console.log("hor2 is infinite");
                                    return false;
                                }
                            }
                        }
                        console.log("none are infinite");
                        return greaterDate(horizon1, horizon2);
                    } else {
                        console.log("greater than or equal to");
                        if (horizon1 === "infinite" || horizon2 === "infinite") {
                            if (horizon1 === "infinite" && horizon2 === "infinite") {
                                console.log("both are infinite");
                                return true;
                            } else {
                                if (horizon1 === "infinite") {
                                    console.log("hor1 is infinite");
                                    return true;
                                } else {
                                    console.log("hor2 is infinite");
                                    return false;
                                }
                            }
                        }
                        console.log("none are infinite");
                        return greaterDate(horizon1, horizon2) || equalDates(horizon1, horizon2);
                    }
                } else if (term === "<") {
                    if (strArr[i + 1] !== "=") {
                        console.log("horizons");
                        console.log(horizon1);
                        console.log(horizon2);
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
                    } else {
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
                    }
                } else if (term === "=") {
                    if (strArr[i + 1] === "=") {
                        if (horizon1 === "infinite" || horizon2 === "infinite") {
                            if (horizon1 === "infinite" && horizon2 === "infinite") {
                                return true;
                            } else {
                                return false;
                            }
                        }
                        return equalDates(horizon1, horizon2);
                    } else {
                        console.error("= should be ==");
                    }
                }
            }
        }
    }
}

function getHorizon(contractString) {
    console.log("Getting horizon");
    console.log(contractString);
    // Loops through the whole contract to find the largest horizon
    if (!contractString.includes("truncate")) {
        console.log("does not include truncate");
        return "infinite";
    } else {
        // TODO: change to go through all contracts by splitting by all 'and' 'or' occurrences
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
                    console.log(strArr);
                    console.log("have not come across truncate before conjucnction " + strArr[i] + " at " + i);
                    return "infinite";
                }
                comeAcrossTruncate = false;
            }
        }
        return maxHorizon;
    }
}



global.decomposeContract = function(inputString) {
    //TODO: check formate of string ie whenever 'if' then followed by '(){}'
    // TODO: do conditional evaluation first

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
    inputString = inputString.replace(/(\r\n|\n|\r)/gm," ");
    // remove multiple whitespaces
    inputString = inputString.replace(/  +/g, ' ');
    // add spacing before and after parenthesis
    inputString = addSpacing(inputString);

    // repeat replacing the if clause while string includes if
    while (inputString.includes("if")) {
        console.log("Headie1");
        console.log(inputString);
        console.log("performing cond eval");
        inputString = findAndEvaluateLeastBalancedIf(inputString);
    }

    console.log("Headie2");
    console.log(inputString);
    inputString = rTrimWhiteSpace(lTrimWhiteSpace(inputString));

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
