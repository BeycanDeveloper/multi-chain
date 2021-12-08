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
    
    let token = multiChain.token('0xba6670261a05b8504e8ab9c45d97a8ed42573822');

    console.log(await token.getBalance("0x74dBE9cA4F93087A27f23164d4367b8ce66C33e2"))
    console.log(await token.method('name'));
})();