/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

import {
  cleanParens,
  addSpacing,
  addParens,
  openingParensAmount,
  closingParensAmount,
  lTrimWhiteSpace,
  rTrimWhiteSpace,
  lTrimParen,
  rTrimParen,
  lTrimDoubleQuotes,
  rTrimDoubleQuotes,
  lTrimBrace,
  rTrimBrace,
  changeDateFormat,
  changeDateFormatBack,
  trimSemiColon,
  padNumber,
  findNextConnective,
  findConsequent,
  isDate,
  sameDayAsCurrentDate,
  greaterDate,
  equalDates,
  beforeCurrentDate,
  computeDateString,
  concatenate
} from "./stringmanipulation.mjs";

import {
  Contract,
  translateContract,
  createNewContractString
} from "./contract.mjs";

import {
  depositCollateral,
  getSelectedMetaMaskAccount,
  getSelectedNetwork,
  holderBalance,
  counterPartyBalance,
  holderAddress,
  counterPartyAddress,
  balanceOfAddress,
  transfer,
  waitForReceipt,
  setDefaultAccount,
  setSmartContractInstance,
  instantiateNew,
  watchTransferEvent
} from "./deploy/deploy.mjs"

import {
  Oracle,
  createOracles,
  getOracleByAddress
} from "./oracles.mjs";

import {
  sleep,
  occurrences,
  isNumeric,
  printStack
} from "./generalfunctions.mjs"

var numberOfSubContracts = 0,
    numberOfContracts = 0,
    superContractsMap = new Map(), // map from superContract id to set of contract objects contained within super contract
    agreedOracleAddress,
    account1Deposited = false,
    account2Deposited = false,
    definitionsMap = new Map(),
    observablesArr = ["libor3m", "tempInLondon"],
    uniqueID = 0, // id to keep track of divs for contract choices (and remove these)
    acquireBtnToBeDisabled1 = true,
    acquireBtnToBeDisabled2 = true,
    contractsBeingDecomposed = 1,
    stringToAddToBeginning = "",
    stringToAddToEnd = "";

window.addEventListener('load', function() {  // commented for testing purposes
    /*
    document.getElementById("deposit_button1").disabled = true;
    document.getElementById("deposit_button2").disabled = true;
    document.getElementById("make_transaction_button").disabled = true;
    document.getElementById("select_deposit").disabled = true;
    document.getElementById("transaction_input_textarea").disabled = true;
    */
    addDepositSelectOptions();
    createOracles();
    // start timer
    update();
    runClock();
});

function addDepositSelectOptions() {
    var $select = $(".custom_select");
    for (var i = 1; i <= 100; ++i) {
        $select.append($('<option></option>').val(i).html(i));
    }
}

global.addDefinition = function(inputString) {
    try {
        document.getElementById("add_definitions_status").innerHTML = "";
        // remove multiple whitespaces
        inputString = inputString.replace(/  +/gm, " ");
        // pattern matching for semantics
        var matches = inputString.match(/^.+\s?=\s?.+;$/);
        if (inputString === "" || matches === null) {
            document.getElementById("add_definitions_status").innerHTML = "Please provide a valid definition.";
            throw new Error("Please provide a valid definition.");
        }
        document.getElementById("input_added_textarea").innerHTML = "";
        var strArr = inputString.split("="),
            part1 = rTrimWhiteSpace(strArr[0]),
            part2 = trimSemiColon(lTrimWhiteSpace(strArr[1])),
            part1Arr = part1.split(" "),
            part2Arr = part2.split(" ");

        // check semantics of second part
        for (var i = 0; i < part2Arr.length; ++i) {
            var term = part2Arr[i];
            if (!part1.includes(term) && nonExistingTerm(term) && !definitionsMap.has(term)) {
                document.getElementById("add_definitions_status").innerHTML = "Please provide a valid definition.";
                throw new Error("Please provide a valid definition.");
            }
        }
        // or just use first word - add checking and then tell user that first term must be definition
        // need to find word in lhs string thats not in rhs and not one of the existing terms & add definition to map
        for (var i = 0; i < part1Arr.length; ++i) {
            var term = part1Arr[i];
            if (!part2.includes(term) && nonExistingTerm(term)) {
                definitionsMap.set(term, part1 + "=" + part2);
            }
        }
        for (var [key, value] of definitionsMap) { // need to do this in order to allow overwriting of definitions
            var valueArr = value.split("=");
            document.getElementById("input_added_textarea").innerHTML += (key + ": " + valueArr[0] + " = " + valueArr[1] + "\n");
        }
    } catch(e) {
        console.log("Invalid definition provided.")
        return;
    }
};

export function nonExistingTerm(term) {
    if (term !== "give" && term !== "truncate" && term !== "get" && term !== "one"
    && term !== "zero" && term !== "scaleK" && term !== "one" && !COMPARISONOPERATOR(term)
    && term !== "&&" && term !== "if" && term !== "||" && !isNumeric(term) && term !== "(" && term !== ")"
    && !isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(term))) && term !== "else" && term !== "}"
    && term !== "{" && term !== "and" && term !== "or" && !observablesArr.includes(term)) {
        return true;
    }
    return false;
}

