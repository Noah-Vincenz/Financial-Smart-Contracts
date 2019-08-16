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

import {depositCollateral, getSelectedMetaMaskAccount, getSelectedNetwork, holderBalance,
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
//var stringToAddToBeginning = ""; // string that is added to the beginning of the contract when outer most does not contain any conjunctions ie. 'truncate' will simply be added to contract string and rest will be decomposed
var superContractsMap = new Map(); // map from superContract id to set of contract objects contained within super contract
var agreedOracleAddress;
var account1Deposited = false;
var account2Deposited = false;
var definitionsMap = new Map();
var observablesArr = ["libor3m", "tempInLondon"];
var uniqueID = 0; // id to keep track of divs for contract choices (and remove these)
var acquireBtnToBeDisabled1 = true;
var acquireBtnToBeDisabled2 = true;
var contractsBeingDecomposed = 0;

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
    if (inputString === "") {
        document.getElementById("add_definitions_status").innerHTML = "Please provide a valid definition.";
        return;
    }
    document.getElementById("add_definitions_status").innerHTML = "";
    // remove multiple whitespaces
    inputString = inputString.replace(/  +/g, ' ');
    // pattern matching for semantics
    var matches = inputString.match(/^\w+\s?=\s?.+;$/);
    if (matches === null) {
        document.getElementById("add_definitions_status").innerHTML = "Please provide a valid definition.";
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
        && term !== "zero" && term !== "scaleK" && term !== "one" && !COMPARISONOPERATOR(term)
        && term !== "&&" && term !== "if" && term !== "||" && !parseFloat(term)
        && !isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(term))) && term !== "else" && term !== "}"
        && term !== "{" && term !== "and" && term !== "or" && !observablesArr.includes(term)
        && !definitionsMap.has(term)) {
            document.getElementById("add_definitions_status").innerHTML = "Please provide a valid definition.";
            return;
        }
    }
    definitionsMap.set(part1, part2);
    for (var [key, value] of definitionsMap) { // need to do this in order to allow overwriting of definitions
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
            if (contract.horizonDate !== "infinite" && beforeCurrentDate(contract.horizonDate, "")) {
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
    // check if getSelectedMetaMaskAccount returns valid result, if not log error telling user to log in
    if(getSelectedMetaMaskAccount() === undefined) {
        document.getElementById("create_contract_status").innerHTML = "Please log into MetaMask.";
        return;
    }
    // check if the parity dev net is selected
    if (getSelectedNetwork() !== "17") {
        document.getElementById("create_contract_status").innerHTML = "Please select the Parity development chain network.";
        return;
    }
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

function evaluateConditionals(inputString) {
    // find innermost if clause and replace it
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
        var prevTerm = termArr[i - 1]; // for syntax checking
        stack.push(term);
        if (term === "if") {
            if (i > termArr.length - 9 || nextTerm !== "("
              || (i > 0 && prevTerm !== "(" && prevTerm !== "{" && prevTerm !== "and" && prevTerm !== "or") ) {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                return "error";
            }
            ++ifsToBeMatched;
            ifsStack.push(openingParens - closingParens);
        } else if (term === "else") {
            if (i < 9 || i > termArr.length - 4 || nextTerm !== "{" || prevTerm !== "}") {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                return "error";
            }
        } else if (term === "{") {
            if (i > termArr.length - 3 || i < 6 || nextTerm === ")" || COMPARISONOPERATOR(nextTerm)
                || nextTerm === "&&" || nextTerm === "||" || nextTerm === "{" || isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm)))
                || nextTerm === "or" || nextTerm === "and" || nextTerm === "else"
                || parseFloat(nextTerm) || observablesArr.includes(nextTerm)
                || (prevTerm !== ")" && prevTerm !== "else")) {
                  document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                  return "error";
            }
        } else if (term === "}") {
            if (i < 8 || (i < termArr.length - 1 && nextTerm !== "}" && nextTerm !== ")" && nextTerm !== "and" && nextTerm !== "or")) {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                return "error";
            }
        } else if (term === "(") {
            if (i > termArr.length - 3 || nextTerm === ")" || COMPARISONOPERATOR(nextTerm)
              || nextTerm === "&&" || nextTerm === "||" || nextTerm === "{" || isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm)))
              || nextTerm === "}" || nextTerm === "or" || nextTerm === "and" || nextTerm === "else"
              || parseFloat(nextTerm) || observablesArr.includes(nextTerm)
              || (i > 0 && (prevTerm === ")" || prevTerm === "one" || prevTerm === "zero"
              || prevTerm === "truncate" || prevTerm === "scaleK" || prevTerm === "else" || prevTerm === "}"))) {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                return "error";
            }
            ++openingParens;
        } else if (term === ")") {
            if ((i < termArr.length - 1 && nextTerm !== ")" && nextTerm !== "and" && nextTerm !== "or" && nextTerm !== "{" && !COMPARISONOPERATOR(nextTerm))
              || i < 2 || ( i > 0 && prevTerm !== "one" && prevTerm !== "zero" && prevTerm !== "}" && prevTerm !== ")" )) {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
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
                stack.pop(); // popping 'if' off stack
                --ifsToBeMatched;
                // performance is good here: not parsing {}{} stuff
                var leftOverArr = termArr.slice(i + 1);
                var firstIndexClosingBrack = leftOverArr.indexOf("}");
                var action1Arr = leftOverArr.slice(1, firstIndexClosingBrack);
                var action1 = action1Arr.join(" ");
                var action2Arr = [];
                var action2 = "";
                if (leftOverArr[firstIndexClosingBrack + 1] === "else") {
                    if (leftOverArr[firstIndexClosingBrack + 2] !== "{" || !leftOverArr.slice(firstIndexClosingBrack + 4).includes("}")) {
                        document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                        return "error";
                    }
                    leftOverArr = leftOverArr.slice(firstIndexClosingBrack + 2); // + 2 because of 'else'
                    firstIndexClosingBrack = leftOverArr.indexOf("}");
                    action2Arr = leftOverArr.slice(1, firstIndexClosingBrack);
                    action2 = action2Arr.join(" ");
                }
                if (!correctConditionalSyntax(ifCondition, action1, action2)) {
                    return "error";
                }
                var bool = evaluate(rTrimWhiteSpace(lTrimWhiteSpace(rTrimParen(lTrimParen(ifCondition)))));
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
                    } else {
                        stack.push(lTrimBrace(rTrimBrace(action2)));
                    }
                }
                // skip next terms until end of conditional clause is reached
                i = i + action1Arr.length + 2;
                if (action2Arr.length !== 0) {
                    i = i + action2Arr.length + 3;
                }

            }
            ifsStack.pop();
            ifCondition = "";
        } else if (term !== "give" && term !== "truncate" && term !== "get" && term !== "one" && term !== "else"
          && term !== "zero" && term !== "scaleK" && term !== "one" && !COMPARISONOPERATOR(term)
          && term !== "&&" && term !== "||" && !parseFloat(term) && !isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(term)))
          && term !== "}" && term !== "{" && term !== "and" && term !== "or" && !observablesArr.includes(term)) {
            // give error
            document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
            return "error";
        }
    }
    var contractString = "";
    while (stack.length > 0) {
        contractString = stack.pop() + " " + contractString;
    }
    return lTrimWhiteSpace(rTrimWhiteSpace(contractString));
}

