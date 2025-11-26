// Service Worker for Google Meet Caption Grabber
console.log("[Meet Caption Grabber] Background service worker started");

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "caption-update") {
        console.log(
            "[Meet Caption Grabber] Received captions:",
            message.data.length
        );

        // 保存到 storage
        chrome.storage.local
            .set({
                captions: message.data,
                lastUpdate: Date.now(),
            })
            .then(() => {
                console.log("[Meet Caption Grabber] Captions saved to storage");
                sendResponse({ success: true });
            })
            .catch((err) => {
                console.error("[Meet Caption Grabber] Storage error:", err);
                sendResponse({ success: false, error: err.message });
            });

        return true; // 保持通道打开以发送异步响应
    }
});

// 定期检查并清理超过 24 小时的数据
chrome.alarms.create("cleanup", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "cleanup") {
        chrome.storage.local.get(["lastUpdate"], (data) => {
            const lastUpdate = data.lastUpdate || 0;
            const now = Date.now();

            // 如果超过 24 小时未更新，清空数据
            if (now - lastUpdate > 24 * 60 * 60 * 1000) {
                chrome.storage.local.remove("captions");
                console.log("[Meet Caption Grabber] Old captions cleared");
            }
        });
    }
});