export function replaceUserDefinitions(inputString, mapOfDefinitions) {
    var strSplit = inputString.split(" "),
        keys = Array.from(mapOfDefinitions.keys()),
        intersection = strSplit.filter(value => keys.includes(value));     // check if any definition appears in inputString

    while(intersection.length !== 0) {
        for(var i = 0; i < intersection.length; ++i) {
            // check for if any definition appears in inputString
            var regex = new RegExp("(.*)(" + intersection[i] + ")(.*)"),
                matchObj1 = regex.exec(inputString), // find matching part in string
                value = mapOfDefinitions.get(intersection[i]),
                valueArr = value.split("="),
                lhs = valueArr[0],
                newValue = valueArr[1],
                endPartArr = lTrimWhiteSpace(matchObj1[2] + matchObj1[3]).split(" "),
                lhsArr = lhs.split(" "); // do not need to trim by whitespace here as we add no whitespace when adding definitions

            for (var j = 1; j < lhsArr.length; ++j) { // skipping first index as this is definition
                regex = new RegExp("(.+\\s)?(" + lhsArr[j] + ")(\\s.+)?");
                var matchObj2 = regex.exec(newValue);
                newValue = matchObj2[1] + endPartArr[j] + matchObj2[3];
            }
            endPartArr.splice(0, lhsArr.length);

            if (newValue.indexOf("one") !== newValue.lastIndexOf("one")
              || newValue.indexOf("zero") !== newValue.lastIndexOf("zero")
              || ( newValue.includes("one") && newValue.includes("zero") ) ) { // value consists of multiple contracts - add parenthesis
                inputString = endPartArr.length > 0 ? matchObj1[1] + " ( " + newValue + " ) " + endPartArr.join(" ") : matchObj1[1] + " ( " + newValue + ")";
            } else {
                // need to add the whitespace as we trimmed it previously
                inputString = endPartArr.length > 0 ? matchObj1[1] + newValue + " " + endPartArr.join(" ") : matchObj1[1] + newValue;
            }
        }
        strSplit = inputString.split(" ");
        intersection = strSplit.filter(value => keys.includes(value));
    }
    return inputString;
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

function obtainSubContractString(array, indexToStartFrom) {
    // returns subcontractString and the number of items in the string
    var stringToReturn = "";
    if (array[indexToStartFrom] === "(") {
        var openingParens = 1;
        for (var i = indexToStartFrom + 1; i < array.length; ++i) {
            // if string starts with opening paren wait until get balanced closing paren
            var term = array[i];
            stringToReturn = stringToReturn === "" ? term : stringToReturn + " " + term;
            if (term === "(") {
                ++openingParens;
            } else if (term === ")") {
                --openingParens;
            }
            if (openingParens === 0) {
                return [stringToReturn, i + 1 - indexToStartFrom];
            }
        }
    } else {
        // else wait until reading 'zero' or 'one' OR a number in the case it is called by getValue and has been replaced by a numbe
        for (var i = indexToStartFrom; i < array.length; ++i) {
            var term = array[i];
            stringToReturn = stringToReturn === "" ? term : stringToReturn + " " + term;
            if (term === "one" || term === "zero" || isNumeric(term)) { // ---
                return [stringToReturn, i + 1 - indexToStartFrom];
            }
        }
    }
}

export function cleanUpBeforeDecomp(inputString) {
    // add dash between date day and time for processing purposes
    inputString = changeDateFormat(inputString);
    // replacing own definitions with map values
    inputString = replaceUserDefinitions(inputString, definitionsMap);
    if (!correctConstruct(inputString)) {
        return "error";
    }
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

global.getDefinitionsText = function() {
    return document.getElementById("add_input_textarea").value;
}


export function extractAllSubHorizons(contract1, contract2, comparisonOperator) {
    var setOfDates = new Set();
    // whenever we reach one or zero we need to find their horizon ie we need to get the horizons of all lowest level subcontracts
    // simply by finding all truncate occurrences.. this is when a contracts value will change as some contract will expire
    var maxHorizon = "";
    if (comparisonOperator === ">=" || comparisonOperator === "==") {
        maxHorizon = getHorizon(contract2); // we only want to check for times that are <= maxHorizon
    } else {
        maxHorizon = getHorizon(contract1); // we only want to check for times that are <= maxHorizon
    }
    setOfDates.add(maxHorizon);
    if (comparisonOperator === "==") {
        return setOfDates;
    }
    var contract1HorArr = contract1.split(" "),
        contract2HorArr = contract2.split(" ");
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
                    deleteFromSuperContracts(superContractsMap, superContractId, contract);
                }
            }
        }
    }
}

