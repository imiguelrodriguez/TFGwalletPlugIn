

async function readFile(file) {
    const url = chrome.runtime.getURL(file);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching file: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Error reading file:", error);
        throw error; // Re-throw the error for handling in onMessage
    }

}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'getIPFS_IP') {
        // Indicate that sendResponse will be called asynchronously
        (async () => {
            try {
                const fileContent = await readFile("IPFS_IP.txt");
                sendResponse({fileContent});
            } catch (error) {
                console.error("Error reading file:", error);
                sendResponse({ error: error.message }); // Send an error message
            }
        })();

        // Return true to indicate that the response will be sent asynchronously
        return true;
    }
});