function correctConditionalSyntax(ifCondition, action1, action2) {
    var inputString = "";
    var ifSyntaxMatches;
    if (action2 === "") {
        inputString = "if " + ifCondition + " { " + action1 + " }";
        ifSyntaxMatches = inputString.match(/^if\s\(\s.+\s\)\s{\s.+\s}$/);
    } else {
        inputString = "if " + ifCondition + " { " + action1 + " } else { " + action2 + " }";
        ifSyntaxMatches = inputString.match(/^if\s\(\s.+\s\)\s{\s.+\s}(\selse\s{\s.+\s})$/);
    }
    if (ifSyntaxMatches === null) {
        document.getElementById("transaction_status").innerHTML = "If clause is not constructed properly.";
        return false;
    }
    return true;
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
        } else if (openingParens === 0 && (term === "||" || term === "&&" || COMPARISONOPERATOR(term))) {
            var part1 = strArr.slice(0, i).join(" ");
            var part2 = strArr.slice(i + 1).join(" ");
            if (term === "||" || term === "&&") {
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
                // if no truncate included then horizon is infinite
                var horizon1 = getHorizon(part1);
                var horizon2 = getHorizon(part2);
                switch(term) {
                    case "{>=}":
                        return greaterDate(horizon1, horizon2) || equalDates(horizon1, horizon2);
                    case "{>}":
                        return greaterDate(horizon1, horizon2);
                    case "{<=}":
                        return !greaterDate(horizon1, horizon2) || equalDates(horizon1, horizon2);
                    case "{<}":
                        return !greaterDate(horizon1, horizon2);
                    case "{==}":
                        return equalDates(horizon1, horizon2);
                    default:
                }
            }
            else if (term === "[>]" || term === "[<]" || term === "[==]" || term === "[>=]" || term === "[<=]") {
                // Value Comparison

                // can only compare two contracts - cannot have a logical operator between two contracts
                var value1 = getValue(part1, "");
                var value2 = getValue(part2, "");
                switch(term) {
                    case "[>=]":
                        return value1 >= value2;
                    case "[>]":
                        return value1 > value2;
                    case "[<=]":
                        return value1 <= value2;
                    case "[<]":
                        return value1 < value2;
                    case "[==]":
                        return value1 === value2;
                    default:
                }
            } else if (term === ">=") {
                // Dominance
                var horizon1 = getHorizon(part1);
                var horizon2 = getHorizon(part2);
                if (greaterDate(horizon1, horizon2) || equalDates(horizon1, horizon2)) {
                    var horizonsSet = extractAllSubHorizons(part1, part2);
                    // go through all dates and call getValue with date parameter
                    for (let hor of horizonsSet) {
                        var x = getValue(part1, hor);
                        var y = getValue(part2, hor);
                        if (x < y) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
            }
        }
    }
}

function extractAllSubHorizons(contract1, contract2) {
    var setOfDates = new Set();
    // whenever we reach one or zero we need to find their horizon ie we need to get the horizons of all lowest level subcontracts
    // simply by finding all truncate occurrences.. this is when a contracts value will change as some contract will expire
    var maxHorizon = getHorizon(contract2); // we only want to check for times that are <= maxHorizon
    setOfDates.add(maxHorizon);
    var contract1HorArr = contract1.split(" ");
    var contract2HorArr = contract2.split(" ");
    for (var i = 0; i < contract1HorArr.length; ++i) {
        var term = contract1HorArr[i];
        if (term === "truncate") {
            var currentHor = lTrimDoubleQuotes(rTrimDoubleQuotes(contract1HorArr[i + 1]));
            if (greaterDate(maxHorizon, currentHor)) {
                setOfDates.add(currentHor);
            }
        }
    }
    for (var i = 0; i < contract2HorArr.length; ++i) {
        var term = contract2HorArr[i];
        if (term === "truncate") {
            var currentHor = lTrimDoubleQuotes(rTrimDoubleQuotes(contract2HorArr[i + 1]));
            if (greaterDate(maxHorizon, currentHor)) {
                setOfDates.add(currentHor);
            }
        }
    }
    return setOfDates;
}

