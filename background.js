/**
 * THIS SECTION HANDLES THE CREATION OF NEW TABS
 */

function handleCreated(tab) {
    console.log(tab.url);
}

function handleUpdated(tabId, changeInfo) {
    if (changeInfo.url) {
        console.log(`Tab: ${tabId} URL changed to ${changeInfo.url}`);
    }
}
chrome.tabs.onCreated.addListener(handleCreated);

chrome.tabs.onUpdated.addListener(handleUpdated);



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

chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
    // 2. A page requested user data, respond with a copy of `user`
    if (message === 'getIPFS_IP') {
        try {
           return readFile("IPFS_IP.txt");
        } catch (error) {
            console.error("Error reading file:", error);
            sendResponse({error: error.message}); // Send an error message
        }
    }
});
