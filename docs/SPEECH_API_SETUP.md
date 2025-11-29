# Web Speech API 語音轉錄設置指南

## 🎤 什麼是 Web Speech API?

我們現在使用**瀏覽器內建的語音轉錄技術**（Web Speech API），而不依賴 Google Meet 的字幕。

**優點：**

-   ✅ 獨立運作，不需要 Google Meet 提供字幕
-   ✅ 支持多種語言
-   ✅ 實時轉錄
-   ✅ 無需額外的外部服務

**支持的瀏覽器：**

-   ✅ Chrome / Chromium
-   ✅ Edge
-   ✅ Opera
-   ❌ Firefox (暫不支持)
-   ❌ Safari (部分支持)

## 🚀 快速開始

### 1. 重新加載擴展

1. 打開 `chrome://extensions/`
2. 找到 "Google Meet Interview Assistant"
3. 點擊 **刷新** ♻️ 按鈕

### 2. 開啟 Google Meet 會議

1. 進入任何 Google Meet 視頻會議
2. 打開 DevTools (按 `F12`)
3. 查看 Console 標籤

### 3. 授予麥克風權限

當擴展首次需要麥克風時，Chrome 會要求您授予權限：

-   ✅ 點擊 "允許" (Allow)
-   ❌ 不要點 "拒絕" (Deny)

### 4. 測試語音識別

在 DevTools Console 中執行：

```javascript
// 檢查是否支持 Web Speech API
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
console.log("Speech API supported:", !!SpeechRecognition);
```

預期輸出：`Speech API supported: true`

## 🔍 調試 - 檢查日誌

打開 DevTools Console（`F12` → Console 標籤），你應該看到這樣的日誌：

```
[ContentScript] Google Meet Interview Assistant loaded
[ContentScript-SpeechAPI] Speech recognition initialized
[ContentScript-SpeechAPI] Speech recognition started
[ContentScript-SpeechAPI] Final: "Hello, this is a test"
```

### 常見日誌說明

| 日誌                                             | 含義                                     |
| ------------------------------------------------ | ---------------------------------------- |
| `[ContentScript-SpeechAPI] Final: "..."`         | ✅ 已捕捉最終語音（會發送到 Side Panel） |
| `[ContentScript-SpeechAPI] Interim: "..."`       | ℹ️ 正在識別中（尚未完成）                |
| `[ContentScript-SpeechAPI] No speech detected`   | ❌ 沒有檢測到語音，1 秒後重試            |
| `[ContentScript-SpeechAPI] Error: network-error` | ❌ 網絡錯誤                              |

## 🌍 設置識別語言

預設是英文 (`en-US`)。如果要改成其他語言：

### 方法 1：在 content-script.js 中修改

```javascript
recognition.language = "zh-CN"; // 簡體中文
// 或
recognition.language = "zh-TW"; // 繁體中文
// 或
recognition.language = "ja-JP"; // 日文
// 等等...
```

### 方法 2：通過 Service Worker 動態設置

修改 `service-worker.js`，添加語言設置命令：

```javascript
// 發送語言設置
chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
    tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
            type: "SET_LANGUAGE",
            language: "zh-TW",
        });
    });
});
```

### 支持的語言代碼

| 語言                | 代碼    |
| ------------------- | ------- |
| English (US)        | `en-US` |
| English (UK)        | `en-GB` |
| Simplified Chinese  | `zh-CN` |
| Traditional Chinese | `zh-TW` |
| Japanese            | `ja-JP` |
| Korean              | `ko-KR` |
| Spanish             | `es-ES` |
| French              | `fr-FR` |
| German              | `de-DE` |
| Russian             | `ru-RU` |

完整列表：https://www.w3schools.com/tags/ref_language_codes.asp

## 🎯 完整工作流程

```
1. 開啟 Google Meet 會議
   ↓
2. 側面板自動連接
   ↓
3. Content Script 初始化 Web Speech API
   ↓
4. 瀏覽器請求麥克風權限 → 你點擊 "允許"
   ↓
5. 開始監聽音頻
   ↓
6. 人說話 → 語音轉錄成文字
   ↓
7. 文字發送到 Service Worker
   ↓
8. Service Worker 轉發到側面板
   ↓
9. 側面板顯示錄製內容
   ↓
10. 你可以提交給 n8n 或清除
```

