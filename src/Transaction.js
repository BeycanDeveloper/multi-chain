const Coin = require('./Coin');
const Token = require('./Token');
const Utils = require('./Utils');
const Web3Utils = require('web3-utils');
const MultiChain = require('./MultiChain');
const abiDecoder = require('abi-decoder');
const ABI = require('../resources/abi.json');
abiDecoder.addABI(ABI);

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
    }

    async getDataFromExplorer() {
        try {
            this.data = await this.multiChain.connector.request({
                method: 'eth_getTransactionByHash',
                params: [this.id]
            });
        } catch (error) {
            throw new Error('There was a problem retrieving transaction data!');
        }

        try {
            let result = await this.multiChain.connector.request({
                method: 'eth_getTransactionReceipt',
                params: [this.id]
            });
            this.data.status = result.status;
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
            let decodedInput = Utils.abiDecoder(this.data.input);
            let receiver = decodedInput.params[0].value;
            let amount = decodedInput.params[1].value;
            return { receiver, amount };
        } else {
            return null;
        }
    }

    /**
     * @returns {String|Object}
     */
    wait() {
        return new Promise((resolve, reject) => {
            let timeOut = 15;
            let time = 0;
            let checkerInterval = setInterval(async () => {
                time ++;
                try {
                    await this.getDataFromExplorer();

                    if (this.data == null) {
                        clearInterval(checkerInterval);
                        reject('failed');
                    } else {
                        if (this.data.blockNumber !== null) {
                            if (this.data.status == '0x0') {
                                clearInterval(checkerInterval);
                                reject('failed');
                            } else {
                                clearInterval(checkerInterval);
                                resolve('success');
                            }
                        }
                    }
                } catch (error) {
                    if (time == timeOut) {
                        clearInterval(checkerInterval);
                        reject(error);
                    } else {
                        if (error.message == 'There was a problem retrieving transaction data!') {
                            this.wait();
                        } else {
                            clearInterval(checkerInterval);
                            reject(error);
                        }
                    }
                }
            }, (1*1000));
        });
    }

    /**
     * @param {String} tokenAddress 
     * @param {Integer} timer 
     * @returns {String|Object}
     */
    verify(tokenAddress = null, timer = 1) {
        
        if (tokenAddress == this.multiChain.activeChain.nativeCurrency.symbol) {
            tokenAddress = null;
        }

        if (tokenAddress && Web3Utils.isAddress(tokenAddress = tokenAddress.toLowerCase()) === false) {
            throw new Error('Invalid token address!');
        }

        return new Promise((resolve, reject) => {
            let timeOut = 15;
            let time = 0;
            let checkerInterval = setInterval(async () => {
                time ++;
                try {

                    await this.getDataFromExplorer();

                    let result = null;

                    if (this.data == null) {
                        result = 'failed';
                    } else {
                        if (this.data.blockNumber !== null) {
                            if (this.data.status == '0x0') {
                                result = 'failed';
                            } else if (tokenAddress && this.data.input == '0x') {
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
                    if (time == timeOut) {
                        clearInterval(checkerInterval);
                        reject(error);
                    } else {
                        if (error.message == 'There was a problem retrieving transaction data!') {
                            this.verify(tokenAddress, timer);
                        } else {
                            clearInterval(checkerInterval);
                            reject(error);
                        }
                    }
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

        if (tokenAddress == this.multiChain.activeChain.nativeCurrency.symbol) {
            tokenAddress = null;
        }

        if (tokenAddress && Web3Utils.isAddress(tokenAddress = tokenAddress.toLowerCase()) === false) {
            throw new Error('Invalid token address!');
        }

        if (Web3Utils.isAddress(receiver = receiver.toLowerCase()) === false) {
            throw new Error('Invalid receiver address!');
        }

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
            .then(async () => {
                let result = await this.verifyData(receiver, amount, tokenAddress);
                if (result = 'verified') {
                    resolve('verified');
                } else {
                    reject('failed');
                }
            })
            .catch((e) => {
                reject('failed');
            });
        });
    }

    /**
     * @returns {String}
     */
    getUrl() {
        let explorerUrl = this.multiChain.activeChain.explorerUrl;
        explorerUrl += explorerUrl.endsWith('/') ? '' : '/';
        explorerUrl += 'tx/'+this.id;
        return explorerUrl;
    }

}

module.exports = Transaction;