function COMPARISONOPERATOR(string) {
    if (string === "{>}" || string === "{<}" || string === "{==}" || string === "{>=}" || string === "{<=}"
      || string === "[>]" || string === "[<]" || string === "[==]" || string === "[>=]" || string === "[<=]" || string === ">=") {
        return true;
    }
    return false;
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
        var maxHorizon = ""; // setting first horizon as empty string
        var comeAcrossTruncate = false;
        for (var i = 0; i < strArr.length; ++i) {
            if (strArr[i] === "truncate") {
                // obtain c from 'truncate t c'
                var truncDate = strArr[i + 1];
                var oscs = obtainSubContractString(strArr.slice(i + 2));
                var c = oscs[0];
                // obtain c's previous horizon
                var prevHorizon = getHorizon(c);
                // compare previous horizon with new horizon t and get min
                var currentHor = truncDate;
                if (greaterDate(lTrimDoubleQuotes(rTrimDoubleQuotes(truncDate)), lTrimDoubleQuotes(rTrimDoubleQuotes(prevHorizon)))) {
                    currentHor = prevHorizon;
                }
                comeAcrossTruncate = true;
                if (maxHorizon === "" || greaterDate(lTrimDoubleQuotes(rTrimDoubleQuotes(currentHor)), lTrimDoubleQuotes(rTrimDoubleQuotes(maxHorizon)))) {
                    maxHorizon = currentHor;
                }
                i += oscs[1];
            } else if (strArr[i] === "and" || strArr[i] === "or") { // have reached end of subcontract
                if (!comeAcrossTruncate) { // if we have not come across a "truncate" then this subcontract's horizon is infinite
                    return "infinite";
                }
                comeAcrossTruncate = false;
            } else if (i === strArr.length - 1 && !comeAcrossTruncate) {
                return "infinite";
            }
        }
        return lTrimDoubleQuotes(rTrimDoubleQuotes(maxHorizon));
    }
}

function getValue(contractString, horizonToCheck) {
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
        var value1 = getValue(part1, horizonToCheck);
        var value2 = getValue(part2, horizonToCheck);
        if (!beforeCurrentDate(horizon1, horizonToCheck)
          && !beforeCurrentDate(horizon2, horizonToCheck)) {
            if (mostBalancedConjType === "and") {
                return value1 + value2;
            } else {
                return Math.max(value1, value2);
            }
        } else if (!beforeCurrentDate(horizon1, horizonToCheck)
          && beforeCurrentDate(horizon2, horizonToCheck)) {
            return value1;
        } else if (beforeCurrentDate(horizon1, horizonToCheck)
          && !beforeCurrentDate(horizon2, horizonToCheck)) {
            return value2;
        } else { // both have expired - return 0
            return 0;
        }
    } else {
        // string does not contain connective
        var value = 1;
        if (contractString.includes("zero")) {
            return 0;
        } else {
            for (var i = 0; i < strArr.length; ++i) {
                if (strArr[i] === "scaleK") { // TODO: do not need to check this as we already have checked syntax
                    value = value * parseFloat(strArr[i + 1]);
                    ++i;
                } else if (strArr[i] === "give") {
                    value = -value;
                }
            }
            if (!beforeCurrentDate(getHorizon(contractString), horizonToCheck)) { // its horizon is after, contract has not expired
                return value;
            } else { // ie contract is expired, it is later than horizonToCheck
                return 0;
            }
        }
    }
}

function obtainSubContractString(array) {
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
                return [array.slice(0, i + 1).join(' '), i + 1];
            }
        }
    } else {
        // else wait until reading 'zero' or 'one'
        for (var i = 0; i < array.length; ++i) {
            if (array[i] === "one" || array[i] === "zero") {
                return [array.slice(0, i + 1).join(' '), i + 1];
            }
        }
    }
}

function correctConstruct(inputString) {
    if (inputString === "") {
        document.getElementById("transaction_status").innerHTML = "Please provide some contract input.";
        return false;
    }
    if (openingParensAmount(inputString) !== closingParensAmount(inputString)) {
        document.getElementById("transaction_status").innerHTML = "The contract is not constructed properly. Parenthesis mismatch.";
        return false;
    }
    if (!inputString.includes("one") && !inputString.includes("zero")) {
        document.getElementById("transaction_status").innerHTML = "The contract is not constructed properly. A contract must include either 'one' or 'zero'.";
        return false;
    }
    if (inputString.includes("get") && !inputString.includes("truncate")) {
        document.getElementById("transaction_status").innerHTML = "The contract is not constructed properly. A contract cannot contain 'get' without 'truncate'.";
        return false;
    }
    return true;
}

function replaceUserDefinitions(inputString) {
    var strSplit = inputString.split(" ");
    let keys = Array.from(definitionsMap.keys());
    var intersection = strSplit.filter(value => keys.includes(value));
    while(intersection.length !== 0) {
        for(var i = 0; i < intersection.length; ++i) {
            const regex = new RegExp("(.*)(" + intersection[i] + ")(.*)");
            var matchObj = regex.exec(inputString);
            var value = definitionsMap.get(intersection[i]);
            if (value.indexOf("one") !== value.lastIndexOf("one")
              || value.indexOf("zero") !== value.lastIndexOf("zero")
              || ( value.includes("one") && value.includes("zero") ) ) { // value consists of multiple contracts - add parenthesis

                inputString = matchObj[1] + "( " + definitionsMap.get(intersection[i]) + " )" + matchObj[3];

            } else {
                inputString = matchObj[1] + definitionsMap.get(intersection[i]) + matchObj[3];
            }
        }
        strSplit = inputString.split(" ");
        intersection = strSplit.filter(value => keys.includes(value));
    }
    return inputString;
}

