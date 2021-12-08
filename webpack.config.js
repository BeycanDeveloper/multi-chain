const path = require('path');
const webpack = require('webpack');

let env = 'prod';

let dev = {
    mode: 'development',
    entry: './test.js',
    output: {
        path: path.resolve(__dirname, 'test'),
        filename: 'test.js',
    },
    watch: true
};

let prod = {
    mode: 'production',
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'multi-chain.min.js',
    }
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
    devtool: "source-map"
});