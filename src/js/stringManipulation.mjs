/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

/**
 * Removes incorrect parenthesis from the start and end of a string and returns the modified string.
 * @param {string} str - The contract to modify.
 * @returns {string} The modified contract string.
 */
export function cleanParens(str) {
    if (str === undefined) throw new Error("No string argument given.");
    if (str[str.length - 1] === "(") {
        str = str.slice(0, -2);
    }
    if (str[0] === ")") {
        str = str.substr(2);
    }
    var strArr = str.split(" ");
    while (openingParensAmount(str) > closingParensAmount(str) && strArr[0] === "(") {
        str = lTrimParen(str);
        strArr = str.split(" ");
    }
    while (openingParensAmount(str) < closingParensAmount(str) && strArr[strArr.length - 1] === ")") {
        str = rTrimParen(str);
        strArr = str.split(" ");
    }
    return str;
}

/**
 * Changes the date format of a string to one that separates date and time by '-' in order
 * to be able to split a contract by whitespaces.
 * @param {string} str - The contract to modify.
 * @returns {string} The modified contract string.
 */
export function changeDateFormat(str) {
  if (str == undefined) throw new Error("No string argument given.");
  const regex = /(.*)(\d\d\d\d)\s(\d\d)(.*)/;
  var matchObj = regex.exec(str);
  while (matchObj !== null) {
      str = matchObj[1] + matchObj[2] + "-" + matchObj[3] + matchObj[4];
      matchObj = regex.exec(str);
  }
  return str;
}

/**
 * Changes the date format of a string to one back to the original formate that
 * separates date and time by a whitespace.
 * @param {string} str - The contract to modify.
 * @returns {string} The modified contract string.
 */
export function changeDateFormatBack(str) {
  if (str == undefined) throw new Error("No string argument given.");
  const regex = /(.*)(\d\d\d\d)-(\d\d)(.*)/;
  var matchObj = regex.exec(str);
  while (matchObj !== null) {
      str = matchObj[1] + matchObj[2] + " " + matchObj[3] + matchObj[4];
      matchObj = regex.exec(str);
  }
  return str;
}

/**
 * Adds spacing before and after parenthesis and curly braces in order to allow
 * splitting of a contract by whitespaces.
 * @param {string} str - The contract to modify.
 * @returns {string} The modified contract string.
 */
export function addSpacing(str) {
    if (str == undefined) throw new Error("No string argument given.");
    // paren spacing
    const regex1 = /(.*\S)(\()(.*)/;
    var matchObj = regex1.exec(str);
    while (matchObj !== null) {
        str = matchObj[1] + " " + matchObj[2] + matchObj[3];
        matchObj = regex1.exec(str)
    }
    const regex2 = /(.*\S)(\))(.*)/;
    matchObj = regex2.exec(str);
    while (matchObj !== null) {
        str = matchObj[1] + " " + matchObj[2] + matchObj[3];
        matchObj = regex2.exec(str)
    }
    const regex3 = /(.*)(\()(\S.*)/;
    matchObj = regex3.exec(str);
    while (matchObj !== null) {
        str = matchObj[1] + matchObj[2] + " " + matchObj[3];
        matchObj = regex3.exec(str)
    }
    const regex4 = /(.*)(\))(\S.*)/;
    matchObj = regex4.exec(str);
    while (matchObj !== null) {
        str = matchObj[1] + matchObj[2] + " " + matchObj[3];
        matchObj = regex4.exec(str)
    }
    // braces spacing
    const regex5 = /(.*\S)({.*)/;
    var matchObj = regex5.exec(str);
    while (matchObj !== null) {
        str = matchObj[1] + " " + matchObj[2];
        matchObj = regex5.exec(str)
    }
    const regex6 = /(.*{)([^<>=\s].*)/;
    matchObj = regex6.exec(str);
    while (matchObj !== null) {
        str = matchObj[1] + " " + matchObj[2];
        matchObj = regex6.exec(str)
    }
    const regex7 = /(.*[^<>=\s])(}.*)/;
    matchObj = regex7.exec(str);
    while (matchObj !== null) {
        str = matchObj[1] + " " + matchObj[2];
        matchObj = regex7.exec(str)
    }
    const regex8 = /(.*})(\S.*)/;
    matchObj = regex8.exec(str);
    while (matchObj !== null) {
        str = matchObj[1] + " " + matchObj[2];
        matchObj = regex8.exec(str)
    }
    return str;
}

