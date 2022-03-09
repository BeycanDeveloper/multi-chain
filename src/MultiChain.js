const Web3 = require('web3');
const Coin = require('./Coin');
const Token = require('./Token');
const Utils = require('./Utils');
const Connector = require('./Connector');
const Web3Utils = require('web3-utils');
const Transaction = require('./Transaction');
const CurrencyConverter = require('./CurrencyConverter');

class MultiChain {

    /**
     * Connector to interact with the wallet
     * @var {Connector}
     */
    connector;

    /**
     * Web3 library instance
     * @var {Web3}
     */
    web3;

    /**
     * Infura id for WalletConnect
     * @var {string}
     */
    infuraId;

    /**
     * Rpc url chain id mapping
     * @var {Object}
     */
    rpcIdMapping = {};

    /**
     * Blockchain networks that can be considered as a payment method.
     * @var {Object}
     */
    acceptedChains;

    /**
     * The id of the currently active blockchain network in the wallet
     * @var {Chain}
     */
    activeChain = {};

    /**
     * Detected wallets
     * @var {Array}
     */
    detectedWallets = [
        'walletconnect'
    ];

    /**
     * Accepted wallets
     * @var {Array}
     */
    acceptedWallets = [
        'metamask',
        'trustwallet',
        'binancewallet'
    ];

    /**
     * Supported wallets
     * @var {Object}
     */
    wallets = {
        metamask: {
            name: 'MetaMask'
        },
        trustwallet: {
            name: 'Trust Wallet'
        },
        binancewallet: {
            name: 'Binance Wallet'
        },
        walletconnect: {
            name: 'WalletConnect'
        },
        coinbasewallet: {
            name: 'Coinbase Wallet'
        },
        coin98wallet: {
            name: 'Coin98 Wallet'
        },
        phantom: {
            name: 'Phantom'
        }
    };

    /**
     * Wallet that the user is connecting to
     * @var {Wallet}
     */
    connectedWallet = {};

    /**
     * Connected wallet address
     * @var {String|null}
     */
    connectedAccount = null;
    
    /**
     * @var {Boolean}
     */
    allowedNetworks = false;

    /**
     * @var {CurrencyConverter}
     */
    static currencyConverter;

    /**
     * @var {Utils}
     */
    static utils;

    /**
     * @param {Object} config 
     */
    constructor(config) {

        this.infuraId = config.infuraId;
        
        this.allowedNetworks = config.allowedNetworks ? true : false;

        if (this.allowedNetworks !== true) {
            this.acceptedChains = config.acceptedChains;
            
            Object.entries(this.acceptedChains).forEach((val) => {
                this.rpcIdMapping[val[1].id] = val[1].rpcUrl;
            });
        }

        if (config.acceptedWallets != undefined) {
            this.acceptedWallets = config.acceptedWallets.filter(val => this.wallets[val]);
        }

        this.detectWallets();
    }

    /**
     * @param {String} to
     * @param {Integer} amount
     * @param {String|null} currencyAddress
     * @return {Transaction|Object}
     * @throws {Error}
     */
    transfer(to, amount, currencyAddress = null) {
        return new Promise(async (resolve, reject) => {

            let chainHexId = await this.connector.getChainHexId();
            if (this.activeChain.hexId != chainHexId) {
                return reject('chain-changed');
            }

            if (parseFloat(amount) < 0) {
                return reject('transfer-amount-error');
            }

            if (currencyAddress == this.activeChain.nativeCurrency.symbol) {
                currencyAddress = null;
            }

            if (!currencyAddress || currencyAddress == this.activeChain.nativeCurrency.symbol) {
                this.coinTransfer(to, amount)
                .then((transaction) => {
                    resolve(transaction);
                })
                .catch((error) => {
                    reject(error);
                });
            } else {
                this.tokenTransfer(to, amount, currencyAddress)
                .then((transaction) => {
                    resolve(transaction);
                })
                .catch((error) => {
                    reject(error);
                });
            }
        });

    }