function runClock() { // every 60 seconds we check for expired contracts
    var now = new Date(),
        timeToNextTick = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

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
    var depositAmount = getSelectedDeposit(),
        senderAddress = document.getElementById(addr).value;

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
    var localHolderAddress = document.getElementById("holder_address").value,
        localCounterPartyAddress = document.getElementById("counter_party_address").value;

    if (localHolderAddress === localCounterPartyAddress) {
        document.getElementById("create_contract_status").innerHTML = "Holder address and counter party address cannot be the same";
        return;
    }
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

export function evaluateConditionals(inputString) {
    var termArr = inputString.split(" "),
        ifsToBeMatched = 0,
        openingParens = 0,
        closingParens = 0,
        contractString = "",
        ifCondition = "",
        ifStack = [],
        noOfOpeningParensStack = [],
        firstPartStack = [],
        compOpStack = [],
        insideCondition = false;

    for (var i = 0; i < termArr.length; ++i) {
        var term = termArr[i],
            nextTerm = termArr[i + 1], // for syntax checking
            prevTerm = termArr[i - 1]; // for syntax checking

        if (term === "if") {
            if (i > termArr.length - 9 || nextTerm !== "("
              || (i > 0 && prevTerm !== "(" && prevTerm !== "{" && prevTerm !== "and" && prevTerm !== "or" && !COMPARISONOPERATOR(prevTerm)) ) {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                return "error";
            }
            noOfOpeningParensStack.push(openingParens - closingParens);
            ++ifsToBeMatched;
            insideCondition = true;
        } else if (term === ")") {
            if ((i < termArr.length - 1 && nextTerm !== ")" && nextTerm !== "and" && nextTerm !== "or" && nextTerm !== "{" && !COMPARISONOPERATOR(nextTerm) && nextTerm !== "||" && nextTerm !== "&&")
              || i < 2 || ( i > 0 && prevTerm !== "one" && prevTerm !== "zero" && prevTerm !== "}" && prevTerm !== ")" )) {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                return "error";
            }
            ++closingParens;
            var bool1 = noOfOpeningParensStack.length === 0 && openingParens === closingParens && ifsToBeMatched !== 0,
                bool2 = (openingParens - noOfOpeningParensStack[noOfOpeningParensStack.length - 1]) === closingParens;
            if (bool1 || bool2) { // have reached end of the if condition
                insideCondition = false;
                var firstPart = firstPartStack.pop(),
                    compOp = compOpStack.pop(),
                    cons = "", // consequence
                    alt = "", // alternative
                    stringToEval = firstPart + " " + compOp + " " + ifCondition,
                    bool = evaluate(firstPart, compOp, ifCondition);
                    if (bool === undefined) {
                        document.getElementById("transaction_status").innerHTML = "Conditional statement syntax error.";
                        return "error";
                    }

                ifCondition = "";
                if (bool) {
                    var findConsequentResult1 = findConsequent(termArr, i + 2); // +2 to skip {
                    cons = findConsequentResult1[0];
                    var lengthOfCons = findConsequentResult1[1];
                    if (ifsToBeMatched > 1) {
                        ifCondition = ifStack.length > 0 ? ifStack.pop() + " " + cons : cons;
                    } else {
                        contractString = contractString === "" ? cons : contractString + " " + cons;
                    }
                    // now need to fast forward in string ie skip indices
                    if (termArr[i + lengthOfCons + 2] !== "else") {
                        i = i + lengthOfCons + 1; // +1 to skip {}
                    } else {
                        var findConsequentResult2 = findConsequent(termArr, i + findConsequentResult1[1] + 4); // +4 because of 'else' + {
                        alt = findConsequentResult2[0];
                        var lengthOfAlt = findConsequentResult2[1];
                        i = i + lengthOfCons + lengthOfAlt + 3; // +3 to skip {}{}
                    }
                } else { // boolean returns false
                    var findConsequentResult1 = findConsequent(termArr, i + 2); // +2 to skip {
                    cons = findConsequentResult1[0];
                    var lengthOfCons = findConsequentResult1[1];
                    if (termArr[i + lengthOfCons + 2] !== "else") { // if no 'else' given
                        i = i + lengthOfCons + 1; // +1 to skip {}
                        if (ifsToBeMatched > 1) { // append result (nothing) to ifCondition
                            if (ifStack.length > 0) {
                                ifCondition = ifStack.pop();
                                var slicedCond = ifCondition.slice(-3);
                                // check if last term was a comp op
                                var slicedCompOp1 = ifCondition.slice(-4); // when compOp is 4 symbols long
                                var slicedCompOp2 = ifCondition.slice(-2); // when compOp is 2 symbols long
                                var slicedCompOp3 = ifCondition.slice(-1); // when compOp is 1 symbol long
                                if (COMPARISONOPERATOR(slicedCond) || COMPARISONOPERATOR(slicedCompOp1) || COMPARISONOPERATOR(slicedCompOp2) || COMPARISONOPERATOR(slicedCompOp3)) { // check if last term was a connective
                                    document.getElementById("transaction_status").innerHTML = "Comparison operator error: Please provide an alternative to your conditional statement.";
                                    return "error";
                                }
                            } else {
                                ifCondition = "";
                            }
                        } else { // append result (nothing) to contractString
                            var slicedCond = contractString.slice(-3);
                            if (slicedCond === "and" || slicedCond === " or") { // check if last term was a connective
                                var lastIndex = contractString.lastIndexOf(" ");
                                contractString = contractString.slice(0, lastIndex);
                            }
                            // check if last term was a comp op
                            var slicedCompOp1 = ifCondition.slice(-4); // when compOp is 4 symbols long
                            var slicedCompOp2 = ifCondition.slice(-2); // when compOp is 2 symbols long
                            var slicedCompOp3 = ifCondition.slice(-1); // when compOp is 1 symbol long
                            if (COMPARISONOPERATOR(slicedCond) || COMPARISONOPERATOR(slicedCompOp1) || COMPARISONOPERATOR(slicedCompOp2) || COMPARISONOPERATOR(slicedCompOp3)) { // check if last term was a connective
                                document.getElementById("transaction_status").innerHTML = "Comparison operator error: Please provide an alternative to your conditional statement.";
                                return "error";
                            }
                        }
                        // check if next term is a comp op
                        if (COMPARISONOPERATOR(termArr[i + 1])) { // check if next term is a connective
                            document.getElementById("transaction_status").innerHTML = "Comparison operator error: Please provide an alternative to your conditional statement.";
                            return "error";
                        }
                        if (termArr[i + 1] === "and" || termArr[i + 1] === "or") { // check if next term is a connective
                            ++i;
                        }
                    } else { // there is an alternative
                        var findConsequentResult2 = findConsequent(termArr, i + findConsequentResult1[1] + 4); // +4 because of 'else' + {
                        alt = findConsequentResult2[0];
                        var lengthOfAlt = findConsequentResult2[1];
                        i = i + lengthOfCons + lengthOfAlt + 3; // +4 to skip {}{}
                        if (ifsToBeMatched > 1) {
                            ifCondition = ifStack.length > 0 ? ifStack.pop() + " " + alt : alt;
                        } else {
                            contractString = contractString === "" ? alt : contractString + " " + alt;
                        }
                    }
                }
                --ifsToBeMatched;
                noOfOpeningParensStack.pop();
            } else if (ifsToBeMatched <= 0 && !insideCondition) { // we are not inside ifCondition and can append to contractString
                contractString = contractString === "" ? term : contractString + " " + term;
            }
        } else if (term === "(") {
            if (i > termArr.length - 3 || nextTerm === ")" || COMPARISONOPERATOR(nextTerm)
              || nextTerm === "&&" || nextTerm === "||" || nextTerm === "{" || isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm)))
              || nextTerm === "}" || nextTerm === "or" || nextTerm === "and" || nextTerm === "else"
              || isNumeric(nextTerm) || observablesArr.includes(nextTerm)
              || (i > 0 && (prevTerm === ")" || prevTerm === "one" || prevTerm === "zero"
              || prevTerm === "truncate" || prevTerm === "scaleK" || prevTerm === "else" || prevTerm === "}"))) {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                return "error";
            }
            ++openingParens;
            if (termArr[i - 1] !== "if") {
                if (ifsToBeMatched <= 0 && !insideCondition) { // we are not inside ifCondition and can append to contractString
                    contractString = contractString === "" ? term : contractString + " " + term;
                }
            }
        } else if (COMPARISONOPERATOR(term)) {
            if (firstPartStack.length === 0 || firstPartStack.length !== ifsToBeMatched) {
                firstPartStack.push(ifCondition);
            }
            compOpStack.push(term);
            ifCondition = "";
        } else if (term === "||" || term === "&&") {
            if (prevTerm !== ")" || nextTerm !== "(") {
                document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                return "error";
            }
            var firstPart = firstPartStack.pop(),
                compOp = compOpStack.pop(),
                secondPart = ifCondition,
                ifConditionVal = evaluate(firstPart, compOp, secondPart);
                if (ifConditionVal === undefined) {
                    document.getElementById("transaction_status").innerHTML = "Conditional statement syntax error.";
                    return "error";
                }

            // keep opening paren
            ifCondition = firstPart.slice(0, 1) === "(" && secondPart.slice(-1) !== ")" ? "(" + ifConditionVal + " " + term : ifConditionVal + " " + term;
            if ((ifConditionVal && term === "&&") || (!ifConditionVal && term === "||")) {
                // keep opening paren
                ifCondition = firstPart.slice(0, 1) === "(" && secondPart.slice(-1) !== ")" ? "(" : "";
            }
        } else if (nonExistingTerm(term)) {
            // give error for non-existing term
            document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
            return "error";
        } else {
            if (ifsToBeMatched > 0) { // we are inside ifCondition and do not want to add to final string
                ifCondition = ifCondition === "" ? term : ifCondition + " " + term;
            } else { // we are not inside ifCondition and can append to contractString
                contractString = contractString === "" ? term : contractString + " " + term;
            }
        }
    }
    return contractString;
}