function cleanUpBeforeDecomp(inputString) {
    if (!correctConstruct(inputString)) {
        return "error";
    }
    // replacing own definitions with map values
    inputString = replaceUserDefinitions(inputString);
    // add dash between date day and time for processing purposes
    inputString = changeDateFormat(inputString);
    // remove linebreaks, then multiple whitespaces
    inputString = inputString.replace(/(\r\n|\n|\r)/gm, " ").replace(/  +/gm, " ");
    // add spacing before and after parenthesis
    inputString = lTrimWhiteSpace(rTrimWhiteSpace(addSpacing(inputString)));
    // evaluate & replace if clauses
    var ifMatches = inputString.match(/^(.*\sif\s.*)|(if\s.*)$/);
    if (ifMatches !== null) {
        inputString = rTrimWhiteSpace(lTrimWhiteSpace(evaluateConditionals(inputString))); // may return "error"
    }
    return inputString;
}

global.decompose = function(inputString, initialDecomposition) {
  ++uniqueID;
  if (initialDecomposition) {
      // This is the case only when this function is triggered by the 'make transaction' button
      removeChildren("button_choices_container"); // NEEDED?
      acquireBtnToBeDisabled1 = true;
      acquireBtnToBeDisabled2 = true;
  }
  document.getElementById("transaction_status").innerHTML = "";
  inputString = cleanUpBeforeDecomp(inputString);
  if (inputString === "error" || !parsesSuccessfullyForSyntax(inputString)) {
      return;
  }
  // check if inputstring contains 'or' else execute right away
  var orMatches = inputString.match(/^(.*)\sor\s(.*)$/);
  if (orMatches !== null) {
      // keep track of the current most balanced conj AND its external combinators
      var termArr = inputString.split(" ");
      var openingParens = 0;
      var closingParens = 0;
      var contractString = "";
      var parseStack = [];
      var contractsStack = [];
      var closingParensStack = [];
      var mostBalancedConj = "";
      var mostBalancedConjBalance = termArr.length - 1;
      var conjWaitingToBeMatched = false; // set to true when reading conjunction and then set to false when reading another conjunction or reaching end
      for (var i = 0; i < termArr.length; ++i) {
          var term = termArr[i];
          if (term === "and" || term === "or") { // we have reached the end of a subcontract whenever 'and' is read
              if (openingParens === closingParens) { // found outer most conjunct
                  mostBalancedConj = term;
                  contractsStack[0] = termArr.slice(0, i).join(' ');
                  contractsStack[1] = termArr.slice(i + 1).join(' ');
                  break;
              } else if (openingParens > closingParens && (openingParens - closingParens) < mostBalancedConjBalance) {
                  mostBalancedConjBalance = openingParens - closingParens;
                  mostBalancedConj = term;
                  var combinatorString = parseStack[parseStack.length - 1];
                  var closingParensString = closingParensStack[closingParensStack.length - 1];
                  if (contractString !== "") {
                      if (combinatorString !== undefined) {
                          contractsStack[0] = combinatorString + " ( " + contractString + closingParensString;
                      } else if (closingParensString !== undefined){
                          contractsStack[0] = contractString + closingParensString;
                      } else {
                          contractsStack[0] = contractString;
                      }
                  }
                  conjWaitingToBeMatched = true;
                  contractString = "";
              }
          } else if (term === "zero" || term === "one") {
              if (contractString === "") {
                  contractString = term;
              } else {
                  contractString = contractString + " " + term;
              }
              var combinatorString = parseStack[parseStack.length - 1];
              var closingParensString = closingParensStack[closingParensStack.length - 1];
              if (conjWaitingToBeMatched) {
                  if (combinatorString !== undefined && closingParensString !== undefined) {
                      contractsStack[1] = combinatorString + " ( " + contractString + closingParensString;
                  } else {
                      contractsStack[1] = contractString;
                  }
                  conjWaitingToBeMatched = false;
                  contractString = "";
              } else {
                  if (combinatorString !== undefined && closingParensString !== undefined) {
                      contractsStack[0] = combinatorString + " ( " + contractString + closingParensString;
                  } else {
                      contractsStack[0] = contractString;
                  }
                  contractString = "";
              }
          } else if (term === ")") {
              // as soon as closing paren is read we have found a contract
              ++closingParens;
              var combinatorString = parseStack.pop();
              var closingParensString = closingParensStack.pop();
          } else if (term === "(") {
              ++openingParens;
              if (contractString !== "") {
                  if (parseStack.length > 0) {
                      parseStack.push(parseStack[parseStack.length - 1] + " ( " + contractString);
                  } else {
                      parseStack.push(contractString);
                  }
                  contractString = "";
              }
              if (termArr[i - 1] !== "and" && i !== 0) {
                  if (closingParensStack.length === 0) {
                      closingParensStack.push(" )");
                  } else {
                      closingParensStack.push(closingParensStack[closingParensStack.length - 1] + " )");
                  }
              }
          } else if (contractString === "") {
              contractString = term;
          } else {
              contractString = contractString + " " + term;
          }
      }
      // this happens if there is a balanced or conjunction at the end and the second part still needs to be added
      if (contractString !== "") {
          contractsStack.push(contractString);
      }
      if (mostBalancedConj === "and") {
          contractsBeingDecomposed += 2;
          decompose(contractsStack[0], false);
          decompose(contractsStack[1], false);
      } else {
          if (contractsBeingDecomposed > 0) {
              --contractsBeingDecomposed;
          }
          addChoices(contractsStack, uniqueID);
      }
  }
  else { // input does not contain 'or'
      if (contractsBeingDecomposed > 0) {
          --contractsBeingDecomposed;
      }
      var contractsArr = decomposeAnds(inputString);
      createContractEntries(contractsArr);
  }
  if (!document.getElementById("button_choices_container").hasChildNodes() && contractsBeingDecomposed === 0) {
      // now we can add the super contract row
      let tr = document.getElementById("my_table").insertRow(1);
      tr.className = "super_contract_row";
      var td;
      tr.appendChild(td = document.createElement("td"));
      var superContractKey = numberOfContracts.toString();
      td.innerHTML = superContractKey;
      for (var i = 0; i < 5; ++i) {
          tr.appendChild(td = document.createElement("td"));
      }
      createValuationSelect(tr, superContractKey);
      createAcquireButton(tr, superContractKey);
      ++numberOfContracts;
      numberOfSubContracts = 0;
  }
};

