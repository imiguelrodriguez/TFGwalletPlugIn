const BLOCKCHAIN_ENDPOINT = "https://rpc2.sepolia.org"
let contractAdd = localStorage.getItem("contractAddress")
const web3 = new Web3(BLOCKCHAIN_ENDPOINT);
let contractObject = null
const contractAbi = '[{"inputs":[{"internalType":"bytes","name":"_publicKey","type":"bytes"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"addDevice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getPublicKey","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRef","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"getRef","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getSmartphoneID","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTemp","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"newTemp","type":"bytes"}],"name":"modTemp","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"removeDevice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"IPFSref","type":"string"}],"name":"storeRef","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"},{"internalType":"string","name":"IPFSref","type":"string"}],"name":"storeRef","outputs":[],"stateMutability":"nonpayable","type":"function"}]'


/**
 * Method that calls the sepolia beacon chain API to get the current estimated gas price.
 * @returns {bigint}
 */
async function updateGasPrice() {
    try {
        const response = await fetch('https://sepolia.beaconcha.in/api/v1/execution/gasnow', {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Error getting gas price: ${response.status}`);
        }

        const res = await response.json();
        console.log("Gas price: ", res.data["rapid"]);
        return res.data["rapid"];

    } catch (error) {
        console.error("Error:", error);
        return 40000n; // return default value
    }
}

/**
 *  Method that initializes the variable contractObject so that smart contract
 *  method can be called later.
 *
 *  This method takes the contract address and connects to the blockchain to initialize
 *  the contract object.
 * @param contractAddress {string} - Hexadecimal string indicating the contract address
 */
async function initContract(contractAddress) {
    contractObject = new web3.eth.Contract(JSON.parse(contractAbi), contractAddress);
}


/**
 * Method that gets tbe smartphone ID (public key) stored in the smart contract.
 * @returns {Promise<string|null>}
 */
async function getPubKey() {
    try {
        if (!contractObject) await initContract(contractAdd);
        return await contractObject.methods.getPublicKey().call();
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

/**
 * Method that gets the temp value of the smart contract.
 *
 * @returns {Promise<string|null>}
 */
async function getTemp() {
    try {
        if (!contractObject) await initContract(contractAdd);
        return await contractObject.methods.getTemp().call();
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

/**
 *  Method that gets the reference list of the current plugin
 *  from the smart contract.
 *
 *  @param {string} privKey - Private key of the sender to get its address in the blockchain.
 *  @returns {Promise<string|null>}
 */
async function getRef(privKey) {
    try {
        if (!contractObject) await initContract(contractAdd);
        const from = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`).address;
        return await contractObject.methods.getRef().call({from: from});
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

/**
 * Method that stores the reference of the IPFS file into the smart contract.
 * @param {string} ref  - IPFS file hash
 * @param {string} privKey - Private key of the sender to get its address in the blockchain.
 */
async function storeRef(ref, privKey) {
    try {
        if (!contractObject) await initContract(contractAdd);

        const gasPrice = await updateGasPrice();
        const from = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`).address;
        const data = contractObject.methods.storeRef(ref).encodeABI();

        const gasAmount = await contractObject.methods.storeRef(ref).estimateGas({ from });

        const tx = {
            from,
            to: contractAdd,
            data,
            gas: gasAmount,
            gasPrice
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);

       return web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('receipt', receipt => {
                console.log('Transaction successful:', receipt);
                alert('Transaction successful. Please, reload the keys in the app to visualize the new credentials.');
            })
            .on('error', error => {
                console.error('Transaction error:', error);
                alert(`Transaction failed with error: ${error.message}`);
            });

    } catch (error) {
        console.error("Error:", error);
        return alert(error.message);
    }
}

