# Google Meet 中文逐字稿助手

自動捕獲 Google Meet 會議中的中文逐字稿，支持實時查看、導出和第三方 AI 服務集成。

## 功能特性

-   🎯 **自動抓取** - MutationObserver 實時監聽字幕變化
-   🌐 **支持中文** - 自動檢測並優先捕獲中文字幕（含繁體/簡體）
-   💾 **本地存儲** - 使用 Chrome Storage API 保存逐字稿
-   📥 **導出功能** - 支持導出為 `.txt` 文件
-   🔄 **自動清理** - 24 小時後自動清空過期數據
-   🔍 **Shadow DOM 支持** - 遍歷 Shadow DOM 捕獲嵌套元素中的字幕

## 安裝方法

### Chrome / Edge 瀏覽器

1. 打開 `chrome://extensions` （或 `edge://extensions`）
2. 開啟右上角 **「開發者模式」**
3. 點擊 **「加載未打包的擴展程序」**
4. 選擇此項目文件夾

### 使用方法

1. 進入 Google Meet 會議
2. 點擊瀏覽器右上角的擴展圖標
3. 點擊 **「開始抓取」** 開始捕獲字幕
4. 實時預覽逐字稿內容
5. 點擊 **「導出 (.txt)」** 下載字幕文件
6. 點擊 **「清空」** 清空已保存的逐字稿

## 推薦的 AI 中文逐字稿方案

### 1. **OpenAI Whisper** （最推薦）

-   效果最好，支持多語言
-   優點：準確率高、支持中文標點符號檢測
-   部署方式：
    ```bash
    pip install openai-whisper
    whisper audio.mp3 --language zh
    ```
-   API 集成：`https://platform.openai.com/docs/guides/speech-to-text`

### 2. **Faster-Whisper** （快速版本）

-   Whisper 的 CTransformers 優化版
-   優點：推理速度快 3-4 倍，資源占用少
-   安裝：
    ```bash
    pip install faster-whisper
    ```
-   適合本地部署

### 3. **Whisper.cpp** （輕量級）

-   C++ 實現，極輕量級
-   優點：可在 CPU 上運行，文件大小小
-   部署：支持 WASM、Native、Mobile
-   GitHub: `https://github.com/ggerganov/whisper.cpp`

### 4. **PaddleSpeech** （中文優化）

-   百度開源，針對中文優化
-   優點：中文支持特別好、標點符號檢測準確
-   安裝：
    ```bash
    pip install paddlespeech
    paddlespeech asr --input audio.wav
    ```
-   支持多種中文方言

### 5. **Vosk** （離線輕量級）

-   完全離線，隱私保護
-   優點：無需網絡、快速、輕量
-   缺點：準確率相對低
-   適合：對隱私要求高的場景

### 6. **其他開源方案**

-   **SpeechRecognition** - Google 云 API 集成
-   **FunASR** - 阿里開源，中文效果好
-   **Wav2Vec2** - Facebook Meta，多語言支持

## 集成第三方 AI 的步驟

1. **服務器端部署**（推薦使用 Faster-Whisper）

    ```python
    from faster_whisper import WhisperModel

    model = WhisperModel("base", device="cuda", compute_type="float16")
    segments, info = model.transcribe("audio.mp3", language="zh")
    ```

2. **擴展中配置**

    - 修改 `popup.js` 添加 API 端點設置
    - 保存 API 密鑰到 `chrome.storage.sync`

3. **上傳邏輯**
    ```javascript
    // 在 popup.js 中添加
    async function uploadToAI(captions) {
        const response = await fetch("https://your-ai-server.com/transcribe", {
            method: "POST",
            body: JSON.stringify({ captions }),
            headers: { "Content-Type": "application/json" },
        });
        return response.json();
    }
    ```

## 技術細節

### 字幕捕獲機制

-   **主要選擇器**：`[data-is-caption="true"]`、`[aria-live="polite"]`
-   **Debounce**：500ms（防止過度更新）
-   **去重**：基於文本內容和時間戳
-   **Shadow DOM**：遞歸遍歷查找嵌套元素

### 存儲結構

```javascript
{
    captions: [
        { text: "你好世界", timestamp: 1700000000000 },
        { text: "這是字幕", timestamp: 1700000005000 }
    ],
    lastUpdate: 1700000010000
}
```

## 常見問題

**Q: 為什麼有時候抓不到字幕？**

-   A: Google Meet 的字幕元素可能不同，檢查瀏覽器控制台日誌確認是否激活
-   嘗試允許字幕選項並確保會議啟用了字幕

**Q: 支持離線使用嗎？**

-   A: 擴展本身離線，但 AI 轉錄需要部署本地服務或使用 API

**Q: 可以直播流錄製嗎？**

-   A: 可以結合 OBS / FFmpeg，捕獲音頻後用 AI 轉錄

## 許可證

MIT

## 常用命令

```bash
# 使用 Faster-Whisper 本地轉錄
faster-whisper audio.mp3 --language zh --output_format txt

# 使用 Whisper.cpp 轉錄
./main -m ggml-model.bin -f audio.wav -l zh

# 使用 PaddleSpeech 轉錄
paddlespeech asr --input audio.wav --lang zh
```

---

歡迎 PR 和 Issue！如有建議或問題，請在 GitHub 提交。
