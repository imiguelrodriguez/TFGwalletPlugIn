function hexStringToArrayBuffer(hexString) {
    if(hexString.substring(0, 2) === '0x' || hexString.substring(0, 2) === '0X')
         hexString = hexString.substring(2)
    // Ensure the hex string has an even number of characters
    if (hexString.length % 2 !== 0) {
        throw new Error("Invalid hex string");
    }

    // Create an ArrayBuffer with length half of the hex string
    const arrayBuffer = new ArrayBuffer(hexString.length / 2);
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert each pair of hex characters to a byte
    for (let i = 0; i < hexString.length; i += 2) {
        uint8Array[i / 2] = parseInt(hexString.substring(i, i+2), 16);
    }

    return uint8Array;
}
function arrayBufferToHex(buffer) {
    // Convert the ArrayBuffer to a Uint8Array
    const uint8Array = new Uint8Array(buffer);
    // Create an empty string to store the hex representation
    let hexString = '';
    // Convert each byte to its hex representation
    for (const byte of uint8Array) {
        // Convert the byte to a hexadecimal string and append it to the result
        hexString += byte.toString(16).padStart(2, '0');
    }
    return hexString;
}
function bigIntToByteArray(number) {
    const hexString = number.toString(16);
    let tempBytes = new Uint8Array(hexString.length/2);
    let j = 0
    for (let i = 0; i < hexString.length; i += 2) {
        let byte = parseInt(hexString.substring(i, i + 2), 16);
        if (byte > 127) {
            byte = -(~byte & 0xFF) - 1;
        }
        tempBytes[j] = byte;
        j++
    }
    return tempBytes
}

async function getIPFS_IP() {

    chrome.runtime.sendMessage("getIPFS_IP")
        .then(result => {
            return result;
        })
        .catch(error => {
            console.error("Error getting IPFS IP:", error);
        });
}


