const Coin = require('./Coin');
const Token = require('./Token');
const Utils = require('./Utils');
const Web3Utils = require('web3-utils');
const MultiChain = require('./MultiChain');

class Transaction {

    /**
     * @var {MultiChain} 
     */
    multiChain;

    /**
     * @var {String} 
     */
    id;

    /**
     * @var {Object} 
     */
    data;

    /**
     * @param {String} transactionId 
     * @param {MultiChain} multiChain 
     */
    constructor(transactionId, multiChain) {
        Utils.validateMultiChain(multiChain);

        this.multiChain = multiChain;
        this.id = transactionId;

        this.getDataFromExplorer();
    }

    async getDataFromExplorer() {
        try {
            this.data = await this.multiChain.provider.request({
                method: 'eth_getTransactionByHash',
                params: [this.id]
            });
        } catch (error) {
            throw new Error('There was a problem retrieving transaction data!');
        }
    }

    /**
     * @returns {String}
     */
    getId() {
        return this.id;
    }

    /**
     * @returns {Object}
     */
    getData() {
        return this.data;
    }

    /**
     * @returns {Object}
     */
    decodeInput() {
        if (this.data.input != '0x') {
            let decodedInput = abiDecoder.decodeMethod(this.data.input);
            let receiver = decodedInput.params[0].value;
            let amount = decodedInput.params[1].value;
            return { receiver, amount };
        } else {
            return null;
        }
    }

    /**
     * @param {String} tokenAddress 
     * @param {Integer} timer 
     * @returns {String|Object}
     */
    verify(tokenAddress = null, timer = 1) {
        
        if (tokenAddress && Web3Utils.isAddress(to) === false) {
            throw new Error('Invalid receiver address!');
        }

        return new Promise((resolve, reject) => {
            let checkerInterval = setInterval(async () => {
                try {

                    await this.getDataFromExplorer();

                    let result = null;

                    if (this.data == null) {
                        result = 'failed';
                    } else {
                        if (this.data.blockNumber !== null) {
                            if (tokenAddress && this.data.input == '0x') {
                                result = 'failed';
                            } else if (!tokenAddress && this.data.value == '0x0') {
                                result = 'failed';
                            } else {
                                result = 'verified';
                            }
                        }
                    }
    
                    if (typeof result == 'string') {
                        clearInterval(checkerInterval);
                        if (result == 'verified') {
                            resolve('verified');
                        } else if (result == 'failed') {
                            reject('failed');
                        }
                    }
    
                } catch (error) {
                    clearInterval(checkerInterval);
                    reject(error);
                }
            }, (timer*1000));
        });
    }

    /**
     * @param {String} receiver
     * @param {Integer} amount
     * @param {String|null} tokenAddress
     * @returns {String}
     */
    async verifyData(receiver, amount, tokenAddress = null) {
        receiver = receiver.toLowerCase();
        if (!tokenAddress) {

            let data = {
                receiver: this.data.to.toLowerCase(),
                amount: Utils.toDec(this.data.value, (new Coin(this.multiChain)).getDecimals())
            };

            if (data.receiver == receiver && data.amount == amount) {
                return 'verified';
            }
        } else {

            let decodedInput = this.decodeInput();

            let data = {
                receiver: decodedInput.receiver.toLowerCase(),
                amount: Utils.toDec(decodedInput.amount, (new Token(tokenAddress, this.multiChain)).getDecimals())
            };
            
            if (data.receiver == receiver && data.amount == amount) {
                return 'verified';
            }
        }
        return 'failed';
    }

    /**
     * @param {String} receiver
     * @param {Integer} amount
     * @param {String|null} tokenAddress
     * @returns {String}
     */
    verifyWithData(receiver, amount, tokenAddress = null) {
        return new Promise((resolve, reject) => {
            this.verify(tokenAddress)
            .then(async (result) => {
                if (result = 'verified') {
                    result = this.verifyData(receiver, amount, tokenAddress);
                    if (result = 'verified') {
                        resolve('verified');
                    } else {
                        reject('failed');
                    }
                } else {
                    reject('failed');
                }
            })
            .catch(() => {
                reject('failed');
            });
        });
    };

}

module.exports = Transaction;