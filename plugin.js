
const DAPP_URL = "www.dapp.com" // example dApp URL
let contractObject
let browserKey
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


	const ipfsButton = document.querySelector("#ipfs")
	ipfsButton.addEventListener("click", async function onclick(event) {
		await fetchDataFromIPFS("QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4")
		event.preventDefault();
	});


	const bip32Button = document.querySelector("#create")
	bip32Button.addEventListener("click", async function onclick(event) {
		let browserKeyPair = Bip32.fromPrivKey(BigInt('0x' + arrayBufferToHex(masterPrivKey)), BigInt('0x' + arrayBufferToHex(masterChainCode)))
		const j = await sha256(DAPP_URL)
		let child = await browserKeyPair.deriveChildKey(Bip32.HARDENED_BIT | parseInt(j.substring(0, 8), 16))
		console.log(child.getPrivateKey())
		console.log(child.getPublicKey())
		console.log(child.getChainCode())

		event.preventDefault();
	});

const storeIPFS = document.querySelector("#store")
storeIPFS.addEventListener("click", async function onclick(event) {
	//const f = await getIPFS_IP()

	let ref = await getRef()
	if (ref === null) { // first time to store info in the IPFS
		// initialize masterPrivKey and so on
		await decryptAES(await getTemp())
		let browserKeyPair = Bip32.fromPrivKey(BigInt('0x' + arrayBufferToHex(masterPrivKey)), BigInt('0x' + arrayBufferToHex(masterChainCode)))
		const j = await sha256(DAPP_URL)
		let child = await browserKeyPair.deriveChildKey(Bip32.HARDENED_BIT | parseInt(j.substring(0, 8), 16))

		const dappKey = await generateSessionKeyDapp()

		// Encrypt the session key Kij (dappKey) using the Root Public Key PK0 (EncPK0(Kij)).
		const c = await encryptWithPubKey(dappKey)

		// Encrypt the set (SKij, PKij, j) using the session key Kij (EncKij(SKij, PKij, j))
		const data = {
			pubKey: hexStringToArrayBuffer(child.publicKey.toString(16)),
			privKey: hexStringToArrayBuffer(child.privateKey.toString(16)),
			chainCode: hexStringToArrayBuffer(child.chain.toString(16))
		}

		const enc = new Uint8Array(await encryptAES(dappKey, data))

		const h = await addFile("((" + c.toString() + "),(" + enc.toString() + "))")
		// h holds the hash of the file where the encrypted bytes are stored
		// but we need to create a new file that stores this hash h
		alert(h)
		let h2 = await addFile(h)
		// h2 is the hash of the file that stores the other hashes
		const ret = await getFile(h)
		alert(ret)
		if(h2 === null)
			h2 = "default"
		await storeRef(h2, arrayBufferToHex(masterPrivKey))

	}
	else { // there is previously a file in the IPFS
		// Get hi file from the IPFS (hiFile) - refs = hi
		const hiFile = getFile(ref)
		alert(hiFile)
		// Store the set ( EncKij (SKij , P Kij , j), EncP K0 (Kij ) ) in the IPFS.
		// This process returns the reference of the stored file (hij ).
		const hij = addFile("( EncKij (SKij , P Kij , j), EncP K0 (Kij ) )")
		// Update file_hi by appending hij .
		const hiPrime = append(hij, hiFile)
		alert(hiPrime)
		await storeRef(hiPrime)
	}
	event.preventDefault();
});

const enc = document.querySelector("#enc")
enc.addEventListener("click", async function onclick(event) {
	await generateSessionKeyDapp()
	const c = await encryptWithPubKey('hey')

	event.preventDefault();
});

const gasP = document.querySelector("#gasprice")
gasP.addEventListener("click", async function onclick(event) {
	await updateGasPrice()
	event.preventDefault();
});

