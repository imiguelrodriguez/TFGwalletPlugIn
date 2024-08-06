async function getIdentifier()
{
	const string = navigator.userAgent // for the moment, but TODO
	return sha256(string)
}

function generateQrCode(qrContent, elementID) {
	return new QRCode(elementID, {
		text: qrContent,
		width: 256,
		height: 256,
		colorDark: "#000000",
		colorLight: "#ffffff",
		correctLevel: QRCode.CorrectLevel.H,
	});
}

let qrContentInput = document.getElementById("qr-content");
let qrGenerationForm = document.getElementById("qr-generation-form");
let qrCode;
let qrButton = document.getElementById("qr-button");
let previousQrContent = ""
let qrRecoveryButton = document.getElementById("recover");
// Initialize button state
qrButton.disabled = true;

// Handle QR code generation form submission
qrGenerationForm.addEventListener("submit", async function (event) {
	event.preventDefault();
	try {
		await handleQrGeneration();
	} catch (error) {
		alert(error);
	}
});

// Handle input change event to enable/disable the button
qrContentInput.addEventListener("input", function () {
	const currentQrContent = qrContentInput.value.trim();
	qrButton.disabled = !currentQrContent || currentQrContent === previousQrContent;
});

// Generate QR code and update previous content
async function handleQrGeneration() {
	contractAdd = qrContentInput.value;
	localStorage.setItem("contractAddress", contractAdd);
	await initContract(qrContentInput.value);
	const key = await generateSessionKey();
	const hexKey = arrayBufferToHex(key);
	const id = await getIdentifier();
	const qrContent = hexKey + id;

	if (!qrCode) {
		qrCode = generateQrCode(qrContent, "qr-code");
	} else {
		qrCode.makeCode(qrContent);
	}

	previousQrContent = qrContentInput.value;
	qrButton.disabled = true;
}

async function handleQrRecoveryGeneration() {
	const id = await getIdentifier();
	if (!qrCode) {
		qrCode = generateQrCode(id, "qr-code-recover");
	} else {
		qrCode.makeCode(id);
	}
	qrRecoveryButton.disabled = true;
}

document.addEventListener("DOMContentLoaded", function() {
	const dappDisable = localStorage.getItem('dappDisable');
	qrContentInput.disabled = !!dappDisable;

	if (dappDisable) {
		qrRecoveryButton.disabled = false;
		// Add attributes to the input field
		qrContentInput.setAttribute('data-bs-toggle', 'tooltip');
		qrContentInput.setAttribute('data-bs-placement', 'top');
		qrContentInput.setAttribute('title', 'Plugin already set up!');
	    new bootstrap.Tooltip(qrContentInput);
	}
});

qrRecoveryButton.addEventListener("click", async function (event) {
	event.preventDefault();
	try {
		await handleQrRecoveryGeneration()
	} catch (error) {
		alert(error);
	}
});
