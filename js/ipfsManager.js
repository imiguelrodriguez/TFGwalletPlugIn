let IPFS_IP

/**
 * Adds data to a file in the IPFS.
 *
 * This method takes some data to be written in a new file in the IPFS.
 * It performs a call to the "add" function of the IPFS RPC API. Lastly,
 * it returns the hash of the newly created file.
 *
 * @param {string} data - String containing the data to be appended.
 * @returns {Promise<string|null>} The hash of the newly created file.
 */
async function addFile(data) {
    try {
        const blob = new Blob([data], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', blob, 'my.txt');

        const response = await fetch(`${IPFS_IP}api/v0/add`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error(`Error adding file to IPFS: ${response.statusText}`);

        const res = await response.json();
        console.log("Added file to IPFS:", res.Hash);
        return res.Hash;
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}


/**
 * Gets data from a file in the IPFS.
 *
 * This method takes a hash indicating the file to be retrieved. It performs a "cat" call
 * to the IPFS RPC API to get the information inside the file. Lastly, the content is returned.
 *
 * @param {string} hash - String with the hash of the file.
 * @returns {Promise<string|null>} The content of the file.
 */
async function getFile(hash) {
    try {
        const formData = new FormData();
        formData.append('arg', hash);

        const response = await fetch(`${IPFS_IP}api/v0/cat`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error(`Error downloading from IPFS: ${response.statusText}`);

        const data = await response.blob();
        console.log("Downloaded data from IPFS (Blob):", data);
        return await data.text();
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

/**
 * Appends data to a file in the IPFS.
 *
 * This method takes some data to be appended to the data inside the
 * file specified by its hash. Since append is not possible, the content
 * of the file is first retrieved and then the new data is appended. Lastly
 * all this information is stored in a new file and its hash is returned.
 *
 * @param {string} data - String containing the data to be appended.
 * @param {string} hash - String with the hash of the file.
 * @returns {Promise<string|null>} The hash of the newly created file.
 */
async function append(data, hash) {
    const prevData = await getFile(hash);
    if (prevData === null) return null;
    else return await addFile(`${prevData}\n${data}`);
}


/**
 * Stores data in the IPFS if the reference stored in the SC is not null. That is, it exists
 * a previous file in the IPFS so that append is needed.
 * @param {string} ref - String with the hash of the previous file.
 * @param {Uint8Array} aesEnc - First encrypted message to be stored.
 * @param {Array} pubKeyEnc - Second encrypted message to be stored.
 * @param {string} privKey - Private key of the sender to get its address in the blockchain.
 */
async function storeInPrevious(ref, aesEnc, pubKeyEnc, privKey) {
    try {
        const hij = await addFile(`((${aesEnc.toString()});(${pubKeyEnc.toString()}))`);
        if (!hij) throw new Error("Failed to add file to IPFS.");

        const hiPrime = await append(hij, ref);
        if (!hiPrime) throw new Error("Failed to append file in IPFS.");

        await storeRef(hiPrime, privKey);
    } catch (error) {
        console.error("Error:", error);
    }
}

/**
 * Stores data in the IPFS if the reference stored in the SC is null. That is, there is no
 * previous file stored in the IPFS. Therefore, a new file is needed.
 * @param {Uint8Array} aesEnc - First encrypted message to be stored.
 * @param {Array} pubKeyEnc - Second encrypted message to be stored.
 * @param {string} privKey - Private key of the sender to get its address in the blockchain.
 */
async function storeInNew(aesEnc, pubKeyEnc, privKey) {
    try {
        const h = await addFile(`((${aesEnc.toString()});(${pubKeyEnc.toString()}))`);
        if (!h) throw new Error("Failed to add file to IPFS.");

        const h2 = await addFile(h);
        if (!h2) throw new Error("Failed to add second file to IPFS.");

        await storeRef(h2, privKey);
    } catch (error) {
        console.error("Error:", error);
    }
}