// Simple service worker background script
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message && message.type === "greeting") {
        console.log("Background received:", message.text, "from", sender);
    }
});
