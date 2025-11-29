# 🔧 故障排查指南

## 問題：打開 Google Meet 後仍顯示「Waiting for Google Meet to start...」

### 原因分析

此問題通常由以下原因引起：

1. ❌ Content Script 沒有正確注入到 Google Meet 頁面
2. ❌ DOM 選擇器過時（Google Meet UI 經常更新）
3. ❌ 消息沒有正確傳遞到 Service Worker
4. ❌ Side Panel 沒有正確連接到 Service Worker

---

## 📋 診斷步驟

### 步驟 1：驗證 Content Script 是否已注入

**在 Google Meet 頁面上執行：**

1. 按 `F12` 打開 DevTools
2. 在控制台 (Console) 標籤中輸入：
    ```javascript
    document.querySelectorAll('[aria-label*="speaking"]').length;
    ```
3. 如果結果 > 0，說明 Google Meet 頁面已加載

**查看日誌：**

-   在控制台中查找 `[ContentScript]` 開頭的日誌
-   應該看到類似：
    ```
    [ContentScript] Google Meet Interview Assistant loaded
    [ContentScript-Monitor] Initializing transcript monitoring...
    [ContentScript-DetectSpeaker] Attempting to detect speaker...
    ```

**如果沒有看到日誌：**

-   [ ] 檢查 `manifest.json` 中的 `content_scripts` 配置是否正確
-   [ ] 確保 `matches` 模式是 `https://meet.google.com/*`
-   [ ] 在 chrome://extensions/ 中卸載並重新加載擴展

---

### 步驟 2：驗證 DOM 元素是否存在

**在 Google Meet 頁面上執行：**

1. 打開 DevTools（F12）
2. 在控制台執行以下命令逐一檢查：

```javascript
// 檢查說話者元素
console.log("=== 說話者元素 ===");
console.log("[data-name]:", document.querySelectorAll("[data-name]").length);
console.log(
    "[aria-label*='is speaking']:",
    document.querySelectorAll("[aria-label*='is speaking']").length
);
console.log(
    "[aria-label*='is presenting']:",
    document.querySelectorAll("[aria-label*='is presenting']").length
);

// 檢查字幕元素
console.log("=== 字幕元素 ===");
console.log(
    "[data-caption-text]:",
    document.querySelectorAll("[data-caption-text]").length
);
console.log(
    "[aria-live='polite']:",
    document.querySelectorAll("[aria-live='polite']").length
);
console.log(
    "[aria-live='assertive']:",
    document.querySelectorAll("[aria-live='assertive']").length
);
```

**期望結果：**

-   至少有一個計數 > 0（找到元素）
-   如果都是 0，說明選擇器可能需要更新

---

### 步驟 3：手動測試元素提取

**在 Google Meet 頁面上執行：**

```javascript
// 測試說話者檢測
function testDetectSpeaker() {
    const selectors = [
        "[data-name]",
        "[aria-label*='is speaking']",
        "[aria-label*='is presenting']",
    ];

    for (let selector of selectors) {
        const els = document.querySelectorAll(selector);
        console.log(
            `${selector}:`,
            Array.from(els)
                .map((e) => e.textContent?.trim())
                .filter((t) => t?.length > 0)
        );
    }
}

// 測試字幕檢測
function testDetectCaption() {
    const selectors = [
        "[data-caption-text]",
        "[aria-live='polite']",
        "[aria-live='assertive']",
    ];

    for (let selector of selectors) {
        const els = document.querySelectorAll(selector);
        console.log(
            `${selector}:`,
            Array.from(els)
                .map((e) => e.textContent?.trim())
                .filter((t) => t?.length > 0)[0]
        );
    }
}

testDetectSpeaker();
testDetectCaption();
```

**根據結果找到有效的選擇器，記下它們。**

---

### 步驟 4：驗證消息傳遞

**檢查 Service Worker 是否收到消息：**

1. 打開 chrome://extensions/
2. 找到你的擴展，點擊「Service worker」開啟其 DevTools
3. 打開 Google Meet 頁面並講幾句話
4. 查看 Service Worker DevTools 中的日誌，應該看到：
    ```
    [ServiceWorker] Message received: TRANSCRIPT_UPDATE
    [ServiceWorker] Transcript update received: {...}
    ```

**如果沒有看到：**

-   [ ] Content Script 可能沒有正確發送消息
-   [ ] 檢查 manifest.json 中的 `permissions`
-   [ ] 確保 `"activeTab"` 權限已添加

---

### 步驟 5：驗證 Side Panel 連接

