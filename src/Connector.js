const WalletConnectProvider = require('@walletconnect/web3-provider').default;
const MultiChain = require('./MultiChain');
const Utils = require('./Utils');

class Connector {

    /**
     * @var {Object}
     */
    provider;

    /**
     * @var {MultiChain} 
     */
    multiChain;

    /**
     * @var {String} 
     */
    wallet;

    /**
     * @param {String} wallet 
     * @param {MultiChain} multiChain
     */
    constructor(wallet, multiChain) {

        this.wallet = wallet;

        if (!multiChain) {
            throw new Error('The MultiChain parameter is required please send a MultiChain sample!');
        }

        this.multiChain = multiChain;

        if (wallet == 'metamask' || wallet == 'trustwallet') {
            this.provider = ethereum;
        } else if (wallet == 'binancewallet') {
            this.provider = BinanceChain;
        } else if (wallet == 'walletconnect') {
            if (!this.multiChain.infuraId) {
                throw new Error('not-found-infura-id');
            } else {
                this.provider = new WalletConnectProvider({
                    rpc: this.multiChain.rpcIdMapping,
                    infuraId: this.multiChain.infuraId
                });
            }
        }
    }

    /**
     * @returns {Array}
     */
    getAccounts() {
        return this.provider.request({ method: 'eth_accounts' });
    };

    /**
     * @returns {Boolean}
     */
    async isConnected() {
        return (await this.getAccounts()).length !== 0;
    };

    /**
     * @returns {String}
     */
    async getChainHexId() {
        let id = await this.provider.request({method: 'eth_chainId'});
        if (Utils.isNumeric(id)) return '0x' + id.toString(16);
        return id;
    };

    /**
     * @returns {Array}
     */
    connect() {
        let connector;
        return new Promise(async (resolve, reject) => {
            if (this.wallet == 'walletconnect') {
                connector = this.provider.enable();
            } else {
                connector = this.provider.request({method: 'eth_requestAccounts'});
            }
            
            connector.then((accounts) => {
                resolve(accounts);
            })
            .catch((error) => {
                reject(error);
            });
        });
    };

    /**
     * 
     * @param {Object} params 
     * @return {Promise}
     */
    request(params) {
        return this.provider.request(params);
    }

    /**
     * @param {Array} params 
     * @returns 
     */
    sendTransaction(params) {
        return new Promise(async (resolve, reject) => {
            this.provider.request({
                method: 'eth_sendTransaction',
                params,
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
     * @param {CallableFunction} callback 
     */
    chainChanged(callback) {
        this.provider.on('chainChanged', (chainHexId) => {
            callback(chainHexId);
        });
    }

    /**
     * @param {CallableFunction} callback 
     */
    accountsChanged(callback) {
        this.provider.on('accountsChanged', (accounts) => {
            callback(accounts);
        });
    }

    /**
     * @param {CallableFunction} callback 
     */
    disconnectEvent(callback) {
        this.provider.on('disconnect', (code, reason) => {
            callback(code, reason);
        });
    }

    async disconnect() {
        if (this.wallet == 'walletconnect') {
            await this.provider.disconnect();
        }
    }
}

module.exports = Connector;