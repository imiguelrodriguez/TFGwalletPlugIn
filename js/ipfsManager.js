const IPFS_IP = "http://192.168.1.134:5001/"

/**
 * Adds data to a file in the IPFS.
 *
 * This method takes some data to be written in a new file in the IPFS.
 * It performs a call to the "add" function of the IPFS RPC API. Lastly,
 * it returns the hash of the newly created file.
 *
 * @param {string} data - String containing the data to be appended.
 * @returns {string} The hash of the newly created file.
 */
async function addFile(data) {

    try {
        const blob = new Blob([data], { type: 'text/plain' }); // Create a Blob object

        const formData = new FormData();
        formData.append('file', blob, 'my.txt'); // Append the Blob with a filename

        const response = await fetch(IPFS_IP + 'api/v0/add', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Error adding file to IPFS: ${response.statusText}`);
        }

        const res = await response.json();
        console.log("Added file to IPFS:", res.Hash);
        return res.Hash
    } catch (error) {
        console.error("Error:", error);
        return null
    }

}

/**
 * Gets data from a file in the IPFS.
 *
 * This method takes a hash indicating the file to be retrieved. It performs a "cat" call
 * to the IPFS RPC API to get the information inside the file. Lastly, the content is returned.
 *
 * @param {string} hash - String with the hash of the file.
 * @returns {string} The content of the file.
 */
async function getFile(hash) {
    try {
        const blob = new Blob([hash], { type: 'text/plain' }); // Create a Blob object
        const formData = new FormData();
        formData.append('arg', blob, 'filename'); // Append the Blob with a filename
        console.log(formData.toString())

        const response = await fetch(IPFS_IP + 'api/v0/cat', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error(`Error downloading from IPFS: ${response.statusText}`);
        }

        const data = await response // Get the downloaded data as a Blob
        console.log("Downloaded data from IPFS (Blob):", data);
        return await data.text()
    } catch (error) {
        console.error("Error:", error);
        return null
    }
}

/**
 * Appends data to a file in the IPFS.
 *
 * This method takes some data to be appended to the data inside the
 * file specified by its hash. Since append is not possible the content
 * of the file is first retrieved and then the new data is appended. Lastly
 * all this information is stored in a new file and its hash is returned.
 *
 * @param {string} data - String containing the data to be appended.
 * @param {string} hash - String with the hash of the file.
 * @returns {string} The hash of the newly created file.
 */
async function append(data, hash) {
    const prevData = await getFile(hash)
    return await addFile(prevData + "," + data)
}


/**
 * Stores data in the IPFS if the reference stored in the SC is not null. That is, it exists
 * a previous file in the IPFS so that append is needed.
 * @param ref {string} - String with the hash of the previous file.
 * @param aesEnc {Uint8Array} - first encrypted message to be stored.
 * @param pubKeyEnc {Array} - second encrypted message to be stored.
 * @param privKey {string} - Private key of the sender to get its address in the blockchain.
 */
async function storeInPrevious(ref, aesEnc, pubKeyEnc, privKey) {
    // Get hi file from the IPFS (hiFile)  --- ref = hi
    const hiFile = await getFile(ref)

    // Store the set ( EncKij (SKij , P Kij , j), EncP K0 (Kij ) ) in the IPFS.
    // This process returns the reference of the stored file (hij ).
    const hij = await addFile("((" + aesEnc.toString() + ");(" + pubKeyEnc.toString() + "))")

    // Update file_hi by appending hij .
    const hiPrime = await append(hij, hiFile)
    await storeRef(hiPrime, privKey)
}

/**
 * Stores data in the IPFS if the reference stored in the SC is null. That is, there is no
 * previous file stored in the IPFS. New file is needed.
 * @param aesEnc {Uint8Array} - first encrypted message to be stored.
 * @param pubKeyEnc {Array} - second encrypted message to be stored.
 * @param privKey {string} - Private key of the sender to get its address in the blockchain.
 */
async function storeInNew(aesEnc, pubKeyEnc, privKey) {
    // store (EncKij(SKij, PKij, j)) , (EncPK0(Kij))
    const h = await addFile("((" + aesEnc.toString() + ");(" + pubKeyEnc.toString() + "))")
    // h holds the hash of the file where the encrypted bytes are stored
    // but we need to create a new file that stores this hash h
    let h2 = await addFile(h)
    // h2 is the hash of the file that stores the other hashes
    await storeRef(h2, privKey)
}