function createValuationSelect(tr, id) {
    var td;
    tr.appendChild(td = document.createElement("td"));
    var div = document.createElement("div");
    td.appendChild(div);
    div.className = "valuation_cell_data";

    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();

    var selectDay = document.createElement("select");
    selectDay.className = "select_valuation";
    selectDay.id = "day_select_" + id;
    selectDay.onchange = function() {
        updateValuationValue(id);
    }
    div.appendChild(selectDay);
    for (var i = 1; i <= 31; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.text = i;
        selectDay.appendChild(option);
    }
    selectDay.value = d;

    var selectMonth = document.createElement("select");
    selectMonth.className = "select_valuation";
    selectMonth.id = "month_select_" + id;
    selectMonth.onchange = function() {
        var selectedMonth = selectMonth.value;
        updateSelectableDaysFromMonth(selectedMonth, id);
        updateValuationValue(id);
    };
    div.appendChild(selectMonth);
    for (var i = 1; i <= 12; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.text = i;
        selectMonth.appendChild(option);
    }
    selectMonth.value = m + 1;

    var selectYear = document.createElement("select");
    selectYear.className = "select_valuation_year";
    selectYear.id = "year_select_" + id;
    selectYear.onchange = function() {
        var selectedYear = selectYear.value;
        updateSelectableDaysFromYear(selectedYear, id);
        updateValuationValue(id);
    };
    div.appendChild(selectYear);
    for (var i = 2019; i <= 2040; i++) {
        var option = document.createElement("option");
        option.value = i;
        option.text = i;
        selectYear.appendChild(option);
    }
    selectYear.value = y;

    var valueLabel = document.createElement("p");
    td.appendChild(valueLabel);
    valueLabel.id = "p_value_" + id;
    valueLabel.className = "p_value";
    updateValuationValue(id);
}

function updateValuationValue(id) {
    var day = document.getElementById("day_select_" + id).value;
    var month = document.getElementById("month_select_" + id).value;
    var year = document.getElementById("year_select_" + id).value;
    var c = getAllSubcontracts(id);
    document.getElementById("p_value_" + id).innerHTML = getValue(c, day + "/" + month + "/" + year + "-" + "12:00:00").toString() + "ETH";
}

// TODO: superContractsMap does not store expired contracts, so cannot go back in time
function getAllSubcontracts(superKey) {
    var finalContractString = "";
    if (superContractsMap.has(superKey)) {
        for (var [superContractId, contractsSet] of superContractsMap) {
            if (superContractId === superKey) {
                for (let contract of contractsSet) {
                    if (finalContractString === "") {
                        finalContractString = contract.contractString;
                    } else {
                        finalContractString = finalContractString + " and " + contract.contractString;
                    }
                }
            }
        }
        return finalContractString;
    } else {
        return "zero"; // all contracts have already expired
    }
}

function updateSelectableDaysFromMonth(selectedMonth, id) {
    var selectDay = document.getElementById("day_select_" + id);
    var selectYear = document.getElementById("year_select_" + id);
    if (selectedMonth === "1" || selectedMonth === "3" || selectedMonth === "5"
      || selectedMonth === "7" || selectedMonth === "8" || selectedMonth === "10"
      || selectedMonth === "12") { // 31 days
        for (var i = selectDay.options.length + 1; i <= 31; ++i) { // add items
          var option = document.createElement("option");
          option.value = i;
          option.text = i;
          selectDay.appendChild(option);
        }
    }
    else if (selectedMonth === "2") {
        if (selectYear === "2020" || selectYear === "2024" || selectYear === "2028"
          || selectYear === "2032" || selectYear === "2036" || selectYear === "2040") { // leap year - 29 days in Feb
            if (parseInt(selectDay.value) > 29) {
                selectDay.value = 29;
            }
            while (selectDay.options.length > 29) {
                selectDay.remove(29);
            }
            if (selectDay.options.length === 28) {
                var option = document.createElement("option");
                option.value = "29";
                option.text = "29";
                selectDay.appendChild(option);
            }
        } else { // 28 days in Feb
            if (parseInt(selectDay.value) > 28) {
                selectDay.value = 28;
            }
            while (selectDay.options.length > 28) {
                selectDay.remove(28);
            }
        }
    }
    else { // 30 days
        if (parseInt(selectDay.value) > 30) {
            selectDay.value = 30;
        }
        if (selectDay.options.length > 30) {
            selectDay.remove(30);
        }
        for (var i = selectDay.options.length + 1; i <= 30; ++i) { // add items
          var option = document.createElement("option");
          option.value = i;
          option.text = i;
          selectDay.appendChild(option);
        }
    }
}

