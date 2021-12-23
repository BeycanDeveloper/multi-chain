const Web3Utils = require('web3-utils');
const BigNumber = require('bignumber.js');
const abiDecoder = require('abi-decoder');
const ABI = require('../resources/abi.json');
abiDecoder.addABI(ABI);

class Utils {

    /**
     * @param value
     * @returns {String}
     */
    static hex(value) {
        return Web3Utils.toHex(value);
    }

    /**
     * @param {Float} amount 
     * @param {Integer} decimals 
     * @returns {String}
     */
    static toHex(amount, decimals) {
        let length = '1' + '0'.repeat(decimals);
        let value = new BigNumber(amount.toString(10), 10).times(length);
        return Web3Utils.toHex(value.toString(10));

    }

    /**
     * @param {Float} amount 
     * @param {Integer} decimals 
     * @returns {Float}
     */
    static toDec(amount, decimals) {
        let length = '1' + '0'.repeat(decimals);
        let value = new BigNumber(amount.toString(10), 10).dividedBy(length);
        return parseFloat(value.toString(10));
    }

    static validateMultiChain(multiChain) {
        if (!multiChain) {
            throw new Error('The MultiChain parameter is required please send a MultiChain sample!');
        }

        if (!multiChain.connectedAccount) {
            throw new Error("No linked wallet found, please link first.");
        }
        
        if (Object.keys(multiChain.activeChain).length == 0) {
            throw new Error('No active chain was found, please select a chain first.');
        }
    }

    /**
     * @param {String} input
     * @return {Object}
     */
    static abiDecoder(input) {
        return abiDecoder.decodeMethod(input);
    }

    /**
     * @param {String|Number} val
     * @return {Boolean}
     */
    static isNumeric(val) {
        if (typeof val != "string") return true;
        return isNaN(val) && isNaN(parseFloat(val));
    }

    /**
     * @param {String} address
     * @return {Boolean}
     */
    static isAddress(address) {
        return Web3Utils.isAddress(address);
    }
}

module.exports = Utils;