## ⚙️ 故障排除

### 問題 1：Console 顯示 "Speech API not supported"

**原因：** 你的瀏覽器不支持 Web Speech API

**解決方案：**

-   升級 Chrome 到最新版本
-   使用 Chrome 而不是 Firefox 或 Safari

### 問題 2：沒有看到 "[ContentScript-SpeechAPI]" 日誌

**原因：** Content Script 可能未正確加載

**解決方案：**

1. 確認你在 `https://meet.google.com` 上（非 HTTP）
2. 重新加載擴展（`chrome://extensions/` → 刷新）
3. 刷新 Google Meet 頁面

### 問題 3：麥克風權限被拒絕

**原因：** 你點擊了 "拒絕" 或 Chrome 被阻止訪問麥克風

**解決方案：**

1. 打開 Chrome 設定 → 隱私和安全 → 網站設定 → 麥克風
2. 找到 `meet.google.com`
3. 改為 "允許"
4. 刷新 Google Meet 頁面

### 問題 4：字幕沒有出現

**檢查清單：**

-   [ ] DevTools 中有 "[ContentScript-SpeechAPI] Final:" 日誌嗎？
-   [ ] 側面板顯示 "Recording" 狀態嗎？
-   [ ] 你說話了嗎？
-   [ ] 麥克風音量夠大嗎？

**測試方法：**

1. 打開 Chrome 設定 → 隱私和安全 → 網站設定 → 麥克風
2. 點擊 `meet.google.com` 旁邊的按鈕測試麥克風

### 問題 5：語音識別識別錯誤的語言

**解決方案：**

1. 編輯 `dist/content-script.js`
2. 找到這一行：`recognition.language = "en-US";`
3. 改為你要的語言代碼（參考上面的表格）
4. 保存並重新加載擴展

### 問題 6："Failed to fetch" 錯誤

**原因：** Webhook 配置問題（與語音轉錄無關）

**解決方案：** 參考 `docs/WEBHOOK_SETUP.md`

## 📊 性能考慮

-   **連續聆聽：** Web Speech API 會連續聆聽，直到手動停止
-   **CPU 使用：** 輕微增加（取決於系統資源）
-   **隱私：** 音頻在本地處理，不發送到 Google
    -   只有轉錄文本發送到你的 n8n webhook

## 🔐 隱私和安全

-   ✅ 音頻不留下痕跡（實時轉錄後丟棄）
-   ✅ 轉錄文本可以提交到你的私密 n8n 實例
-   ✅ 不記錄任何東西到 Chrome 同步
-   ⚠️ 確保 n8n webhook URL 是 HTTPS（加密傳輸）

## 📚 更多資源

-   [Web Speech API 官方文檔](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
-   [Chrome 擴展開發指南](https://developer.chrome.com/docs/extensions/)
-   [語言識別常見問題](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang)

## 💡 提示和技巧

**提示 1：多人會議**

-   Web Speech API 會識別所有音頻（包括所有參與者說話）
-   對於多人會議，你可能需要手動編輯誰在說話
-   或在 Side Panel 中手動輸入說話人名字

**提示 2：背景噪音**

-   Web Speech API 在安靜環境中效果最佳
-   如果有背景噪音，使用耳麥會更好

**提示 3：連續監聽**

-   Web Speech API 會自動重新啟動（如果監聽停止）
-   不需要手動干預

**提示 4：禁用和重新啟用**

-   點擊側面板上的按鈕來啟用/禁用錄製
-   可以暫停並稍後繼續

## 🐛 報告問題

如果遇到問題，請在 Console 中複製 "[ContentScript-SpeechAPI]" 開頭的所有日誌，並提供給開發者。

例如：

```
[ContentScript-SpeechAPI] Speech recognition started
[ContentScript-SpeechAPI] Error: no-speech
```

這將幫助診斷問題。
