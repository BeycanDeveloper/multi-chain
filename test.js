let MultiChain = require('./index');
let testnets = require('./testnets.json');

let multiChain = new MultiChain({
    acceptedChains: testnets,
    acceptedWallets: [
        'metamask',
        'trustwallet',
        'binancewallet',
        'walletconnect'
    ],
    infuraId: "7c6b76cce9634d479314258141acf181"
});

(async () => {
    await multiChain.connect('metamask');

})();