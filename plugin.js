let sessionKey
let masterPrivKey
let masterPubKey
let masterChainCode

async function getIdentifier()
	{
		const string = navigator.userAgent // for the moment, but TODO
		return sha256(string)
	}

	async function sha256(string) {
		const utf8 = new TextEncoder().encode(string);
		const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray
			.map((bytes) => bytes.toString(16).padStart(2, '0'))
			.join('');
	}

	function generateQrCode(qrContent) {
		return new QRCode("qr-code", {
			text: qrContent,
			width: 256,
			height: 256,
			colorDark: "#000000",
			colorLight: "#ffffff",
			correctLevel: QRCode.CorrectLevel.H,
		});
	}

	let qrContentInput = document.getElementById("qr-content");
	let qrGenerationForm =
		document.getElementById("qr-generation-form");
	let qrCode;

// Event listener for form submit event
	qrGenerationForm.addEventListener("submit", async function (event) {
		// Prevent form submission
		event.preventDefault();
		// add error handling
		try {
			await contract(qrContentInput.value);
			//let qrContent = qrContentInput.value;
			const key = await generateSessionKey();
			const hexKey = arrayBufferToHex(key);
			const id = await getIdentifier();
			let qrContent = hexKey + id;
			if (qrCode == null) {

				// Generate code initially
				qrCode = generateQrCode(qrContent);
			} else {

				// If code already generated then make
				// again using same object
				qrCode.makeCode(qrContent);
			}
		} catch (e) {
			alert(e);
		}
	});
	let qrButton = document.getElementById("qr-button");
	qrButton.disabled = true;

	let qrCodeDiv = document.getElementById("qr-code");

	qrContentInput.addEventListener("input", function () {
		qrButton.disabled = qrContentInput.value.trim() === "";
	});

	const button = document.querySelector("#contract");

	button.addEventListener("click", function onclick(event) {
		contract("0xf3d80c7165dd0104449792b3fa8f59b6ddf0a5bb")
		event.preventDefault();
	});

	const getTempButton = document.querySelector("#temp")
	getTempButton.addEventListener("click", async function onclick(event) {
		let temp = await getTemp();
		await decryptAES(temp)
		event.preventDefault();
	});

	const bip32Button = document.querySelector("#create")
	bip32Button.addEventListener("click", async function onclick(event) {
		let browserKeyPair = Bip32.fromPrivKey(BigInt('0x' + arrayBufferToHex(masterPrivKey)), BigInt('0x' + arrayBufferToHex(masterChainCode)))
		const j = await sha256(generateRandomURL())
		let child = await browserKeyPair.deriveChildKey(Bip32.HARDENED_BIT | parseInt(j.substring(0, 8), 16))
		console.log(child.getPrivateKey())
		console.log(child.getPublicKey())
		console.log(child.getChainCode())

		event.preventDefault();
	});

const storeIPFS = document.querySelector("#store")

async function navigation() {
	// Get the RefsList value from the SKM SC associated to PKi
	let ref = await getRef(arrayBufferToHex(masterPrivKey))
	// Initialize masterPrivKey and so on
	await decryptAES(await getTemp())
	let browserKeyPair = Bip32.fromPrivKey(BigInt('0x' + arrayBufferToHex(masterPrivKey)), BigInt('0x' + arrayBufferToHex(masterChainCode)))
	const j = await sha256(generateRandomURL())

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
	const c = await encryptWithPubKey('04' + arrayBufferToHex(masterPubKey), dappKey)

	// Encrypt the set (SKij, PKij, j) using the session key Kij (EncKij(SKij, PKij, j))
	const enc = new Uint8Array(await encryptAES(dappKey, data))

	if (ref === null) { // First time to store info in the IPFS
		await storeInNew(enc, c, arrayBufferToHex(masterPrivKey));
	}
	else { // there is previously a file in the IPFS
		await storeInPrevious(ref, enc, c, arrayBufferToHex(masterPrivKey));
	}
}

storeIPFS.addEventListener("click", async function onclick(event) {
	//const f = await getIPFS_IP()
	await navigation()
	event.preventDefault();
});

