document.getElementById("highlight").addEventListener("click", async () => {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (!tab?.id) return;
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                document.body.style.transition = "background 0.3s";
                document.body.style.background = "#fffae6";
            },
        });
    } catch (e) {
        console.error(e);
    }
});

document.getElementById("notify").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "greeting", text: "Hello from popup" });
    window.close();
});
