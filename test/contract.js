/* test/contract.js */
import {
    translateContract,
    createNewContractString
} from "../src/js/contract.mjs";

import {
    expect,
    assert
} from "chai";

describe('testing contract.mjs...', function() {

    describe('translateContract()', function() {
        context('with non-empty arguments', function() {
            it('1', function() {
                var res = translateContract(1, "3", [], "20/10/2020-20:20:20", "no");
                assert.isString(res);
                expect(res).to.equal("3 Ethers are transferred from the holder address to the counter-party address before 20/10/2020-20:20:20.");
            })
            it('2', function() {
                var res = translateContract(1, "3", ["libor3m"], "20/10/2020-20:20:20", "no");
                assert.isString(res);
                expect(res).to.equal("3xlibor3m Ethers are transferred from the holder address to the counter-party address before 20/10/2020-20:20:20.");
            })
            it('3', function() {
                var res = translateContract(1, "3", ["libor3m", "tempInLondon"], "20/10/2020-20:20:20", "no");
                assert.isString(res);
                expect(res).to.equal("3xlibor3mxtempInLondon Ethers are transferred from the holder address to the counter-party address before 20/10/2020-20:20:20.");
            })
            it('4', function() {
                var res = translateContract(1, "0", ["libor3m", "tempInLondon"], "20/10/2020-20:20:20", "no");
                assert.isString(res);
                expect(res).to.equal("0 Ether are transferred from the holder address to the counter-party address before 20/10/2020-20:20:20.");
            })
            it('5', function() {
                var res = translateContract(1, "1", ["libor3m", "tempInLondon"], "20/10/2020-20:20:20", "no");
                assert.isString(res);
                expect(res).to.equal("1xlibor3mxtempInLondon Ethers are transferred from the holder address to the counter-party address before 20/10/2020-20:20:20.");
            })
            it('6', function() {
                var res = translateContract(0, "1", [], "20/10/2020-20:20:20", "no");
                assert.isString(res);
                expect(res).to.equal("1 Ether is transferred from the counter-party address to the holder address before 20/10/2020-20:20:20.");
            })
            it('7', function() {
                var res = translateContract(0, "1", [], "20/10/2020-20:20:20", "yes");
                assert.isString(res);
                expect(res).to.equal("1 Ether is transferred from the counter-party address to the holder address at 20/10/2020-20:20:20.");
            })
            it('8', function() {
                var res = translateContract(0, "1", [], "infinite", "yes");
                assert.isString(res);
                expect(res).to.equal("1 Ether is transferred from the counter-party address to the holder address.");
            })
        })
    })

    describe('createNewContractString()', function() {

        context('with non-empty arguments', function() {

            it('1', function() {
                var res = createNewContractString("0", [], 0, "\"12/12/2019-20:20:20\"", "no");
                assert.isString(res);
                expect(res).to.equal("truncate \"12/12/2019-20:20:20\" ( zero )")
            })

            it('2', function() {
                var res = createNewContractString("10", [], 0, "\"12/12/2019-20:20:20\"", "no");
                assert.isString(res);
                expect(res).to.equal("truncate \"12/12/2019-20:20:20\" ( scaleK 10 ( one ) )")
            })

            it('3', function() {
                var res = createNewContractString("1", [], 0, "\"12/12/2019-20:20:20\"", "no");
                assert.isString(res);
                expect(res).to.equal("truncate \"12/12/2019-20:20:20\" ( one )")
            })

            it('4', function() {
                var res = createNewContractString("1", [], 0, "\"12/12/2019-20:20:20\"", "yes");
                assert.isString(res);
                expect(res).to.equal("get ( truncate \"12/12/2019-20:20:20\" ( one ) )")
            })

            it('5', function() {
                var res = createNewContractString("1", [], 0, "infinite", "no");
                assert.isString(res);
                expect(res).to.equal("one")
            })

            it('6', function() {
                var res = createNewContractString("1", [], 1, "infinite", "no");
                assert.isString(res);
                expect(res).to.equal("give ( one )")
            })

            it('7', function() {
                var res = createNewContractString("100", [], 1, "infinite", "no");
                assert.isString(res);
                expect(res).to.equal("give ( scaleK 100 ( one ) )")
            })

            it('8', function() {
                var res = createNewContractString("0", [], 1, "infinite", "no");
                assert.isString(res);
                expect(res).to.equal("give ( zero )")
            })

            it('9', function() {
                var res = createNewContractString("0", [], 1, "\"12/12/2019-20:20:20\"", "yes");
                assert.isString(res);
                expect(res).to.equal("get ( give ( truncate \"12/12/2019-20:20:20\" ( zero ) ) )")
            })

            it('10', function() {
                var res = createNewContractString("12.5", [], 1, "\"12/12/2019-20:20:20\"", "yes");
                assert.isString(res);
                expect(res).to.equal("get ( give ( truncate \"12/12/2019-20:20:20\" ( scaleK 12.5 ( one ) ) ) )")
            })
        })
    })
})