**在 Side Panel 中執行（右鍵 → 檢查）：**

1. 在 Side Panel 上右鍵 → Inspect
2. 在打開的 DevTools 控制台執行：

    ```javascript
    // 查看連接日誌
    document.querySelectorAll("*"); // 檢查是否有日誌輸出
    ```

3. 查看 Side Panel DevTools 中的日誌，應該看到：
    ```
    [SidePanel] Connecting to service worker...
    [SidePanel] Connection established
    [SidePanel] Service worker message: TRANSCRIPT_UPDATED
    ```

**如果連接失敗：**

-   [ ] 檢查 manifest.json 中是否有 `sidePanel` 配置
-   [ ] 確保 Side Panel HTML 路徑正確
-   [ ] 在 Side Panel 中檢查是否有 JavaScript 錯誤

---

## 🔍 常見問題及解決方案

### 問題 A：「Waiting for Google Meet to start...」始終顯示

**解決步驟：**

1. 在 Google Meet 頁面測試所有選擇器（步驟 3）
2. 根據結果更新 `content-script.js` 中的選擇器
3. 在 chrome://extensions/ 中重新加載擴展
4. 刷新 Google Meet 頁面

**如果仍未解決：**

```javascript
// 在 DevTools 中執行查看所有可能的元素
document.querySelectorAll("[role]"); // 按 role 查找
document.querySelectorAll("[data-*]"); // 按 data 屬性查找
document.querySelectorAll("[aria-*]"); // 按 aria 屬性查找
```

---

### 問題 B：消息在控制台中出現但 UI 不更新

**原因：** Side Panel 可能沒有正確連接或監聽消息

**解決步驟：**

1. 在 Side Panel DevTools 中查看錯誤
2. 檢查 `sidepanel.js` 中的 `connectToServiceWorker()` 函數
3. 驗證 Port 連接是否建立
4. 檢查是否有 JavaScript 錯誤

---

### 問題 C：API 調用失敗（Fetch 錯誤）

**原因：** 可能是 CORS 或權限問題

**解決步驟：**

1. 在 manifest.json 中添加必要的權限：

    ```json
    "permissions": ["storage", "sidePanel", "activeTab", "scripting"]
    "host_permissions": ["https://meet.google.com/*"]
    ```

2. 檢查 Network 標籤中的 API 調用
3. 查看響應狀態和錯誤信息

---

## 🛠️ 高級調試技巧

### 技巧 1：啟用詳細日誌

在 `content-script.js` 中添加：

```javascript
// 在文件頂部
const DEBUG = true;

// 然後在每個函數中
if (DEBUG) console.log("詳細信息");
```

### 技巧 2：使用 Chrome 遠程調試

如果需要調試 Service Worker：

```bash
chrome --remote-debugging-port=9222
```

然後在 `chrome://inspect` 中查看

### 技巧 3：查看 Storage 數據

在 DevTools 中：

1. 打開 Application 標籤
2. 左側選擇 Storage → Local Storage
3. 查看保存的 webhook URL 等數據

### 技巧 4：測試消息發送

在 Service Worker DevTools 中執行：

```javascript
// 模擬發送消息給所有 Port
state.activeConnections.forEach((port) => {
    port.postMessage({
        type: "TRANSCRIPT_UPDATED",
        data: {
            speaker: "Test Speaker",
            transcript: "This is a test",
        },
    });
});
```

---

## 📞 如果問題仍未解決

### 收集調試信息

1. **控制台日誌**

    - 在 Google Meet：F12 → Console，複製所有 `[ContentScript]` 日誌
    - 在 Service Worker DevTools：複製所有 `[ServiceWorker]` 日誌
    - 在 Side Panel：複製所有 `[SidePanel]` 日誌

2. **DOM 信息**

    - 在 Google Meet 中執行步驟 2 的命令
    - 複製結果

3. **Manifest 配置**

    - 驗證 manifest.json 中的所有配置

4. **創建 Issue**
    - 附加上述信息
    - 說明你的 Chrome 版本
    - 說明 Google Meet 的 URL

---

## 📚 相關資源

| 資源                    | 連結                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Chrome DevTools 指南    | [developer.chrome.com/docs/devtools](https://developer.chrome.com/docs/devtools/)                                             |
| Content Script 官方文檔 | [developer.chrome.com/docs/extensions/mv3/content_scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/) |
| Service Worker 官方文檔 | [developer.chrome.com/docs/extensions/mv3/service_workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/) |

---

**更新時間：** 2024-11-29  
**版本：** 1.0
