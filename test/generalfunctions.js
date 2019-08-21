/* test/generalfunctions.js */
import {
    occurrences,
    isNumeric
} from "../src/js/generalfunctions.mjs";

import {
    expect,
    assert
} from "chai";

describe('testing generalfunctions.mjs...', function() {

    describe('occurrences()', function() {

        context('with non-empty arguments', function() {

            it('1', function() {
                var res = occurrences("give one or zero or give else", "give", false);
                assert.isNumber(res);
                expect(res).to.equal(2)
            })

            it('2', function() {
                var res = occurrences("give one or get get get zero or give else get", "get", false);
                assert.isNumber(res);
                expect(res).to.equal(4)
            })

            it('3', function() {
                var res = occurrences("give one or get get get zero or give else get", "truncate", false);
                assert.isNumber(res);
                expect(res).to.equal(0)
            })

            it('4', function() {
                var res = occurrences("give one or get get get zero or give else get truncate ", "truncate", false);
                assert.isNumber(res);
                expect(res).to.equal(1)
            })

            it('5', function() {
                var res = occurrences("truncate give one or get get get zero or give else get ", "truncate", false);
                assert.isNumber(res);
                expect(res).to.equal(1)
            })

            it('6', function() {
                var res = occurrences("truncater give one or get get get zero otruncate or give else get ", " truncate ", false);
                assert.isNumber(res);
                expect(res).to.equal(0)
            })

            it('7', function() {
                var res = occurrences("truncater give one or get get get zero otruncate or give else get ", "truncate", false);
                assert.isNumber(res);
                expect(res).to.equal(2)
            })
        })
    })

    describe('isNumeric()', function() {

        context('with non-empty arguments', function() {

            it('1', function() {
                var res = isNumeric("1");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('2', function() {
                var res = isNumeric("give");
                assert.isBoolean(res);
                expect(res).to.equal(false)
            })
            it('3', function() {
                var res = isNumeric("1.01");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('4', function() {
                var res = isNumeric("0.001");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
            it('5', function() {
                var res = isNumeric("1000");
                assert.isBoolean(res);
                expect(res).to.equal(true)
            })
        })
    })
})
