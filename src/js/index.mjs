/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import {
  cleanParens, addSpacing, addParens, openingParensAmount, closingParensAmount,
  lTrimWhiteSpace, rTrimWhiteSpace, lTrimParen, rTrimParen, lTrimDoubleQuotes,
  rTrimDoubleQuotes, lTrimBrace, rTrimBrace, changeDateFormat, changeDateFormatBack,
  trimSemiColon
} from "./stringmanipulation.mjs";

import {Contract, translateContract} from "./contract.mjs";

import {depositCollateral, getSelectedMetaMaskAccount, holderBalance,
  counterPartyBalance, holderAddress, counterPartyAddress, balanceOfAddress,
  transfer, waitForReceipt, setDefaultAccount, setSmartContractInstance, instantiateNew,
  watchTransferEvent
} from "./deploy/deploy.mjs"

import {Oracle, createOracles, getOracleByAddress} from "./oracles.mjs";

//TODO: add window for user to add definitions by typing 'c1 = give zero' then whenever parsing through string we replace every c1 with its value in the map
//TODO: add gas estimation of transfers
//TODO: go over conditionalEvaluation to check if correct for all cases

var numberOfSubContracts = 0;
var numberOfContracts = 0;
var stringToAddToBeginning = ""; // string that is added to the beginning of the contract when outer most does not contain any conjunctions ie. 'truncate' will simply be added to contract string and rest will be decomposed
var superContractsMap = new Map(); // map from superContract id to set of contract objects contained within super contract
var agreedOracleAddress;
var account1Deposited = false;
var account2Deposited = false;
var definitionsMap = new Map();

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
    document.getElementById("transaction_input_textarea").disabled = true;
    */
    createOracles();

    // start timer
    update();
    runClock();
});

// TODO: transform input ie decrease spaces
global.addDefinition = function(inputString) {
    document.getElementById("add_definitions_status").innerHTML = "";
    // pattern matching for semantics
    var matches = inputString.match(/^\w+\s=\s.+;$/);
    if (matches === null) {
        document.getElementById("add_definitions_status").innerHTML = "The format of the given definition is incorrect.";
        return;
    }
    document.getElementById("input_added_textarea").innerHTML = "";
    var strArr = inputString.split("=");
    var part1 = rTrimWhiteSpace(strArr[0]);
    var part2 = trimSemiColon(lTrimWhiteSpace(strArr[1]));
    // check semantics of second part
    var secondArr = part2.split(" ");
    for (var i = 0; i < secondArr.length; ++i) {
        var term = secondArr[i];
        if (term !== "give" && term !== "truncate" && term !== "get" && term !== "one"
        && term !== "zero" && term !== "scaleK" && term !== "one" && term !== "{==}"
        && term !== "{>=}" && term !== "{<=}" && term !== "{<}" && term !== "{>}" && term !== "[==]"
        && term !== "[>=]" && term !== "[<=]" && term !== "[<]" && term !== "[>]" && term !== "&&"
        && term !== "||" && !parseInt(term) && !isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(term))) && term !== "else" && term !== "}"
        && term !== "{" && term !== "and" && term !== "or" && term !== "libor3m" && term !== "tempInLondon" && !definitionsMap.has(term)) {
            document.getElementById("add_definitions_status").innerHTML = "The format of the given definition is incorrect.";
            return;
        }
    }
    definitionsMap.set(part1, part2);
    for (var [key, value] of definitionsMap) {
        document.getElementById("input_added_textarea").innerHTML += (key + " = " + value + "\n");
    }
}

global.getDefinitionsText = function() {
    return document.getElementById("add_input_textarea").value;
}

function update() {
    // loop through all contracts and check if their time == current time and if so check if get or not
    // if get: then execute
    // if not get: then disable acquire button
    for (var [superContractId, contractsSet] of superContractsMap) {
        for (let contract of contractsSet) {
            if (contract.horizonDate !== "infinite" && beforeCurrentDate(contract.horizonDate)) {
                if (contract.toBeExecutedAtHorizon === "yes") { // contract contains 'get' - must be executed now
                    executeSingleContract(contract);
                } else { // contract just contains 'truncate' and not 'get'
                    document.getElementById("td_status_" + contract.id).innerHTML = "expired";
                    deleteFromSuperContracts(superContractId, contract);
                }
            }
        }
    }
}

