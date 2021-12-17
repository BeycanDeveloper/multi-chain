let MultiChain = require('./index');

multiChain = new MultiChain({
    testnets: true,
    acceptedWallets: [
        'metamask',
        'trustwallet',
        'binancewallet'
    ]
});

(async () => {
    await multiChain.connect('metamask');
    
    let tx = multiChain.transaction("0x23f77be071d7ae3ebef096f2aee00b8f2550c9f85e6e5d0ec8b002c3991e1ad8");

    console.log(tx)
})();