function updateSelectableDaysFromYear(selectedYear, id) {
    var selectDay = document.getElementById("day_select_" + id);
    var selectMonth = document.getElementById("month_select_" + id);
    if (selectMonth.value === "2") {
        if (selectedYear === "2020" || selectedYear === "2024" || selectedYear === "2028"
          || selectedYear === "2032" || selectedYear === "2036" || selectedYear === "2040") { // leap year - 29 days in Feb
            if (parseInt(selectDay.value) > 29) {
                selectDay.value = 29;
            }
            while (selectDay.options.length > 29) { // remove items first
                selectDay.remove(29);
            }
            if (selectDay.options.length === 28) {
                var option = document.createElement("option");
                option.value = "29";
                option.text = "29";
                selectDay.appendChild(option);
            }
        } else { // 28 days in Feb
            if (parseInt(selectDay.value) > 28) {
                selectDay.value = 28;
            }
            while (selectDay.options.length > 28) {
                selectDay.remove(28);
            }
        }
    }
}

function createAcquireButton(tr, id) {
    var td;
    tr.appendChild(td = document.createElement("td"));
    //Create array of options to be added
    var btn = document.createElement('input');
    btn.type = "button";
    btn.className = "acquire_button button";
    btn.id = "acquire_button_" + id;
    btn.value = "acquire";
    btn.onclick = _ => {
        if (correctUserTryingToAcquire()) {
            executeSuperContract(id);
        } else {
            document.getElementById("table_status").innerHTML = "Please change the currently selected MetaMask account to the one owner of the contract you are trying to acquire.";
        }
    };
    td.appendChild(btn);
    // if either of these is true then we want the acquire button to be disabled
    if (acquireBtnToBeDisabled1 || acquireBtnToBeDisabled2) {
        btn.disabled = true;
    }
}

function addChoices(contractsStack, divId) {
    var contract2 = contractsStack.pop();
    var contract1 = contractsStack.pop();
    createSection(divId);
    createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract1)), 1, divId);
    createOrLabel(divId);
    createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract2)), 2, divId);
}

function createContractEntries(contractsArr) {
    // acquire button should be disabled if either all contracts are expired or all contracts are to be acquired at horizon ie 'get'
    for (var i = 0; i < contractsArr.length; ++i) {
        var conString = cleanParens(lTrimWhiteSpace(rTrimWhiteSpace(contractsArr[i])));
        if (!conString.includes("get")) { // at least one contract is not acquired at its horizon
            acquireBtnToBeDisabled1 = false;
        }
        if (!beforeCurrentDate(getHorizon(conString), "")) { // at least one subcontract has not expired yet
            acquireBtnToBeDisabled2 = false;
        }
        createContractObject(conString);
    }
}

