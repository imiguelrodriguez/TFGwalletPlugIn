const BLOCKCHAIN_IP = "https://rpc2.sepolia.org"
const contractAdd = "0xea2e663c09a9e70df3de682127691d2e125802dd"
const web3 = new Web3(BLOCKCHAIN_IP);
let gas
let gasPrice

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

    } catch (error) {
        console.error("Error:", error);
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

async function getPubKey() {
    try {
        if (contractObject == null)
            await contract(contractAdd);
        const publicKey = await contractObject.methods.getSmartphoneID().call();
        alert(publicKey);
    } catch (e) {
        alert(e);
    }
}

/**
 * Method that gets the temp value of the smart contract.
 *
 * @returns {Promise<string|null>}
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
 *  @returns {Promise<string|null>}
 */
async function getRef() {
    try {
        if (contractObject == null)
            await contract(contractAdd);
        return await contractObject.methods.getRef().call();
    } catch (e) {
        alert(e);
        return null
    }
}

/**
 * Method that stores the reference of the IPFS file into the smart contract.
 * @param ref {string} - IPFS file hash
 * @returns {Promise<null>}
 */
async function storeRef(ref, privKey) {
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
            gas: web3.utils.toWei('0.017', 'gwei'), // Gas limit
            gasPrice: web3.utils.toWei('20', 'gwei') // Gas price in Gwei (1 Gwei = 10^9 Wei)
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);

        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('receipt', console.log)
            .on('error', console.error);


    } catch (e) {
        alert(e);
        return null
    }
}


