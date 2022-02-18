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

    let contract = multiChain.contract([
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_buybackTokenAddr",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_tokenToBeSentAddr",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_totalBuybackLimit",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_exchangeRate",
                    "type": "uint256"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_amount",
                    "type": "uint256"
                }
            ],
            "name": "send",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ], "0x568c84893392ce0285017400076f73d7219026ea");

    console.log(contract);

})();