let MultiChain = require('./index');

let multiChain = new MultiChain({
    testnets: true,
    acceptedWallets: [
        'metamask',
        'trustwallet',
        'binancewallet',
        'walletconnect'
    ],
    infuraId: "7c6b76cce9634d479314258141acf181"
});

(async () => {
    await multiChain.connect('walletconnect');
})();