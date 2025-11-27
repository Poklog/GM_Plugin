# 🎤 Chrome 擴展安裝說明

## ✅ 錯誤已修復！

所有文件已準備好在 `dist/` 資料夾中。

## 🚀 現在就可以在 Chrome 中加載！

### 步驟 1: 打開 Chrome 擴展管理頁面

```
chrome://extensions/
```

### 步驟 2: 啟用開發人員模式

-   在頁面右上角找到「開發人員模式」開關
-   點擊開啟

### 步驟 3: 載入未封裝的擴展功能

1. 點擊「載入未封裝的擴展功能」按鈕
2. 選擇這個資料夾: `c:\Users\user\OneDrive\桌面\專案\GM_Plugin\dist`
3. 點擊選擇資料夾

### 步驟 4: 配置 n8n Webhook

1. 打開 Google Meet (https://meet.google.com)
2. 點擊 Chrome 工具欄右上角的擴展圖標
3. 點擊「Open Interview Assistant」打開側邊欄
4. 點擊側邊欄右上角的設置按鈕 ⚙️
5. 輸入你的 n8n webhook URL
6. 點擊「Save Webhook」

### 步驟 5: 開始使用！

-   在 Google Meet 通話中
-   側邊欄會自動捕捉逐字稿
-   完成每個 Q&A 後點擊「Submit Q&A」
-   右側面板會顯示更新的備忘稿

---

## 📁 dist/ 文件結構

```
dist/
├── manifest.json          ✅ Chrome 擴展配置
├── content-script.js      ✅ Google Meet DOM 監控
├── service-worker.js      ✅ 後台處理
├── sidepanel.html         ✅ UI 結構
├── sidepanel.js           ✅ UI 邏輯
├── styles.css             ✅ 樣式
└── utils/
    ├── storage.js         ✅ 存儲工具
    ├── webhook.js         ✅ Webhook 工具
    └── message.js         ✅ 消息工具
```

所有文件都已準備好！✨

---

## 🐛 如果遇到問題

### 1. 擴展不顯示?

-   確認 Chrome 版本是否最新
-   重新載入擴展（按 Ctrl+R）
-   清除 Chrome 快取並重試

### 2. 開發人員工具中有錯誤?

-   按 F12 打開開發人員工具
-   查看 Console 標籤
-   搜索 `[ContentScript]` 或 `[ServiceWorker]` 日誌

### 3. Side panel 不打開?

-   確認你在 Google Meet 頁面上
-   嘗試點擊擴展圖標
-   檢查 Chrome 版本是否支持 side panel API

---

## 📞 需要幫助?

查看以下文件:

-   `README.md` - 完整功能說明
-   `DEVELOPMENT.md` - 開發和調試指南
-   `N8N_INTEGRATION.md` - n8n webhook 設置

---

**準備好了嗎? 現在可以在 Chrome 中加載擴展了! 🚀**
