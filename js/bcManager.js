const BLOCKCHAIN_IP = "https://rpc2.sepolia.org"
const contractAdd = "0x4937449274df32696e89a1c651f884eed5e0cb44"
const web3 = new Web3(BLOCKCHAIN_IP);
let contractObject

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
async function contract(contractAddress) {
    // first let abi = "[\n\t\t{\n\t\t\t\"inputs\": [],\n\t\t\t\"stateMutability\": \"nonpayable\",\n\t\t\t\"type\": \"constructor\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\t\"name\": \"deviceID\",\n\t\t\t\t\t\"type\": \"address\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"name\": \"addDevice\",\n\t\t\t\"outputs\": [],\n\t\t\t\"stateMutability\": \"nonpayable\",\n\t\t\t\"type\": \"function\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\t\"name\": \"deviceID\",\n\t\t\t\t\t\"type\": \"address\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"name\": \"removeDevice\",\n\t\t\t\"outputs\": [],\n\t\t\t\"stateMutability\": \"nonpayable\",\n\t\t\t\"type\": \"function\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\t\"name\": \"deviceID\",\n\t\t\t\t\t\"type\": \"address\"\n\t\t\t\t},\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\t\"name\": \"IPFSref\",\n\t\t\t\t\t\"type\": \"uint256\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"name\": \"storeRef\",\n\t\t\t\"outputs\": [],\n\t\t\t\"stateMutability\": \"nonpayable\",\n\t\t\t\"type\": \"function\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\t\"name\": \"IPFSref\",\n\t\t\t\t\t\"type\": \"uint256\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"name\": \"storeRef\",\n\t\t\t\"outputs\": [],\n\t\t\t\"stateMutability\": \"nonpayable\",\n\t\t\t\"type\": \"function\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [],\n\t\t\t\"name\": \"getRef\",\n\t\t\t\"outputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\t\"name\": \"\",\n\t\t\t\t\t\"type\": \"uint256\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"stateMutability\": \"view\",\n\t\t\t\"type\": \"function\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\t\"name\": \"deviceID\",\n\t\t\t\t\t\"type\": \"address\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"name\": \"getRef\",\n\t\t\t\"outputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\t\"name\": \"\",\n\t\t\t\t\t\"type\": \"uint256\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"stateMutability\": \"view\",\n\t\t\t\"type\": \"function\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\t\"name\": \"newTemp\",\n\t\t\t\t\t\"type\": \"uint256\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"name\": \"modTemp\",\n\t\t\t\"outputs\": [],\n\t\t\t\"stateMutability\": \"nonpayable\",\n\t\t\t\"type\": \"function\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [],\n\t\t\t\"name\": \"getTemp\",\n\t\t\t\"outputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"uint256\",\n\t\t\t\t\t\"name\": \"\",\n\t\t\t\t\t\"type\": \"uint256\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"stateMutability\": \"view\",\n\t\t\t\"type\": \"function\"\n\t\t},\n\t\t{\n\t\t\t\"inputs\": [],\n\t\t\t\"name\": \"getSmartphoneID\",\n\t\t\t\"outputs\": [\n\t\t\t\t{\n\t\t\t\t\t\"internalType\": \"address\",\n\t\t\t\t\t\"name\": \"\",\n\t\t\t\t\t\"type\": \"address\"\n\t\t\t\t}\n\t\t\t],\n\t\t\t\"stateMutability\": \"view\",\n\t\t\t\"type\": \"function\"\n\t\t}\n\t]";
    // second let abi = '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"addDevice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getRef","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"getRef","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getSmartphoneID","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTemp","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"newTemp","type":"bytes"}],"name":"modTemp","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"removeDevice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"},{"internalType":"uint256","name":"IPFSref","type":"uint256"}],"name":"storeRef","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"IPFSref","type":"uint256"}],"name":"storeRef","outputs":[],"stateMutability":"nonpayable","type":"function"}]'
    let abi = '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"addDevice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getRef","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"getRef","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getSmartphoneID","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTemp","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"newTemp","type":"bytes"}],"name":"modTemp","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"}],"name":"removeDevice","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"IPFSref","type":"string"}],"name":"storeRef","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"deviceID","type":"address"},{"internalType":"string","name":"IPFSref","type":"string"}],"name":"storeRef","outputs":[],"stateMutability":"nonpayable","type":"function"}]'
    const contractAbi = JSON.parse(abi);

    contractObject = new web3.eth.Contract(contractAbi, contractAddress);
}


/**
 * Method that gets tbe smartphone ID (public key) stored in the smart contract.
 * @returns {string|null}
 */
async function getPubKey() {
    try {
        if (contractObject == null)
            await contract(contractAdd);
        return await contractObject.methods.getSmartphoneID().call();
    } catch (e) {
        alert(e);
        return null
    }
}

/**
 * Method that gets the temp value of the smart contract.
 *
 * @returns {string|null}
 */
async function getTemp() {
    try {
        if (contractObject == null)
            await contract(contractAdd);
        return await contractObject.methods.getTemp().call();
    } catch (e) {
        alert(e);
        return null
    }
}

/**
 *  Method that gets the reference list of the current plugin
 *  from the smart contract.
 *
 *  @param {string} privKey - Private key of the sender to get its address in the blockchain.
 *  @returns {string|null}
 */
async function getRef(privKey) {
    try {
        if (contractObject == null)
            await contract(contractAdd);
        const from = web3.eth.accounts.privateKeyToAccount('0x' + privKey.toString(16)).address;

        return await contractObject.methods.getRef().call({from: from});
    } catch (e) {
        alert(e);
        return null
    }
}

/**
 * Method that stores the reference of the IPFS file into the smart contract.
 * @param ref {string} - IPFS file hash
 * @param {ArrayBuffer} privKey - Private key of the sender to get its address in the blockchain.
 * @param privKey
 */
async function storeRef(ref, privKey) {
    const gasPrice = await updateGasPrice();

    const storeRef = contractObject.methods.storeRef(ref);
    let gasAmount = 0;
    const from = web3.eth.accounts.privateKeyToAccount('0x' + privKey.toString(16)).address;
    await storeRef.estimateGas({from: from}).then(function(gas){
        console.log(gas);
        gasAmount = gas;
    }).catch(function(error){
        console.log(error)
    });

    try {
        if (contractObject == null)
            await contract(contractAdd);
        // using the promise
        const from = web3.eth.accounts.privateKeyToAccount('0x' + privKey.toString(16)).address;
        const data = contractObject.methods.storeRef(ref).encodeABI();

        const tx = {
            from: from,
            to: contractAdd,
            data,
            gas: gasAmount, //web3.utils.toWei('0.017', 'gwei'), // Gas limit
            gasPrice: gasPrice //web3.utils.toWei('20', 'gwei') // Gas price in Gwei (1 Gwei = 10^9 Wei)
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);

        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('receipt', console.log)
            .on('error', console.error);

    } catch (e) {
        alert(e);
    }
}


