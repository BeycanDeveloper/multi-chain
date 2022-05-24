let MultiChain = require('./index');
let testnets = require('./testnets.json');
let mainnets = require('./mainnets.json');

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

let mUSDC = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d';
let tUSDC = '0x64544969ed7EBf5f083679233325356EbE738930';

(async () => {
    await multiChain.connect('metamask');

    multiChain.transfer("0x74dBE9cA4F93087A27f23164d4367b8ce66C33e2", 1, tUSDC)
})();