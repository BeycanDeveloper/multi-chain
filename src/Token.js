const Utils = require('./Utils');
const MultiChain = require('./MultiChain');
const ABI = require('../resources/abi.json');

class Token {

    /**
     * @var {Object} 
     */
    contract;

    /**
     * @var {String} 
     */
    address;

    /**
     * @var {MultiChain} 
     */
    multiChain;

    /**
     * @param {String} address 
     * @param {MultiChain} multiChain 
     * @throws {Error}
     */
    constructor(address, multiChain, abi = null) {
        Utils.validateMultiChain(multiChain);
        
        if (!address) throw new Error('Invalid token address');
        
        this.address = address;
        this.multiChain = multiChain;
        this.contract = multiChain.web3.eth.contract(abi || ABI).at(address);
    }

    /**
     * @param {String} address
     * @returns {Float|Object}
     */
    getBalance(address) {
        return new Promise((resolve, reject) => {
            this.contract.balanceOf(address, (error, balance) => {
                if (error) {
                    reject(error);
                } else {
                    this.contract.decimals((error, decimals) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(parseFloat(balance.div(10**decimals).toString()));
                        }
                    });
                }
            });
        });
    }

    /**
     * @returns {String|Object}
     */
    getName() {
        return new Promise((resolve, reject) => {
            this.contract.name((error, name) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(name);
                }
            });
        });
    }

    /**
     * @returns {Float|Object}
     */
    getTotalSupply() {
        return new Promise((resolve, reject) => {
            this.contract.totalSupply((error, totalSupply) => {
                if (error) {
                    reject(error);
                } else {
                    this.contract.decimals((error, decimals) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(parseFloat(totalSupply.div(10**decimals).toString()));
                        }
                    });
                }
            });
        });
    }

    /**
     * @returns {String|Object}
     */
    getSymbol() {
        return new Promise((resolve, reject) => {
            this.contract.symbol((error, symbol) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(symbol);
                }
            });
        });
    }

    /**
     * @returns {String|Object}
     */
    getDecimals() {
        return new Promise((resolve, reject) => {
            this.contract.decimals((error, decimals) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(parseInt(decimals.toNumber()));
                }
            });
        });
    }

    /**
     * @returns {String}
     */
    getAddress() {
        return this.address;
    }

    /**
     * @param {String} to
     * @param {Integer} amount
     * @returns {String|Object}
     */
    transfer(to, amount) {
        return new Promise(async (resolve, reject) => {
    
            if (parseFloat(amount) > await this.getBalance(this.multiChain.connectedAccount)) {
                return reject('insufficient-balance');
            }
            
            amount = Utils.toHex(amount, (await this.getDecimals()));
    
            let data = this.contract.transfer.getData(to, amount, {from: this.multiChain.connectedAccount});
            
            let gas = await this.multiChain.getEstimateGas({
                to: this.address,
                from: this.multiChain.connectedAccount,
                value: '0x0',
                data
            });

            this.multiChain.connector.sendTransaction([{
                to: this.address,
                from: this.multiChain.connectedAccount,
                value: '0x0',
                gas,
                data
            }])
            .then((transactionId) => {
                resolve(transactionId);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * @param {String} spender
     * @param {Number} amount
     * @returns {Boolean}
     */
    approve(spender, amount) {
        return new Promise(async (resolve, reject) => {
            amount = Utils.toHex(amount, (await this.getDecimals()));
            
            let data = this.contract.approve.getData(spender, amount, {from: this.multiChain.connectedAccount});
            
            let gas = await this.multiChain.getEstimateGas({
                to: this.address,
                from: this.multiChain.connectedAccount,
                value: '0x0',
                data
            });

            this.multiChain.connector.sendTransaction([{
                to: this.address,
                from: this.multiChain.connectedAccount,
                value: '0x0',
                gas,
                data
            }])
            .then((transactionId) => {
                resolve(transactionId);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

    /**
     * @param {String} owner
     * @param {String} spender
     * @returns {Boolean}
     */
    allowance(owner, spender) {
        return new Promise((resolve, reject) => {
            this.contract.allowance(owner, spender, async (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(parseFloat(Utils.toDec(result, await this.getDecimals())));
                }
            });
        });
    }

    method(method, ...params) {
        method = this.contract[method];
        return new Promise((resolve, reject) => {
            let result = (error, name) => error ? reject(error) : resolve(name);
            if (params.length == 0) {
                method(result);
            } else {
                method(params, result);
            }
            ;
        });
    }
}

module.exports = Token;