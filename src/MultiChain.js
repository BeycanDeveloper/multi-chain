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
     * @var {CurrencyConverter}
     */
    static CurrencyConverter;

    /**
     * @var {Utils}
     */
    static Utils;

    /**
     * @param {Object} config 
     */
    constructor(config) {

        // is browser
        if (typeof window != 'undefined') {
            if (window.ethereum && window.ethereum.isTrust) {
                delete config.testnets;
            }
        }

        // Testnets
        if (typeof config.acceptedChains != 'undefined') {
            this.acceptedChains = config.acceptedChains;
        } else {
            if (typeof config.testnets != 'undefined' && config.testnets == true) {
                this.acceptedChains = require('../resources/testnets.json');
            } else if (typeof config.mainnets != 'undefined' && config.mainnets == true) {
                this.acceptedChains = require('../resources/mainnets.json');
            }
        }

        let acceptedChains = {};
        Object.entries(this.acceptedChains).forEach((val) => {
            let currencies = [];
            Object.entries(val[1].currencies).forEach((val) => {
                currencies.push(Utils.isAddress(val[1]) ? val[1].toLowerCase() : val[1]);
            });
            acceptedChains[val[0]] = Object.assign(val[1], {currencies});
        });
        this.acceptedChains = acceptedChains;

        if (config.acceptedWallets != undefined) {
            this.acceptedWallets = config.acceptedWallets.filter(val => this.wallets[val]);
        }

        this.infuraId = config.infuraId;

        Object.entries(this.acceptedChains).forEach((val) => {
            this.rpcIdMapping[val[1].id] = val[1].rpcUrl;
        });

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

            if (currencyAddress && !this.activeChain.currencies.includes(currencyAddress)) {
                return reject('currency-is-not-accepted');
            }

            let chainHexId = await this.connector.getChainHexId();
            if (this.activeChain.hexId != chainHexId) {
                return reject('chain-changed');
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
        this.validate(to, amount, tokenAddress);
        return new Promise((resolve, reject) => {
            try {
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
        this.validate(to, amount);
        return new Promise((resolve, reject) => {
            try {
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
     * @param {String} address 
     * @param {Array} abi 
     * @return {Object}
     */
    contract(address, abi) {
        return this.web3.eth.contract(abi).at(address);
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
        return new Promise(async (resolve, reject) => {
        
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
                let chainHexId = await this.connector.getChainHexId();
                if (this.acceptedChains[chainHexId]) {
                    this.connectedAccount = accounts[0];
                    this.connectedWallet = this.wallets[wallet];
                    this.activeChain = this.acceptedChains[chainHexId];
    
                    this.connector.chainChanged(() => {
                        window.location.reload();
                    });

                    this.connector.accountsChanged(() => {
                        window.location.reload();
                    });

                    this.connector.disconnectEvent(() => {
                        window.location.reload();
                    });
    
                    resolve(this.connectedAccount);
                } else {
                    reject('not-accepted-chain');
                }
            })
            .catch(error => {
                reject(error);
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

MultiChain.CurrencyConverter = CurrencyConverter;
MultiChain.Utils = Utils;

if (typeof window != 'undefined') {
    window.MultiChain = MultiChain;
}

module.exports = MultiChain;