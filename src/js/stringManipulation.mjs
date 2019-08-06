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
    while (openingParensAmount(contractString) > closingParensAmount(contractString)) {
        contractString = lTrimParen(lTrimWhiteSpace(contractString));
    }
    while (openingParensAmount(contractString) < closingParensAmount(contractString)) {
        contractString = rTrimParen(rTrimWhiteSpace(contractString));
    }
    return contractString;
}

export function changeDateFormat(string) {
  const regex = /(.*)(\d\d\d\d)\s(\d\d)(.*)/;
  var matchObj = regex.exec(string);
  while (matchObj !== null) {
      string = matchObj[1] + matchObj[2] + "-" + matchObj[3] + matchObj[4];
      matchObj = regex.exec(string);
  }
  return string;
}

export function changeDateFormatBack(string) {
  const regex = /(.*)(\d\d\d\d)-(\d\d)(.*)/;
  var matchObj = regex.exec(string);
  while (matchObj !== null) {
      string = matchObj[1] + matchObj[2] + " " + matchObj[3] + matchObj[4];
      matchObj = regex.exec(string);
  }
  return string;
}

export function addSpacing(string) {
    // paren spacing
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
    // braces spacing
    const regex5 = /(.*\S)({)([^<>=].*)/;
    var matchObj = regex5.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + " " + matchObj[2] + matchObj[3];
        matchObj = regex5.exec(string)
    }
    const regex6 = /(.*\S[^<>=\S])(})(.*)/;
    matchObj = regex6.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + " " + matchObj[2] + matchObj[3];
        matchObj = regex6.exec(string)
    }
    const regex7 = /(.*)({)([^<>=\S]\S.*)/;
    matchObj = regex7.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + matchObj[2] + " " + matchObj[3];
        matchObj = regex7.exec(string)
    }
    const regex8 = /(.*[^<>=])(})(\S.*)/;
    matchObj = regex8.exec(string);
    while (matchObj !== null) {
        string = matchObj[1] + matchObj[2] + " " + matchObj[3];
        matchObj = regex8.exec(string)
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

export function lTrimBrace(str) {
    if (str == null) return str;
    return str.replace(/^\{+/g, '');
}

export function rTrimBrace(str) {
    if (str == null) return str;
    return str.replace(/\}$/g, '');
}

export function lTrimDoubleQuotes(str) {
    if (str == null) return str;
    return str.replace(/^\"+/g, '');
}

export function rTrimDoubleQuotes(str) {
    if (str == null) return str;
    return str.replace(/\"$/g, '');
}

export function trimSemiColon(str) {
    if (str == null) return str;
    return str.replace(/;/g, '');
}
