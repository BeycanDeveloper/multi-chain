const Utils = require('./Utils');
const MultiChain = require('./MultiChain');

class Coin {

    /**
     * @var {Object} 
     */
    symbol;

    /**
     * @var {String} 
     */
    decimals;

    /**
     * @var {MultiChain} 
     */
    multiChain;

    /**
     * @param {MultiChain} multiChain 
     * @throws {Error}
     */
    constructor(multiChain) {
        Utils.validateMultiChain(multiChain);

        let nativeCurrency = multiChain.activeChain.nativeCurrency;
        this.decimals = nativeCurrency.decimals;
        this.symbol = nativeCurrency.symbol;

        this.multiChain = multiChain;
    }

    
    /**
     * @param {String} address
     * @returns {Float}
     */
    async getBalance(address) {
        let balance = await this.multiChain.provider.request({
            method: 'eth_getBalance', 
            params: [address, 'latest']
        });
        return parseFloat((parseInt(balance) / 10**this.decimals).toFixed(6));
    }

    /**
     * @param {String} to 
     * @param {Float|Integer} amount 
     * @returns {String|Object}
     */
    transfer(to, amount) {
        return new Promise(async (resolve, reject) => {

            if (parseFloat(amount) > await this.getBalance(this.multiChain.connectedAccount)) {
                return reject('insufficient-balance');
            }

            this.multiChain.provider.request({
                method: 'eth_sendTransaction',
                params: [{
                    to,
                    from: this.multiChain.connectedAccount,
                    value: Utils.toHex(amount, this.decimals)
                }],
            })
            .then((transactionId) => {
                resolve(transactionId);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * @returns {String}
     */
    getSymbol() {
        return this.symbol;
    }

    /**
     * @returns {Integer}
     */
    getDecimals() {
        return this.decimals;
    }
}

module.exports = Coin;