    /**
     * @param {String} to
     * @param {Integer} amount
     * @param {String|null} tokenAddress
     * @return {Transaction|Object}
     * @throws {Error}
     */
    tokenTransfer(to, amount, tokenAddress) {
        return new Promise((resolve, reject) => {
            try {
                this.validate(to, amount, tokenAddress);
                (new Token(tokenAddress, this)).transfer(to, amount)
                .then((transactionId) => {
                    resolve(new Transaction(transactionId, this));
                })
                .catch((error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @param {String} to
     * @param {Integer} amount
     * @return {Transaction|Object}
     * @throws {Error}
     */
    coinTransfer(to, amount) {
        return new Promise((resolve, reject) => {
            try {
                this.validate(to, amount);
                (new Coin(this)).transfer(to, amount)
                .then((transactionId) => {
                    resolve(new Transaction(transactionId, this));
                })
                .catch((error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * @param {Array} abi 
     * @param {String|null} address 
     * @return {Object}
     */
    contract(abi, address = null) {
        if (!address) {
            return this.web3.eth.contract(abi);
        } else {
            return this.web3.eth.contract(abi).at(address);
        }
    }

    /**
     * @param {String} address 
     * @param {Array} abi 
     * @return {Token}
     */
    token(address, abi = null) {
        return new Token(address, this, abi);
    }

    /**
     * @return {Coin}
     */
    coin() {
        return new Coin(this);
    }

    /**
     * @param {String} transactionId 
     * @return {Transaction}
     */
    transaction(transactionId) {
        return new Transaction(transactionId, this)
    }

    /**
     * @param {String} to
     * @param {Integer} amount
     * @param {String|null} tokenAddress
     * @return {Boolean}
     * @throws {Error}
     */
    validate(to, amount, tokenAddress = null) {
        if (!this.connectedAccount) {
            throw new Error("No linked wallet found, please link first.");
        } 

        if (amount <= 0) {
            throw new Error("The amount cannot be zero or less than zero!");
        } 

        if (Web3Utils.isAddress(to) === false) {
            throw new Error('Invalid receiver address!');
        }

        if (tokenAddress && Web3Utils.isAddress(tokenAddress) === false) {
            throw new Error('Invalid token address!');
        }

        return true;
    }

    /**
     * Sends a request to connect to the wallet selected by the user
     * @param {String} wallet 
     * @returns {String|Object}
     */
    connect(wallet) {
        return new Promise((resolve, reject) => {
            this.connectWallet(wallet)
            .then(async (connectedAccount) => {
                let chainHexId = await this.connector.getChainHexId();
                if (!this.allowedNetworks) {
                    if (this.acceptedChains[chainHexId]) {
                        this.connectedAccount = connectedAccount;
                        this.connectedWallet = this.wallets[wallet];
                        this.activeChain = this.acceptedChains[chainHexId];
                        resolve(connectedAccount);
                    } else {
                        reject('not-accepted-chain');
                    }
                } else {
                    this.connectedAccount = connectedAccount;
                    this.connectedWallet = this.wallets[wallet];
                    resolve(connectedAccount);
                }
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    connectWallet(wallet) {
        return new Promise((resolve, reject) => {
            if (!this.wallets[wallet] || !this.acceptedWallets.includes(wallet)) {
                return reject('not-accepted-wallet');
            }
    
            if (!this.detectedWallets.includes(wallet)) {
                return reject('wallet-not-detected');
            }

            try {
                this.connector = new Connector(wallet, this);
                this.web3 = new Web3(this.connector.provider);
            } catch (error) {
                return reject(error.message);
            }

            this.connector.connect()
            .then(async accounts => {
                resolve(accounts[0]);
            })
            .catch(error => {
                reject(error);
            });
        })
    }

    personalSign(message) {
        return new Promise((resolve, reject) => {
            this.connector.request({
                method: 'personal_sign',
                params: [message, this.connectedAccount],
                from: this.connectedAccount
            })
            .then(signature => {
                resolve(signature);
            })
            .catch(error => {
                if (
                    error.code == 4001 || 
                    error.code == -32603 || 
                    error.message == 'cancelled' || 
                    error.message == 'User canceled' ||
                    error.message == 'MetaMask Personal Message Signature: User denied message signature.'
                ) {
                    reject('signature-request-denied');
                } else {
                    reject('something-went-wrong');
                }
            });
        })
    }
    
    getGasPrice() {
        return new Promise((resolve, reject) => {
            this.web3.eth.getGasPrice(function(err, gasPrice) {
                if (!err) {
                    resolve(Utils.hex(gasPrice.toString()));
                } else {
                    reject(err);
                }
            });
        });
    }

    getEstimateGas(data) {
        return new Promise((resolve, reject) => {
            this.web3.eth.estimateGas(data, function(err, gas) {
                if (!err) {
                    resolve(Utils.hex(gas));
                } else {
                    reject(err);
                }
            });
        });
    }

    detectWallets() {
        if (typeof window != 'undefined') {
            if (window.ethereum) {
                if (window.ethereum.isMetaMask) {
                    this.detectedWallets.push('metamask');
                }
                
                if (window.ethereum.isTrust) {
                    this.detectedWallets.push('trustwallet');
                }
            }
            
            if (window.BinanceChain) {
                this.detectedWallets.push('binancewallet');
            }
        }
    }
}

MultiChain.currencyConverter = CurrencyConverter;
MultiChain.utils = Utils;

if (typeof window != 'undefined') {
    window.MultiChain = MultiChain;
}

module.exports = MultiChain;