/**
 * Adds parenthesis to the front of a string if a string has more closing parens then opening ones,
 * or to the end if it is the other way round.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function addParens(str) {
    if (str == undefined) throw new Error("No string argument given.");
    while (openingParensAmount(str) > closingParensAmount(str)) {
        str = str + " )";
    }
    while (openingParensAmount(str) < closingParensAmount(str)) {
        str = "( " + str;
    }
    return str;
}

/**
 * Counts and returns the number of opening parenthesis contained inside a string.
 * @param {string} str - The string to iterate.
 * @returns {number} The number of opening parenthesis occurrences.
 */
export function openingParensAmount(str) {
    if (str == undefined) throw new Error("No string argument given.");
    return str.split("(").length - 1;
}

/**
 * Counts and returns the number of closing parenthesis contained inside a string.
 * @param {string} str - The string to iterate.
 * @returns {number} The number of closing parenthesis occurrences.
 */
export function closingParensAmount(str) {
    if (str == undefined) throw new Error("No string argument given.");
    return str.split(")").length - 1;
}

/**
 * Removes whitespaces present at the beginning of a string.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function lTrimWhiteSpace(str) {
    if (str == undefined) throw new Error("No string argument given.");
    return str.replace(/^\s+/g, '');
}

/**
 * Removes whitespaces present at the end of a string.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function rTrimWhiteSpace(str) {
    if (str == undefined) throw new Error("No string argument given.");
    return str.replace(/\s+$/g, '');
}

/**
 * Removes an opening parenthesis present at the beginning of a string and the following whitespace.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function lTrimParen(str) {
    if (str == undefined) throw new Error("No string argument given.");
    if (str.indexOf("(") === 0) {
      return str.slice(2);
    }
    return str;
}

/**
 * Removes a closing parenthesis present at the end of a string and the preceding whitespace.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function rTrimParen(str) {
    if (str == undefined) throw new Error("No string argument given.");
    if (str.lastIndexOf(")") === str.length - 1) {
        return str.slice(0, -2);
    }
    return str;
}

/**
 * Removes an opening curly brace present at the beginning of a string and the following whitespace.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function lTrimBrace(str) {
    if (str == undefined) throw new Error("No string argument given.");
    if (str.indexOf("{") === 0) {
      return str.slice(2);
    }
    return str;
}

/**
 * Removes a closing curly brace present at the end of a string and the preceding whitespace.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function rTrimBrace(str) {
    if (str == undefined) throw new Error("No string argument given.");
    if (str.lastIndexOf("}") === str.length - 1) {
        return str.slice(0, -2);
    }
    return str;
}

/**
 * Removes double quotes present at the beginning of a string.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function lTrimDoubleQuotes(str) {
    if (str == undefined) throw new Error("No string argument given.");
    return str.replace(/^\"/, '');
}

/**
 * Removes double quotes present at the end of a string.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function rTrimDoubleQuotes(str) {
    if (str == undefined) throw new Error("No string argument given.");
    return str.replace(/\"$/, '');
}

/**
 * Removes a single semi-colon present at the end of a string.
 * @param {string} str - The string to modify.
 * @returns {string} The modified string.
 */
export function trimSemiColon(str) {
    if (str == undefined) throw new Error("No string argument given.");
    return str.replace(/;$/g, '');
}

/**
 * Pads a given number of length 1 with a zero at the beginning.
 * @param {string} number - The number to be padded.
 * @returns {string} The modified number.
 */
export function padNumber(number) {
    if (number.length === 1) {
        return "0" + number;
    }
    return number;
}

/**
 * Used to find the next closest connective inside a given contract string.
 * @param {array} contractStringArr - The given contract string separated by whitespaces.
 * @param {number} indexToStartFrom - The index to start iterating from.
 * @returns {string} The type of the next connective.
 */
export function findNextConnective(contractStringArr, indexToStartFrom) {
    for (var i = indexToStartFrom; i < contractStringArr.length; ++i) {
        var term = contractStringArr[i];
        if (term === "and" || term === "or") {
            return term;
        }
    }
    return "";
}

/**
 * Used to find the next closest consequent inside a given contract string.
 * @param {array} contractStringArr - The given contract string separated by whitespaces.
 * @param {number} indexToStartFrom - The index to start iterating from.
 * @returns {array} A pair array containing the consequent string and its size.
 */
export function findConsequent(contractStringArr, indexToStartFrom) {
    var returnString = "";
    for (var i = indexToStartFrom; i < contractStringArr.length; ++i) {
        var term = contractStringArr[i];
        if (term === "}") {
            return [returnString, i - indexToStartFrom + 1];
        } else {
            returnString = returnString === "" ? term : returnString + " " + term;
        }
    }
    return ["", 0];
}

