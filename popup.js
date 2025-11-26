const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
let isCapturing = false;

// 状态消息
function setStatus(msg, type = "info") {
    statusEl.textContent = msg;
    statusEl.className = `status ${type}`;
}

// 刷新显示逐字稿
async function refreshTranscript() {
    try {
        const data = await chrome.storage.local.get("captions");
        const captions = data.captions || [];
        transcriptEl.innerHTML = "";

        if (captions.length === 0) {
            transcriptEl.innerHTML =
                '<div class="caption-item" style="color: #999;">暂无字幕</div>';
            return;
        }

        captions.forEach((cap, idx) => {
            const div = document.createElement("div");
            div.className = "caption-item";
            const time = new Date(cap.timestamp).toLocaleTimeString("zh-CN");
            div.innerHTML = `<strong>${time}</strong>: ${cap.text}`;
            transcriptEl.appendChild(div);
        });

        transcriptEl.scrollTop = transcriptEl.scrollHeight;
    } catch (e) {
        console.error("Error refreshing transcript:", e);
    }
}

// 開始抓取
document.getElementById("start").addEventListener("click", async () => {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (!tab?.url?.includes("meet.google.com")) {
            setStatus("請在 Google Meet 上運行", "error");
            return;
        }

        isCapturing = true;
        setStatus("正在抓取...", "success");
        document.getElementById("start").disabled = true;

        // 定期刷新显示
        const interval = setInterval(() => {
            if (!isCapturing) {
                clearInterval(interval);
                return;
            }
            refreshTranscript();
        }, 1000);
    } catch (e) {
        setStatus("錯誤: " + e.message, "error");
        console.error(e);
    }
});

// 停止抓取
document.getElementById("stop").addEventListener("click", () => {
    isCapturing = false;
    document.getElementById("start").disabled = false;
    setStatus("已停止", "info");
    refreshTranscript();
});

// 導出逐字稿
document.getElementById("export").addEventListener("click", async () => {
    try {
        const data = await chrome.storage.local.get("captions");
        const captions = data.captions || [];

        if (captions.length === 0) {
            setStatus("沒有要導出的字幕", "error");
            return;
        }

        let text = "Google Meet 逐字稿\n";
        text += "生成時間: " + new Date().toLocaleString("zh-CN") + "\n";
        text += "=".repeat(50) + "\n\n";

        captions.forEach((cap) => {
            const time = new Date(cap.timestamp).toLocaleTimeString("zh-CN");
            text += `[${time}] ${cap.text}\n`;
        });

        // 使用 Chrome downloads API
        const blob = new Blob([text], { type: "text/plain; charset=utf-8" });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: `Meet-Caption-${new Date().getTime()}.txt`,
            saveAs: true,
        });

        setStatus("正在下載...", "success");
        setTimeout(() => {
            URL.revokeObjectURL(url);
            setStatus("下載完成", "success");
        }, 1000);
    } catch (e) {
        setStatus("導出失敗: " + e.message, "error");
        console.error(e);
    }
});

// 清空逐字稿
document.getElementById("clear").addEventListener("click", async () => {
    try {
        await chrome.storage.local.set({ captions: [] });
        transcriptEl.innerHTML =
            '<div class="caption-item" style="color: #999;">暂无字幕</div>';
        setStatus("已清空", "success");
    } catch (e) {
        setStatus("清空失敗", "error");
        console.error(e);
    }
});

// 初始化
document.addEventListener("DOMContentLoaded", () => {
    refreshTranscript();
});
