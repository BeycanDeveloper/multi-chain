class Provider {

    /**
     * @var {Object}
     */
    instance;

    /**
     * @param {String} wallet 
     */
    constructor(wallet) {
        if (wallet == 'metamask' || wallet == 'trustwallet') {
            this.instance = ethereum;
        } else if (wallet == 'binancewallet') {
            this.instance = BinanceChain;
        }
    }

    /**
     * @returns {Array}
     */
    getAccounts() {
        return this.instance.request({ method: 'eth_accounts' });
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
    getChainHexId() {
        return this.instance.request({method: 'eth_chainId'});
    };

    /**
     * @returns {Array}
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.instance.request({ method: 'eth_requestAccounts' })
            .then((accounts) => {
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
        return this.instance.request(params);
    }

    /**
     * @param {Array} params 
     * @returns 
     */
    sendTransaction(params) {
        return new Promise(async (resolve, reject) => {
            this.instance.request({
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
        this.instance.on('chainChanged', (chainHexId) => {
            callback(chainHexId);
        });
    }

    /**
     * @param {CallableFunction} callback 
     */
    accountsChanged(callback) {
        this.instance.on('accountsChanged', (accounts) => {
            callback(accounts);
        });
    }
}

module.exports = Provider;