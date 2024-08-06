async function decryptAES(temp) {
    try {
        let key = localStorage.getItem("aesKey");

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
        if (new Uint8Array(masterPubKey)[0] === 0)
            masterPubKey = masterPubKey.slice(1)
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
 * @returns {Promise<Array>}
 */
async function encryptAESHandler(key, data) {
    try {
        if(typeof data === "string")
            return await encryptAES(key, new TextEncoder().encode(data));
        else if (data instanceof ArrayBuffer) // TODO: include length in bytes as a prefix
            return await encryptAES(key, data);
        else
            return (await encryptAES(key, new Uint8Array(Array.from(data.privKey).concat(Array.from(data.pubKey)).concat(Array.from(data.chainCode)).concat(Array.from(data.dAppID))))).concat(data.privKey.length).concat(data.pubKey.length)

    } catch (error) {
        console.error('Error encrypting data:', error.toString());
    }
}

/**
 * Method that encrypts some data using an AES key.
 * @param key
 * @param data
 * @returns {Promise<Array>}
 */
async function encryptAES(key, data) {
    try {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const algorithm = { name: 'AES-GCM', iv: iv, length: 256 };

        let cryptoKey = await crypto.subtle.importKey(
            "raw",
            key,
            algorithm,
            true,
            ["encrypt", "decrypt"]
        );

        console.log("iv:", iv);
        return Array.from(iv).concat(Array.from(new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv}, cryptoKey, data))))
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
    sessionKey = arrayBufferToHex(rawKey);
    localStorage.setItem("aesKey", arrayBufferToHex(rawKey))
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

async function encryptWithPubKey(publicKey, data) {
    // initialize EC
    const EC = elliptic.ec;
    const ec = new EC('secp256k1');

    // Step 1: We have a public key (y_A = g^alpha mod p)
    // Convert the public key to an elliptic curve key object
    const key = ec.keyFromPublic(publicKey, 'hex');

    // Step 2: Get an exponent "r" large enough between 1 and p-1
    const r = ec.genKeyPair().getPrivate();

    // Step 3: Calculate the session key using y_A^r mod p = x
    const y_A_r = key.getPublic().mul(r).x.toString('hex') +  key.getPublic().mul(r).y.toString('hex');  // y_A^r mod p
    console.log("yA_r:", y_A_r);
    // Step 3.1: Perform SHA256(x) to get k (AES session key)
    const k = await sha256(y_A_r);

    // Step 4: Encrypt the message using AES_k(message) = c1
    const c1 = await encryptAESHandler(hexStringToArrayBuffer(k), data)
    const lengthC1 = c1.length

    // Step 5: Generate the second cryptogram using g^r mod p = c2
    const c2 = ec.g.mul(r).encode();
    const lengthC2 = c2.length
    // return c1, c2, length c1
    console.log("Message before encryption: ", data);
    console.log("c1 length: ", lengthC1);

    return c1.concat(c2).concat(lengthC1)

}
