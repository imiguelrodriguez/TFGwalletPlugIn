let sessionKey
let masterPrivKey
let masterPubKey
let masterChainCode

document.addEventListener('DOMContentLoaded', async (event) => {
    const dappElement = document.getElementById('dapp');
    const notConfiguredElement = document.querySelector('.not-configured');

    // Retrieve the state from local storage
    const dappDisable = localStorage.getItem('dappDisable');

    // Apply the state to the elements
    if (dappElement) {
        dappElement.disabled = dappDisable === 'false';
    } else {
        console.error('Element with class "dapp" not found');
    }

    if (notConfiguredElement) {
        notConfiguredElement.style.display = dappDisable === 'true' ? 'none' : 'grid';
    } else {
        console.error('Element with class "not-configured" not found');
    }

    // Initialize masterPrivKey and so on
    try {
        let encryptedKeys = localStorage.getItem('rootKeys');
        if (encryptedKeys === undefined || encryptedKeys === null) {
            let encryptedKeys = await getTemp();
            localStorage.setItem('rootKeys', encryptedKeys)
        }
        await decryptAES(encryptedKeys)
        updateNewDappButton('true')
    } catch (error) {
        console.error(error);
    }
});

const newDapp = document.querySelector("#dapp")

async function navigation() {

    let browserKeyPair = Bip32.fromPrivKey(BigInt('0x' + arrayBufferToHex(masterPrivKey)), BigInt('0x' + arrayBufferToHex(masterChainCode)))
    const j = await sha256(generateRandomURL())
    // Get the RefsList value from the SKM SC associated to PKi
    let ref = await getRef(arrayBufferToHex(masterPrivKey))
    // Derive child key for dApp
    let child = await browserKeyPair.deriveChildKey(Bip32.HARDENED_BIT | parseInt(j.substring(0, 8), 16))
    const dappKey = await generateSessionKeyDapp()

    const data = {
        pubKey: hexStringToArrayBuffer(child.publicKey.toString(16)),
        privKey: hexStringToArrayBuffer(child.privateKey.toString(16)),
        chainCode: hexStringToArrayBuffer(child.chain.toString(16)),
        dAppID: j
    }

    // Encrypt the session key Kij (dappKey) using the Root Public Key PK0 (EncPK0(Kij)).
    const removeLeadingZeros = (str) => str.replace(/^0+/, '') || '0';

    const pubKey = (await getPubKey()).substring(2);
    const cleanedPubKey = removeLeadingZeros(pubKey);
    const c = await encryptWithPubKey('04' + cleanedPubKey, dappKey)

    // Encrypt the set (SKij, PKij, j) using the session key Kij (EncKij(SKij, PKij, j))
    const enc = new Uint8Array(await encryptAESHandler(dappKey, data))
    if (ref != null) {
        if (ref === "") { // First time to store info in the IPFS
            await storeInNew(enc, c, arrayBufferToHex(masterPrivKey));
        } else { // there is previously a file in the IPFS
            await storeInPrevious(ref, enc, c, arrayBufferToHex(masterPrivKey));
        }
    }
}

newDapp.addEventListener("click", async function onclick(event) {
    //const f = await getIPFS_IP()
    // Get the button element
    const button = document.getElementById('dapp');
    const originalClass = button.className;
    // Change the background color to the disabled background color
    button.style.backgroundColor = "#4f1fcc";
    // Change button content to show spinner and "Loading..." text
    button.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Loading...
    `;

    // Disable the button to prevent further clicks
    button.disabled = true;

    try {
        await navigation();
    } catch (error) {
        console.error("Navigation error:", error);
    } finally {
        button.innerHTML = 'New dApp';
        button.className = originalClass;
        button.style.backgroundColor = '';
        button.style.border = '';
        button.removeAttribute('disabled');
    }
    event.preventDefault();
});


function updateNewDappButton(value) {
    // Save the state to local storage
    localStorage.setItem('dappDisable', value);
}
