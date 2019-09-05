/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

var oracleArr = [];

/**
 * This class defines an Oracle. Every Oracle possesses a unique address and acts as a provider of any observable values for the parties of a contract.
 */
export class Oracle {

    // class constructor
    constructor(address) {
        this.address = address;
    }

    /**
     * Used to return the value of the tempInLondon observable
     */
    getTempInLondon() {
        switch(this.address) {
            case "0x8ce40d9956e7b8a89a1d73f4d4850c760ea20a56":
                return 23;
                break;
            case "0xc90bc8ff4387fe14cdd0934ef9935be590cb83ca":
                return 25;
                break;
            case "0xa03cbbea9891d7961ed23fd965b6ad3109c36a30":
                return 22;
                break;
            case "0x90a3coyea9891d7961edo78h96b6ad3109c3659b":
                return 24;
                break;
            case "0xa89fbjs0033nkkklizqp04bj4jb5bjxxk4nb33n4":
                return 22;
                break;
            default:
              // code block
        }
    }

    /**
     * Used to return the value of the libor3m observable
     */
    getLiborSpotRate() {
        switch(this.address) {
            case "0x8ce40d9956e7b8a89a1d73f4d4850c760ea20a56":
                return 2.26563;
                break;
            case "0xc90bc8ff4387fe14cdd0934ef9935be590cb83ca":
                return 2.25634;
                break;
            case "0xa03cbbea9891d7961ed23fd965b6ad3109c36a30":
                return 2.26551;
                break;
            case "0x90a3coyea9891d7961edo78h96b6ad3109c3659b":
                return 2.25555;
                break;
            case "0xa89fbjs0033nkkklizqp04bj4jb5bjxxk4nb33n4":
                return 2.25420;
                break;
            default:
              // code block
        }
    }
}

/**
 * This is used to create and instantiate a set of Oracle objects.
 */
export function createOracles() {
    const o1 = new Oracle("0x8ce40d9956e7b8a89a1d73f4d4850c760ea20a56");
    const o2 = new Oracle("0xc90bc8ff4387fe14cdd0934ef9935be590cb83ca");
    const o3 = new Oracle("0xa03cbbea9891d7961ed23fd965b6ad3109c36a30");
    const o4 = new Oracle("0x90a3coyea9891d7961edo78h96b6ad3109c3659b");
    const o5 = new Oracle("0xa89fbjs0033nkkklizqp04bj4jb5bjxxk4nb33n4");
    oracleArr = [o1, o2, o3, o4, o5];
}

/**
 * Used to retrieve an Oracle object by address.
 * @param {string} address - The address of the requested Oracle.
 * @returns {Oracle} The requested Oracle object.
 */
export function getOracleByAddress(address) {
    for (var i = 0; i < oracleArr.length; ++i) {
        if (oracleArr[i].address === address) {
            return oracleArr[i];
        }
    }
}
