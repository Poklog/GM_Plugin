# 🎓 Google Meet Interview Assistant - 新手學習路線圖

> 從零開始理解這個 Chrome 擴展插件的完整指南，包含概念、技術、函數及資源連結

---

## 📚 目錄

1. [前置知識檢查清單](#前置知識檢查清單)
2. [學習路線圖（五個階段）](#學習路線圖五個階段)
3. [核心概念深入解析](#核心概念深入解析)
4. [技術棧詳解](#技術棧詳解)
5. [關鍵函數速查表](#關鍵函數速查表)
6. [推薦學習資源](#推薦學習資源)
7. [實踐練習](#實踐練習)
8. [常見問題](#常見問題)

---

## 前置知識檢查清單

### ✅ 必須具備

-   [ ] **JavaScript 基礎**

    -   變數、函數、對象、陣列
    -   事件監聽（`addEventListener`）
    -   Promise 和 async/await
    -   ES6+ 語法（箭頭函數、解構賦值等）
    -   資源：[MDN JavaScript 教程](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)

-   [ ] **HTML & CSS 基礎**

    -   DOM 結構和操作
    -   CSS 選擇器、Flexbox、Grid
    -   資源：[MDN HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)、[MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)

-   [ ] **瀏覽器基礎**
    -   DevTools 使用方法（F12）
    -   控制台調試（console.log）
    -   網絡標籤頁（Network 標籤）
    -   資源：[Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### 🟡 建議具備

-   [ ] **API 基礎**

    -   HTTP 請求、REST API
    -   JSON 數據格式
    -   資源：[MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

-   [ ] **Git 基礎**
    -   版本控制概念
    -   資源：[Pro Git 書籍](https://git-scm.com/book)

---

## 學習路線圖（五個階段）

### 🟢 第一階段：Chrome 擴展基礎（1-2 天）

**目標：** 理解 Chrome 擴展的基本結構和生命週期

#### 要學的概念

1. **什麼是 Chrome 擴展？**

    - 擴展 vs 應用
    - Manifest V3 規範
    - 權限系統

2. **擴展的三大組件**

    - **Content Script** - 在網頁中運行的腳本
    - **Service Worker** - 後台運行的腳本
    - **Side Panel** - UI 面板

3. **文件結構**
    ```
    dist/
    ├── manifest.json          # 配置文件（必讀！）
    ├── content-script.js      # 網頁內容腳本
    ├── service-worker.js      # 後台工作者
    ├── sidepanel.html         # UI 結構
    ├── sidepanel.js           # UI 邏輯
    ├── styles.css             # UI 樣式
    └── utils/                 # 工具函數
    ```

#### 推薦資源

| 資源                      | 類型 | 時長  | 連結                                                                                |
| ------------------------- | ---- | ----- | ----------------------------------------------------------------------------------- |
| Chrome Extension 官方文檔 | 官方 | 自學  | [dev.chrome.com/docs/extensions](https://developer.chrome.com/docs/extensions/)     |
| Manifest V3 遷移指南      | 官方 | 30 分 | [manifest-v3-migration](https://developer.chrome.com/docs/extensions/mv3/intro/)    |
| 擴展基礎入門              | 視頻 | 20 分 | [YouTube - Chrome Extensions Tutorial](https://www.youtube.com/watch?v=0n809nd4Zu4) |

#### 關鍵文件閱讀順序

1. 本專案的 [`manifest.json`](../dist/manifest.json)
2. [Chrome Extension 官方 Manifest 文檔](https://developer.chrome.com/docs/extensions/mv3/manifest/)
3. 本專案的 [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

### 🟡 第二階段：核心架構理解（2-3 天）

**目標：** 理解三個組件如何協作

#### 要學的概念

1. **Message Passing（消息傳遞）**

    - 單向通信：`chrome.runtime.sendMessage()`
    - 雙向通信：`chrome.runtime.connect()`（Port）
    - 何時使用各自

2. **Storage API（存儲）**

    - `chrome.storage.local`
    - 同步 vs 異步
    - 存儲限制

3. **Tab Management（標籤管理）**

    - 監測標籤激活
    - 特定標籤的消息發送

4. **Side Panel API**
    - 何時顯示/隱藏面板
    - 與其他組件通信

#### 核心流程圖

```
┌─────────────────────────────┐
│   Google Meet Page          │
│  (content-script.js)        │
│                             │
│ 監測 DOM 變化              │
│ 捕捉說話者和字幕          │
└────────────┬────────────────┘
             │ sendMessage()
             ▼
┌─────────────────────────────┐
│  Service Worker             │
│  (service-worker.js)        │
│                             │
│ 路由消息                   │
│ 調用 n8n webhook            │
│ 管理存儲                   │
└────────────┬────────────────┘
             │ connect(port)
             ▼
┌─────────────────────────────┐
│  Side Panel                 │
│  (sidepanel.js)             │
│                             │
│ 顯示實時數據               │
│ 接收用戶輸入               │
│ 更新 UI                    │
└─────────────────────────────┘
```

#### 關鍵代碼位置

| 概念      | 文件                | 關鍵函數                                 | 行數     |
| --------- | ------------------- | ---------------------------------------- | -------- |
| 消息發送  | `content-script.js` | `chrome.runtime.sendMessage()`           | ~120-150 |
| 消息接收  | `service-worker.js` | `chrome.runtime.onMessage.addListener()` | ~50-100  |
| Port 連接 | `sidepanel.js`      | `chrome.runtime.connect()`               | ~30-50   |
| 存儲操作  | `utils/storage.js`  | `chrome.storage.local.get/set()`         | ~20-50   |

#### 推薦資源

| 資源                     | 連結                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Message Passing 官方文檔 | [developer.chrome.com/docs/extensions/mv3/messaging](https://developer.chrome.com/docs/extensions/mv3/messaging/)         |
| Storage API 官方文檔     | [developer.chrome.com/docs/extensions/reference/storage](https://developer.chrome.com/docs/extensions/reference/storage/) |
| 本專案架構文檔           | [`ARCHITECTURE.md`](ARCHITECTURE.md)                                                                                      |

---

### 🟠 第三階段：實現細節（3-4 天）

**目標：** 理解每個組件的具體實現

#### A. Content Script 深度（content-script.js）

**目的：** 在 Google Meet 頁面中捕捉數據

**關鍵概念：**

-   DOM 選擇器和 MutationObserver
-   事件冒泡和委托

**核心函數：**

```javascript
// 1. 檢測說話者
function detectSpeaker() {
    // 嘗試多個 CSS 選擇器找到說話者名稱
    // 返回: "John Doe"
}

// 2. 檢測字幕
function detectCaption() {
    // 從頁面 DOM 提取字幕文本
    // 返回: "Hello everyone..."
}

// 3. 初始化監控
function initializeTranscriptMonitoring() {
    // 使用 MutationObserver 監測 DOM 變化
    // 防抖延遲: 300ms
}

// 4. 發送消息到 Service Worker
chrome.runtime.sendMessage({
    type: "TRANSCRIPT_UPDATED",
    data: { speaker, transcript },
});
```

**學習任務：**

-   [ ] 理解 MutationObserver 工作原理
-   [ ] 閱讀 Google Meet 頁面結構（使用 DevTools）
-   [ ] 修改 CSS 選擇器測試
-   [ ] 在控制台看 `[ContentScript]` 日誌

**推薦資源：**

| 資源                 | 連結                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------- |
| MutationObserver API | [MDN MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) |
| CSS 選擇器           | [MDN CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)       |
| DevTools 選擇器檢查  | 在 Google Meet 按 F12，點擊左上角選擇器圖標                                               |

---

#### B. Service Worker 深度（service-worker.js）

**目的：** 消息路由、webhook 調用、數據存儲

**關鍵概念：**

-   事件驅動架構
-   異步操作和 Promise
-   多客戶端管理

**核心函數：**

```javascript
// 1. 接收消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
        case "TRANSCRIPT_UPDATED":
            handleTranscriptUpdate(message.data);
            break;
    }
});

// 2. 連接到 Side Panel（Port）
chrome.runtime.onConnect.addListener((port) => {
    // 建立持久連接
    // 可以多次發送消息
});

// 3. 調用 n8n Webhook
async function handleSubmitTranscript(data) {
    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
}

// 4. 廣播到所有 Side Panel
function broadcastToSidePanels(message) {
    activeConnections.forEach((port) => {
        port.postMessage(message);
    });
}
```

**學習任務：**

-   [ ] 理解 Service Worker 的生命週期
-   [ ] 在 chrome://extensions 找到 Service Worker 的 DevTools
-   [ ] 測試不同的消息類型
-   [ ] 理解 activeConnections Map 的用途

**推薦資源：**

| 資源                    | 連結                                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Service Worker 官方文檔 | [developer.chrome.com/docs/extensions/mv3/service_workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/) |
| Service Worker 生命週期 | [Google Developers - Service Worker Lifecycle](https://developers.google.com/web/tools/chrome-devtools/progressive-web-apps)  |
| Promise 和 Async/Await  | [MDN Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)                       |

---

#### C. Side Panel UI 深度（sidepanel.html + sidepanel.js + styles.css）

**目的：** 顯示實時數據和接收用戶輸入

**HTML 結構（sidepanel.html）：**

```html
<div class="container">
    <div class="header">
        <!-- 標題和按鈕 -->
    </div>

    <div class="content-wrapper">
        <div class="panel">
            <!-- 左側：字幕面板 -->
            <div class="transcript-content"></div>
        </div>

        <div class="panel">
            <!-- 右側：筆記面板 -->
            <div class="notes-content"></div>
        </div>
    </div>
</div>
```

**CSS 架構（styles.css）：**

```css
/* 光模式（默認） */
body {
    background: #ffffff;
}

/* 深模式 */
body.dark-mode {
    background: #1f2937;
}

/* 組件樣式 */
.panel {
    /* 面板容器 */
}
.header {
    /* 頂部標題 */
}
.btn {
    /* 按鈕 */
}
.modal {
    /* 模態框 */
}
```

**JavaScript 邏輯（sidepanel.js）：**

```javascript
// 1. 連接到 Service Worker
function connectToServiceWorker() {
    const port = chrome.runtime.connect({ name: "sidepanel-connection" });
    port.onMessage.addListener((message) => {
        // 處理實時更新
    });
}

// 2. 更新 UI
function updateTranscriptUI(data) {
    // 將新數據添加到 DOM
}

// 3. 處理用戶交互
document.getElementById("submitBtn").addEventListener("click", () => {
    // 提交字幕到 n8n
});

// 4. 深色模式切換
function toggleDarkMode() {
    document.documentElement.classList.toggle("dark-mode");
}
```

**學習任務：**

-   [ ] 修改 CSS 顏色測試
-   [ ] 在 DevTools 檢查 DOM 結構
-   [ ] 測試深色模式切換
-   [ ] 添加新的 UI 按鈕

**推薦資源：**

| 資源         | 連結                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Flexbox 布局 | [MDN Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)               |
| CSS Grid     | [MDN CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)                      |
| 事件監聽     | [MDN addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) |
| DOM 操作     | [MDN DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)                     |

---

#### D. 工具函數深度（utils/）

**storage.js - 數據持久化：**

```javascript
// Chrome Storage 包裝器
async function saveWebhookUrl(url) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ webhookUrl: url }, resolve);
    });
}

async function getWebhookUrl() {
    return new Promise((resolve) => {
        chrome.storage.local.get("webhookUrl", (result) => {
            resolve(result.webhookUrl);
        });
    });
}
```

**webhook.js - API 調用：**

```javascript
async function sendToWebhook(data, webhookUrl) {
    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
}
```

**message.js - 消息管理：**

```javascript
// 定義消息類型
const TYPES = {
    TRANSCRIPT_UPDATED: "TRANSCRIPT_UPDATED",
    NOTES_UPDATED: "NOTES_UPDATED",
    WEBHOOK_CONFIGURED: "WEBHOOK_CONFIGURED",
};
```

**學習任務：**

-   [ ] 理解 Promise 包裝的原因
-   [ ] 測試 fetch API 調用
-   [ ] 在存儲中添加新字段

---

### 🔴 第四階段：n8n 集成（2-3 天）

**目標：** 理解如何與外部 API 集成

#### 概念

1. **Webhook 是什麼？**

    - HTTP POST 回調
    - 請求/響應格式

2. **n8n 工作流程**

    - Webhook 觸發器
    - 數據處理節點
    - 響應節點

3. **數據流**

```
┌──────────────────────┐
│  Side Panel          │
│ "Submit Q&A" 按鈕    │
└──────────┬───────────┘
           │ 發送數據
           ▼
┌──────────────────────┐
│ Service Worker       │
│ fetch(webhookUrl)    │
└──────────┬───────────┘
           │ HTTP POST
           ▼
┌──────────────────────┐
│ n8n Webhook          │
│ 處理和 AI 分析      │
└──────────┬───────────┘
           │ 返回結果
           ▼
┌──────────────────────┐
│ Side Panel           │
│ 顯示 AI 生成的筆記  │
└──────────────────────┘
```

#### 請求格式

```json
{
    "meetingId": "abc-defg-hij",
    "timestamp": "2024-11-27T10:30:00.000Z",
    "speaker": "John Doe",
    "transcript": "Hello everyone...",
    "metadata": {
        "extensionId": "...",
        "capturedAt": "2024-11-27T10:30:00.000Z",
        "type": "TRANSCRIPT_SUBMISSION"
    }
}
```

#### 響應格式

```json
{
    "success": true,
    "message": "Transcript processed",
    "updatedNotes": [
        {
            "id": "q1",
            "question": "What is your experience?",
            "hint": "Look for details"
        }
    ],
    "removedQuestions": ["q5"]
}
```

#### 推薦資源

| 資源                | 連結                                                                |
| ------------------- | ------------------------------------------------------------------- |
| n8n 官方文檔        | [docs.n8n.io](https://docs.n8n.io/)                                 |
| Webhook 使用指南    | [n8n Webhook 文檔](https://docs.n8n.io/workflows/triggers/webhook/) |
| 本專案 n8n 集成指南 | [`N8N_INTEGRATION.md`](N8N_INTEGRATION.md)                          |
| Postman 測試工具    | [postman.com](https://www.postman.com/)                             |

#### 學習任務

-   [ ] 閱讀 n8n 官方文檔
-   [ ] 創建簡單的 n8n webhook 工作流程
-   [ ] 使用 Postman 測試 webhook
-   [ ] 在本項目中配置 webhook URL
-   [ ] 完整測試 end-to-end 流程

---

### 🟣 第五階段：完整集成與調試（2-3 天）

**目標：** 實際運行整個插件並理解所有部分協作

#### 調試工具

| 工具                    | 用途           | 快捷鍵                               |
| ----------------------- | -------------- | ------------------------------------ |
| Chrome DevTools         | 檢查 HTML/CSS  | F12                                  |
| Service Worker DevTools | 後台調試       | chrome://extensions → Service Worker |
| console.log             | 查看日誌       | 看 `[PREFIX]` 標記                   |
| Network 標籤            | 監測 API 調用  | F12 → Network                        |
| Storage 標籤            | 查看保存的數據 | F12 → Application → Storage          |

#### 調試清單

-   [ ] 打開 Google Meet 頁面
-   [ ] 打開 Side Panel（點擊擴展圖標）
-   [ ] 配置 n8n webhook URL
-   [ ] 監測 DevTools 中的日誌
-   [ ] 測試字幕捕捉
-   [ ] 測試提交到 n8n
-   [ ] 驗證響應處理
-   [ ] 測試深色模式
-   [ ] 檢查存儲中的數據

#### 推薦資源

| 資源                     | 連結                                                                              |
| ------------------------ | --------------------------------------------------------------------------------- |
| Chrome DevTools 完全指南 | [developer.chrome.com/docs/devtools](https://developer.chrome.com/docs/devtools/) |
| 本專案開發指南           | [`DEVELOPMENT.md`](DEVELOPMENT.md)                                                |
| 本專案快速開始           | [`QUICKSTART_ZH.md`](QUICKSTART_ZH.md)                                            |

---

## 核心概念深入解析

### 📌 消息傳遞系統

**問題：** 為什麼需要複雜的消息系統？

**答案：** 因為三個組件在不同的執行環境中：

```
┌─────────────────────────────────────────┐
│         Chrome 進程                      │
│                                         │
│  ┌─────────┐    ┌──────────┐  ┌─────┐ │
│  │ 網頁    │    │ 後台工作 │  │UI面 │ │
│  │ 環境    │◄──►│ 者環境   │◄►│ 板  │ │
│  │         │    │          │  │     │ │
│  └─────────┘    └──────────┘  └─────┘ │
│                                         │
│    (隔離)      (隔離)      (隔離)      │
└─────────────────────────────────────────┘
        消息傳遞是唯一的溝通方式
```

**兩種通信方式：**

1. **sendMessage（一次性）**

    ```javascript
    // Content Script 發送
    chrome.runtime.sendMessage({ type: "DATA" }, (response) => {
        console.log(response); // 接收單一回復
    });

    // Service Worker 接收和回復
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        sendResponse({ success: true });
    });
    ```

2. **Port（持續連接）**

    ```javascript
    // Side Panel 建立連接
    const port = chrome.runtime.connect({ name: "panel" });

    // 發送多個消息
    port.postMessage({ type: "MESSAGE_1" });
    port.postMessage({ type: "MESSAGE_2" });

    // 接收多個消息
    port.onMessage.addListener((msg) => {
        // 實時更新
    });
    ```

**何時用哪個？**

-   `sendMessage`: 單次操作（查詢、設置）
-   `Port`: 需要實時推送（聊天、股票行情）

---

### 📌 MutationObserver 工作原理

**問題：** 為什麼不用 `setInterval` 定期檢查？

**答案：** 效率！MutationObserver 只在 DOM 變化時觸發。

```javascript
// ❌ 低效方式：每 100ms 檢查一次
setInterval(() => {
    const speaker = document.querySelector(".speaker-name").textContent;
}, 100); // CPU 浪費！

// ✅ 高效方式：只在變化時執行
const observer = new MutationObserver(() => {
    const speaker = document.querySelector(".speaker-name").textContent;
});

observer.observe(document.querySelector(".meet-container"), {
    childList: true, // 監控子節點變化
    subtree: true, // 監控整個子樹
    characterData: true, // 監控文本變化
});
```

---

### 📌 Chrome Storage 工作原理

**同步存儲的代碼：**

```javascript
// ❌ 錯誤：無法同步獲取
const url = chrome.storage.local.get("webhookUrl"); // 返回 undefined！

// ✅ 正確：使用回調
chrome.storage.local.get("webhookUrl", (result) => {
    console.log(result.webhookUrl); // 現在有值
});

// ✅ 或使用 Promise（推薦）
const url = await new Promise((resolve) => {
    chrome.storage.local.get("webhookUrl", (result) => {
        resolve(result.webhookUrl);
    });
});
```

**為什麼異步？** 因為存儲可能在不同的進程！

---

## 技術棧詳解

### 🔧 前端技術

| 技術           | 用途 | 版本   | 文檔                                                                     |
| -------------- | ---- | ------ | ------------------------------------------------------------------------ |
| **HTML5**      | 結構 | ES5+   | [MDN HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)            |
| **CSS3**       | 樣式 | Modern | [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)              |
| **JavaScript** | 邏輯 | ES6+   | [MDN JS](https://developer.mozilla.org/en-US/docs/Web/JavaScript)        |
| **Flexbox**    | 布局 | CSS3   | [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) |
| **CSS Grid**   | 布局 | CSS3   | [Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)   |

### 🔌 Chrome APIs

| API                    | 用途      | 限制                |
| ---------------------- | --------- | ------------------- |
| `chrome.runtime`       | 消息傳遞  | 後台 + 內容腳本     |
| `chrome.storage.local` | 本地存儲  | 10MB                |
| `chrome.tabs`          | 標籤管理  | Service Worker 可用 |
| `chrome.sidePanel`     | 邊側面板  | Manifest V3 only    |
| `fetch` API            | HTTP 請求 | 需要特定權限        |

### 🌐 外部集成

| 服務                | 用途         | 認證            | 文檔                                                  |
| ------------------- | ------------ | --------------- | ----------------------------------------------------- |
| **n8n**             | 工作流自動化 | Webhook URL     | [n8n Docs](https://docs.n8n.io/)                      |
| **Google Meet API** | 會議數據     | OAuth（非必需） | [Google Meet API](https://developers.google.com/meet) |

---

## 關鍵函數速查表

### 按文件分類

#### `dist/content-script.js`

```javascript
/**
 * 檢測 Google Meet 中的說話者
 * @returns {string} 說話者名稱，如 "John Doe"
 */
function detectSpeaker() {
    /* ... */
}

/**
 * 檢測字幕文本
 * @returns {string} 字幕內容
 */
function detectCaption() {
    /* ... */
}

/**
 * 初始化 DOM 監控，每 300ms 防抖
 */
function initializeTranscriptMonitoring() {
    /* ... */
}

/**
 * 向 Service Worker 發送消息
 */
function sendTranscriptUpdate(speaker, transcript) {
    chrome.runtime.sendMessage({
        type: "TRANSCRIPT_UPDATED",
        data: { speaker, transcript },
    });
}
```

#### `dist/service-worker.js`

```javascript
/**
 * 處理來自 Content Script 的字幕更新
 */
function handleTranscriptUpdate(data) {
    /* ... */
}

/**
 * 向 n8n webhook 提交字幕
 */
async function handleSubmitTranscript(data) {
    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
}

/**
 * 廣播消息到所有 Side Panel
 */
function broadcastToSidePanels(message) {
    activeConnections.forEach((port) => {
        port.postMessage(message);
    });
}

/**
 * 保存 Webhook URL
 */
async function handleSaveWebhookUrl(url) {
    // 驗證 + 存儲
}
```

#### `dist/sidepanel.js`

```javascript
/**
 * 連接到 Service Worker（持久連接）
 */
function connectToServiceWorker() {
    /* ... */
}

/**
 * 更新 UI 中的字幕面板
 */
function updateTranscriptUI(transcriptData) {
    /* ... */
}

/**
 * 更新筆記面板
 */
function updateNotesUI(notesData) {
    /* ... */
}

/**
 * 提交字幕到 n8n
 */
async function submitTranscript() {
    /* ... */
}

/**
 * 切換深色模式
 */
function toggleDarkMode() {
    document.documentElement.classList.toggle("dark-mode");
    // 保存到 chrome.storage.local
}

/**
 * 初始化深色模式
 */
function initializeDarkMode() {
    /* ... */
}
```

#### `dist/utils/storage.js`

```javascript
/**
 * 保存 Webhook URL
 */
async function saveWebhookUrl(url) {
    /* ... */
}

/**
 * 獲取 Webhook URL
 */
async function getWebhookUrl() {
    /* ... */
}

/**
 * 保存字幕
 */
async function saveTranscript(transcript) {
    /* ... */
}

/**
 * 獲取會議筆記
 */
async function getMeetingNotes() {
    /* ... */
}

/**
 * 清除所有存儲（調試用）
 */
async function clearAll() {
    /* ... */
}
```

#### `dist/utils/webhook.js`

```javascript
/**
 * 發送數據到 n8n Webhook
 * @param {object} data - 要發送的數據
 * @param {string} url - Webhook URL
 * @returns {Promise<object>} 響應數據
 */
async function sendToWebhook(data, url) {
    /* ... */
}

/**
 * 驗證 Webhook URL 格式
 */
function validateWebhookUrl(url) {
    /* ... */
}

/**
 * 解析 n8n 的響應
 */
function parseWebhookResponse(response) {
    /* ... */
}
```

#### `dist/utils/message.js`

```javascript
// 消息類型常量
const TYPES = {
    TRANSCRIPT_UPDATED: "TRANSCRIPT_UPDATED",
    NOTES_UPDATED: "NOTES_UPDATED",
    WEBHOOK_CONFIGURED: "WEBHOOK_CONFIGURED",
};

/**
 * 從 Content Script 向 Service Worker 發送消息
 */
function sendToServiceWorker(message) {
    /* ... */
}

/**
 * 從 Side Panel 發送消息
 */
function sendFromSidePanel(message) {
    /* ... */
}

/**
 * 連接到 Service Worker（返回 Port）
 */
function connectSidePanel() {
    /* ... */
}
```

---

## 推薦學習資源

### 📚 官方文檔（必讀）

#### Chrome 擴展相關

1. [Chrome Extensions 官方文檔](https://developer.chrome.com/docs/extensions/)
2. [Manifest V3 完全指南](https://developer.chrome.com/docs/extensions/mv3/)
3. [Content Scripts 詳解](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
4. [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
5. [Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
6. [Messaging API](https://developer.chrome.com/docs/extensions/mv3/messaging/)

#### 網絡和 API

1. [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
2. [MDN Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
3. [MDN Async/Await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)

#### n8n 相關

1. [n8n 官方文檔](https://docs.n8n.io/)
2. [Webhook 觸發器](https://docs.n8n.io/workflows/triggers/webhook/)
3. [HTTP 節點](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.http/)

### 🎥 視頻教程

| 標題                        | 平台    | 時長   | 連結                                                |
| --------------------------- | ------- | ------ | --------------------------------------------------- |
| Chrome Extension Basics     | YouTube | 30 分  | [Link](https://www.youtube.com/watch?v=0n809nd4Zu4) |
| Building a Chrome Extension | YouTube | 1 小時 | [Link](https://www.youtube.com/watch?v=MqQtd5vl9qA) |
| JavaScript Promise          | YouTube | 10 分  | [Link](https://www.youtube.com/watch?v=dhvZLW7SYIc) |

### 📖 書籍推薦

| 書籍                                                            | 作者             | 重點                |
| --------------------------------------------------------------- | ---------------- | ------------------- |
| [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS) | Kyle Simpson     | JavaScript 深度     |
| [Eloquent JavaScript](https://eloquentjavascript.net/)          | Marijn Haverbeke | JavaScript 完整教程 |
| [Pro Git](https://git-scm.com/book)                             | Scott Chacon     | Git 版本控制        |

### 🛠️ 工具和資源

| 工具                | 用途         | 連結                                                    |
| ------------------- | ------------ | ------------------------------------------------------- |
| **Chrome DevTools** | 調試         | Built-in                                                |
| **VS Code**         | 編輯器       | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Postman**         | API 測試     | [postman.com](https://www.postman.com/)                 |
| **n8n Cloud**       | Webhook 測試 | [n8n.io](https://n8n.io/)                               |
| **Google Meet**     | 測試環境     | [meet.google.com](https://meet.google.com)              |

---

## 實踐練習

### 🟢 初級練習（第 1-2 階段）

#### 練習 1.1：修改插件名稱和圖標

**目標：** 理解 manifest.json

**任務：**

1. 打開 `dist/manifest.json`
2. 更改 `"name"` 為你喜歡的名稱
3. 在 Chrome `chrome://extensions/` 中刷新查看變化

**期望結果：** 插件名稱在 Chrome 中改變

---

#### 練習 1.2：添加控制台日誌

**目標：** 理解日誌系統

**任務：**

1. 打開 `dist/content-script.js`
2. 在 `detectSpeaker()` 函數中添加：
    ```javascript
    console.log(`${PREFIX} Speaker: ${speaker}`);
    ```
3. 打開 Google Meet，在 DevTools 控制台查看日誌

**期望結果：** 看到 `[ContentScript] Speaker: John Doe` 的日誌

---

#### 練習 1.3：修改 UI 顏色

**目標：** 理解 CSS

**任務：**

1. 打開 `dist/styles.css`
2. 找到 `.header` 規則
3. 將 `background` 改為 `#4CAF50`（綠色）
4. 在 Chrome 中刷新 Side Panel

**期望結果：** 頂部標題欄變綠

---

### 🟡 中級練習（第 3 階段）

#### 練習 3.1：捕捉新的 DOM 元素

**目標：** 理解 DOM 選擇器和 MutationObserver

**任務：**

1. 在 Google Meet 中打開 DevTools（F12）
2. 用選擇器工具點擊你想捕捉的 UI 元素
3. 記下其 CSS 選擇器
4. 在 `content-script.js` 中添加新的 `detect*()` 函數
5. 在 MutationObserver 中調用它

**期望結果：** 能夠捕捉新的數據

---

#### 練習 3.2：添加新的消息類型

**目標：** 理解消息傳遞系統

**任務：**

1. 在 `dist/utils/message.js` 中添加新的消息類型：

    ```javascript
    PARTICIPANT_COUNT_UPDATED: "PARTICIPANT_COUNT_UPDATED";
    ```

2. 在 `content-script.js` 中添加函數檢測參與者數量
3. 發送新消息類型到 Service Worker
4. 在 `service-worker.js` 中處理新消息
5. 廣播到 Side Panel

**期望結果：** 新消息能正確路由到所有組件

---

#### 練習 3.3：修改 Webhook 請求格式

**目標：** 理解 webhook 集成

**任務：**

1. 查看 `dist/utils/webhook.js` 中 `sendToWebhook()` 函數
2. 添加新字段到請求：
    ```javascript
    meetingNotes: data.notes,
    participantCount: data.count
    ```
3. 在 Postman 中測試新格式

**期望結果：** n8n 能接收並處理新字段

---

### 🔴 高級練習（第 5 階段）

#### 練習 5.1：完整的 End-to-End 測試

**目標：** 理解完整流程

**任務：**

1. 設置 n8n webhook
2. 打開 Google Meet 會議
3. 配置插件的 Webhook URL
4. 捕捉一段對話
5. 提交到 n8n
6. 驗證 Side Panel 更新

**檢查清單：**

-   [ ] DevTools 中看到 `[ContentScript]` 日誌
-   [ ] 看到 `[ServiceWorker]` 日誌
-   [ ] 看到 `[SidePanel]` 日誌
-   [ ] Network 標籤顯示 Webhook 請求
-   [ ] Side Panel 更新為 n8n 響應

---

#### 練習 5.2：添加新功能

**目標：** 從零開始實現功能

**任務：** 添加「導出為 JSON」功能

**步驟：**

1. 在 `dist/sidepanel.html` 添加按鈕
2. 在 `dist/sidepanel.js` 添加點擊監聽
3. 創建導出函數
4. 測試下載文件

**期望結果：** 能導出會議記錄為 JSON 文件

---

#### 練習 5.3：性能優化

**目標：** 理解性能監測

**任務：**

1. 測量 MutationObserver 的執行時間
2. 找出性能瓶頸
3. 優化代碼（例如：使用防抖）
4. 測量優化後的性能

**期望結果：** 看到性能改進

---

## 常見問題

### Q1: 如何調試 Service Worker？

**A:**

1. 打開 `chrome://extensions/`
2. 找到你的擴展
3. 點擊「Service worker」鏈接
4. DevTools 會打開

### Q2: 為什麼消息沒有到達？

**A:** 檢查：

1. Content Script 是否注入？（DevTools 控制台看有無日誌）
2. 消息類型拼寫是否正確？
3. 是否在 manifest.json 中配置了 content_scripts？

### Q3: 如何在 Google Meet 檢查 DOM 結構？

**A:**

1. 打開 Google Meet 視頻通話
2. 按 F12 打開 DevTools
3. 按 Ctrl+Shift+C 打開元素選擇器
4. 點擊要檢查的 UI 元素

### Q4: Storage 有大小限制嗎？

**A:** 是的，`chrome.storage.local` 限制：

-   每個鍵值對：10MB
-   總存儲：根據瀏覽器配置（通常 10MB+）

### Q5: 如何測試 Webhook？

**A:**

1. 使用 [Postman](https://postman.com)
2. 創建 POST 請求到 Webhook URL
3. 添加 JSON 請求體
4. 查看響應

### Q6: 為什麼深色模式沒有生效？

**A:** 檢查：

1. `body.dark-mode` CSS 規則是否存在？
2. JavaScript 是否執行 `document.documentElement.classList.toggle('dark-mode')`？
3. 在 DevTools 中檢查 `<html>` 元素是否有 `dark-mode` 類

### Q7: 如何添加新的權限？

**A:** 在 `manifest.json` 中修改 `permissions` 數組：

```json
"permissions": ["storage", "sidePanel", "activeTab", "scripting", "webRequest"]
```

### Q8: 區別是什麼？sendMessage vs Port

| 特性     | sendMessage | Port     |
| -------- | ----------- | -------- |
| 連接次數 | 一次        | 多次     |
| 用途     | 單次操作    | 實時推送 |
| 複雜度   | 簡單        | 稍複雜   |
| 性能     | 快          | 快       |

---

## 進階主題（可選）

### 🚀 性能優化

1. **防抖（Debounce）**

    ```javascript
    function debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    }
    ```

2. **節流（Throttle）**
    ```javascript
    function throttle(func, delay) {
        let lastCall = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func(...args);
            }
        };
    }
    ```

### 🔐 安全最佳實踐

1. **驗證 Webhook URL**

    - 只允許 HTTPS
    - 檢查 URL 格式

2. **數據驗證**

    - 驗證來自網頁的數據
    - 清理用戶輸入

3. **權限最小化**
    - 只請求必要的權限
    - 定期審查權限

### 📊 分析和監測

1. **性能監測**

    ```javascript
    const start = performance.now();
    // 操作代碼
    const end = performance.now();
    console.log(`耗時: ${end - start}ms`);
    ```

2. **錯誤追蹤**
    ```javascript
    try {
        // 操作
    } catch (error) {
        console.error(`${PREFIX} 錯誤:`, error);
    }
    ```

---

## 學習時間表（建議）

| 階段             | 天數        | 累計天數 |
| ---------------- | ----------- | -------- |
| 前置知識檢查     | 3-5         | 3-5      |
| 第一階段（基礎） | 1-2         | 4-7      |
| 第二階段（架構） | 2-3         | 6-10     |
| 第三階段（實現） | 3-4         | 9-14     |
| 第四階段（集成） | 2-3         | 11-17    |
| 第五階段（調試） | 2-3         | 13-20    |
| 實踐練習         | 5-7         | 18-27    |
| **總計**         | **~3-4 週** |          |

---

## 後續學習路線

完成本指南後，可以探索：

1. **高級特性**

    - [Dynamic Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/#dynamic-ids)
    - [Offscreen Documents](https://developer.chrome.com/docs/extensions/mv3/migrate/to-service-workers/offscreen-document/)

2. **其他 Chrome API**

    - [Chrome Scripting API](https://developer.chrome.com/docs/extensions/reference/scripting/)
    - [Chrome Debugger Protocol](https://chromedevtools.github.io/devtools-protocol/)

3. **發佈擴展**

    - [Chrome Web Store 發佈指南](https://developer.chrome.com/docs/webstore/publish/)

4. **其他瀏覽器擴展**
    - Firefox WebExtensions
    - Microsoft Edge Extensions
    - Safari Web Extensions

---

## 獲取幫助

### 遇到問題？

1. **查看本項目文檔**

    - [`DEVELOPMENT.md`](DEVELOPMENT.md) - 開發指南
    - [`ARCHITECTURE.md`](ARCHITECTURE.md) - 架構詳解
    - [`N8N_INTEGRATION.md`](N8N_INTEGRATION.md) - n8n 集成

2. **檢查控制台日誌**

    - `[ContentScript]` - 網頁中的日誌
    - `[ServiceWorker]` - 後台日誌
    - `[SidePanel]` - UI 日誌

3. **使用 Chrome DevTools**

    - F12 打開 DevTools
    - 檢查 HTML 結構
    - 檢查 Network 請求
    - 查看 Storage 數據

4. **查看官方文檔**

    - [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/)
    - [MDN Web Docs](https://developer.mozilla.org/)

5. **GitHub Issues**
    - 查看項目 issues
    - 創建新 issue 報告問題

---

## 貢獻和反饋

如果你有改進此學習指南的建議，歡迎提交 PR 或 Issue！

---

**最後更新:** 2024-11-27  
**版本:** 1.0  
**作者:** GM_Plugin Team

**祝你學習愉快！🎉**
