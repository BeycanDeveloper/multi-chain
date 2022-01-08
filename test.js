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
                    "name": "_tokenAddress",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_totalSaleLimit",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_minContribution",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_maxContribution",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_exchangeRate",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_startDate",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_endDate",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "_autoTransfer",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "buy",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "claim",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "sales",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "receiverAddress",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "totalPurchase",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "sent",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ], "0xacef9a5eb5796bb85b9ad8a803fbb04c20c353df");

    let data = contract.buy.getData({from: multiChain.connectedAccount});

    let amount = MultiChain.utils.toHex(0.1, 18);
    console.log(data)
    let gas = await multiChain.getEstimateGas({
        to: contract.address, 
        from: multiChain.connectedAccount,
        value: amount,
        data,
    });

    console.log(gas)

    multiChain.connector.sendTransaction([{
        to: contract.address,
        from: multiChain.connectedAccount,
        value: amount,
        gas,
        data
    }])
    .then((transactionId) => {
        console.log(transactionId)

    })
    .catch((error) => {
        console.log(error)
    })
})();