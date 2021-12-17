const Web3Utils = require('web3-utils');
const BigNumber = require('bignumber.js');
const abiDecoder = require('abi-decoder');
const ABI = require('../resources/abi.json');
abiDecoder.addABI(ABI);

class Utils {

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
}

module.exports = Utils;