function decomposeAnds(contractString) {
    // keep two stacks: one for combinators and one for closing parenthesis to be added
    var termArr = contractString.split(" ");
    var openingParens = 0;
    var contractString = "";
    var parseStack = [];
    var finalContractsArr = [];
    var closingParensStack = [];
    for (var i = 0; i < termArr.length; ++i) {
        var term = termArr[i];
        if (term === "and") { // we have reached the end of a subcontract whenever 'and' is read
            if (contractString !== "") {
                if (openingParens === 0) {
                    finalContractsArr.push(contractString);
                } else if (parseStack.length > 0) {
                    finalContractsArr.push(parseStack[parseStack.length - 1] + " ( " + contractString + closingParensStack[closingParensStack.length - 1]);
                } else if (closingParensStack.length > 0) {
                    finalContractsArr.push(contractString + closingParensStack[closingParensStack.length - 1]);
                } else {
                    finalContractsArr.push(contractString);
                }
                contractString = "";
            }
        } else if (term === ")") {
            // as soon as closing paren is read we have found a contract
            --openingParens;
            var combinatorString = parseStack.pop();
            var closingParensString = closingParensStack.pop();
            if (contractString !== "") {
                finalContractsArr.push(combinatorString + " ( " + contractString + closingParensString);
                contractString = "";
            }
        } else if (term === "(") {
            ++openingParens;
            if (contractString !== "") {
                if (parseStack.length > 0) {
                    parseStack.push(parseStack[parseStack.length - 1] + " ( " + contractString);
                } else {
                    parseStack.push(contractString);
                }
                contractString = "";
            }
            if (termArr[i - 1] !== "and" && i !== 0) {
                if (closingParensStack.length === 0) {
                    closingParensStack.push(" )");
                } else {
                    closingParensStack.push(closingParensStack[closingParensStack.length - 1] + " )");
                }
            }
        } else if (contractString === "") {
            contractString = term;
        } else {
            contractString = contractString + " " + term;
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
    newStack[0] = addParens(cleanParens(contractStringArr.slice(0, indexOfMostBalancedOr).join(' ')));
    newStack[1] = addParens(cleanParens(contractStringArr.slice(indexOfMostBalancedOr + 1, contractStringArr.length - 1).join(' ')));
    return newStack;
}

function parsesSuccessfullyForSyntax(contractString) {
    var strArr = contractString.split(" ");
    for (var i = 0; i < strArr.length; ++i) {
        var term = strArr[i];
        var prevTerm = strArr[i - 1];
        var nextTerm = strArr[i + 1];
        switch (term) {
            case "zero":
                if (i < strArr.length - 1 && nextTerm !== "and" && nextTerm !== "or" && nextTerm !== ")") {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                    return false;
                }
                break;
            case "one":
                if (i < strArr.length - 1 && nextTerm !== "and" && nextTerm !== "or" && nextTerm !== ")") {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                    return false;
                }
                break;
            case "and":
                if ((i > 0 && prevTerm !== ")" && prevTerm !== "one" && prevTerm !== "zero")
                  || nextTerm === ")" || nextTerm === "and" || nextTerm === "or" || isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm)))
                  || parseFloat(nextTerm) || observablesArr.includes(nextTerm)) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                    return false;
                }
                break;
            case "or":
                if ((i > 0 && prevTerm !== ")" && prevTerm !== "one" && prevTerm !== "zero")
                  || nextTerm === ")" || nextTerm === "and" || nextTerm === "or" || isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm)))
                  || parseFloat(nextTerm) || observablesArr.includes(nextTerm)) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                    return false;
                }
                break;
            case "truncate":
                if (i > strArr.length - 3 || (i < strArr.length - 1 && !isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm))))) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": truncate should be followed by a date in the following pattern: 'dd/mm/yyyy hh:mm:ss'.";
                    return false;
                }
                break;
            case "get":
                if (i < strArr.length - 1 && nextTerm !== "(") {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": get should be followed by opening parenthesis.";
                    return false;
                }
                break;
            case "scaleK":
                if (i > strArr.length - 3 || (i < strArr.length - 1 && !parseFloat(nextTerm) && !observablesArr.includes(nextTerm))) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": scaleK should be followed by an integer or an observable.";
                    return false;
                }
                break;

            case "give":
                if (i === strArr.length - 1 || (i < strArr.length - 1 && nextTerm !== "one" && nextTerm !== "zero")) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": give should be followed by one or zero.";
                    return false;
                }
                break;
            case "(":
                if (i > strArr.length - 3 || prevTerm === "one" || prevTerm === "zero" || prevTerm === ")"
                  || prevTerm === "scaleK" || prevTerm === "truncate" || nextTerm === "and" || nextTerm === "or"
                  || nextTerm === ")" || isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm)))
                  || parseFloat(nextTerm) || observablesArr.includes(nextTerm)) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                    return false;
                }
                break;
            case ")":
                if ((i > 0 && prevTerm !== ")" && prevTerm !== "one" && prevTerm !== "zero")
                  || i < 2 || (i < strArr.length - 1 && nextTerm !== ")" && nextTerm !== "and" && nextTerm !== "or")) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                    return false;
                }
                break;
            default:
                if (parseFloat(term) || observablesArr.includes(term)) {
                    if (i === 0 || i === strArr.length - 1 || prevTerm !== "scaleK") {
                        document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": a float/observable value should be after scaleK.";
                        return false;
                    }
                } else if (isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(term)))) {
                    if (i === 0 || i === strArr.length - 1 || prevTerm !== "truncate") {
                        document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": a date should be after truncate.";
                        return false;
                    }
                } else {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                    return false;
                }
        }
    }
    return true;
}

