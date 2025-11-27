# 🔧 技術棧詳細說明

> Google Meet Interview Assistant Chrome Extension - 完整技術文檔

## 📋 目錄

-   [核心技術](#核心技術)
-   [架構和 API](#架構和api)
-   [主要函數](#主要函數)
-   [依賴和工具](#依賴和工具)
-   [推薦學習資源](#推薦學習資源)
-   [外部集成](#外部集成)

---

## 核心技術

### 1. Chrome Extension Manifest V3

**版本:** Manifest V3（最新標準）

**主要特性:**

-   Service Worker 替代 Background Page
-   Content Security Policy 增強
-   Dynamic Content Script 支持
-   Native Promise-based APIs

**相關 API:**

-   `chrome.runtime` - 消息傳遞
-   `chrome.storage.local` - 本地數據存儲
-   `chrome.sidePanel` - 側面板管理
-   `chrome.tabs` - 標籤頁管理
-   `chrome.scripting` - 動態腳本注入

**學習資源:**

-   [Chrome Manifest V3 官方文檔](https://developer.chrome.com/docs/extensions/mv3/)
-   [Chrome Extension API 參考](https://developer.chrome.com/docs/extensions/reference/)
-   [Chrome Extension 最佳實踐](https://developer.chrome.com/docs/extensions/mv3/best_practices/)

---

### 2. Vanilla JavaScript (ES6+)

**特性:** 無框架依賴，純原生 JavaScript

**使用的 ES6+ 特性:**

```javascript
// 箭頭函數
const handler = (data) => {
    /* ... */
};

// 解構賦值
const { transcript, speaker } = data;

// 模板字符串
console.log(`[${PREFIX}] Message: ${message}`);

// 異步/等待
async function fetchData() {
    const response = await fetch(url);
    return response.json();
}

// Promise 鏈
port.onMessage.addListener((msg) => {
    return processMessage(msg).then((result) => sendResponse(result));
});

// Map 和 Set 數據結構
const connections = new Map();
```

**學習資源:**

-   [MDN - JavaScript ES6+ 特性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
-   [JavaScript Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
-   [異步 JavaScript 完整指南](https://javascript.info/async)

---

### 3. DOM 操作和監控

**技術:** MutationObserver、DOM Selection、事件監聽

**核心實現:**

```javascript
// MutationObserver 監控 DOM 變化
const observer = new MutationObserver((mutations) => {
    // 監控 Google Meet 的字幕和發言人變化
});

// CSS 選擇器查詢
const speaker = document.querySelector('[role="presentation"] span');

// 事件監聽
element.addEventListener("click", handler);

// 動態 HTML 更新
document.getElementById("transcriptContent").innerHTML += `<div>${text}</div>`;
```

**學習資源:**

-   [MDN - MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
-   [MDN - DOM Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Document_querySelector)
-   [MDN - DOM Events](https://developer.mozilla.org/en-US/docs/Web/Events)

---

### 4. CSS3 和現代樣式

**特性:** Flexbox、Grid、CSS 動畫、深色模式支持

**核心技術:**

```css
/* 響應式佈局 */
.container {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

/* 深色模式支持 */
body.dark-mode {
    background: #1a202c;
    color: #e2e8f0;
}

/* CSS 動畫 */
@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* 漸層背景 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**學習資源:**

-   [CSS-Tricks - Flexbox 完整指南](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
-   [CSS-Tricks - CSS Grid 完整指南](https://css-tricks.com/snippets/css/complete-guide-grid/)
-   [MDN - CSS 動畫](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
-   [MDN - CSS 深色模式](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

---

## 架構和 API

### 應用架構圖

```
┌─────────────────────────────────────────────────────────┐
│                   Google Meet 網頁                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Content Script (content-script.js)       │   │
│  │  ✓ 監控 DOM 變化                                 │   │
│  │  ✓ 檢測發言人和字幕                             │   │
│  │  ✓ MutationObserver 300ms 去抖動               │   │
│  │  ✓ 發送消息到 Service Worker                   │   │
│  └──────────────────┬───────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────┘
                      │ chrome.runtime.sendMessage
                      ▼
         ┌────────────────────────────┐
         │   Service Worker (後臺)    │
         │  (service-worker.js)       │
         │                            │
         │  ✓ 消息路由器              │
         │  ✓ 存儲管理                │
         │  ✓ Webhook 通訊            │
         │  ✓ 廣播更新到側面板       │
         │  ✓ 標籤頁監控             │
         └──────────┬────────┬────────┘
                    │        │
      chrome.       │        │ chrome.runtime.
      storage.      │        │ connect (port)
      local get/set │        │
                    ▼        ▼
         ┌────────────────────────────┐
         │    n8n Webhook Endpoint    │
         │  (外部 AI 處理)            │
         │                            │
         │  ✓ 處理轉錄文本            │
         │  ✓ 生成會議筆記            │
         │  ✓ 移除已回答問題          │
         └────────────────────────────┘
                    ▲
                    │ fetch API
                    │
         ┌──────────┴────────────────────┐
         │   WebhookUtil                 │
         │  (dist/utils/webhook.js)      │
         │                               │
         │  ✓ POST 請求構建              │
         │  ✓ URL 驗證                   │
         │  ✓ 響應解析                   │
         └───────────────────────────────┘
                    ▲
                    │
         ┌──────────┴────────────────────┐
         │   Side Panel (UI)             │
         │  (sidepanel.html/js)          │
         │                               │
         │  ✓ 雙面板界面                 │
         │  ✓ 實時更新                   │
         │  ✓ Webhook 配置               │
         │  ✓ 深色模式                   │
         │  ✓ 用戶交互                   │
         └───────────────────────────────┘
```

### Chrome 消息傳遞 API

#### 消息類型常量

```javascript
const MESSAGE_TYPES = {
    // 內容腳本 → Service Worker
    TRANSCRIPT_UPDATE: "TRANSCRIPT_UPDATE", // 更新轉錄
    SUBMIT_TRANSCRIPT: "SUBMIT_TRANSCRIPT", // 提交轉錄
    SAVE_WEBHOOK_URL: "SAVE_WEBHOOK_URL", // 保存 Webhook

    // Service Worker → 側面板
    CONNECTION_ESTABLISHED: "CONNECTION_ESTABLISHED",
    TRANSCRIPT_UPDATED: "TRANSCRIPT_UPDATED",
    NOTES_UPDATED: "NOTES_UPDATED",
    WEBHOOK_CONFIGURED: "WEBHOOK_CONFIGURED",
    SYNC_STARTED: "SYNC_STARTED",
    SYNC_COMPLETED: "SYNC_COMPLETED",
};
```

#### 消息格式

**內容腳本發送:**

```javascript
chrome.runtime.sendMessage(
    {
        type: "TRANSCRIPT_UPDATE",
        data: {
            speaker: "John Doe",
            transcript: "Hello everyone...",
            timestamp: Date.now(),
            meetingId: "abc-defg-hij",
        },
    },
    (response) => {
        console.log("Service Worker 已處理");
    }
);
```

**Service Worker 廣播:**

```javascript
// 通過端口發送
port.postMessage({
  type: "NOTES_UPDATED",
  data: {
    notes: [...],
    timestamp: Date.now()
  }
});
```

**學習資源:**

-   [Chrome Extension Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)
-   [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
-   [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/tabs/)

---

## 主要函數

### Content Script (`dist/content-script.js`)

#### 1. `detectSpeaker()` - 檢測當前發言人

```javascript
/**
 * 檢測 Google Meet 中的當前發言人
 * @returns {string} 發言人名稱或 "Unknown Speaker"
 */
function detectSpeaker() {
    // 多個 CSS 選擇器嘗試
    // 1. 嘗試主發言人卡片
    // 2. 嘗試參與者列表中的活躍成員
    // 3. 嘗試發言指示器
    // 回退到 "Unknown Speaker"
}
```

#### 2. `detectCaption()` - 檢測字幕文本

```javascript
/**
 * 從 Google Meet 界面檢索即時字幕
 * @returns {string} 字幕文本或空字符串
 */
function detectCaption() {
    // 查詢字幕容器
    // 提取文本內容
    // 清理空白
}
```

#### 3. `initializeTranscriptMonitoring()` - 初始化監控

```javascript
/**
 * 設置 MutationObserver 監控轉錄變化
 * 包含 300ms 去抖動以減少事件
 */
function initializeTranscriptMonitoring() {
    // MutationObserver 設置
    // 目標：演講者卡片、字幕、參與者列表
    // 回調：300ms 去抖動 → 發送更新
}
```

**學習資源:**

-   [Google Meet DOM 結構分析](https://github.com/search?q=google+meet+dom+selectors)

---

### Service Worker (`dist/service-worker.js`)

#### 1. `handleTranscriptUpdate()` - 處理轉錄更新

```javascript
/**
 * 處理來自內容腳本的轉錄更新
 * @param {Object} data - 轉錄數據
 * @param {Object} sender - 消息發送者信息
 * @param {Function} sendResponse - 響應回調
 */
async function handleTranscriptUpdate(data, sender, sendResponse) {
    // 1. 驗證數據
    // 2. 存儲到 chrome.storage.local
    // 3. 廣播到側面板
    // 4. 發送響應
}
```

#### 2. `handleSubmitTranscript()` - 提交到 n8n

```javascript
/**
 * 發送轉錄到 n8n Webhook 進行 AI 處理
 * @param {Object} data - 轉錄數據
 * @param {Object} sender - 消息發送者
 * @param {Function} sendResponse - 響應回調
 */
async function handleSubmitTranscript(data, sender, sendResponse) {
    // 1. 獲取 Webhook URL
    // 2. 構建請求負載
    // 3. 發送 POST 到 n8n
    // 4. 解析響應
    // 5. 存儲會議筆記
    // 6. 廣播更新
}
```

#### 3. `broadcastToSidePanels()` - 廣播消息

```javascript
/**
 * 向所有連接的側面板發送消息
 * @param {Object} message - 消息對象
 */
function broadcastToSidePanels(message) {
    // 遍歷活躍連接
    // 發送消息到每個端口
    // 錯誤處理
}
```

**學習資源:**

-   [Chrome Service Worker 生命週期](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
-   [異步消息處理最佳實踐](https://developer.chrome.com/docs/extensions/mv3/messaging/#connect)

---

### Side Panel (`dist/sidepanel.js`)

#### 1. `connectToServiceWorker()` - 建立連接

```javascript
/**
 * 創建持久連接到 Service Worker
 * 用於實時消息接收
 */
function connectToServiceWorker() {
    // 使用 chrome.runtime.connect() 建立端口
    // 設置消息監聽器
    // 處理斷開連接
}
```

#### 2. `updateTranscriptUI()` - 更新轉錄界面

```javascript
/**
 * 使用新轉錄數據更新 DOM
 * @param {Object} transcriptData - 轉錄對象
 */
function updateTranscriptUI(transcriptData) {
    // 創建 HTML 元素
    // 添加到 DOM
    // 自動滾動到底部
    // 動畫效果
}
```

#### 3. `toggleDarkMode()` - 切換深色模式

```javascript
/**
 * 切換深色模式並保存偏好
 */
function toggleDarkMode() {
    // 切換 class: document.documentElement.classList.toggle("dark-mode")
    // 保存到 chrome.storage.local
    // 更新按鈕圖標
}
```

#### 4. `submitTranscript()` - 提交轉錄

```javascript
/**
 * 通過 Service Worker 將轉錄提交到 n8n
 */
function submitTranscript() {
    // 收集當前轉錄
    // 發送消息給 Service Worker
    // 顯示加載指示器
    // 等待響應
    // 更新 UI
}
```

---

### Utility 模塊

#### StorageUtil (`dist/utils/storage.js`)

```javascript
// 主要函數
async saveWebhookUrl(url)           // 保存 Webhook URL
async getWebhookUrl()               // 獲取 Webhook URL
async saveTranscript(data)          // 保存轉錄
async getUnsyncedTranscripts()      // 獲取未同步轉錄
async markTranscriptSynced(id)      // 標記為已同步
async saveMeetingNotes(data)        // 保存會議筆記
async getMeetingNotes()             // 獲取會議筆記
async clearAll()                    // 清除所有數據（調試用）
```

**學習資源:**

-   [Chrome Storage API 詳解](https://developer.chrome.com/docs/extensions/reference/storage/)

#### WebhookUtil (`dist/utils/webhook.js`)

```javascript
// 主要函數
async sendToWebhook(data, url)          // 發送 POST 請求
validateWebhookUrl(url)                 // URL 格式驗證
parseWebhookResponse(response)          // 解析 n8n 響應
```

**Webhook 請求格式:**

```json
{
    "meetingId": "abc-defg-hij",
    "timestamp": "2024-11-27T10:30:00.000Z",
    "speaker": "John Doe",
    "transcript": "Full interview transcript...",
    "metadata": {
        "extensionId": "chrome-extension-id",
        "capturedAt": "2024-11-27T10:30:00.000Z",
        "type": "TRANSCRIPT_SUBMISSION"
    }
}
```

**預期的 n8n 響應格式:**

```json
{
    "success": true,
    "message": "Transcript processed successfully",
    "updatedNotes": [
        {
            "id": "q1",
            "question": "What is your experience with X?",
            "hint": "Look for specific technical details"
        }
    ],
    "removedQuestions": ["q5", "q7"]
}
```

**學習資源:**

-   [Fetch API 完整指南](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
-   [HTTP POST 請求](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST)

#### MessageUtil (`dist/utils/message.js`)

```javascript
// 主要函數
async sendToServiceWorker(msg)              // 發送消息到 Service Worker
async sendFromSidePanel(msg)                // 從側面板發送消息
connectSidePanel()                          // 創建側面板連接
registerServiceWorkerListener(callback)     // 註冊監聽器
registerPortListener(port, callback)        // 註冊端口監聽器
```

---

## 依賴和工具

### 無外部依賴（純 Vanilla）

✓ 沒有 React、Vue、Angular
✓ 沒有 npm 包
✓ 沒有構建工具（webpack、babel）
✓ 完全依賴 Chrome Extension API 和標準 Web API

### 開發工具

| 工具                     | 用途                | 文檔                                                                |
| ------------------------ | ------------------- | ------------------------------------------------------------------- |
| Chrome DevTools          | 調試擴展            | [Chrome DevTools 指南](https://developer.chrome.com/docs/devtools/) |
| Service Worker Inspector | 後臺進程調試        | 在 `chrome://extensions/` 中                                        |
| Content Script Debugger  | 內容腳本調試        | 在網頁 DevTools 中查看 `[ContentScript]` 日誌                       |
| Network Tab              | 監控 Webhook 請求   | Chrome DevTools → Network                                           |
| Storage Inspector        | 查看 chrome.storage | Chrome DevTools → Application → Storage                             |

---

## 推薦學習資源

### 必讀

1. **Chrome Extension 官方文檔**

    - [Manifest V3 指南](https://developer.chrome.com/docs/extensions/mv3/)
    - [Service Workers 在擴展中的使用](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
    - [消息傳遞完整指南](https://developer.chrome.com/docs/extensions/mv3/messaging/)

2. **JavaScript 核心知識**

    - [MDN - JavaScript 完整指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
    - [现代 JavaScript 教程](https://javascript.info/)
    - [異步 JavaScript 完全指南](https://javascript.info/async)

3. **Web API**
    - [DOM API 參考](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
    - [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
    - [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

### 進階主題

| 主題                        | 資源                                                                                          | 相關度          |
| --------------------------- | --------------------------------------------------------------------------------------------- | --------------- |
| **MutationObserver**        | [MDN 文檔](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)                 | 高 (轉錄監控)   |
| **Content Security Policy** | [CSP 指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)                             | 中 (擴展安全)   |
| **Flexbox 佈局**            | [CSS-Tricks 指南](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)                    | 高 (UI 設計)    |
| **CSS Grid**                | [CSS-Tricks 指南](https://css-tricks.com/snippets/css/complete-guide-grid/)                   | 中 (響應式設計) |
| **正則表達式**              | [MDN 指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) | 低 (URL 驗證)   |

### 調試技巧

-   [Chrome Extension 調試指南](https://developer.chrome.com/docs/extensions/mv3/tipsandtricks/)
-   [常見 Manifest V3 錯誤](https://developer.chrome.com/docs/extensions/mv3/troubleshooting/)
-   [Service Worker 故障排除](https://developer.chrome.com/docs/extensions/mv3/service_workers/#troubleshooting)

---

## 外部集成

### n8n Webhook 集成

**n8n 是什麼?**

-   開源工作流自動化平臺
-   支持 2000+ 應用集成
-   無代碼/低代碼工作流構建

**集成流程:**

```
┌─────────────────────────────────────────┐
│  Google Meet Interview Assistant        │
│  (發送轉錄)                             │
└──────────────┬──────────────────────────┘
               │ HTTP POST
               │ { transcript, speaker, ... }
               ▼
┌─────────────────────────────────────────┐
│  n8n Webhook Node                       │
│  (接收請求)                             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  n8n 工作流 (workflow)                  │
│  1. OpenAI GPT 提取要點                  │
│  2. 分類問題                            │
│  3. 生成後續問題                        │
│  4. 識別已回答的問題                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  HTTP Response (JSON)                   │
│  { success, notes, removedQuestions }   │
└──────────────┬──────────────────────────┘
               │ HTTP Response
               ▼
┌─────────────────────────────────────────┐
│  Interview Assistant Side Panel         │
│  (顯示筆記和更新)                       │
└─────────────────────────────────────────┘
```

**設置 n8n Webhook:**

1. 在 n8n 中創建新工作流
2. 添加 "Webhook" 觸發節點
3. 配置 POST 方法
4. 複製 Webhook URL
5. 粘貼到擴展設置中

**推薦資源:**

-   [n8n 官方文檔](https://docs.n8n.io/)
-   [n8n Webhook 文檔](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.webhook/)
-   [n8n 工作流示例](https://n8n.io/workflows/)
-   [n8n OpenAI 集成](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.openai/)

### Google Meet API 限制

⚠️ **重要:** 該擴展使用 DOM 解析而不是官方 API

**原因:**

-   Google Meet 沒有公開的轉錄 API
-   進程內音頻捕獲受到隱私限制
-   DOM 監控是唯一可靠的方法

**學習資源:**

-   [Google Chrome Extension 權限](https://developer.chrome.com/docs/extensions/mv3/declare_permissions/)
-   [Chrome Host Permissions](https://developer.chrome.com/docs/extensions/mv3/host_permissions/)

---

## 除錯日誌前綴

所有組件使用帶前綴的控制台日誌，便於調試：

| 前綴              | 模塊           | 位置                     |
| ----------------- | -------------- | ------------------------ |
| `[ContentScript]` | 內容腳本       | `dist/content-script.js` |
| `[ServiceWorker]` | Service Worker | `dist/service-worker.js` |
| `[SidePanel]`     | 側面板         | `dist/sidepanel.js`      |
| `[StorageUtil]`   | 存儲工具       | `dist/utils/storage.js`  |
| `[WebhookUtil]`   | Webhook 工具   | `dist/utils/webhook.js`  |
| `[MessageUtil]`   | 消息工具       | `dist/utils/message.js`  |

**查看日誌:**

```javascript
// 打開 DevTools (F12) 並查看 Console 標籤
// 過濾特定組件的日誌：
// - 內容腳本：在 Google Meet 頁面的 DevTools 中
// - Service Worker：chrome://extensions/ → 點擊"Service worker"
// - 側面板：右鍵點擊側面板 → Inspect
```

---

## 快速參考

### 常用 Chrome Extension API

```javascript
// 消息傳遞
chrome.runtime.sendMessage(message, callback)
chrome.runtime.onMessage.addListener(handler)
chrome.runtime.connect(connectInfo)

// 存儲
chrome.storage.local.set({ key: value })
chrome.storage.local.get(['key'], (result) => {})

// 標籤頁
chrome.tabs.query({ active: true }, (tabs) => {})
chrome.tabs.onUpdated.addListener(callback)

// 側面板
chrome.sidePanel.setOptions({ tabId, path, enabled })
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

// 腳本
chrome.scripting.executeScript({ target, function })
```

### DOM 查詢實用技巧

```javascript
// 查詢所有元素
document.querySelectorAll("selector"); // NodeList
document.getElementsByClassName("class"); // HTMLCollection

// 單個元素
document.querySelector("selector"); // 第一個匹配
document.getElementById("id"); // by ID
document.querySelector("[attribute]"); // 屬性選擇器

// 事件委託
document.addEventListener("click", (e) => {
    if (e.target.matches("selector")) {
        // 處理
    }
});
```

---

## 貢獻指南

當添加新功能時：

1. ✅ 添加帶前綴的控制台日誌
2. ✅ 遵循現有的代碼結構
3. ✅ 添加 JSDoc 註釋
4. ✅ 在 `docs/` 中更新文檔
5. ✅ 測試所有 Chrome 瀏覽器版本
6. ✅ 驗證沒有 CSP 違規

---

## 版本歷史

| 版本  | 日期       | 更新                      |
| ----- | ---------- | ------------------------- |
| 1.0.0 | 2024-11-27 | 初始發布 - 核心功能完成   |
| -     | -          | • 實時轉錄捕獲            |
| -     | -          | • n8n 集成                |
| -     | -          | • 深色模式支持            |
| -     | -          | • 完整的 Manifest V3 實現 |

---

**最後更新:** 2024-11-27  
**維護者:** GitHub Copilot  
**許可證:** MIT