function runClock() { // every 60 seconds we check for expired contracts
    var now = new Date();
    var timeToNextTick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function() {
        update();
        runClock();
    }, timeToNextTick);
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
                document.getElementById("select_deposit").disabled = true;
                if (id === 1) {
                    account1Deposited = true;
                } else {
                    account2Deposited = true;
                }
                if (account1Deposited && account2Deposited) {
                    document.getElementById("make_transaction_button").disabled = false;
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
    var localHolderAddress = document.getElementById("holder_address").value;
    var localCounterPartyAddress = document.getElementById("counter_party_address").value;
    // TODO: check if getSelectedMetaMaskAccount returns valid result, if not log error telling user to log in
    if (getSelectedMetaMaskAccount().toUpperCase() === localHolderAddress.toUpperCase()) {
        setDefaultAccount(localHolderAddress);
        instantiateNew(localHolderAddress, localCounterPartyAddress).then(instantiationTxHash => {
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
    return document.getElementById("transaction_input_textarea").value;
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
        if (term === "if") {
            if (i >= termArr.length - 3 || nextTerm !== "(") {
                document.getElementById("transaction_status").innerHTML = "syntax error at term " + (i + 1).toString() + ": " + nextTerm;
                return "error";
            }
            ++ifsToBeMatched;
            ifsStack.push(openingParens - closingParens);
        } else if (term === "(") {
            if (i >= termArr.length - 3 || nextTerm === ")" || nextTerm === "{>}"
              || nextTerm === "{<}" || nextTerm === "{>=}" || nextTerm === "{<=}"
              || nextTerm === "{==}" || nextTerm === "[>]"
              || nextTerm === "[<]" || nextTerm === "[>=]" || nextTerm === "[<=]"
              || nextTerm === "[==]" || nextTerm === "{&&}" || nextTerm === "||"
              || nextTerm === "{" || nextTerm === "}") {
                document.getElementById("transaction_status").innerHTML = "syntax error at term " + (i + 1).toString() + ": " + nextTerm;
                return "error";
            }
            ++openingParens;
        } else if (term === ")") {
            if (i < termArr.length - 1 && ( nextTerm === "if" || nextTerm === "(" || nextTerm === "}") ) {
                document.getElementById("transaction_status").innerHTML = "syntax error at term " + (i + 1).toString() + ": " + nextTerm;
                return "error";
            }
            ++closingParens;
            if ( ( ifsStack.length === 0 && openingParens === closingParens && ifsToBeMatched !== 0 )
              || ( openingParens - ifsStack[ifsStack.length - 1] === closingParens ) ) {

                // pop from stack until we have read 'if'
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
                var bool = evaluate(rTrimWhiteSpace(lTrimWhiteSpace(rTrimParen(lTrimParen(ifCondition)))));
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
          && term !== "zero" && term !== "scaleK" && term !== "one" && term !== "{==}"
          && term !== "{>=}" && term !== "{<=}" && term !== "{<}" && term !== "{>}"
          && term !== "[==]" && term !== "[>=]" && term !== "[<=]" && term !== "[<]" && term !== "[>]"
          && term !== "&&" && term !== "||" && !parseInt(term) && !isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(term)))
          && term !== "else" && term !== "}" && term !== "{" && term !== "and" && term !== "or" && term !== "libor3m" && term !== "tempInLondon") {
            // give error
            document.getElementById("transaction_status").innerHTML = "syntax error at term " + i.toString() + ": " + term;
            return "error";
        }
    }
    var contractString = "";
    while (stack.length !== 0) {
        contractString = stack.pop() + " " + contractString;
    }
    return lTrimWhiteSpace(rTrimWhiteSpace(contractString));
}

function evaluate(inputString) {
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
                var bool1 = evaluate(lTrimWhiteSpace(rTrimWhiteSpace(lTrimParen(rTrimParen(part1)))));
                var bool2 = evaluate(lTrimWhiteSpace(rTrimWhiteSpace(lTrimParen(rTrimParen(part2)))));
                if (term === "||") {
                    return bool1 || bool2;
                } else if (term === "&&") {
                    return bool1 && bool2;
                }
            }
            else if (term === "{>}" || term === "{<}" || term === "{==}" || term === "{>=}" || term === "{<=}") {
                // Horizon Comparison

                // can only compare two contracts - cannot have a logical operator between two contracts
                // if no truncate included then horizon is infinite, else find max date
                var part1 = strArr.slice(0, i).join(" ");
                var part2 = strArr.slice(i + 1).join(" ");
                var horizon1 = getHorizon(part1);
                var horizon2 = getHorizon(part2);
                if (term === "{>=}") {
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
                } else if (term === "{>}") {
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
                } else if (term === "{<=}") {
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
                } else if (term === "{<}") {
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
                } else if (term === "{==}") {
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
            else if (term === "[>]" || term === "[<]" || term === "[==]" || term === "[>=]" || term === "[<=]") {
                // Value Comparison

                // can only compare two contracts - so we cannot have (a & b) > (c | d), cannot have  a & b or  a | b
                var part1 = strArr.slice(0, i).join(" ");
                var part2 = strArr.slice(i + 1).join(" ");
                var value1 = getValue(part1);
                var value2 = getValue(part2);
                if (term === "[>=]") {
                    return value1 >= value2;
                } else if (term === "[>]") {
                    return value1 > value2;
                } else if (term === "[<=]") {
                    return value1 <= value2;
                } else if (term === "[<]") {
                    return value1 < value2;
                } else if (term === "[==]") {
                    return value1 === value2;
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
        // Find minimum horizon, but beforeCurrentDate() must return false
        var strArr = contractString.split(" ");
        var indexOfFirstTruncate = strArr.indexOf("truncate");
        var substringArr = strArr.slice(indexOfFirstTruncate + 1);
        var maxHorizon = substringArr[0]; // setting first horizon as maxHorizon
        var comeAcrossTruncate = false;
        for (var i = 0; i < strArr.length; ++i) {
            if(strArr[i] === "truncate") {
                // obtain c from 'truncate t c'
                var truncDate = strArr[i + 1];
                var c = obtainContractString(strArr.slice(i + 2));
                // obtain c's previous horizon
                var prevHorizon = getHorizon(c);
                // compare previous horizon with new horizon t and get min
                var currentHor = truncDate;
                if (prevHorizon !== "infinite" && greaterDate(truncDate, prevHorizon)) {
                    currentHor = prevHorizon;
                }

                comeAcrossTruncate = true;
                if (greaterDate(currentHor, maxHorizon)) {
                    maxHorizon = currentHor;
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

function getValue(contractString) {
    var strArr = contractString.split(" ");
    // check if string contains conjunction
    if (contractString.includes("and") || contractString.includes("or")) {
        // find most balanced conjunction
        var indexOfMostBalancedConj = 0;
        var mostBalancedConjType = "";
        var mostBalancedConjBalance = strArr.length;
        var openingParens = 0;
        for (var i = 0; i < strArr.length; ++i) {
            if (strArr[i] === "(") {
                ++openingParens;
            } else if (strArr[i] === ")") {
                --openingParens;
            } else if (strArr[i] === "and" || strArr[i] === "or") {
                if (openingParens < mostBalancedConjBalance) {
                    indexOfMostBalancedConj = i;
                    mostBalancedConjType = strArr[i];
                    mostBalancedConjBalance = openingParens;
                }
            }
        }
        // split contract by mostBalanced conj and perform getValue and getHorizon on both parts
        var part1 = strArr.slice(0, indexOfMostBalancedConj).join(" ");
        var part2 = strArr.slice(indexOfMostBalancedConj + 1).join(" ");
        var horizon1 = getHorizon(part1);
        var horizon2 = getHorizon(part2);
        var value1 = getValue(part1);
        var value2 = getValue(part2);
        if (!beforeCurrentDate(lTrimDoubleQuotes(rTrimDoubleQuotes(horizon1))) && !beforeCurrentDate(lTrimDoubleQuotes(rTrimDoubleQuotes(horizon2)))) {
            if (mostBalancedConjType === "and") {
                return value1 + value2;
            } else {
                return Math.max(value1, value2);
            }
        } else if (!beforeCurrentDate(lTrimDoubleQuotes(rTrimDoubleQuotes(horizon1))) && beforeCurrentDate(lTrimDoubleQuotes(rTrimDoubleQuotes(horizon2)))) {
            return value1;
        } else if (beforeCurrentDate(lTrimDoubleQuotes(rTrimDoubleQuotes(horizon1))) && !beforeCurrentDate(lTrimDoubleQuotes(rTrimDoubleQuotes(horizon2)))) {
            return value2;
        } else { // both have expired - return 0
            return 0;
        }
    } else {
        // string does not contain conjunction
        var value = 1;
        if (contractString.includes("zero")) {
            return 0;
        } else {
            for (var i = 0; i < strArr.length; ++i) {
                if (strArr[i] === "scaleK" && i < strArr.length - 2 && parseFloat(strArr[i + 1])) {
                    value = value * parseFloat(strArr[i + 1]);
                } else if (strArr[i] === "give") {
                    value = -value;
                }
            }
            if (beforeCurrentDate(lTrimDoubleQuotes(rTrimDoubleQuotes(getHorizon(contractString))))) {
                return 0;
            } else {
                return value;
            }
        }
    }
}

function obtainContractString(array) {
    // if string starts with opening paren wait until get balanced closing paren
    if (array[0] === "(") {
        var openingParens = 1;
        for (var i = 1; i < array.length; ++i) {
            if (array[i] === "(") {
                ++openingParens;
            } else if (array[i] === ")") {
                --openingParens;
            }
            if (openingParens === 0) {
                return array.slice(0, i + 1).join(' ');
            }
        }
    } else {
        // else wait until reading 'zero' or 'one'
        for (var i = 0; i < array.length; ++i) {
            if (array[i] === "one" || array[i] === "zero") {
                return array.slice(0, i + 1).join(' ');
            }
        }
    }
}


// TODO: add syntax checking to this method - right now this happens in createContract object: too late as other correct contracts get added anyways
global.decomposeContract = function(inputString) {
    document.getElementById("transaction_status").innerHTML = "";
    if (inputString === "") {
        document.getElementById("transaction_status").innerHTML = "Please provide some contract input.";
        return;
    }
    if (openingParensAmount(inputString) !== closingParensAmount(inputString)) {
        document.getElementById("transaction_status").innerHTML = "Parenthesis mismatch: The contract is not constructed properly.";
        return;
    }
    // replacing own definitions with map values
    var strSplit = inputString.split(" ");
    let keys = Array.from(definitionsMap.keys());
    var intersection = strSplit.filter(value => keys.includes(value));
    while(intersection.length !== 0) {
        for(var i = 0; i < intersection.length; ++i) {
            const regex = new RegExp("(.*)(" + intersection[i] + ")(.*)");
            var matchObj = regex.exec(inputString);
            var value = definitionsMap.get(intersection[i]);
            if (value.indexOf("one") !== value.lastIndexOf("one") ||
              value.indexOf("zero") !== value.lastIndexOf("zero") ||
              ( value.includes("one") && value.includes("zero") ) ) { // value consists of multiple contracts - add parenthesis
                inputString = matchObj[1] + "( " + definitionsMap.get(intersection[i]) + " )" + matchObj[3];
            } else {
                inputString = matchObj[1] + definitionsMap.get(intersection[i]) + matchObj[3];
            }
        }
        strSplit = inputString.split(" ");
        intersection = strSplit.filter(value => keys.includes(value));
    }
    inputString = changeDateFormat(inputString);
    // remove linebreaks
    inputString = inputString.replace(/(\r\n|\n|\r)/gm," ");
    // remove multiple whitespaces
    inputString = inputString.replace(/  +/g, ' ');
    // add spacing before and after parenthesis
    inputString = addSpacing(inputString);
    // repeat replacing the if clause while string includes if
    var ifMatches = inputString.match(/^(.*)\sif\s(.*)$/);
    if (ifMatches !== null) {
        inputString = evaluateConditionals(inputString);
    }
    if (inputString === "" || inputString === "error") {
        return;
    }

    inputString = rTrimWhiteSpace(lTrimWhiteSpace(inputString));

    if (inputString.includes("get") && !inputString.includes("truncate")) {
        document.getElementById("transaction_status").innerHTML = "The contract is not constructed properly. A contract cannot contain 'get' without 'truncate'.";
        return;
    }

    removeChildren("button_choices_container");
    var noOfOpeningParens = 0;
    var noOfClosingParens = 0;
    var contractsStack = [];
    stringToAddToBeginning = "";

    // check if inputstring contains 'or' else execute right away
    var orMatches = inputString.match(/^(.*)\sor\s(.*)$/);
    if (orMatches !== null) {
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
                   contractsStack.push(strArr.slice(0, i).join(' '));
                   contractsStack.push(strArr.slice(i + 1).join(' '));
                   break;
               } else if (noOfOpeningParens > noOfClosingParens) {
                   if ( (noOfOpeningParens - noOfClosingParens) < mostBalancedOr ) {
                      mostBalancedOr = noOfOpeningParens - noOfClosingParens;
                      indexOfMostBalancedOr = i;
                   }
               }
           } else {
                if (term === "(") {
                    ++noOfOpeningParens;
                } else if (term === ")") {
                    ++noOfClosingParens;
                    if (i === strArr.length - 1) {
                        contractsStack.push(inputString);
                    }
                }
           }
           if (noOfClosingParens > noOfOpeningParens) {
               document.getElementById("transaction_status").innerHTML = "Parenthesis mismatch: The contract is not constructed properly.";
               return;
           }
        }
        if (contractsStack.length === 1 && contractsStack[0].includes("or")) {
            contractsStack = splitContract(strArr, indexOfMostBalancedOr);
        }
        combineContracts(contractsStack);

    } else {
        // String does not include "or" -> execute right away
        var acquireBtnToBeDisabled1 = true;
        var acquireBtnToBeDisabled2 = true;

        var contractsArr = decomposeAnds(inputString);
        // acquire button should be disabled if either all contracts are expired or all contracts are to be acquired at horizon ie 'get'
        for (var i = 0; i < contractsArr.length; ++i) {
            var conString = stringToAddToBeginning + cleanParens(lTrimWhiteSpace(rTrimWhiteSpace(contractsArr[i])));
            if (!conString.includes("get")) { // at least one contract is not acquired at its horizon
                acquireBtnToBeDisabled1 = false;
            }
            if (!beforeCurrentDate(lTrimDoubleQuotes(rTrimDoubleQuotes(getHorizon(conString))))) { // at least one subcontract has not expired yet
                acquireBtnToBeDisabled2 = false;
            }
            createContractObject(conString);
        }
        var table = document.getElementById("my_table");
        let tr = table.insertRow(1);
        tr.className = "super_contract_row";
        var td;
        tr.appendChild(td = document.createElement("td"));
        var superContractKey = numberOfContracts.toString();
        td.innerHTML = superContractKey;
        for (var i = 0; i < 6; ++i) {
            tr.appendChild(td = document.createElement("td"));
        }
        var btn = document.createElement('input');
        btn.type = "button";
        btn.className = "acquire_button button";
        btn.id = "acquire_button_" + superContractKey;
        btn.value = "acquire";
        btn.onclick = _ => {
            if (correctUserTryingToAcquire()) {
                executeSuperContract(superContractKey);
            } else {
                document.getElementById("table_status").innerHTML = "Please change the currently selected MetaMask account to the one owner of the contract you are trying to acquire.";
            }
        };
        td.appendChild(btn);

        // if either of these is true then we want the acquire button to be disabled
        if (acquireBtnToBeDisabled1 || acquireBtnToBeDisabled2) {
            btn.disabled = true;
        }
        ++numberOfContracts;
        numberOfSubContracts = 0;
    }
};

function decomposeAnds(contractString) {
    // NOTE: as soon as closing paren is read we have found a contract

    var outputArr = contractString.split(" ");
    var openingParens = 0;
    var contractString = "";
    var finalContractsArr = [];
    var operatorsStack = [];
    for (var i = 0; i < outputArr.length; ++i) {
        var term = outputArr[i];
        if (term === "and") { // we have reached the end of a subcontract whenever 'and' is read
            if (openingParens === 0 && contractString !== "") {
                finalContractsArr.push(contractString);
                contractString = "";
            } else if (openingParens > 0) {
                // apply all operators on the stack to this sub contract, without popping them
                for (var j = operatorsStack.length - 1; j >= 0; --j) {
                    contractString = operatorsStack[j] + " ( " + contractString + " )";
                }
                finalContractsArr.push(contractString);
                contractString = "";
            }
        } else if (term === ")") {
            --openingParens;
            // cut ')' off contractString
            //contractString = contractString.slice(0, contractString.lastIndexOf(" "));
            if (outputArr[i + 1] === "and" && operatorsStack.length > 0) {
                finalContractsArr.push(operatorsStack.pop() + " ( " + contractString + " )");
                contractString = "";
            } else { // next item is ')' OR we are at last item
                if (operatorsStack.length > 0) {
                    contractString = operatorsStack.pop() + " ( " + contractString + " )";
                }
            }
        } else if (term === "(") {
            ++openingParens;
            if (contractString !== "") { // to handle case where 'and' is followed by '('
                operatorsStack.push(contractString);
                contractString = "";
            }
        } else {
            if (contractString === "") {
                contractString = term;
            } else {
                contractString = contractString + " " + term;
            }
        }
    }
    // this happens if there is a balanced or conjunction at the end and the second part still needs to be added
    if (contractString !== "") {
        finalContractsArr.push(contractString);
    }
    return finalContractsArr;
}

function concatenate(arr1, arr2) {
    for (var i = 0; i < arr2.length; ++i) {
        arr1.push(arr2[i]);
    }
    return arr1;
}

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

function combineContracts(contractsStack) {
    var contract1 = contractsStack.pop();
    var contract2 = contractsStack.pop();
    createSection();
    createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract2)), 1);
    createOrLabel();
    createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract1)), 2);
}

