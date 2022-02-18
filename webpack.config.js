const path = require('path');
const webpack = require('webpack');

const wpdir = "C:/wamp64/www/projects/wp-development/products/wp-content/plugins/tokenico/assets/js";
const dist = path.join(__dirname, "/dist");

let env = 'prod';

let dev = {
    mode: 'development',
    entry: './test.js',
    output: {
        path: path.resolve(__dirname, 'test'),
        filename: 'test.js',
    },
    watch: true,
    devtool: "source-map"
};

let prod = {
    mode: 'production',
    entry: './index.js',
    output: {
        path: wpdir,
        filename: 'multi-chain.min.js',
    },
    devtool: "source-map"
};

module.exports = Object.assign(env == 'prod' ? prod : dev, {
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        extensions: ["", ".js", ".jsx"],
        fallback: {
            http: false, 
            https: false
        }
    }
});