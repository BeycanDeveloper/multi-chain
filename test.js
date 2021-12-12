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
    
    let coin = multiChain.coin();

    console.log(await coin.transfer("0x3BFC285D60F79258D999a669B98aD8662c6277b5", 0.001))
})();