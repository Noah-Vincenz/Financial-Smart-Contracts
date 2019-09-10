/* test/index.js */
import {
    nonExistingTerm,
    replaceUserDefinitions,
    evaluateConditionals,
    evaluate,
    getHorizon,
    getValue,
    decomposeAnds,
    cleanUpBeforeDecomp,
    extractAllSubHorizons,
    decompose
} from "../src/js/index.mjs";

import {
    expect,
    assert
} from "chai";

describe('testing index.mjs...', function() {

    describe('nonExistingTerm()', function() {
        context('with non-empty string argument', function() {
            it('1', function() {
                var res = nonExistingTerm("andr");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('2', function() {
                var res = nonExistingTerm("and");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('3', function() {
                var res = nonExistingTerm("and ");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('4', function() {
                var res = nonExistingTerm(" and ");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
        })
    })

    describe('replaceUserDefinitions()', function() {
        var map = new Map;
        map.set("andGive", "andGive=and give");
        map.set("zcb", "zcb t x=scaleK x ( get ( truncate t ( one ) ) )");

        context('with non-empty string argument', function() {

            it('1', function() {
                var res = replaceUserDefinitions("zero andGive one", map);
                assert.isString(res);
                expect(res).to.equal("zero and give one")
            })
            it('2', function() {
                var res = replaceUserDefinitions("zero andGive ( one or one )", map);
                assert.isString(res);
                expect(res).to.equal("zero and give ( one or one )")
            })
            it('3', function() {
                var res = replaceUserDefinitions("zero andGiv one", map);
                assert.isString(res);
                expect(res).to.equal("zero andGiv one")
            })
            it('4', function() {
                var res = replaceUserDefinitions("andGive one", map);
                assert.isString(res);
                expect(res).to.equal("and give one")
            })
            it('5', function() {
                var res = replaceUserDefinitions("zcb \"24/12/2017-23:33:33\" 5", map);
                assert.isString(res);
                expect(res).to.equal("scaleK 5 ( get ( truncate \"24/12/2017-23:33:33\" ( one ) ) )")
            })
            it('6', function() {
                var res = replaceUserDefinitions("zcb \"24/12/2017-23:33:33\" 5 andGive ( zero and one )", map);
                assert.isString(res);
                expect(res).to.equal("scaleK 5 ( get ( truncate \"24/12/2017-23:33:33\" ( one ) ) ) and give ( zero and one )")
            })
        })

        context('with empty string argument', function() {
            it('should return the empty string', function() {
                var res = replaceUserDefinitions("", map);
                assert.isString(res);
                expect(res).to.equal("")
            })
        })
    })

    describe('evaluateConditionals()', function() {

        context('with non-empty string argument', function() {
            it('1', function() {
                var res = evaluateConditionals("if ( ( zero [<] one ) && ( ( one [>] one ) || ( zero [==] zero ) ) ) { one } else { zero } and one");
                assert.isString(res);
                expect(res).to.equal("one and one")
            })
            it('2', function() {
                var res = evaluateConditionals("if ( ( zero [<] one ) && ( one [==] one ) ) { one } else { zero } and one");
                assert.isString(res);
                expect(res).to.equal("one and one")
            })
            it('3', function() {
                var res = evaluateConditionals("if ( ( zero [<] one ) && ( one [==] one ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('4', function() {
                var res = evaluateConditionals("zero and ( if ( zero [<] if ( if ( if ( one [>] one ) { zero } else { one } [==] one ) { one } [==] one ) { one } ) { one } or if ( zero [==] zero ) { one } else { zero } )");
                assert.isString(res);
                expect(res).to.equal("zero and ( one or one )")
            })
            it('5', function() {
                var res = evaluateConditionals("zero and ( if ( zero [<] if ( if ( one [==] one ) { one } [==] one ) { one } ) { one } or if ( zero [==] zero ) { one } else { zero } )");
                assert.isString(res);
                expect(res).to.equal("zero and ( one or one )")
            })
            it('6', function() {
                var res = evaluateConditionals("zero and ( if ( zero [<] if ( one [==] one ) { one } ) { one } or if ( zero [==] zero ) { one } else { zero } )");
                assert.isString(res);
                expect(res).to.equal("zero and ( one or one )")
            })
            it('7', function() {
                var res = evaluateConditionals("zero and ( if ( if ( one [==] one ) { zero } [<] one ) { one } or if ( zero [==] zero ) { one } else { zero } )");
                assert.isString(res);
                expect(res).to.equal("zero and ( one or one )")
            })
            it('8', function() {
                var res = evaluateConditionals("zero and ( if ( zero [<] one ) { one } or if ( zero [==] zero ) { one } else { zero } )");
                assert.isString(res);
                expect(res).to.equal("zero and ( one or one )")
            })
            it('9', function() {
                var res = evaluateConditionals("one and if ( ( ( if ( zero [>] one ) { zero } else { one } ) [<] truncate \"24/03/2019-23:33:33\" ( one ) ) || ( zero [<=] one ) ) { zero } else { give ( one ) }");
                assert.isString(res);
                expect(res).to.equal("one and zero")
            })
            it('10', function() {
                var res = evaluateConditionals("if ( ( if ( zero [>] one ) { zero } else { one } [<] truncate \"24/03/2019-23:33:33\" ( one ) ) || ( zero [<=] one ) ) { zero } else { give ( one ) }");
                assert.isString(res);
                expect(res).to.equal("zero")
            })
            it('11', function() {
                var res = evaluateConditionals("if ( ( if ( zero [>] one ) { zero } else { one } [<] truncate \"24/03/2019-23:33:33\" ( one ) ) || ( zero [==] one ) ) { zero } else { give ( one ) }");
                assert.isString(res);
                expect(res).to.equal("give ( one )")
            })
            it('12', function() {
                var res = evaluateConditionals("if ( if ( zero [>] one ) { truncate \"24/03/2019-23:33:33\" ( one ) } and truncate \"24/03/2019-23:33:33\" ( one ) [==] truncate \"25/03/2019-23:33:33\" ( one ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('13', function() {
                var res = evaluateConditionals("if ( zero > one ) { truncate \"24/03/2019-23:33:33\" ( one ) } and ( zero or one )");
                assert.isString(res);
                expect(res).to.equal("( zero or one )")
            })
            it('14', function() {
                var res = evaluateConditionals("( zero or one ) and if ( zero > one ) { truncate \"24/03/2019-23:33:33\" ( one ) }");
                assert.isString(res);
                expect(res).to.equal("( zero or one )")
            })
            it('15', function() {
                var res = evaluateConditionals("if ( zero [==] scaleK 10 ( truncate \"25/03/2019-23:33:33\" ( truncate \"25/03/2020-23:33:33\" ( one ) ) ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('16', function() {
                var res = evaluateConditionals("if ( scaleK 10 one and zero [==] scaleK 10 ( truncate \"25/03/2019-23:33:33\" ( one ) ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("zero")
            })
            it('17', function() {
                var res = evaluateConditionals("if ( scaleK 10 one and zero [==] scaleK 10 ( truncate \"25/03/2020-23:33:33\" ( one ) ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('18', function() {
                var res = evaluateConditionals("if ( if ( zero [<] one ) { truncate \"26/03/2019-23:33:33\" ( one ) } and truncate \"24/03/2020-23:33:33\" ( one ) [>] truncate \"25/03/2019-23:33:33\" ( one ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('19', function() {
                var res = evaluateConditionals("if ( if ( zero [>] one ) { truncate \"26/03/2019-23:33:33\" ( one ) } and truncate \"24/03/2019-23:33:33\" ( one ) [<] truncate \"25/03/2019-23:33:33\" ( one ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("zero")
            })
            it('20', function() {
                var res = evaluateConditionals("if ( truncate \"26/03/2019-23:33:33\" ( one ) and truncate \"24/03/2020-23:33:33\" ( one ) [==] truncate \"25/03/2020-23:33:33\" ( one ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('21', function() {
                var res = evaluateConditionals("if ( if ( zero {>} one ) { truncate \"26/03/2019-23:33:33\" ( one ) } and truncate \"24/03/2019-23:33:33\" ( one ) {<} truncate \"25/03/2019-23:33:33\" ( one ) ) { one } else { zero }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('22', function() {
                var res = evaluateConditionals("if ( ( zero {>} one ) || ( ( one [==] one ) && ( zero [<] one ) ) ) { one }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('23', function() {
                var res = evaluateConditionals("if ( if ( ( zero {>} one ) || ( ( one [==] one ) && ( zero [<] one ) ) ) { one } else { zero } [==] one ) { one }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('24', function() {
                var res = evaluateConditionals("if ( if ( ( zero {>} one ) || ( ( one [==] one ) && ( zero [==] one ) ) ) { one } else { zero } [>=] zero ) { zero }");
                assert.isString(res);
                expect(res).to.equal("zero")
            })
            it('26', function() {
                var res = evaluateConditionals("if ( if ( ( zero {>} one ) || ( ( one [==] one ) && ( zero [==] one ) ) ) { one } else { zero } [==] zero ) { one }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('27', function() {
              var res = evaluateConditionals("if ( if ( ( ( one [==] one ) && ( zero [==] one ) ) || ( ( one [==] one ) && ( zero [<] one ) ) ) { one } else { zero } [>] one ) { zero } else { one }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
            it('28', function() {
                var res = evaluateConditionals("if ( if ( ( ( one [==] one ) && ( zero [<] one ) ) || ( ( one [==] one ) && ( zero [<] one ) ) ) { one } else { zero } [>] one ) { zero } else { one }");
                assert.isString(res);
                expect(res).to.equal("one")
            })
        })
    })

    describe('evaluate()', function() {

        context('with non-empty string argument', function() {

            it('1', function() {
                var res = evaluate("zero", "<", "one");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('2', function() {
                var res = evaluate("zero", "==", "one");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('3', function() {
                var res = evaluate("zero", ">", "one");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('4', function() {
                var res = evaluate("zero", "[>]", "one");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('5', function() {
                var res = evaluate("zero", "[<]", "one");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('6', function() {
                var res = evaluate("zero", "[==]", "one");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('7', function() {
                var res = evaluate("zero", "{==}", "one");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('8', function() {
                var res = evaluate("zero", "{<}", "one");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('9', function() {
                var res = evaluate("zero", "{>}", "one");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('10', function() {
                var res = evaluate("scaleK 10 ( one )", "{>}", "one");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('11', function() {
                var res = evaluate("scaleK 10 ( one )", "[>]", "one");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('12', function() {
                var res = evaluate("scaleK 10 ( one )", ">", "one");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('13', function() {
                var res = evaluate("scaleK 0 ( one )", "[>]", "one");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('14', function() {
                var res = evaluate("scaleK 0 ( one )", "[==]", "zero");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('15', function() {
                var res = evaluate("scaleK 0 ( one )", "{==}", "zero");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('16', function() {
                var res = evaluate("scaleK 0 ( scaleK 10 ( one ) )", "[>]", "zero");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('17', function() {
                var res = evaluate("scaleK 0 ( scaleK 10 ( one ) )", "[==]", "zero");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('18', function() {
                var res = evaluate("scaleK 10 ( scaleK 0 ( one ) )", "[==]", "zero");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('19', function() {
                var res = evaluate("truncate \"20/10/2020-20:20:20\" ( one )", "{<}", "zero");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('20', function() {
                var res = evaluate("truncate \"20/10/2020-20:20:20\" ( one )", "{==}", "truncate \"20/10/2020-20:20:20\" ( zero )");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('21', function() {
                var res = evaluate("truncate \"21/10/2020-20:20:20\" ( one )", "{>}", "truncate \"20/10/2020-20:20:20\" ( zero )");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('22', function() {
                var res = evaluate("( truncate \"20/12/2019-23:33:33\" ( one ) and truncate \"24/12/2019-23:33:33\" ( zero ) )", ">", "truncate \"24/12/2019-23:33:33\" ( one )");
                assert.isBoolean(res);
                expect(res).to.equal(false);
            })
            it('23', function() {
                var res = evaluate("( truncate \"23/12/2017-23:33:33\" ( one ) and truncate \"26/12/2017-23:33:33\" ( one ) )", ">", "truncate \"24/12/2017-23:33:33\" ( one )");
                assert.isBoolean(res);
                expect(res).to.equal(true);
            })
            it('24', function() {
                var res = evaluate("( truncate \"24/12/2019-23:33:33\" ( one ) and truncate \"26/12/2019-23:33:33\" ( one ) )", ">", "truncate \"24/12/2019-23:33:33\" ( one )");
                assert.isBoolean(res);
                expect(res).to.equal(true);
            })
            it('25', function() {
                var res = evaluate("( truncate \"20/12/2017-23:33:33\" ( one ) and truncate \"24/12/2017-23:33:33\" ( zero ) )", "==", "truncate \"24/12/2017-23:33:33\" ( one )");
                assert.isBoolean(res);
                expect(res).to.equal(false);
            })
            it('26', function() {
                var res = evaluate("( truncate \"20/12/2017-23:33:33\" ( zero ) and truncate \"24/12/2017-23:33:33\" ( one ) )", "==", "truncate \"24/12/2017-23:33:33\" ( one )");
                assert.isBoolean(res);
                expect(res).to.equal(true);
            })
            it('27', function() {
                var res = evaluate("zero", "[<=]", "one");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('28', function() {
                var res = evaluate("zero", "{>=}", "one");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
        })
    })

    describe('getHorizon()', function() {

        context('with non-empty contract strings as arguments', function() {

            it('1', function() {
                var res = getHorizon("truncate \"24/01/2019-23:33:33\" ( one )");
                assert.isString(res);
                expect(res).to.equal("24/01/2019-23:33:33")
            })
            it('2', function() {
                var res = getHorizon("truncate \"24/01/2019-23:33:33\" ( truncate \"25/01/2019-23:33:33\" ( one ) )");
                assert.isString(res);
                expect(res).to.equal("24/01/2019-23:33:33")
            })
            it('3', function() {
                var res = getHorizon("truncate \"24/01/2019-23:33:33\" ( truncate \"23/01/2019-23:33:33\" ( one ) )");
                assert.isString(res);
                expect(res).to.equal("23/01/2019-23:33:33")
            })
            it('4', function() {
                var res = getHorizon("truncate \"17/08/2019-20:33:33\" ( one and truncate \"18/08/2019-20:33:33\" ( one ) )");
                assert.isString(res);
                expect(res).to.equal("17/08/2019-20:33:33")
            })
            it('5', function() {
                var res = getHorizon("truncate \"17/08/2019-20:33:33\" ( one and truncate \"16/08/2019-20:33:33\" ( one ) )");
                assert.isString(res);
                expect(res).to.equal("17/08/2019-20:33:33")
            })
            it('6', function() {
                var res = getHorizon("truncate \"17/08/2019-20:33:33\" ( one ) or truncate \"16/08/2019-20:33:33\" ( one )");
                assert.isString(res);
                expect(res).to.equal("17/08/2019-20:33:33")
            })
            it('7', function() {
                var res = getHorizon("truncate \"17/08/2019-20:33:33\" ( one ) or one");
                assert.isString(res);
                expect(res).to.equal("infinite")
            })
            it('8', function() {
                var res = getHorizon("one or truncate \"17/08/2019-20:33:33\" ( one )");
                assert.isString(res);
                expect(res).to.equal("infinite")
            })
            it('9', function() {
                var res = getHorizon("\"17/08/2019-20:33:33\" ( one ) or ( truncate \"17/08/2019-20:33:33\" ( one ) or one )");
                assert.isString(res);
                expect(res).to.equal("infinite")
            })
            it('10', function() {
                var res = getHorizon("truncate \"17/08/2019-20:33:33\" ( one or zero )");
                assert.isString(res);
                expect(res).to.equal("17/08/2019-20:33:33")
            })
            it('11', function() {
                var res = getHorizon("truncate \"17/08/2019-20:33:33\" ( one or zero ) and zero");
                assert.isString(res);
                expect(res).to.equal("infinite")
            })
        })

        context('with empty contract string as argument', function() {

            it('1', function() {
                var res = getHorizon("");
                assert.isString(res);
                expect(res).to.equal("infinite")
            })
        })
    })

    describe('getValue()', function() {

        context('with non-empty contract string and empty horizonToCheck as argument', function() {

            it('1', function() {
                var res = getValue("one", "");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
            it('2', function() {
                var res = getValue("zero", "");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('3', function() {
                var res = getValue("one and zero", "");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
            it('4', function() {
                var res = getValue("one and one", "");
                assert.isNumber(res);
                expect(res).to.equal(2)
            })
            it('5', function() {
                var res = getValue("one or zero", "");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
            it('6', function() {
                var res = getValue("one or one", "");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
            it('7', function() {
                var res = getValue("scaleK 10 ( one )", "");
                assert.isNumber(res);
                expect(res).to.equal(10)
            })
            it('8', function() {
                var res = getValue("scaleK 10 ( zero )", "");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('9', function() {
                var res = getValue("scaleK 10 ( one and one )", "");
                assert.isNumber(res);
                expect(res).to.equal(20)
            })
            it('10', function() {
                var res = getValue("scaleK 10 ( one and zero )", "");
                assert.isNumber(res);
                expect(res).to.equal(10)
            })
            it('11', function() {
                var res = getValue("scaleK 10 ( one and scaleK 10 ( one ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(110)
            })
            it('12', function() {
              var res = getValue("scaleK 10 ( one or scaleK 10 ( one ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(100)
            })
            it('13', function() {
                var res = getValue("scaleK 10 ( one ) or one", "");
                assert.isNumber(res);
                expect(res).to.equal(10)
            })
            it('14', function() {
                var res = getValue("get ( truncate \"17/08/2019-20:33:33\" ( one ) )", "17/08/2019-20:33:33");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
            it('15', function() {
                var res = getValue("get ( truncate \"16/08/2019-23:33:33\" ( one ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('16', function() {
                var res = getValue("get ( truncate \"18/08/2019-23:33:33\" ( one ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('17', function() {
                var res = getValue("scaleK 10 ( one and one )", "");
                assert.isNumber(res);
                expect(res).to.equal(20)
            })
            it('18', function() {
                var res = getValue("scaleK 10 ( one and give ( one ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('19', function() {
                var res = getValue("give ( scaleK 10 ( one and give ( one ) ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('20', function() {
                var res = getValue("give ( scaleK 10 ( one and one ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(-20)
            })
            it('21', function() {
                var res = getValue("( one or zero ) and ( scaleK 10 ( one ) and zero )", "");
                assert.isNumber(res);
                expect(res).to.equal(11)
            })
            it('22', function() {
                var res = getValue("one or ( zero and ( scaleK 10 ( one ) and zero ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(10)
            })
            it('23', function() {
                var res = getValue("( one or ( zero and scaleK 10 ( one ) ) ) and zero", "");
                assert.isNumber(res);
                expect(res).to.equal(10)
            })
            it('24', function() {
                var res = getValue("( one or ( one and scaleK 10 ( one ) ) ) and one", "");
                assert.isNumber(res);
                expect(res).to.equal(12)
            })
            it('25', function() {
                var res = getValue("( one and ( scaleK 10 ( one ) and one ) )", "");
                assert.isNumber(res);
                expect(res).to.equal(12)
            })
            it('26', function() {
                var res = getValue("( one or ( one and scaleK 10 ( one ) ) ) and truncate \"24/12/2017-23:33:33\" ( one )", "");
                assert.isNumber(res);
                expect(res).to.equal(11)
            })
        })

        context('with non-empty contract string and non-empty horizonToCheck as argument', function() {
            it('1', function() {
                var res = getValue("scaleK 100 ( get ( truncate \"18/08/2019-23:33:33\" ( one ) ) )", "18/08/2019-23:33:33");
                assert.isNumber(res);
                expect(res).to.equal(100)
            })
            it('2', function() {
                var res = getValue("scaleK 100 ( get ( truncate \"18/08/2019-23:33:33\" ( one ) ) )", "19/08/2019-23:33:33");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('3', function() {
                var res = getValue("get ( truncate \"18/08/2019-23:33:33\" ( one ) )", "19/08/2019-23:33:33");
                assert.isNumber(res);
                expect(res).to.equal(0)
            })
            it('4', function() {
                var res = getValue("get ( truncate \"18/08/2019-23:33:33\" ( one ) )", "18/08/2019-23:33:33");
                assert.isNumber(res);
                expect(res).to.equal(1)
            })
        })

    })

    describe('decomposeAnds()', function() {

        context('with non-empty contract string as argument', function() {

            it('1', function() {
                var res = decomposeAnds("one and zero");
                assert.isArray(res);
                assert.lengthOf(res, 2);
                assert.include(res, "one");
                assert.include(res, "zero");
            })
            it('2', function() {
                var res = decomposeAnds("one and ( zero and one )");
                assert.isArray(res);
                assert.lengthOf(res, 3);
                assert.include(res, "one");
                assert.include(res, "zero");
                assert.sameMembers(res, ["one", "zero", "one"]);
            })
            it('3', function() {
                var res = decomposeAnds("one and scaleK 10 ( zero and one )");
                assert.isArray(res);
                assert.lengthOf(res, 3);
                assert.include(res, "one");
                assert.notInclude(res, "zero");
                assert.sameMembers(res, ["one", "scaleK 10 ( zero )", "scaleK 10 ( one )"]);
            })
            it('4', function() {
                var res = decomposeAnds("one and scaleK 10 ( zero and give ( scaleK 5 ( one ) and zero ) )");
                assert.isArray(res);
                assert.lengthOf(res, 4);
                assert.include(res, "one");
                assert.notInclude(res, "zero");
                assert.sameMembers(res, ["one", "scaleK 10 ( zero )", "scaleK 10 ( give ( scaleK 5 ( one ) ) )", "scaleK 10 ( give ( zero ) )"]);
            })
        })

        context('with empty contract string as argument', function() {

            it('1', function() {
                var res = decomposeAnds("");
                assert.isArray(res);
                assert.isEmpty(res);
            })
        })

    })

    describe('cleanUpBeforeDecomp()', function() {

        context('with non-empty contract string as argument', function() {

            it('1', function() {
                var res = cleanUpBeforeDecomp("\"12/12/2019 15:15:22\"  one");
                assert.isString(res);
                expect(res).to.equal("\"12/12/2019-15:15:22\" one")
            })
            it('2', function() {
                var res = cleanUpBeforeDecomp("one  and   zero");
                assert.isString(res);
                expect(res).to.equal("one and zero")
            })
            it('3', function() {
                var res = cleanUpBeforeDecomp("  \"12/12/2019 15:15:22\" zero   ");
                assert.isString(res);
                expect(res).to.equal("\"12/12/2019-15:15:22\" zero")
            })
            it('4', function() {
                var res = cleanUpBeforeDecomp("one and   \"12/12/2019 15:15:22\"\n");
                assert.isString(res);
                expect(res).to.equal("one and \"12/12/2019-15:15:22\"")
            })
            it('5', function() {
                var res = cleanUpBeforeDecomp("(one and zero)()\"12/12/2019 15:15:22\"  ");
                assert.isString(res);
                expect(res).to.equal("( one and zero ) ( ) \"12/12/2019-15:15:22\"")
            })
        })
    })

    describe('extractAllSubHorizons()', function() {

        context('with non-empty contract strings as arguments', function() {

            it('1', function() {
                var res = extractAllSubHorizons("truncate \"24/01/2019-23:33:33\" ( one )", "one", ">=");
                assert.typeOf(res, 'set');
                assert.include(res, "24/01/2019-23:33:33");
            })
            it('2', function() {
                var res = extractAllSubHorizons("truncate \"24/01/2019-23:33:33\" ( one ) and truncate \"25/01/2019-23:33:33\" ( one )", "one", ">=");
                assert.typeOf(res, 'set');
                assert.include(res, "24/01/2019-23:33:33");
                assert.include(res, "25/01/2019-23:33:33");
            })
            it('3', function() {
                var res = extractAllSubHorizons("truncate \"24/01/2019-23:33:33\" ( one ) and truncate \"26/01/2019-23:33:33\" ( one )", "truncate \"27/01/2019-23:33:33\" ( one )", ">=");
                assert.typeOf(res, 'set');
                assert.include(res, "24/01/2019-23:33:33");
                assert.include(res, "26/01/2019-23:33:33");
                assert.include(res, "27/01/2019-23:33:33");
            })
            it('4', function() {
                var res = extractAllSubHorizons("truncate \"24/01/2019-23:33:33\" ( one ) and truncate \"26/01/2019-23:33:33\" ( one )", "truncate \"25/01/2019-23:33:33\" ( one )", ">=");
                assert.typeOf(res, 'set');
                assert.include(res, "24/01/2019-23:33:33");
                assert.include(res, "25/01/2019-23:33:33");
                assert.notInclude(res, "26/01/2019-23:33:33");
            })
        })
    })

    describe('decompose()', function() {
        // Output format: [first part, second part, most balanced conj, stringToAddToBeginning, stringToAddToEnd]

        context('with a non-empty contract string as argument', function() {
            it('1', function() {
                var res = decompose("one or zero".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["one", "zero", "or", "", ""]);
            })

            it('2', function() {
                var res = decompose("one and zero".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["one", "zero", "and", "", ""]);
            })

            it('3', function() {
                var res = decompose("one and ( zero or one )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["one", "( zero or one )", "and", "", ""]);
            })

            it('4', function() {
                var res = decompose("( one and zero ) or one".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["( one and zero )", "one", "or", "", ""]);
            })

            it('5', function() {
                var res = decompose("give ( one and zero )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["give ( one )", "give ( zero )", "and", "", ""]);
            })

            it('6', function() {
                var res = decompose("give ( one and zero ) and one".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["give ( one and zero )", "one", "and", "", ""]);
            })

            it('7', function() {
                var res = decompose("give ( one and zero ) or one".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["give ( one and zero )", "one", "or", "", ""]);
            })

            it('8', function() {
                var res = decompose("( truncate \"24/12/2019-23:33:33\" ( give one and ( one and zero ) ) ) and one".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["( truncate \"24/12/2019-23:33:33\" ( give one and ( one and zero ) ) )", "one", "and", "", ""]);
            })

            it('9', function() {
                var res = decompose("( truncate \"24/12/2019-23:33:33\" ( give one and ( one and zero ) ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["truncate \"24/12/2019-23:33:33\" ( give one )", "truncate \"24/12/2019-23:33:33\" ( one and zero )", "and", "", ""]);
            })

            it('10', function() {
                var res = decompose("truncate \"24/12/2019-23:33:33\" ( one and zero )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["truncate \"24/12/2019-23:33:33\" ( one )", "truncate \"24/12/2019-23:33:33\" ( zero )", "and", "", ""]);
            })

            it('11', function() {
                var res = decompose("( truncate \"24/12/2019-23:33:33\" ( give ( one ) and ( one and zero ) ) ) and ( one and scaleK 10 ( one and zero ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["truncate \"24/12/2019-23:33:33\" ( give ( one ) and ( one and zero ) )", "one and scaleK 10 ( one and zero )", "and", "", ""]);
            })

            it('12', function() {
                var res = decompose("( truncate \"24/12/2019-23:33:33\" ( give ( one ) and ( one and zero ) ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["truncate \"24/12/2019-23:33:33\" ( give ( one ) )", "truncate \"24/12/2019-23:33:33\" ( one and zero )", "and", "", ""]);
            })

            it('13', function() {
                var res = decompose("( one and scaleK 10 ( one and zero ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["one", "scaleK 10 ( one and zero )", "and", "", ""]);
            })

            it('14', function() {
                var res = decompose("scaleK 10 ( one and zero )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["scaleK 10 ( one )", "scaleK 10 ( zero )", "and", "", ""]);
            })

            it('15', function() {
                var res = decompose("truncate \"24/12/2019-23:33:33\" ( scaleK 10 ( one ) and ( scaleK 7 ( one and zero ) ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["truncate \"24/12/2019-23:33:33\" ( scaleK 10 ( one ) )", "truncate \"24/12/2019-23:33:33\" ( scaleK 7 ( one and zero ) )", "and", "", ""]);
            })

            it('16', function() {
                var res = decompose("( give ( zero ) or give ( one ) ) and one".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["( give ( zero ) or give ( one ) )", "one", "and", "", ""]);
            })

            it('17', function() {
                var res = decompose("( give ( zero ) or give ( one ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["give ( zero )", "give ( one )", "or", "", ""]);
            })

            it('18', function() {
                var res = decompose("truncate \"24/12/2019-23:33:33\" ( scaleK 10 ( one or zero ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["one", "zero", "or", "truncate \"24/12/2019-23:33:33\" ( scaleK 10 ( ", " ) )"]);
            })

            it('19', function() {
                var res = decompose("give ( one and scaleK 5 ( one or zero ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["give ( one )", "give ( scaleK 5 ( one or zero ) )", "and", "", ""]);
            })

            it('20', function() {
                var res = decompose("( give ( zero ) or give ( one ) ) and ( one or zero )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["give ( zero ) or give ( one )", "one or zero", "and", "", ""]);
            })

            it('21', function() {
                var res = decompose("( one or zero )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["one", "zero", "or", "", ""]);
            })

            it('22', function() {
                var res = decompose("( give ( zero ) or give ( one ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["give ( zero )", "give ( one )", "or", "", ""]);
            })

            it('23', function() {
                var res = decompose("( scaleK 50 ( get ( truncate \"24/12/2019-23:33:33\" ( give ( one ) ) ) ) ) or ( zero or truncate \"11/07/2019-23:53:00\" ( give ( one ) ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["scaleK 50 ( get ( truncate \"24/12/2019-23:33:33\" ( give ( one ) ) ) )", "zero or truncate \"11/07/2019-23:53:00\" ( give ( one ) )", "or", "", ""]);
            })

            it('24', function() {
                var res = decompose("( zero or truncate \"11/07/2019-23:53:00\" ( give ( one ) ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["zero", "truncate \"11/07/2019-23:53:00\" ( give ( one ) )", "or", "", ""]);
            })

            it('25', function() {
                var res = decompose("( scaleK 101 ( get ( truncate \"24/01/2019-23:33:33\" ( one ) ) ) and scaleK 102 ( get ( truncate \"24/02/2019-23:33:33\" ( give ( one ) ) ) ) ) or ( ( scaleK 103 ( get ( truncate \"24/03/2019-23:33:33\" ( one ) ) ) and scaleK 104 ( get ( truncate \"24/04/2019-23:33:33\" ( give ( one ) ) ) ) ) or ( scaleK 105 ( get ( truncate \"24/05/2019-23:33:33\" ( one ) ) ) and scaleK 106 ( get ( truncate \"24/06/2019-23:33:33\" ( give ( one ) ) ) ) ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["scaleK 101 ( get ( truncate \"24/01/2019-23:33:33\" ( one ) ) ) and scaleK 102 ( get ( truncate \"24/02/2019-23:33:33\" ( give ( one ) ) ) )", "( scaleK 103 ( get ( truncate \"24/03/2019-23:33:33\" ( one ) ) ) and scaleK 104 ( get ( truncate \"24/04/2019-23:33:33\" ( give ( one ) ) ) ) ) or ( scaleK 105 ( get ( truncate \"24/05/2019-23:33:33\" ( one ) ) ) and scaleK 106 ( get ( truncate \"24/06/2019-23:33:33\" ( give ( one ) ) ) ) )", "or", "", ""]);
            })

            it('26', function() {
                var res = decompose("( scaleK 103 ( get ( truncate \"24/03/2019-23:33:33\" ( one ) ) ) and scaleK 104 ( get ( truncate \"24/04/2019-23:33:33\" ( give ( one ) ) ) ) ) or ( scaleK 105 ( get ( truncate \"24/05/2019-23:33:33\" ( one ) ) ) and scaleK 106 ( get ( truncate \"24/06/2019-23:33:33\" ( give ( one ) ) ) ) )".split(" "));
                assert.isArray(res);
                assert.lengthOf(res, 5);
                assert.sameMembers(res, ["scaleK 103 ( get ( truncate \"24/03/2019-23:33:33\" ( one ) ) ) and scaleK 104 ( get ( truncate \"24/04/2019-23:33:33\" ( give ( one ) ) ) )", "scaleK 105 ( get ( truncate \"24/05/2019-23:33:33\" ( one ) ) ) and scaleK 106 ( get ( truncate \"24/06/2019-23:33:33\" ( give ( one ) ) ) )", "or", "", ""]);
            })
        })
    })
})