export function evaluate(part1, comparisonOperator, part2) {
    if (comparisonOperator === "{>}" || comparisonOperator === "{<}" || comparisonOperator === "{==}" || comparisonOperator === "{>=}" || comparisonOperator === "{<=}") {
        // Horizon Comparison

        // can only compare two contracts - cannot have a logical operator between two contracts
        // if no truncate included then horizon is infinite
        var horizon1 = getHorizon(part1),
            horizon2 = getHorizon(part2);
        switch(comparisonOperator) {
            case "{>=}":
                return !greaterDate(horizon2, horizon1);
            case "{>}":
                return greaterDate(horizon1, horizon2);
            case "{<=}":
                return !greaterDate(horizon1, horizon2);
            case "{<}":
                return greaterDate(horizon2, horizon1);
            case "{==}":
                return equalDates(horizon1, horizon2);
            default:
        }
    }
    else if (comparisonOperator === "[>]" || comparisonOperator === "[<]" || comparisonOperator === "[==]" || comparisonOperator === "[>=]" || comparisonOperator === "[<=]") {
        // Value Comparison
        // can only compare two contracts - cannot have a logical operator between two contracts
        var value1 = getValue(part1, ""),
            value2 = getValue(part2, "");
        switch(comparisonOperator) {
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
    } else if (comparisonOperator === ">=" || comparisonOperator === ">" || comparisonOperator === "<=" || comparisonOperator === "<" || comparisonOperator === "==") {
        // Dominance Comparison
        var horizon1 = getHorizon(part1),
            horizon2 = getHorizon(part2);
        // go through all dates and call getValue with date parameter
        switch(comparisonOperator) {
            case ">=":
                if (!greaterDate(horizon2, horizon1)) {
                    var horizonsSet = extractAllSubHorizons(part1, part2, comparisonOperator);
                    for (let hor of horizonsSet) {
                        var value1 = getValue(part1, hor),
                            value2 = getValue(part2, hor);
                        if (value1 < value2) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
                break;
            case ">":
                return evaluate(part1, ">=", part2) && !evaluate(part1, "==", part2);
            case "<=":
                if (!greaterDate(horizon1, horizon2)) {
                    var horizonsSet = extractAllSubHorizons(part1, part2, comparisonOperator);
                    for (let hor of horizonsSet) {
                        var value1 = getValue(part1, hor),
                            value2 = getValue(part2, hor);
                        if (value1 > value2) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
                break;
            case "<":
                return evaluate(part1, "<=", part2) && !evaluate(part1, "==", part2);
            case "==":
                if (equalDates(horizon2, horizon1)) {
                    var horizonsSet = extractAllSubHorizons(part1, part2, comparisonOperator);
                    for (let hor of horizonsSet) {
                        var value1 = getValue(part1, hor),
                            value2 = getValue(part2, hor);
                        if (value1 !== value2) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
                break;
            default:
        }
    }
}

function COMPARISONOPERATOR(string) {
    if (string === "{>}" || string === "{<}" || string === "{==}" || string === "{>=}" || string === "{<=}"
      || string === "[>]" || string === "[<]" || string === "[==]" || string === "[>=]" || string === "[<=]"
      || string === ">=" || string === "==" || string === "<=" || string === ">" || string === "<") {
        return true;
    }
    return false;
}

export function getHorizon(contractString) {
    // Loops through the whole contract once to find the largest horizon
    // Find minimum horizon, but beforeCurrentDate() must return false
    var strArr = contractString.split(" "),
        maxHorizon = "", // setting first horizon as empty string
        comeAcrossTruncate = false;
    for (var i = 0; i < strArr.length; ++i) {
        if (strArr[i] === "truncate") {
            // obtain c from 'truncate t c'
            var truncDate = strArr[i + 1],
                oscs = obtainSubContractString(strArr, i + 2),
                c = oscs[0],
                prevHorizon = getHorizon(c), // obtain c's previous horizon
                currentHor = lTrimDoubleQuotes(rTrimDoubleQuotes(truncDate)); // compare previous horizon with new horizon t and get min
            if (greaterDate(currentHor, prevHorizon)) {
                currentHor = prevHorizon;
            }
            comeAcrossTruncate = true;
            if (maxHorizon === "" || greaterDate(currentHor, maxHorizon)) {
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
    return maxHorizon;
}

export function decompose(termArr) { // decomposes contract by most external connective
    stringToAddToBeginning = "";
    stringToAddToEnd = "";
    var openingParens = 0,
        closingParens = 0,
        contractString = "",
        contractParsed = "",
        parseStack = [],
        contractsStack = [],
        closingParensStack = [],
        mostBalancedConj = "",
        mostBalancedConjBalance = termArr.length - 1,
        secondPartString = "",
        stringToAddToBeginning = "",
        stringToAddToEnd = "",
        conjWaitingToBeMatched = false; // set to true when reading conjunction and then set to false when reading another conjunction or reaching end

    for (var i = 0; i < termArr.length; ++i) {
        var term = termArr[i];
        if (term === "and" || term === "or") { // we have reached the end of a subcontract whenever 'and' is read
            if (openingParens === closingParens) { // found outer most conjunct
                mostBalancedConj = term;
                contractsStack[0] = contractParsed;
                contractsStack[1] = termArr.slice(i + 1).join(' ');
                stringToAddToBeginning = "";
                stringToAddToEnd = "";
                if (termArr[i - 1] === ")" && termArr[i + 1] === "(") {
                    contractsStack[0] = lTrimParen(rTrimParen(contractsStack[0]));
                    contractsStack[1] = lTrimParen(rTrimParen(contractsStack[1]));
                }
                return [contractsStack[0], contractsStack[1], mostBalancedConj, "" , ""];
            } else if (openingParens - closingParens < mostBalancedConjBalance) { // found a new most balanced connective
                mostBalancedConjBalance = openingParens - closingParens;
                mostBalancedConj = term;
                var combinatorString = parseStack[parseStack.length - 1];
                var closingParensString = closingParensStack[closingParensStack.length - 1];
                if (combinatorString !== undefined) {
                    if (mostBalancedConj === "or") {
                        contractsStack[0] = contractString;
                        stringToAddToBeginning = combinatorString + " ( ";
                        stringToAddToEnd = closingParensString;
                    } else {
                        contractsStack[0] = contractParsed + closingParensString;
                    }
                } else {
                    contractsStack[0] = contractParsed;
                }
                contractString = "";
                conjWaitingToBeMatched = true;
            } else { // ie conjWaitingToBeMatched
                secondPartString = secondPartString === "" ? term : secondPartString + " " + term;
                if (conjWaitingToBeMatched) {
                    contractString = contractString === "" ? term : contractString + " " + term;
                }
            }
        } else if (term === "zero" || term === "one") {
            var combinatorString = parseStack[parseStack.length - 1];
            var closingParensString = closingParensStack[closingParensStack.length - 1];
            if (conjWaitingToBeMatched) {
                secondPartString = secondPartString === "" ? term : secondPartString + " " + term;
            }
            contractString = contractString === "" ? term : contractString + " " + term;
        } else if (term === ")") {
            var combinatorString;
            var closingParensString;
            if (!conjWaitingToBeMatched) {
                combinatorString = parseStack.pop();
                closingParensString = closingParensStack.pop();
            }

            if (secondPartString !== "" && conjWaitingToBeMatched && (openingParens - closingParens === mostBalancedConjBalance || ( openingParens - closingParens === mostBalancedConjBalance + 1 && termArr[0] === "("))) {
                secondPartString = closingParensString !== undefined ? secondPartString + closingParensString : secondPartString + " " + term;
                if (mostBalancedConj === "or") {
                    contractsStack[1] = secondPartString;
                } else { // connective is "and"
                    if (combinatorString !== undefined) {
                        if (secondPartString[0] !== "(") {
                            contractsStack[1] = stringToAddToBeginning !== "" ? stringToAddToBeginning + " ( " + combinatorString + " ( " + secondPartString : combinatorString + " ( " + secondPartString;
                        } else {
                            contractsStack[1] = stringToAddToBeginning !== "" ? stringToAddToBeginning + " ( " + combinatorString + " " + secondPartString : combinatorString + " " + secondPartString;
                        }
                    }
                    else if (closingParensString !== undefined) {
                        contractsStack[1] = stringToAddToBeginning !== "" ? stringToAddToBeginning + " ( " + secondPartString : "( " + secondPartString;
                    } else {
                        contractsStack[1] = stringToAddToBeginning !== "" ? stringToAddToBeginning + " " + secondPartString : secondPartString;
                    }
                }
                secondPartString = "";
            }
            contractString = "";
            ++closingParens;
        } else if (term === "(") {
            ++openingParens;
            if (contractString !== "" && openingParens - closingParens < mostBalancedConjBalance) {
                if (parseStack.length > 0) {
                    parseStack.push(parseStack[parseStack.length - 1] + " ( " + contractString);
                } else {
                    parseStack.push(contractString);
                }
            }
            if (termArr[i - 1] !== "and" && i !== 0) {
                if (closingParensStack.length === 0) {
                    closingParensStack.push(" )");
                } else {
                    closingParensStack.push(closingParensStack[closingParensStack.length - 1] + " )");
                }
            }

            if (conjWaitingToBeMatched) {
                secondPartString = secondPartString === "" ? term : secondPartString + " " + term;
            }

            contractString = "";
        } else {
            if (conjWaitingToBeMatched) {
                secondPartString = secondPartString === "" ? term : secondPartString + " " + term;
            }
            contractString = contractString === "" ? term : contractString + " " + term;
        }
        contractParsed = contractParsed === "" ? term : contractParsed + " " + term;
    }
    // this happens if there is a balanced or conjunction at the end and the second part still needs to be added
    return [cleanParens(contractsStack[0]), cleanParens(contractsStack[1]), mostBalancedConj, stringToAddToBeginning, stringToAddToEnd];
}

export function getValue(contractString, horizonToCheck) {
    var termArr = contractString.split(" "),
        currentString = "",
        combinatorStack = [],
        valuesStack = [],
        currentVal,
        horizonsStack = []; // pushes horizons of each c whenever we push combinators

    for (var i = 0; i < termArr.length; ++i) {
        var term = termArr[i];
        if (term === "(") {
            if (currentString !== "") {
                combinatorStack.push(currentString);
                currentString = "";
            }
        } else if (term === ")") { // whenever we read this we can evaluate current contract string and pop 1 comb off the combinators stack to apply
            currentVal = getLowestLevelContractValue(currentString, horizonToCheck);
            if (combinatorStack.length > 0) {
                var str = combinatorStack.pop() + " " + currentVal.toString();
                currentVal = getLowestLevelContractValue(str, horizonToCheck);
            }
            if (currentVal !== undefined) {
                currentString = i === termArr.length - 1 ? "" : currentVal.toString();
            }
            // apply combinator to it and call getValue again
        } else if (term === "get") {
            var oscs = obtainSubContractString(termArr, i + 1);
            var subContractString = oscs[0];
            var tempValue = getValue(subContractString, horizonToCheck);
            currentVal = sameDayAsCurrentDate(getHorizon(subContractString), horizonToCheck) ? tempValue : 0;

            if (currentVal !== undefined) {
                currentString = i === termArr.length - 1 ? "" : currentVal.toString();
            }
            i += oscs[1];
        } else {
            currentString = currentString === "" ? term : currentString + " " + term;
        }
    }
    if (currentString !== "") {
        currentVal = getLowestLevelContractValue(currentString, horizonToCheck);
    }
    return currentVal;
}

function getLowestLevelContractValue(contractString, horizonToCheck) {
    if (contractString.includes(" or ")) { // it will only contain one or the other, not both
        var arr = contractString.split(" or ");
        return Math.max(getLowestLevelContractValue(arr[0], horizonToCheck), getLowestLevelContractValue(arr[1], horizonToCheck));
    } else if (contractString.includes(" and ")) {
        var arr = contractString.split(" and ");
        return getLowestLevelContractValue(arr[0], horizonToCheck) + getLowestLevelContractValue(arr[1], horizonToCheck);
    } else {
        // string does not contain connective ie we are in lowest-level subcontract
        if (isNumeric(contractString)) {
            return parseFloat(contractString);
        } else if (contractString === "zero" || contractString.includes(" zero ") || contractString === "0" || contractString.includes(" 0 ")) {
            return 0;
        } else if (contractString === "one") {
            return 1;
        } else {
            var value = 1;
            var horizon = getHorizon(contractString);
            var termArr = contractString.split(" ");
            for (var i = 0; i < termArr.length; ++i) {
                if (termArr[i] === "scaleK") {
                    if (termArr[i + 1].includes("x")) { // value dependent on some observable values
                        var arr = termArr[i + 1].split("x");
                        for (var j = 0; j < arr.length; ++j) {
                            if (isNumeric(arr[j])) {
                                value = value * parseFloat(arr[j]);
                            } else { // we encountered an observable
                                if (arr[j] === "libor3m") {
                                    // rounding because Parity can only handle integers
                                    value = Math.round(value * getOracleByAddress(agreedOracleAddress).getLiborSpotRate());
                                } else if (arr[j] === "tempInLondon") {
                                    value = Math.round(value * getOracleByAddress(agreedOracleAddress).getTempInLondon());
                                }
                            }
                        }
                    } else {
                        value = value * parseFloat(termArr[i + 1]);
                    }
                    ++i;
                } else if (termArr[i] === "give") {
                    value = -value;
                } else if (isNumeric(termArr[i])) {
                    value = value * parseFloat(termArr[i]);
                }
            }
            if (beforeCurrentDate(horizon, horizonToCheck)) { // ie contract has expired, its horizon is before horizonToCheck
                return 0;
            } else { // contract's horizon is after the horizon given, so it is valid
                return value;
            }

        }
    }
}

global.processContract = function(inputString, initialDecomposition, firstOrHasBeenDecomposed, contractOwner) {
    ++uniqueID;
    if (initialDecomposition) {
        // This is the case only when this function is triggered by the 'make transaction' button
        contractsBeingDecomposed = 1;
        removeChildren("button_choices_container"); // NEEDED?
        acquireBtnToBeDisabled1 = true;
        acquireBtnToBeDisabled2 = true;
        document.getElementById("transaction_status").innerHTML = "";
    }
    inputString = cleanUpBeforeDecomp(inputString);
    if (inputString === "error" || !parsesSuccessfullyForSyntax(inputString)) {
        return;
    }
    var termArr = inputString.split(" ");
    // check if inputstring contains 'or' else execute right away
    var orMatches = inputString.match(/^(.*)\sor\s(.*)$/);
    if (orMatches !== null) {
        // keep track of the current most balanced conj AND its external combinators
        var decomposedResult = decompose(termArr),
            part1 = decomposedResult[0],
            part2 = decomposedResult[1],
            mostBalancedConj = decomposedResult[2];
        if (mostBalancedConj === "and") {
            ++contractsBeingDecomposed;
            processContract(part1, false, firstOrHasBeenDecomposed, contractOwner);
            processContract(part2, false, firstOrHasBeenDecomposed, contractOwner);
        } else { // conn is "or"
            if (!firstOrHasBeenDecomposed) {
                var occ = occurrences(decomposedResult[3], "give ", false);
                contractOwner = occ % 2 === 0 ? 0 : 1; // setting the owner for all future contract choices
            }
            firstOrHasBeenDecomposed = true;
            addChoices([part1, part2], decomposedResult[3], decomposedResult[4], uniqueID, contractOwner);
        }
    }
    else { // input does not contain 'or'
        var contractsArr = decomposeAnds(inputString); // calling this for performance reasons - decomposeAnds will not recursively call itself
        contractsBeingDecomposed = contractsBeingDecomposed + contractsArr.length - 1;
        createContractEntries(contractsArr);
    }
};

function createValuationSelect(tr, id) {
    var td;
    tr.appendChild(td = document.createElement("td"));
    var div = document.createElement("div");
    td.appendChild(div);
    div.className = "valuation_cell_data";

    var date = new Date(),
        d = date.getDate(),
        m = date.getMonth(),
        y = date.getFullYear();

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
    var day = padNumber(document.getElementById("day_select_" + id).value),
        month = padNumber(document.getElementById("month_select_" + id).value),
        year = document.getElementById("year_select_" + id).value,
        c = getAllSubcontracts(id);
    document.getElementById("p_value_" + id).innerHTML = getValue(c, day + "/" + month + "/" + year + "-" + "12:00:00").toString() + "ETH";
}

function getAllSubcontracts(superKey) {
    var finalContractString = "";
    if (superContractsMap.has(superKey)) {
        for (var [superContractId, contractsSet] of superContractsMap) {
            if (superContractId === superKey) {
                for (let contract of contractsSet) {
                    finalContractString = finalContractString === "" ? contract.contractString : finalContractString + " and " + contract.contractString;
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
        executeSuperContract(id);
    };
    td.appendChild(btn);
    // if either of these is true then we want the acquire button to be disabled
    if (acquireBtnToBeDisabled1 || acquireBtnToBeDisabled2) {
        btn.disabled = true;
    }
}

function addChoices(contractsStack, beginningStr, endStr, divId, owner) {
    var contract2 = contractsStack.pop();
    var contract1 = contractsStack.pop();
    createSection(divId);
    createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract1)), beginningStr, endStr, 1, divId, owner);
    createOrLabel(divId);
    createButton(rTrimWhiteSpace(lTrimWhiteSpace(contract2)), beginningStr, endStr, 2, divId, owner);
    stringToAddToBeginning = "";
    stringToAddToEnd = "";
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

export function decomposeAnds(contractString) {
    // keep two stacks: one for combinators and one for closing parenthesis to be added
    var termArr = contractString.split(" "),
        openingParens = 0,
        contractString = "",
        parseStack = [],
        finalContractsArr = [],
        closingParensStack = [];
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
                if (combinatorString !== undefined && closingParensString !== undefined) {
                    finalContractsArr.push(combinatorString + " ( " + contractString + closingParensString);
                } else {
                    finalContractsArr.push(contractString);
                }
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
        } else {
            contractString = contractString === "" ? term : contractString + " " + term;
        }
    }
    // this happens if there is a balanced or conjunction at the end and the second part still needs to be added
    if (contractString !== "") {
        finalContractsArr.push(contractString);
    }
    return finalContractsArr;
}

function parsesSuccessfullyForSyntax(contractString) {
    var strArr = contractString.split(" ");
    for (var i = 0; i < strArr.length; ++i) {
        var term = strArr[i],
            prevTerm = strArr[i - 1],
            nextTerm = strArr[i + 1];
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
                  || isNumeric(nextTerm) || observablesArr.includes(nextTerm)) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": " + term;
                    return false;
                }
                break;
            case "or":
                if ((i > 0 && prevTerm !== ")" && prevTerm !== "one" && prevTerm !== "zero")
                  || nextTerm === ")" || nextTerm === "and" || nextTerm === "or" || isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm)))
                  || isNumeric(nextTerm) || observablesArr.includes(nextTerm)) {
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
                if (i > strArr.length - 3 || (i < strArr.length - 1 && !isNumeric(nextTerm) && !observablesArr.includes(nextTerm))) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": scaleK should be followed by an integer or an observable.";
                    return false;
                }
                break;

            case "give":
                if (i === strArr.length - 1 || (i < strArr.length - 1 && nextTerm !== "(")) {
                    document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": give should be followed by opening parenthesis.";
                    return false;
                }
                break;
            case "(":
                if (i > strArr.length - 3 || prevTerm === "one" || prevTerm === "zero" || prevTerm === ")"
                  || prevTerm === "scaleK" || prevTerm === "truncate" || nextTerm === "and" || nextTerm === "or"
                  || nextTerm === ")" || isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(nextTerm)))
                  || isNumeric(nextTerm) || observablesArr.includes(nextTerm)) {
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
                if (isNumeric(term) || observablesArr.includes(term)) {
                    if (i === 0 || i === strArr.length - 1 || prevTerm !== "scaleK" || nextTerm !== "(") {
                        document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": a float/observable value should be after scaleK and the float/observable should be followed by parenthesis.";
                        return false;
                    }
                } else if (isDate(lTrimDoubleQuotes(rTrimDoubleQuotes(term)))) {
                    if (i === 0 || i === strArr.length - 1 || prevTerm !== "truncate" || nextTerm !== "(") {
                        document.getElementById("transaction_status").innerHTML = "Syntax error at term " + i.toString() + ": a date should be after truncate and the date should be followed by parenthesis.";
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
    // this is a lowest-level subcontract, ie. it contains only 1 occurrence zero/one
    var giveOccurrences = 0,
        getOccurrences = 0,
        getHasAppeared = false, // to make sure gets are followed by a truncate
        amount = "1",
        contractObsArr = [];
    if (inputString.includes(" zero ") || inputString.includes(" zero") || inputString === "zero") {
        amount = "0";
    }
    var horizonDate = getHorizon(inputString);
    var newStr = inputString.replace(/[()]/g, ''); // removing parenthesis
    var strArr = newStr.split(" ");
    for (var i = 0; i < strArr.length; ++i) {
        var str = strArr[i];
        if (str === "give") {
            ++giveOccurrences;
        } else if (str === "scaleK" && amount !== "0") {
            if (isNumeric(strArr[i + 1])) {
                amount = ( parseFloat(amount) * parseFloat(strArr[i + 1]) ).toString();
                ++i;
            } else if (observablesArr.includes(strArr[i + 1])) {
                contractObsArr.push(strArr[i + 1]);
                ++i;
            }
        } else if (str === "get") {
            getHasAppeared = true;
            ++getOccurrences;
        } else if (str === "truncate") { // to make sure gets are followed by a truncate
            getHasAppeared = false;
        }
    }
    if (getHasAppeared) {
        document.getElementById("transaction_status").innerHTML = "Syntax error: get must be followed by truncate.";
        addSuperContractRow();
        return;
    }
    var recipient = giveOccurrences % 2 === 0 ? 0 : 1,
        acquireAtHorizon = getOccurrences % 2 === 0 ? "no" : "yes",
        contractString = createNewContractString(amount, contractObsArr, recipient, horizonDate, acquireAtHorizon);
    const contract = new Contract(numberOfContracts.toString() + "." + numberOfSubContracts.toString(), amount, contractObsArr, recipient, contractString,
       translateContract(recipient, amount, contractObsArr, horizonDate, acquireAtHorizon),
       horizonDate, acquireAtHorizon, "waiting to be executed");

    var balanceLabel = recipient === 1 ? document.getElementById("holder_balance_p").innerHTML.split() : document.getElementById("counter_party_balance_p").innerHTML;
    const regex = new RegExp("(Balance:\\s)(.+)(ETH)");
    var matchObj = regex.exec(balanceLabel); // cannot check Rust balance as this will cause a delay. However, this is fine since label balance gets updated directly after transfer
    var balance = parseFloat(matchObj[2]);
    // uncomment this for testing, comment below - > there will be no super contract row
    // createTableRow(contract); // TESTING
    if (balance >= parseFloat(amount) && enoughBalanceForCapacity(contract, balance)) {
        createTableRow(contract);
        ++numberOfSubContracts;
        if (horizonDate !== "infinite" && beforeCurrentDate(contract.horizonDate, "")) {
            // add expired label
            document.getElementById("td_status_" + contract.id).innerHTML = "expired";
        } else {
            addToSuperContracts(superContractsMap, numberOfContracts.toString(), contract); // contract is only added to pending contracts map if it is still valid
            document.getElementById("td_status_" + contract.id).innerHTML = "waiting to be executed";
        }
        addSuperContractRow();
    } else {
        document.getElementById("transaction_status").innerHTML = "Insufficient funds. The sending party does not have enough Ether in their account. Please deposit before adding additional contracts.";
        addSuperContractRow();
    }
}

function addSuperContractRow() {
    --contractsBeingDecomposed;
    if (!document.getElementById("button_choices_container").hasChildNodes() && contractsBeingDecomposed === 0 && numberOfSubContracts !== 0) {
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
}

function addToSuperContracts(map, superKey, contract) {
    if (map.has(superKey)) {
        for (var [superContractId, contractsSet] of map) {
            if (superContractId === superKey) {
                var newSet = contractsSet;
                newSet.add(contract);
                map.set(superContractId, newSet);
                break;
            }
        }
    } else {
        var newSet = new Set();
        newSet.add(contract);
        map.set(superKey, newSet);
    }
    console.log("SupercontractsMap after adding a contract");
    console.log(map);
}

function deleteFromSuperContracts(map, superKey, contract) {
    for (var [superContractId, contractsSet] of map) {
        if (superContractId === superKey) {
            var newSet = contractsSet;
            newSet.delete(contract);
            map.set(superContractId, newSet);
            if (newSet.size === 0) {
                map.delete(superContractId);
                document.getElementById("acquire_button_" + superContractId).disabled = true;
            }
            break;
        }
    }
    console.log("SupercontractsMap after deleting a contract");
    console.log(map);
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
    var obsArr = contract.observablesArr;
    if (obsArr.length > 0) {
        for (var i = 0; i < obsArr.length; ++i) {
            if (obsArr[i] === "libor3m") {
                // rounding because Parity can only handle integers
                contract.amount = (Math.round(parseFloat(contract.amount) * getOracleByAddress(agreedOracleAddress).getLiborSpotRate())).toString();
            } else if (obsArr[i] === "tempInLondon") {
                contract.amount = (Math.round(parseFloat(contract.amount) * getOracleByAddress(agreedOracleAddress).getTempInLondon())).toString();
            }
        }
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
        if (balance >= parseFloat(contract.amount)) {
            transfer(fromAddress, toAddress, parseFloat(contract.amount)).then(transferTxHash => {
                // do not need to watch for transfer event as we do checks here.. watching the event may cause delays
                waitForReceipt(transferTxHash).then( _ => {
                    console.log(fromAddress + " has transferred " + contract.amount + " Ether to " + toAddress);
                    document.getElementById("td_status_" + contract.id).innerHTML = "successful";
                    deleteFromSuperContracts(superContractsMap, contract.id.split(".")[0], contract);
                    retrieveBalances();
                });
            });
        } else {
            document.getElementById("td_status_" + contract.id).innerHTML = "insufficient funds";
            if (beforeCurrentDate(contract.horizonDate, "")) {
                document.getElementById("td_status_" + contract.id).innerHTML = "expired";
                deleteFromSuperContracts(superContractsMap, contract.id.split(".")[0], contract);
            }
        }
    });
}

function enoughBalanceForCapacity(contract, balance) {
    // compute sum of transactions in Map
    var sum = 0;
    for (var [superContractId, contractsSet] of superContractsMap) {
        for (let contractInMap of contractsSet) {
            sum += parseFloat(contractInMap.amount);
        }
    }
    if (contract.recipient === 0) { // owner is recipient - if sum is +ve then that means holder is receiving and counter party paying
        sum = -sum; // negate the sum for the counterparty
    }
    // subtract final sum + new tx amount from balance and check if >= 0
    if ((balance - (sum + parseFloat(contract.amount))) >= 0) {
        return true;
    } else {
        return false;
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

function ownsRights(contractOwnerInt) {
    var ownerAddress = contractOwnerInt === 0 ? document.getElementById("holder_address").value : document.getElementById("counter_party_address").value;
    if (getSelectedMetaMaskAccount().toUpperCase() === ownerAddress.toUpperCase()) {
        return true;
    } else {
        document.getElementById("transaction_status").innerHTML = "Please change the currently selected MetaMask account to the owner of the contract you are trying to make a choice on.";
        return false;
    }
}

function createButton (contractString, beginningString, endString, buttonId, divId, owner) {
    var button = document.createElement("button");
    button.id = "choices_button_" + buttonId;
    button.className = "choices_button";
    button.innerHTML = cleanParens(contractString);
    var finalContractString = beginningString + button.innerHTML + endString;
    // 2. Append somewhere
    var container = document.getElementById("section_" + divId.toString());
    container.appendChild(button);
    // 3. Add event handler
    button.addEventListener ("click", function() {
        if (ownsRights(owner)) { // party must own the rights of the contract to make choice
            removeChildren("section_" + divId);
            container.remove();
            processContract(finalContractString, false, true, owner); // firstOrHasBeenDecomposed is true because this is a choice button
        }
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