function createContractObject(inputString) {
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
                document.getElementById("transaction_status").innerHTML = "Syntax error: scaleK should be followed by an integer or an observable.";
                return;
            }
        } else if (str === "truncate") {
            if (strArr.length > i + 1 && isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(strArr[i + 1])))) {
                horizonDate = strArr[i + 1];
                ++i;
            } else {
                console.error("Syntax error: truncate should be followed by a date in the following pattern: 'dd/mm/yyyy hh:mm:ss'.");
                document.getElementById("transaction_status").innerHTML = "Syntax error: truncate should be followed by a date in the following pattern: 'dd/mm/yyyy hh:mm:ss'.";
                return;
            }
        } else if (str === "get") {
            acquireAtHorizon = "yes";
        }
    }
    horizonDate = lTrimDoubleQuotes(rTrimDoubleQuotes(horizonDate));

    const contract = new Contract(numberOfContracts.toString() + "." + numberOfSubContracts.toString(), amount, recipient, inputString,
       translateContract(recipient, amount, horizonDate, acquireAtHorizon),
       horizonDate, acquireAtHorizon, "waiting to be executed");

    createTableRow(contract);

    if (horizonDate !== "infinite" && beforeCurrentDate(contract.horizonDate)) {
        // add expired label
        document.getElementById("td_status_" + contract.id).innerHTML = "expired";
    } else {
        addToSuperContracts(numberOfContracts.toString(), contract); // contract is only added to pending contracts map if it is still valid
        document.getElementById("td_status_" + contract.id).innerHTML = "waiting to be executed";
    }
    ++numberOfSubContracts;
}

