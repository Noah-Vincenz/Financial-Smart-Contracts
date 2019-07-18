/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

export function cleanParens(contractString) {
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

export function furtherCleanUp(string) {
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

export function addSpacing(string) {
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

export function addParens(contractString) {
    if (openingParensAmount(contractString) > closingParensAmount(contractString)) {
        contractString = contractString + " )";
    } else if (openingParensAmount(contractString) < closingParensAmount(contractString)) {
        contractString = "( " + contractString;
    }
    return contractString;
}

export function openingParensAmount(string) {
    return string.split("(").length - 1;
}

export function closingParensAmount(string) {
    return string.split(")").length - 1;
}

export function lTrimWhiteSpace(str) {
    if (str == null) return str;
    return str.replace(/^\s+/g, '');
}

export function rTrimWhiteSpace(str) {
    if (str == null) return str;
    return str.replace(/\s$/g, '');
}

export function lTrimParen(str) {
    if (str == null) return str;
    return str.replace(/^\(+/g, '');
}

export function rTrimParen(str) {
    if (str == null) return str;
    return str.replace(/\)$/g, '');
}

export function lTrimDoubleQuotes(str) {
    if (str == null) return str;
    return str.replace(/^\"+/g, '');
}

export function rTrimDoubleQuotes(str) {
    if (str == null) return str;
    return str.replace(/\"$/g, '');
}
