/* test/stringmanipulation.js */
import {
    cleanParens,
    changeDateFormat,
    changeDateFormatBack,
    addSpacing,
    addParens,
    openingParensAmount,
    closingParensAmount,
    lTrimWhiteSpace,
    rTrimWhiteSpace,
    lTrimParen,
    rTrimParen,
    lTrimBrace,
    rTrimBrace,
    lTrimDoubleQuotes,
    rTrimDoubleQuotes,
    trimSemiColon,
    findConsequent,
    findNextConnective,
    padNumber,
    concatenate,
    computeDateString,
    beforeCurrentDate,
    equalDates,
    greaterDate,
    isDate,
} from "../src/js/stringmanipulation.mjs";

import {
    expect,
    assert
} from "chai";

describe('testing stringmanipulation.mjs...', function() {

    describe('cleanParens()', function() {
        // NOTE: spaces are added around parenthesis before this method is being called
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = cleanParens(") one or zero )");
                assert.isString(res);
                expect(res).to.equal("one or zero")
            })
            it('2', function() {
                var res = cleanParens("one or zero");
                assert.isString(res);
                expect(res).to.equal("one or zero")
            })
            it('3', function() {
                var res = cleanParens("( ( one or zero");
                assert.isString(res);
                expect(res).to.equal("one or zero")
            })
            it('4', function() {
                var res = cleanParens("( ( one or zero (");
                assert.isString(res);
                expect(res).to.equal("one or zero")
            })
            it('5', function() {
                var res = cleanParens("one ( ( or zero");
                assert.isString(res);
                expect(res).to.equal("one ( ( or zero")
            })
            it('6', function() {
                var res = cleanParens("( one ) ) or zero");
                assert.isString(res);
                expect(res).to.equal("( one ) ) or zero")
            })
            it('7', function() {
                var res = cleanParens("( one ) ) or zero )");
                assert.isString(res);
                expect(res).to.equal("( one ) ) or zero")
            })
            it('8', function() {
                var res = cleanParens("( one ) ) or zero ) ");
                assert.isString(res);
                expect(res).to.equal("( one ) ) or zero ) ")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = cleanParens("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(cleanParens, Error, "No string argument given.");
            })
        })
    })

    describe('changeDateFormat()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = changeDateFormat("\"24/12/2019 23:33:33\"");
                assert.isString(res);
                expect(res).to.equal("\"24/12/2019-23:33:33\"")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = changeDateFormat("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(changeDateFormat, Error, "No string argument given.");
            })
        })
    })

    describe('changeDateFormatBack()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = changeDateFormatBack("\"24/12/2019-23:33:33\"");
                assert.isString(res);
                expect(res).to.equal("\"24/12/2019 23:33:33\"")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = changeDateFormatBack("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(changeDateFormatBack, Error, "No string argument given.");
            })
        })
    })

    describe('addSpacing()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = addSpacing("give one or zero");
                assert.isString(res);
                expect(res).to.equal("give one or zero")
            })
            it('2', function() {
                var res = addSpacing("give one or zero)");
                assert.isString(res);
                expect(res).to.equal("give one or zero )")
            })
            it('3', function() {
                var res = addSpacing("give one or zero ");
                assert.isString(res);
                expect(res).to.equal("give one or zero ")
            })
            it('4', function() {
                var res = addSpacing("give one (or zero)");
                assert.isString(res);
                expect(res).to.equal("give one ( or zero )")
            })
            it('5', function() {
                var res = addSpacing("give one {}(or zero)");
                assert.isString(res);
                expect(res).to.equal("give one { } ( or zero )")
            })
            it('6', function() {
                var res = addSpacing("{give one} (or zero)");
                assert.isString(res);
                expect(res).to.equal("{ give one } ( or zero )")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = addSpacing("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(addSpacing, Error, "No string argument given.");
            })
        })
    })

    describe('addParens()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = addParens("one ) )");
                assert.isString(res);
                expect(res).to.equal("( ( one ) )")
            })
            it('2', function() {
                var res = addParens("give one or zero)");
                assert.isString(res);
                expect(res).to.equal("( give one or zero)")
            })
            it('3', function() {
                var res = addParens("give one or zero ");
                assert.isString(res);
                expect(res).to.equal("give one or zero ")
            })
            it('4', function() {
                var res = addParens("give one (or zero)");
                assert.isString(res);
                expect(res).to.equal("give one (or zero)")
            })
            it('5', function() {
                var res = addParens("give one ((or zero)");
                assert.isString(res);
                expect(res).to.equal("give one ((or zero) )")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = addParens("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(addParens, Error, "No string argument given.");
            })
        })
    })

    describe('openingParensAmount()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = openingParensAmount("one ) )");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('2', function() {
                var res = openingParensAmount("give one or zero");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('3', function() {
                var res = openingParensAmount("give one or (zero ");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
            it('4', function() {
                var res = openingParensAmount("give one (or zero)");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
            it('5', function() {
                var res = openingParensAmount("give one(() (or zero)");
                assert.isNumber(res);
                expect(res).to.equal(3)
            })
        })

        context('with empty string argument', function() {
            it('should return 0', function() {
                var res = openingParensAmount("");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(openingParensAmount, Error, "No string argument given.");
            })
        })
    })

    describe('closingParensAmount()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = closingParensAmount("one ) )");
                assert.isNumber(res);
                expect(res).to.equal(2)
            })
            it('2', function() {
                var res = closingParensAmount("give one or zero");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('3', function() {
                var res = closingParensAmount("give one or (zero ");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('4', function() {
                var res = closingParensAmount("give one (or zero)");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
            it('5', function() {
                var res = closingParensAmount("give one(() (or zero)");
                assert.isNumber(res);
                expect(res).to.equal(2)
            })
        })

        context('with empty string argument', function() {
            it('should return 0', function() {
                var res = closingParensAmount("");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(closingParensAmount, Error, "No string argument given.");
            })
        })
    })

    describe('lTrimWhiteSpace()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = lTrimWhiteSpace(" one ) )");
                assert.isString(res);
                expect(res).to.equal("one ) )")
            })
            it('2', function() {
                var res = lTrimWhiteSpace("one ) )");
                assert.isString(res);
                expect(res).to.equal("one ) )")
            })
            it('3', function() {
                var res = lTrimWhiteSpace("  one ) ) ");
                assert.isString(res);
                expect(res).to.equal("one ) ) ")
            })
            it('4', function() {
                var res = lTrimWhiteSpace("   give one (or zero)");
                assert.isString(res);
                expect(res).to.equal("give one (or zero)")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = lTrimWhiteSpace("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(lTrimWhiteSpace, Error, "No string argument given.");
            })
        })
    })

    describe('rTrimWhiteSpace()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = rTrimWhiteSpace(" one ) ) ");
                assert.isString(res);
                expect(res).to.equal(" one ) )")
            })
            it('2', function() {
                var res = rTrimWhiteSpace("one ) )");
                assert.isString(res);
                expect(res).to.equal("one ) )")
            })
            it('3', function() {
                var res = rTrimWhiteSpace("one ) )  ");
                assert.isString(res);
                expect(res).to.equal("one ) )")
            })
            it('4', function() {
                var res = rTrimWhiteSpace("give one (or zero)   ");
                assert.isString(res);
                expect(res).to.equal("give one (or zero)")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = rTrimWhiteSpace("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(rTrimWhiteSpace, Error, "No string argument given.");
            })
        })
    })

    describe('lTrimParen()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = lTrimParen(" one ) )");
                assert.isString(res);
                expect(res).to.equal(" one ) )")
            })
            it('2', function() {
                var res = lTrimParen("( one ) )");
                assert.isString(res);
                expect(res).to.equal("one ) )")
            })
            it('3', function() {
                var res = lTrimParen("( (one ) )");
                assert.isString(res);
                expect(res).to.equal("(one ) )")
            })
            it('4', function() {
                var res = lTrimParen("( (give one (or zero)");
                assert.isString(res);
                expect(res).to.equal("(give one (or zero)")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = lTrimParen("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(lTrimParen, Error, "No string argument given.");
            })
        })
    })

    describe('rTrimParen()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = rTrimParen(" one ) )");
                assert.isString(res);
                expect(res).to.equal(" one )")
            })
            it('2', function() {
                var res = rTrimParen("(one ) ");
                assert.isString(res);
                expect(res).to.equal("(one ) ")
            })
            it('3', function() {
                var res = rTrimParen("( (one)) )");
                assert.isString(res);
                expect(res).to.equal("( (one))")
            })
            it('4', function() {
                var res = rTrimParen("( (give one (or zero");
                assert.isString(res);
                expect(res).to.equal("( (give one (or zero")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = rTrimParen("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(rTrimParen, Error, "No string argument given.");
            })
        })
    })

    describe('lTrimBrace()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = lTrimBrace("{ one }");
                assert.isString(res);
                expect(res).to.equal("one }")
            })
            it('2', function() {
                var res = lTrimBrace("{ {}{one) ");
                assert.isString(res);
                expect(res).to.equal("{}{one) ")
            })
            it('3', function() {
                var res = lTrimBrace(" {one}");
                assert.isString(res);
                expect(res).to.equal(" {one}")
            })
            it('4', function() {
                var res = lTrimBrace(" ");
                assert.isString(res);
                expect(res).to.equal(" ")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = lTrimBrace("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(lTrimBrace, Error, "No string argument given.");
            })
        })
    })

    describe('rTrimBrace()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = rTrimBrace("{ one }");
                assert.isString(res);
                expect(res).to.equal("{ one")
            })
            it('2', function() {
                var res = rTrimBrace("{ {}{one)}} }");
                assert.isString(res);
                expect(res).to.equal("{ {}{one)}}")
            })
            it('3', function() {
                var res = rTrimBrace(" {one} ");
                assert.isString(res);
                expect(res).to.equal(" {one} ")
            })
            it('4', function() {
                var res = rTrimBrace(" ");
                assert.isString(res);
                expect(res).to.equal(" ")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = rTrimBrace("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(rTrimBrace, Error, "No string argument given.");
            })
        })
    })

    describe('lTrimDoubleQuotes()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = lTrimDoubleQuotes("\"24/12/2019-23:33:33\"");
                assert.isString(res);
                expect(res).to.equal("24/12/2019-23:33:33\"")
            })
            it('2', function() {
                var res = lTrimDoubleQuotes("\"\"24/12/2019-23:33:33\"");
                assert.isString(res);
                expect(res).to.equal("\"24/12/2019-23:33:33\"")
            })
            it('3', function() {
                var res = lTrimDoubleQuotes(" 24/12/2019-23:33:33\"");
                assert.isString(res);
                expect(res).to.equal(" 24/12/2019-23:33:33\"")
            })
            it('4', function() {
                var res = lTrimDoubleQuotes("\" 24/12/2019-23:33:33\"");
                assert.isString(res);
                expect(res).to.equal(" 24/12/2019-23:33:33\"")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = lTrimDoubleQuotes("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(lTrimDoubleQuotes, Error, "No string argument given.");
            })
        })
    })

    describe('rTrimDoubleQuotes()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = rTrimDoubleQuotes("\"24/12/2019-23:33:33\"");
                assert.isString(res);
                expect(res).to.equal("\"24/12/2019-23:33:33")
            })
            it('2', function() {
                var res = rTrimDoubleQuotes("\"\"24/12/2019-23:33:33\"\"");
                assert.isString(res);
                expect(res).to.equal("\"\"24/12/2019-23:33:33\"")
            })
            it('3', function() {
                var res = rTrimDoubleQuotes(" 24/12/2019-23:33:33 ");
                assert.isString(res);
                expect(res).to.equal(" 24/12/2019-23:33:33 ")
            })
            it('4', function() {
                var res = rTrimDoubleQuotes("\" 24/12/2019-23:33:33 \"");
                assert.isString(res);
                expect(res).to.equal("\" 24/12/2019-23:33:33 ");
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = rTrimDoubleQuotes("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(rTrimDoubleQuotes, Error, "No string argument given.");
            })
        })
    })

    describe('trimSemiColon()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = trimSemiColon("one;");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('2', function() {
                var res = trimSemiColon("one;;");
                assert.isString(res);
                expect(res).to.equal("one;")
            })
            it('3', function() {
                var res = trimSemiColon("one; ");
                assert.isString(res);
                expect(res).to.equal("one; ")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = trimSemiColon("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })

        context('without argument', function() {
            it('should throw an error', function() {
                assert.throws(trimSemiColon, Error, "No string argument given.");
            })
        })
    })

    describe('concatenate()', function() {

        context('with two non-empty arrays as arguments', function() {

            it('1', function() {
                var res = concatenate([1, 2, 3, 4], [1, 2]);
                assert.isArray(res);
                assert.lengthOf(res, 6);
                assert.sameMembers(res, [1, 2, 3, 4, 1, 2]);
            })
            it('2', function() {
                var res = concatenate([1, 2, 3, 4], [1, 2, 5]);
                assert.isArray(res);
                assert.lengthOf(res, 7);
                assert.sameMembers(res, [1, 2, 3, 4, 1, 2, 5]);
            })
            it('3', function() {
                var res = concatenate([1, 2], [1, 2, 5]);
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, [1, 2, 1, 2, 5]);
            })
        })

        context('with empty arrays as arguments', function() {

            it('1', function() {
                var res = concatenate([], [1, 2, 5]);
                assert.isArray(res);
                assert.lengthOf(res, 3);
                assert.sameMembers(res, [1, 2, 5]);
            })

            it('2', function() {
                var res = concatenate([], []);
                assert.isArray(res);
                assert.isEmpty(res);
            })

            it('3', function() {
                var res = concatenate([1, 2], []);
                assert.isArray(res);
                assert.lengthOf(res, 2);
                assert.sameMembers(res, [1, 2]);
            })
        })

    })

    describe('computeDateString()', function() {

        context('with non-empty string argument', function() {

            it('1', function() {
                var res = computeDateString("11/12/2019-20:21:22");
                assert.isString(res);
                expect(res).to.equal("2019-12-11T20:21:22+01:00")
            })
        })
    })

    describe('beforeCurrentDate()', function() {

        context('with non-empty horizonToCheck argument', function() {

            it('1', function() {
                var res = beforeCurrentDate("11/12/2019-20:21:22", "11/12/2019-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('2', function() {
                var res = beforeCurrentDate("11/12/2019-20:21:22", "11/12/2019-20:21:23");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })

            it('3', function() {
                var res = beforeCurrentDate("11/12/2019-20:21:23", "11/12/2019-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('4', function() {
                var res = beforeCurrentDate("11/12/2019-20:21:22", "infinite");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })

            it('5', function() {
                var res = beforeCurrentDate("infinite", "infinite");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('6', function() {
                var res = beforeCurrentDate("infinite", "11/12/2019-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
        })

        context('with empty horizonToCheck argument', function() {

            it('1', function() {
                var res = beforeCurrentDate("11/12/2010-20:21:22", "");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
        })
    })

    describe('equalDates()', function() {

        context('with two non-infinite date arguments', function() {

            it('1', function() {
                var res = equalDates("11/12/2019-20:21:22", "11/12/2019-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })

            it('2', function() {
                var res = equalDates("11/12/2019-20:21:22", "11/12/2019-20:21:23");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('3', function() {
                var res = equalDates("11/12/2019-20:21:23", "11/12/2019-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
        })

        context('with infinite date arguments', function() {

            it('1', function() {
                var res = equalDates("11/12/2010-20:21:22", "infinite");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('2', function() {
                var res = equalDates("infinite", "11/12/2010-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('3', function() {
                var res = equalDates("infinite", "infinite");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
        })
    })

    describe('greaterDate()', function() {

        context('with two non-infinite date arguments', function() {

            it('1', function() {
                var res = greaterDate("11/12/2019-20:21:22", "11/12/2019-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('2', function() {
                var res = greaterDate("11/12/2019-20:21:22", "11/12/2019-20:21:23");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('3', function() {
                var res = greaterDate("11/12/2019-20:21:23", "11/12/2019-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
        })

        context('with infinite date arguments', function() {

            it('1', function() {
                var res = greaterDate("11/12/2010-20:21:22", "infinite");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('2', function() {
                var res = greaterDate("infinite", "11/12/2010-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })

            it('3', function() {
                var res = greaterDate("infinite", "infinite");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
        })
    })

    describe('isDate()', function() {

        context('with non-empty arguments', function() {

            it('1', function() {
                var res = isDate(" ");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('2', function() {
                var res = isDate("11/12/2010-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })

            it('3', function() {
                var res = isDate("11/12/2010 20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('4', function() {
                var res = isDate("11/12/20100-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('5', function() {
                var res = isDate("1/13/2010-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('6', function() {
                var res = isDate("01/1/2010-20:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('7', function() {
                var res = isDate("01/01/2010-2:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('8', function() {
                var res = isDate("01/01/2010-02/21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('9', function() {
                var res = isDate("01/01/2010-25:21:22");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })

            it('10', function() {
                var res = isDate("01/01/2010-02:21:62");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
        })

        context('with empty argument', function() {

            it('1', function() {
                var res = isDate("");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
        })
    })

    describe('padNumber()', function() {

        context('with non-empty number string as argument', function() {

            it('1', function() {
                var res = padNumber("1");
                assert.isString(res);
                expect(res).to.equal("01")
            })
            it('2', function() {
                var res = padNumber("10");
                assert.isString(res);
                expect(res).to.equal("10")
            })
            it('3', function() {
                var res = padNumber("100");
                assert.isString(res);
                expect(res).to.equal("100")
            })
            it('4', function() {
                var res = padNumber("0");
                assert.isString(res);
                expect(res).to.equal("00")
            })
        })

        context('with empty number string as argument', function() {

            it('1', function() {
                var res = padNumber("");
                assert.isString(res);
                expect(res).to.equal("")
            })
        })
    })

    describe('findNextConnective()', function() {

        var arr = ["one", "or", "zero", "and", "some", "other", "word", "or", "one", "and", "or", "zero"];

        context('with non-empty contract string array as arguments', function() {

            it('1', function() {
                var res = findNextConnective(arr, 0);
                assert.isString(res);
                expect(res).to.equal("or")
            })
            it('2', function() {
                var res = findNextConnective(arr, 1);
                assert.isString(res);
                expect(res).to.equal("or")
            })
            it('3', function() {
                var res = findNextConnective(arr, 2);
                assert.isString(res);
                expect(res).to.equal("and")
            })
            it('4', function() {
                var res = findNextConnective(arr, 5);
                assert.isString(res);
                expect(res).to.equal("or")
            })
            it('5', function() {
                var res = findNextConnective(arr, arr.length - 3);
                assert.isString(res);
                expect(res).to.equal("and")
            })
            it('5', function() {
                var res = findNextConnective(arr, arr.length - 1);
                assert.isString(res);
                expect(res).to.equal("")
            })
        })
    })

    describe('findConsequent()', function() {

        var strArr1 = ["one", "or", "if", "(", "zero", "[==]", "zero", ")", "{", "one", "}", "else", "{", "zero", "}"];
        var strArr2 = ["one", "or", "if", "(", "zero", "[==]", "zero", ")", "{", "one", "and", "zero", "}", "else", "{", "zero", "}"];
        var strArr3 = ["one", "or", "if", "(", "zero", "[==]", "zero", ")", "{", "one", "and", "zero", "}"];


        context('with non-empty string array as argument', function() {

            it('1', function() {
                var res = findConsequent(strArr1, 9);
                assert.isArray(res);
                assert.include(res, 2);
                assert.include(res, "one");
            })
            it('2', function() {
                var res = findConsequent(strArr2, 9);
                assert.isArray(res);
                assert.include(res, 4);
                assert.include(res, "one and zero");
            })
            it('3', function() {
                var res = findConsequent(strArr3, 9);
                assert.isArray(res);
                assert.include(res, 4);
                assert.include(res, "one and zero");
            })
            it('4', function() {
                var res = findConsequent(strArr2, 15);
                assert.isArray(res);
                assert.include(res, 2);
                assert.include(res, "zero");
            })
            it('5', function() {
                var res = findConsequent(["one", "and", "zero"], 0);
                assert.isArray(res);
                assert.include(res, 0);
                assert.include(res, "");
            })
        })

        context('with empty string array as argument', function() {
            it('should return the empty string', function() {
                var res = findConsequent([], 2);
                assert.isArray(res);
                assert.include(res, 0);
                assert.include(res, "");
            })
        })
    })
})
