/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */
var oracleArr = [];

export class Oracle {

    constructor(address) {
        this.address = address;
    }

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
            default:
              // code block
        }
    }

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
            default:
              // code block
        }
    }
}

export function createOracles() {
    const o1 = new Oracle("0x8ce40d9956e7b8a89a1d73f4d4850c760ea20a56");
    const o2 = new Oracle("0xc90bc8ff4387fe14cdd0934ef9935be590cb83ca");
    const o3 = new Oracle("0xa03cbbea9891d7961ed23fd965b6ad3109c36a30");
    oracleArr = [o1, o2, o3];
}

export function getOracleByAddress(address) {
    for (var i = 0; i < oracleArr.length; ++i) {
        if (oracleArr[i].address === address) {
            return oracleArr[i];
        }
    }
}
