const axios = require('axios');

class CurrencyConverter {

    /**
     * @var {String}
     */
    api;

    /**
     * @var {String}
     */
    apiUrl;

    /**
     * @var {String|null}
     */
    apiKey = null;

    /**
     * @var array
     */
    apis = {
        'cryptocompare': 'https://min-api.cryptocompare.com/data/price',
        'coinmarketcap': 'https://pro-api.coinmarketcap.com/v1/tools/price-conversion'
    };

    /**
     * @param {String} api
     * @param {String|null} apiKey
     * @throws {Error}
     */
    constructor(api, apiKey = null) {
        if (!this.apis[api]) {
            throw new Error('Unsupported api!');
        }

        this.api = api;
        this.apiKey = apiKey;
        this.apiUrl = this.apis[api];
    }

    /**
     * @param {String} from
     * @param {String} to
     * @param {Number} amount
     * @return {Float|null}
     * @throws {Error}
     */
    convert(from, to, amount) {
        if (this.api == 'coinmarketcap') {
            return this.convertWithCoinMarketCap(from, to, amount);
        } else if (this.api == 'cryptocompare') {
            return this.convertWithCryptoCompare(from, to, amount);
        } else {
            return null;
        }
    }

    /**
     * It is not currently used by js as requests are prohibited by coinmarketcap
     * @deprecated
     * @param {String} from
     * @param {String} to
     * @param {Number} amount
     * @return {Float|null}
     * @throws {Error}
     */
    async convertWithCoinMarketCap(from, to, amount) {
        throw new Error("It is not currently used by js as requests are prohibited by coinmarketcap");

        this.checkUsedApi('coinmarketcap');

        let apiUrl = `${this.apiUrl}?amount=${amount}&symbol=${from}&convert=${to}`;

        let response = await axios.get(apiUrl, {
            headers: {
                'Accepts': 'application/json',
                'X-CMC_PRO_API_KEY': `${this.apiKey}`,
            }
        });

        let convertData = response.data;

        if (convertData.data) {
            return parseFloat(price.toFixed(convertData.data.quote[strtoupper(to)].price));
        } else {
            return null;
        }
    }

    /**
     * @param {String} from
     * @param {String} to
     * @param {Number} amount
     * @return {Float|null}
     * @throws {Error}
     */
    async convertWithCryptoCompare(from, to, amount) {
        this.checkUsedApi('cryptocompare');

        let apiUrl = this.apiUrl + '?fsym=' + from + '&tsyms=' + to;
        let response = await axios.get(apiUrl);
        let convertData = response.data;
        if (convertData[to]) {
            let price = amount * convertData[to];
            return parseFloat(price.toFixed(6));
        } else {
            return null;
        }
    }

    /**
     * @param {String} api
     * @return {void}
     * @throws {Error}
     */
    checkUsedApi(api) {
        if (this.api != api) {
            throw new Error(`The api chosen to be used is not the "${api}" api!`);
        } else {
            if (this.apiKey == null && this.api == 'coinmarketcap') {
                throw new Error("The key of the api selected to be used has not been entered.");
            }
        }
    }

}


module.exports = CurrencyConverter;