function createContractObject(inputString) {
    var recipient = 0; // by default the contract holder is the recipient
    var amount = "1";
    if (inputString.includes("zero")) {
        amount = "0";
    }
    var horizonDate = getHorizon(inputString);
    var acquireAtHorizon = "no"; // used for get, ie if get is discovered then this is set to true
    var newStr = inputString.replace(/[()]/g, ''); // removing parenthesis
    var strArr = newStr.split(" ");
    for (var i = 0; i < strArr.length; ++i) {
        var str = strArr[i];
        if (str === "give") {
            recipient = 1;
        } else if (str === "scaleK" && !inputString.includes("zero")) {
            if (parseFloat(strArr[i + 1])) {
                amount = ( parseFloat(amount) * parseFloat(strArr[i + 1]) ).toString();
                ++i;
            } else if (observablesArr.includes(strArr[i + 1])) {
                amount = strArr[i + 1];
                ++i;
            }
        } else if (str === "get") {
            acquireAtHorizon = "yes";
        }
    }
    const contract = new Contract(numberOfContracts.toString() + "." + numberOfSubContracts.toString(), amount, recipient, inputString,
       translateContract(recipient, amount, horizonDate, acquireAtHorizon),
       horizonDate, acquireAtHorizon, "waiting to be executed");

    createTableRow(contract);

    if (horizonDate !== "infinite" && beforeCurrentDate(contract.horizonDate, "")) {
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

function beforeCurrentDate(contractDate, horizonToCheck) {
  if (horizonToCheck === "") { // we want to compare against the current date - so it is valid even if it is equal to
      if (contractDate === "infinite") {
          return false;
      }
      var contractDate = new Date(computeDateString(contractDate));
      var todayDate = new Date();
      if (contractDate.getTime() < todayDate.getTime()) { // Note the =
          return true;
      } else {
          return false;
      }
  } else { // we want to compare against another date, not the current date
      if (horizonToCheck === "infinite" || contractDate === "infinite") {
          if (horizonToCheck === "infinite" && contractDate === "infinite") {
              return false;
          } else if (horizonToCheck === "infinite") {
              return true;
          } else {
              return false;
          }
      }
      var contractDate = new Date(computeDateString(contractDate));
      var dateToCompareAgainst = new Date(computeDateString(horizonToCheck));
      if (contractDate.getTime() < dateToCompareAgainst.getTime()) {
          return true;
      } else {
          return false;
      }
  }
}

function equalDates(dateString1, dateString2) {
    // for first date
    if (dateString1 === "infinite" || dateString2 === "infinite") {
        if (dateString1 === "infinite" && dateString2 === "infinite") {
            return true;
        } else {
            return false;
        }
    }
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
    if (dateString1 === "infinite" || dateString2 === "infinite") {
        if (dateString1 === "infinite" && dateString2 === "infinite") {
            return false;
        } else if (dateString1 === "infinite") {
            return true;
        } else {
            return false;
        }
    }
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
                    if (bool === 0) {
                        document.getElementById("td_status_" + contract.id).innerHTML = "insufficient funds";
                        if (beforeCurrentDate(contract.horizonDate, "")) {
                            document.getElementById("td_status_" + contract.id).innerHTML = "expired";
                            deleteFromSuperContracts(contract.id.split(".")[0], contract);
                        }
                    } else if (bool === 1) {
                        document.getElementById("td_status_" + contract.id).innerHTML = "failed: sender address and recipient address are the same";
                        if (beforeCurrentDate(contract.horizonDate, "")) {
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
            if (beforeCurrentDate(contract.horizonDate, "")) {
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
}

function correctUserTryingToAcquire() {
    if (getSelectedMetaMaskAccount().toUpperCase() === document.getElementById("holder_address").value.toUpperCase()) {
        return true;
    } else {
        return false;
    }
}

function createButton (contractString, buttonId, divId) {
    var button = document.createElement("button");
    button.id = "choices_button_" + buttonId;
    button.className = "choices_button";
    button.innerHTML = cleanParens(contractString);
    // 2. Append somewhere
    var container = document.getElementById("section_" + divId.toString());
    container.appendChild(button);
    // 3. Add event handler
    button.addEventListener ("click", function() {
        removeChildren("section_" + divId);
        container.remove();
        decompose(button.innerHTML, false);
    });
}

function createSection(divId) {
    var div = document.createElement("div");
    div.id = "section_" + divId.toString();
    var para = document.createElement("p");
    var node = document.createTextNode("Contract choice:");
    para.appendChild(node);
    div.appendChild(para);
    var bottomContainer = document.getElementById("button_choices_container");
    bottomContainer.appendChild(div);
}

function createOrLabel(divId) {
    var para = document.createElement("p");
    para.className = "p_small";
    var node = document.createTextNode("OR");
    para.appendChild(node);
    var container = document.getElementById("section_" + divId.toString());
    container.appendChild(para);
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
    if (stringInput === undefined) {
        return false;
    }
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
    decomposeOrs("( scaleK 50 ( get ( truncate \"24/12/2019-23:33:33\" ( give one ) ) ) ) or ( zero and truncate \"26/12/2019-23:33:33\" ( give zero ) )");
    removeChildren("button_choices_container");
    decomposeOrs("( scaleK 50 ( get ( truncate \"24/12/2019-23:33:33\" ( give one ) ) ) ) or ( zero or truncate \"26/12/2019-23:33:33\" ( give zero ) )");
    removeChildren("button_choices_container");
    decomposeOrs("( scaleK 50 ( get ( truncate \"24/12/2019-23:33:33\" ( give one ) ) ) ) or zero");
    removeChildren("button_choices_container");
    decomposeOrs("zero or give one");
    removeChildren("button_choices_container");
    decomposeOrs("( ( zero or give one ) or scaleK 10 ( one ) ) or zero");
    removeChildren("button_choices_container");
    decomposeOrs("( zero or give one ) or ( scaleK 10 one or zero )");
    removeChildren("button_choices_container");
    decomposeOrs("( zero or one ) or scaleK 10 ( one )");
    removeChildren("button_choices_container");
    decomposeOrs("give one or ( ( truncate \"24/12/2019-23:33:33\" ( give zero ) ) and give zero )");
    removeChildren("button_choices_container");
    decomposeOrs("( zero or give one ) or ( ( scaleK 10 one ) or zero )");
    removeChildren("button_choices_container");
    decomposeOrs("( zero or give one ) or ( ( scaleK 10 ( one ) ) or zero )");
    removeChildren("button_choices_container");
    decomposeOrs("give one or ( ( truncate \"24/12/2019-23:33:33\" ( give zero ) ) or give zero )");
    removeChildren("button_choices_container");
    decomposeOrs("truncate \"24/12/2019-23:33:33\" ( one or give zero )");
    removeChildren("button_choices_container");
    decomposeOrs("truncate \"24/12/2019-23:33:33\" ( one ) or truncate \"24/12/2019-23:33:33\" ( zero )");
    removeChildren("button_choices_container");
    decomposeOrs("( scaleK 101 ( get ( truncate \"24/01/2019-23:33:33\" ( one ) ) ) and scaleK 102 ( get ( truncate \"24/02/2019-23:33:33\" ( give one ) ) ) ) or ( ( scaleK 103 ( get ( truncate \"24/03/2019-23:33:33\" ( one ) ) ) and scaleK 104 ( get ( truncate \"24/04/2019-23:33:33\" ( give one ) ) ) ) or ( scaleK 105 ( get ( truncate \"24/05/2019-23:33:33\" ( one ) ) ) and scaleK 106 ( get ( truncate \"24/06/2019-23:33:33\" ( give one ) ) ) ) )");
    removeChildren("button_choices_container");
    decomposeOrs("( scaleK 100 one and scaleK 101 one ) or ( ( scaleK 102 one and scaleK 103 one ) or ( scaleK 104 one and scaleK 105 one ) )");
    removeChildren("button_choices_container");
    decomposeOrs("( one and give one ) or ( ( zero and give zero ) or ( give one and give zero ) )");
    removeChildren("button_choices_container");
    decomposeOrs("( zero or give one ) or ( scaleK 10 ( one ) or zero )");
    removeChildren("button_choices_container");
};
