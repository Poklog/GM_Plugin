# 快速開始指南 (Quick Start)

## 🚀 5 分鐘快速開始

### 步驟 1：安裝依賴

```bash
npm install
```

### 步驟 2：構建擴展

```bash
npm run build
```

檔案將輸出到 `dist/` 資料夾。

### 步驟 3：載入到 Chrome

1. 打開 Chrome，進入 `chrome://extensions/`
2. 啟用右上角的「開發人員模式」
3. 點擊「載入未封裝的擴展功能」
4. 選擇 `dist/` 資料夾
5. 完成！擴展現在已載入

### 步驟 4：配置 n8n Webhook

1. 準備好您的 n8n webhook URL
    - 參考 `N8N_INTEGRATION.md` 設置 n8n 工作流
2. 打開 Google Meet
3. 點擊擴展圖標打開側邊欄
4. 點擊側邊欄右上角的設置按鈕 ⚙️
5. 貼上 n8n webhook URL
6. 點擊「Save Webhook」

### 步驟 5：開始使用

1. 在 Google Meet 通話中
2. 側邊欄左側會自動捕捉發言人和字幕
3. 每個 Q&A 完成後，點擊「Submit Q&A」
4. n8n 處理後會在右側顯示更新的備忘稿

## 📁 專案結構概覽

```
GM_Plugin/
├── public/                    # 側邊欄 UI
│   ├── sidepanel.html        # HTML 結構
│   ├── sidepanel.js          # 邏輯和事件
│   └── styles.css            # 現代化 CSS 設計
│
├── src/
│   ├── content-script.js     # Google Meet DOM 監控
│   ├── service-worker.js     # 後台處理、Webhook、Storage
│   └── utils/                # 模塊化工具
│       ├── storage.js        # Chrome storage 操作
│       ├── webhook.js        # n8n webhook 通信
│       └── message.js        # 組件間通信
│
├── manifest.json             # Chrome 擴展配置
├── package.json              # 依賴和腳本
├── webpack.config.js         # 構建配置
├── README.md                 # 完整文檔
├── DEVELOPMENT.md            # 開發指南
└── N8N_INTEGRATION.md        # n8n 集成詳解
```

## 🎯 核心功能

### 1️⃣ 自動捕捉逐字稿

-   監控 Google Meet 頁面 DOM
-   實時檢測發言人和字幕
-   自動更新側邊欄左側面板

### 2️⃣ 回傳到 n8n

-   點擊「Submit Q&A」按鈕
-   當前對話發送到 n8n webhook
-   n8n 進行 AI 處理（可選）

### 3️⃣ 接收並顯示備忘稿

-   n8n 返回更新的問題列表
-   已完成的問題自動刪除
-   右側面板實時顯示待詢問的問題

## 🔍 主要模塊說明

### StorageUtil (`src/utils/storage.js`)

```javascript
// 保存 webhook URL
StorageUtil.saveWebhookUrl("https://...");

// 獲取 webhook URL
const url = await StorageUtil.getWebhookUrl();

// 保存逐字稿
StorageUtil.saveTranscript({ speaker, text, timestamp });

// 獲取會議備忘稿
const notes = await StorageUtil.getMeetingNotes();
```

### WebhookUtil (`src/utils/webhook.js`)

```javascript
// 發送數據到 n8n
const response = await WebhookUtil.sendToWebhook(data, webhookUrl);

// 驗證 webhook URL
const isValid = WebhookUtil.validateWebhookUrl(url);

// 解析 n8n 回應
const parsed = WebhookUtil.parseWebhookResponse(response);
```

### MessageUtil (`src/utils/message.js`)

```javascript
// 組件間通信
const response = await MessageUtil.sendToServiceWorker({
    type: "SUBMIT_TRANSCRIPT",
    data: { speaker, text },
});

// 建立長連接
const port = MessageUtil.connectSidePanel();
```

## 📊 數據流示意圖

```
Google Meet Page
     │
     │ (Real-time monitoring)
     ▼
Content Script ──sendMessage──> Service Worker
     │                               │
     │                         (Validate & Process)
     │                               │
     │                    ┌──────────┴──────────┐
     │                    ▼                     ▼
     │           Send to n8n webhook    Store in chrome.storage
     │                    │
     │            (AI Processing)
     │                    │
     │            ◄───────┘
     │
Side Panel ◄────port connection────┘ (Broadcast updates)
     │
     ├─ Left Panel: Display Transcript
     └─ Right Panel: Show Meeting Notes
```

## 🛠️ 開發模式

```bash
# 監視模式（自動重建）
npm run dev

# 清理構建檔案
npm run clean
```

## 🐛 調試技巧

### 查看 Service Worker 日誌

1. `chrome://extensions/`
2. 找到您的擴展
3. 點擊「Service worker」鏈接

### 查看 Content Script 日誌

1. 打開 Google Meet
2. F12 打開開發者工具
3. 查找 `[ContentScript]` 日誌

### 查看 Side Panel 日誌

1. 右擊側邊欄
2. 選擇「檢查」
3. 查找 `[SidePanel]` 日誌

所有日誌都有清晰的前綴便於追蹤！

## 🔗 Console 日誌前綴

| 前綴              | 說明             |
| ----------------- | ---------------- |
| `[ContentScript]` | Google Meet 監控 |
| `[ServiceWorker]` | 後台進程         |
| `[SidePanel]`     | 側邊欄 UI        |
| `[StorageUtil]`   | 存儲操作         |
| `[WebhookUtil]`   | Webhook 通信     |
| `[MessageUtil]`   | 消息路由         |

## 📝 n8n 工作流快速設置

1. 打開 n8n 儀表板
2. 創建新工作流
3. 添加 "Webhook" 節點作為觸發器
4. 配置 Method: `POST`
5. 複製 Webhook URL
6. 添加處理邏輯節點（可選 ChatGPT）
7. 返回 HTTP 回應

詳見 `N8N_INTEGRATION.md`

## 🧪 測試檢查清單

-   [ ] 擴展無錯誤加載
-   [ ] Google Meet 上側邊欄打開正常
-   [ ] Content script 檢測到發言人
-   [ ] 所有日誌顯示正確前綴
-   [ ] 可配置 Webhook URL
-   [ ] 逐字稿正確發送到 Webhook
-   [ ] 接收到 n8n 回應
-   [ ] 備忘稿在右側面板更新
-   [ ] UI 在不同縮放級別響應正常
-   [ ] 開發者工具中無控制台錯誤

## ⚠️ 常見問題

### Q: 擴展不顯示？

A: 檢查 `chrome://extensions/` 中是否有錯誤。確認 manifest.json 語法正確。

### Q: 無法捕捉音頻？

A: Google Meet UI 會更新。可能需要修改 `src/content-script.js` 中的 DOM 選擇器。

### Q: Webhook 無響應？

A: 檢查 URL 正確性，驗證 n8n 工作流已激活，查看 Service Worker 日誌。

### Q: 側邊欄無法打開？

A: 側邊欄僅在 Google Meet 頁面上顯示。點擊擴展圖標或工具欄按鈕。

## 📚 更多資源

-   `README.md` - 完整功能文檔
-   `DEVELOPMENT.md` - 開發詳細指南
-   `N8N_INTEGRATION.md` - n8n 集成詳解

## 🎉 下一步

1. ✅ npm install
2. ✅ npm run build
3. ✅ 載入到 Chrome
4. ✅ 配置 n8n Webhook
5. ✅ 在 Google Meet 測試
6. 🚀 享受使用！

---

**需要幫助？** 查看 `DEVELOPMENT.md` 中的故障排除部分。
