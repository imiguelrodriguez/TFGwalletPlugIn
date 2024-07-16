async function decryptAES(temp) {
    try {
        let key = localStorage.getItem("aesKey");
        alert("Retrieved " + key);

        // Ensure the key is in the correct format
        let bufferedKey = new Uint8Array(key.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
        if (bufferedKey.length !== 32) {
            throw new Error("Invalid AES key length. Expected 32 bytes (256 bits).");
        }

        // Convert the hex string to an ArrayBuffer
        let tempArray = hexStringToArrayBuffer(temp);

        // Extract the IV (first 16 bytes) and the encrypted data
        let iv = tempArray.slice(0, 12);
        let privKeyLength = tempArray.slice(12, 13)[0]
        let pubKeyLength = tempArray.slice(13, 14)[0]
        let encryptedBuffer = tempArray.slice(14);

        // Debugging output
        console.log("IV:", iv);
        console.log("Encrypted Buffer:", encryptedBuffer);

        // Initialize the AES-GCM decryption algorithm
        const algorithm = { name: 'AES-GCM', iv: iv, length: 256 };

        // Import the key
        let cryptoKey = await crypto.subtle.importKey(
            "raw",
            bufferedKey,
            algorithm,
            true,
            ["encrypt", "decrypt"]
        );

        // Decrypt the data
        let decryptedBuffer = await crypto.subtle.decrypt(
            algorithm,
            cryptoKey,
            encryptedBuffer
        );


        masterPrivKey = decryptedBuffer.slice(0, privKeyLength)
        masterPubKey = decryptedBuffer.slice(privKeyLength, privKeyLength + pubKeyLength)
        masterChainCode = decryptedBuffer.slice(privKeyLength + pubKeyLength)

        if (masterPrivKey.byteLength === 33)
            masterPrivKey = masterPrivKey.slice(1)
        // Convert the decrypted ArrayBuffer to a string
        const decryptedData = arrayBufferToHex(decryptedBuffer);

        console.log('Decrypted data:', decryptedData);

    } catch (error) {
        console.error('Error decrypting data:', error.toString());
    }
}

/**
 * Method that encrypts some data using an AES key.
 * @param key
 * @param data
 * @returns {Promise<ArrayBuffer>}
 */
async function encryptAES(key, data) {
    try {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        let messageBytes = null
        if(typeof data === "string")
            messageBytes = new TextEncoder().encode(data);
        else if (data instanceof ArrayBuffer) // TODO: include length in bytes as a prefix
            messageBytes = data
        else
            messageBytes = new Uint8Array(Array.from(data.privKey).concat(Array.from(data.pubKey)).concat(Array.from(data.chainCode)).concat(Array.from(data.dAppID)))

        const algorithm = { name: 'AES-GCM', iv: iv, length: 256 };

        let cryptoKey = await crypto.subtle.importKey(
            "raw",
            key,
            algorithm,
            true,
            ["encrypt", "decrypt"]
        );
        return await crypto.subtle.encrypt({ name: "AES-GCM", iv}, cryptoKey, messageBytes)
    } catch (error) {
        console.error('Error encrypting data:', error.toString());
    }
}
async function generateSessionKey() {
    const browserKey = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    let rawKey = await window.crypto.subtle.exportKey('raw', browserKey)
    alert("Saving key " + rawKey)
    // better to use memory than to store it in disk
    sessionKey = arrayBufferToHex(rawKey);
    localStorage.setItem("aesKey", arrayBufferToHex(rawKey))
    let ret = localStorage.getItem("aesKey")
    alert("Retrieved " + ret)
    // Export the key as raw bytes
    return rawKey;
}

async function generateSessionKeyDapp() {
    const dappKey = await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    let rawKey = await window.crypto.subtle.exportKey('raw', dappKey)
    alert("Saving key " + rawKey)
    // better to use memory than to store it in disk
    sessionKey = arrayBufferToHex(rawKey);
    localStorage.setItem("dAppKey", arrayBufferToHex(rawKey))
    let ret = localStorage.getItem("dAppKey")
    alert("Retrieved " + ret)
    // Export the key as raw bytes
    return rawKey;
}

async function encryptWithPubKey(data) {
    const k = localStorage.getItem("dAppKey")
    const hashedK = await sha256(k)
    const c1 = await encryptAES(hexStringToArrayBuffer(hashedK), data)
    const EC = elliptic.ec;
    const ec = new EC('secp256k1');
    const basePoint = ec.g;
    const p =  basePoint.mul(hashedK) // apparently modulo is handled internally
    const c2 = p.getX().toArray().concat(p.getY().toArray())

    return Array.from(new Uint8Array(c1)).concat(c2)
}