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

    request(params) {
        return this.instance.request(params);
    }

    chainChanged(callback) {
        this.instance.on('chainChanged', (chainHexId) => {
            callback(chainHexId);
        });
    }
    
    accountsChanged(callback) {
        this.instance.on('accountsChanged', (accounts) => {
            callback(accounts);
        });
    }
}

module.exports = Provider;