function addToSuperContracts(superKey, contract) {
    if (superContractsMap.has(superKey)) {
        for (var [superContractId, contractsSet] of superContractsMap) {
            if (superContractId === superKey) {
                var newSet = contractsSet;
                newSet.add(contract);
                superContractsMap.set(superContractId, newSet);
                break;
            }
        }
    } else {
        var newSet = new Set();
        newSet.add(contract);
        superContractsMap.set(superKey, newSet);
    }
    console.log("SupercontractsMap after adding a contract");
    console.log(superContractsMap);
}

function deleteFromSuperContracts(superKey, contract) {
    for (var [superContractId, contractsSet] of superContractsMap) {
        if (superContractId === superKey) {
            var newSet = contractsSet;
            newSet.delete(contract);
            superContractsMap.set(superContractId, newSet);
            if (newSet.size === 0) {
                superContractsMap.delete(superContractId);
                document.getElementById("acquire_button_" + superContractId).disabled = true;
            }
            break;
        }
    }
    console.log("SupercontractsMap after deleting a contract");
    console.log(superContractsMap);
}

function computeDateString(dateString) {
    var horizonArr = dateString.split("-");
    var dateArr = horizonArr[0].split("/");
    var timeArr = horizonArr[1].split(":");
    // +01:00 to get BST from UTC
    var finalDateString = dateArr[2] + "-" + dateArr[1] + "-"
    + dateArr[0] + "T" + timeArr[0] + ":" + timeArr[1] + ":"
    + timeArr[2] + "+01:00"; // adding 15 seconds to the contract's expiry date to allow it to execute
    return finalDateString;
}