/**
 * Used to obtain the next following subcontract string from a given input contract string.
 * @param {array} array - The given contract string separated by whitespaces.
 * @param {number} indexToStartFrom - The index to start iterating from.
 * @returns {array} A pair array containing the subcontract string and its size.
 */
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

/**
 * Used to check whether a given string input is a date
 * @param {string} stringInput - The given string to be checked.
 * @returns {boolean} A boolean value specifying whether the input string corresponds to a date.
 */
export function isDate(stringInput) {

    if (stringInput === undefined) {
        return false;
    }
    var matches = stringInput.match(/^((0[1-9])|([12][0-9])|(3[01]))\/((0[1-9])|(1[0-2]))\/(\d\d\d\d)-((0[0-9])|(1[0-9])|(2[0-3])):([0-5][0-9]):([0-5][0-9])$/);
    if (matches === null) {
        return false;
    } else if (matches[0] === stringInput) {
        return true;
    } else {
        return false;
    }
}

/**
 * Used to check whether a given date is the same day as the current date.
 * @param {string} contractHorizon - The given contract horizon date to be checked.
 * @param {string} horizonToCheck - A date to be compared against instead of the current date (if given).
 * @returns {boolean} A boolean value specifying whether the two dates are the same day.
 */
export function sameDayAsCurrentDate(contractHorizon, horizonToCheck) {
    var contractDay = contractHorizon.split("-")[0].split("/")[0],
        contractMonth = contractHorizon.split("-")[0].split("/")[1],
        contractYear = contractHorizon.split("-")[0].split("/")[2];
    if (horizonToCheck === "") {
        var todayDay = new Date().getDate().toString(),
            todayMonth = new Date().getMonth(),
            todayYear = new Date().getFullYear().toString();
        if (contractDay === todayDay && contractMonth === padNumber((todayMonth + 1).toString()) && contractYear === todayYear) {
            return true;
        }
        return false;
    } else {
        var toCompareDay = horizonToCheck.split("-")[0].split("/")[0],
            toCompareMonth = horizonToCheck.split("-")[0].split("/")[1],
            toCompareYear = horizonToCheck.split("-")[0].split("/")[2];
        if (contractDay === toCompareDay && contractMonth === toCompareMonth && contractYear === toCompareYear) {
            return true;
        }
        return false;
    }
}

/**
 * Used to check whether a given date is after another given date.
 * @param {string} dateString1 - The first given contract horizon date.
 * @param {string} dateString2 - The second given contract horizon date.
 * @returns {boolean} A boolean value specifying whether the first date is after the second.
 */
export function greaterDate(dateString1, dateString2) {
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

/**
 * Used to check whether a two given dates are equivalent.
 * @param {string} dateString1 - The first given contract horizon date.
 * @param {string} dateString2 - The second given contract horizon date.
 * @returns {boolean} A boolean value specifying whether the two dates are the same.
 */
export function equalDates(dateString1, dateString2) {
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

/**
 * Used to check whether a given date is before the current date.
 * @param {string} contractDate - The given contract horizon date to be checked.
 * @param {string} horizonToCheck - A date to be compared against instead of the current date (if given).
 * @returns {boolean} A boolean value specifying whether the first date is before the current date.
 */
export function beforeCurrentDate(contractDate, horizonToCheck) {
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

/**
 * Used to compute a date string in a specified format.
 * @param {string} dateString - The date string to be formatted.
 * @returns {string} The final date string in our desired format.
 */
export function computeDateString(dateString) {
    var horizonArr = dateString.split("-"),
        dateArr = horizonArr[0].split("/"),
        timeArr = horizonArr[1].split(":"),
        finalDateString = dateArr[2] + "-" + dateArr[1] + "-"
    + dateArr[0] + "T" + timeArr[0] + ":" + timeArr[1] + ":"
    + timeArr[2] + "+01:00"; // adding 15 seconds to the contract's expiry date to allow it to execute
    return finalDateString;
}

/**
 * Used to concatenate two arrays.
 * @param {array} arr1 - The first array used for the concatenation.
 * @param {array} arr2 - The second array used for the concatenation.
 * @returns {array} Our final array.
 */
export function concatenate(arr1, arr2) {
    for (var i = 0; i < arr2.length; ++i) {
        arr1.push(arr2[i]);
    }
    return arr1;
}
