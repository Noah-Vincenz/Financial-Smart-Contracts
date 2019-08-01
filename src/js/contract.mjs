/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

/* jshint esversion: 6 */

export class Contract {
    constructor(id, amount, recipient, contractString, meaningOfContractString, horizonDate, toBeExecutedAtHorizon, status) {
        this.id = id;
        this.amount = amount;
        this.recipient = recipient;
        this.contractString = contractString;
        this.meaningOfContractString = meaningOfContractString;
        this.horizonDate = horizonDate;
        this.toBeExecutedAtHorizon = toBeExecutedAtHorizon;
        this.status = status;
    }
}

export function translateContract(recipient, amount, horizonDate, acquireAtHorizon) {
    var to = " owner ";
    var from = " counter-party ";
    var hDate = "";
    if (recipient === 1) {
        to = " counter-party ";
        from = " owner ";
    }
    if (horizonDate !== "infinite") {
        if (acquireAtHorizon === "yes") {
            hDate = " at " + horizonDate;
        } else {
            hDate = " before " + horizonDate;
        }
    }
    var adj = " is";
    if (parseFloat(amount) !== 1) {
        if (parseFloat(amount) === 0) {
            adj = " are";
        } else {
            adj = "s are";
        }
    }
    return amount + " Ether" + adj + " transferred from the " + from + " address to the " + to + " address" + hDate + ".";
}