function beforeCurrentDate(contractDate) {
    if (contractDate === "infinite") {
        return false;
    }
    var contractDate = new Date(computeDateString(contractDate));
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

function executeSuperContract(superKey) {
    for (var [superContractId, contractsSet] of superContractsMap) {
        if (superContractId === superKey) {
            for (let contract of contractsSet) {
                if (contract.toBeExecutedAtHorizon !== "yes") {
                    executeSingleContract(contract);
                }
            }
        }
    }
}

function executeSingleContract(contract) {
    if (contract.amount === "tempInLondon") {
        contract.amount = getOracleByAddress(agreedOracleAddress).getTempInLondon().toString();
    }
    if (contract.amount === "libor3m") {
        contract.amount = getOracleByAddress(agreedOracleAddress).getLiborSpotRate().toString();
    }

    holderAddress().then(holderAddress => {
        counterPartyAddress().then(counterPartyAddress => {
            if (contract.recipient == 0) { // owner receives
                createMoveFile(counterPartyAddress, holderAddress, parseFloat(contract.amount));
                callTransferFunction(contract, counterPartyAddress, holderAddress);
            } else { // counter party receives
                createMoveFile(holderAddress, counterPartyAddress, parseFloat(contract.amount));
                callTransferFunction(contract, holderAddress, counterPartyAddress);
            }
            if (document.getElementById("td_status_" + contract.id).innerHTML !== "successful") {
                document.getElementById("td_status_" + contract.id).innerHTML = "not accepted by user";
            }
        });
    });
}

function callTransferFunction(contract, fromAddress, toAddress) {
    balanceOfAddress(fromAddress).then(balance => {
        // do local balance check as contract does not update as quickly
        if (balance >= parseFloat(contract.amount)) {
            transfer(fromAddress, toAddress, parseFloat(contract.amount)).then(transferTxHash => {
                watchTransferEvent().then(boolean => {
                    var bool = parseInt(boolean);
                    console.log("booooolean: " + bool);
                    if (bool === 0) {
                        document.getElementById("td_status_" + contract.id).innerHTML = "insufficient funds";
                        if (beforeCurrentDate(contract.horizonDate)) {
                            document.getElementById("td_status_" + contract.id).innerHTML = "expired";
                            deleteFromSuperContracts(contract.id.split(".")[0], contract);
                        }
                    } else if (bool === 1) {
                        document.getElementById("td_status_" + contract.id).innerHTML = "failed: sender address and recipient address are the same";
                        if (beforeCurrentDate(contract.horizonDate)) {
                            document.getElementById("td_status_" + contract.id).innerHTML = "expired";
                            deleteFromSuperContracts(contract.id.split(".")[0], contract);
                        }
                    } else if (bool === 2) {
                        waitForReceipt(transferTxHash).then( _ => {
                            console.log(fromAddress + " has transferred " + contract.amount + " Ether to " + toAddress);
                            document.getElementById("td_status_" + contract.id).innerHTML = "successful";
                            deleteFromSuperContracts(contract.id.split(".")[0], contract);
                            retrieveBalances();
                        });
                    }
                });
            });
        } else {
            //window.alert("The sender address does not have enough Ether for this transfer. Please deposit more Ether into the account.");
            document.getElementById("td_status_" + contract.id).innerHTML = "insufficient funds";
            if (beforeCurrentDate(contract.horizonDate)) {
                document.getElementById("td_status_" + contract.id).innerHTML = "expired";
                deleteFromSuperContracts(contract.id.split(".")[0], contract);
            }
        }
    });
}

function sleep(ms) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > ms){
            break;
        }
    }
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
    tr.className = "standard_row";
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
    td.id = "td_status_" + contract.id;
    td.innerHTML = contract.status;
    tr.appendChild(td = document.createElement("td"));
}

function correctUserTryingToAcquire() {
    if (getSelectedMetaMaskAccount().toUpperCase() === document.getElementById("holder_address").value.toUpperCase()) {
        return true;
    } else {
        return false;
    }
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
