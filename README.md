# 🎤 Google Meet Interview Assistant Chrome Extension

> AI-powered interview assistant web extension for Google Meet with n8n integration

[![Status](https://img.shields.io/badge/Status-Complete-brightgreen)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()
[![Chrome Web Store](https://img.shields.io/badge/Platform-Chrome%20Extension-yellow)]()

## ✨ Features

-   **Real-time Transcript Capture**: Automatically captures speaker and captions from Google Meet
-   **Dual-Panel Side Interface**:
    -   Left panel: Interview transcript/Q&A history
    -   Right panel: AI-generated meeting notes and reminders
-   **n8n Webhook Integration**: Send interview transcripts to n8n for AI processing
-   **Modern UI**: Beautiful, responsive design with animations
-   **Local Storage**: Persists transcripts and notes locally in Chrome

## Project Structure

```
GM_Plugin/
├── dist/                      # Extension source files (direct development)
│   ├── manifest.json         # Chrome extension manifest
│   ├── content-script.js     # Google Meet DOM monitoring
│   ├── service-worker.js     # Background service worker
│   ├── sidepanel.html        # Side panel UI
│   ├── sidepanel.js          # Side panel logic
│   ├── styles.css            # Modern CSS styling
│   └── utils/
│       ├── storage.js        # Chrome storage utilities
│       ├── webhook.js        # n8n webhook utilities
│       └── message.js        # Inter-component messaging
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md       # System architecture
│   ├── DEVELOPMENT.md        # Development guide
│   ├── N8N_INTEGRATION.md    # n8n webhook setup
│   ├── QUICKSTART_ZH.md      # 快速開始（中文）
│   ├── INSTALL_CHROME.md     # Chrome installation guide
│   └── DELIVERY.md           # Delivery notes
├── README.md                 # This file
├── manifest.json             # Reference copy
└── package.json              # Project metadata
```

## Installation & Setup

### 1. Load in Chrome (No Build Required!)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder
5. The extension will appear in your Chrome toolbar

### 2. Configure n8n Webhook

1. Click the extension icon or open Google Meet
2. Click the settings ⚙️ icon in the side panel
3. Enter your n8n webhook URL
4. Click "Save Webhook"

## Development

### Edit Files Directly

All source files are in the `dist/` folder. Simply edit them directly:

-   `dist/sidepanel.html` - UI structure
-   `dist/sidepanel.js` - Side panel logic
-   `dist/styles.css` - Styling
-   `dist/content-script.js` - Google Meet monitoring
-   `dist/service-worker.js` - Background processing
-   `dist/utils/*.js` - Utility functions

### Reload Extension After Changes

1. Go to `chrome://extensions/`
2. Find "Google Meet Interview Assistant"
3. Click the refresh ♻️ icon
4. Your changes will take effect immediately

## Usage

### During Google Meet

1. Open a Google Meet call
2. Click the extension icon to open the side panel
3. The left panel will automatically capture the conversation
4. After each Q&A, click "Submit Q&A" to send to n8n
5. The right panel will update with AI-generated notes and remaining questions
6. Use the 🌙 moon icon in the header to toggle dark mode

### Dark Mode

The extension includes a built-in dark mode feature:

-   Click the sun/moon icon in the header to toggle
-   Your preference is automatically saved
-   Works with all UI components including modals and forms

### Keyboard Shortcuts

-   `Enter` in webhook input: Save webhook
-   `Enter` in dark mode button area: Toggle theme

## Architecture

### Component Communication Flow

```
┌─────────────────────────────────┐
│  Google Meet Page               │
│  (content-script.js)            │
│  - Monitor DOM for transcripts  │
│  - Detect speakers & captions   │
└──────────────┬──────────────────┘
               │ chrome.runtime.sendMessage
               ▼
┌─────────────────────────────────┐
│  Service Worker (Background)    │
│  (service-worker.js)            │
│  - Validate messages            │
│  - Send to n8n webhook          │
│  - Manage chrome.storage.local  │
│  - Route to side panel          │
└──────────────┬──────────────────┘
               │ chrome.runtime.connect (port)
               ▼
┌─────────────────────────────────┐
│  Side Panel                     │
│  (sidepanel.js + sidepanel.html)│
│  - Display transcripts          │
│  - Show meeting notes           │
│  - Configure webhook            │
│  - Real-time updates            │
│  - Dark mode toggle             │
└─────────────────────────────────┘
```

## Console Logging

All components include detailed console logging with prefixes for debugging:

-   `[ContentScript]` - Google Meet monitoring
-   `[ServiceWorker]` - Background processing
-   `[SidePanel]` - UI interactions
-   `[StorageUtil]` - Storage operations
-   `[WebhookUtil]` - Webhook communications
-   `[MessageUtil]` - Message routing

Open DevTools (F12) to view logs during development.

## n8n Webhook Integration

### Expected Request Format

```json
{
    "meetingId": "abc-defg-hij",
    "timestamp": "2024-11-26T10:30:00.000Z",
    "speaker": "John Doe",
    "transcript": "Hello everyone, thanks for joining...",
    "metadata": {
        "extensionId": "...",
        "capturedAt": "2024-11-26T10:30:00.000Z",
        "type": "TRANSCRIPT_SUBMISSION"
    }
}
```

### Expected Response Format

```json
{
    "success": true,
    "message": "Transcript processed",
    "updatedNotes": [
        {
            "id": "q1",
            "question": "What is your experience with X?",
            "hint": "Look for specific details"
        }
    ],
    "removedQuestions": ["q5", "q7"]
}
```

## Debugging

### Debug Service Worker

1. Go to `chrome://extensions/`
2. Find "Google Meet Interview Assistant"
3. Click "Service worker" link to open DevTools

### Debug Content Script

1. Open DevTools on Google Meet (F12)
2. Look for `[ContentScript]` logs

### Debug Side Panel

1. Right-click side panel → Inspect
2. DevTools will open for the side panel

## Modular Utilities

### StorageUtil (`dist/utils/storage.js`)

-   `saveWebhookUrl(url)` - Save webhook endpoint
-   `getWebhookUrl()` - Retrieve webhook
-   `saveTranscript(data)` - Store transcript
-   `getMeetingNotes()` - Get notes from n8n
-   `clearAll()` - Debug: clear all storage

### WebhookUtil (`dist/utils/webhook.js`)

-   `sendToWebhook(data, url)` - Send to n8n
-   `validateWebhookUrl(url)` - URL validation
-   `parseWebhookResponse(data)` - Parse n8n response

### MessageUtil (`dist/utils/message.js`)

-   `sendToServiceWorker(msg)` - Send message
-   `connectSidePanel()` - Establish port
-   `TYPES` - Message type constants

## Troubleshooting

### Extension Not Appearing

-   Check `chrome://extensions/` for errors
-   Verify manifest.json syntax
-   Check browser console for manifest errors

### Not Capturing Audio

-   Verify Google Meet page is loaded
-   Check content script injection in DevTools
-   Verify DOM selectors haven't changed (Google updates UI)

### Webhook Not Responding

-   Verify webhook URL is correct
-   Check n8n workflow is active
-   Monitor Service Worker logs
-   Test webhook with Postman

### Side Panel Won't Open

-   Only appears on Google Meet pages
-   Click extension icon or toolbar button
-   Check if extension is enabled

## Documentation

For more detailed information, see the docs folder:

-   **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and data flow
-   **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guidelines
-   **[N8N_INTEGRATION.md](docs/N8N_INTEGRATION.md)** - n8n webhook setup guide
-   **[QUICKSTART_ZH.md](docs/QUICKSTART_ZH.md)** - 快速開始指南（中文）
-   **[INSTALL_CHROME.md](docs/INSTALL_CHROME.md)** - Chrome 安裝詳細步驟

## Future Enhancements

-   [ ] Real-time transcription API support
-   [ ] Multiple language support
-   [ ] Export to PDF/Word
-   [ ] Collaboration features
-   [ ] Advanced filtering and search
-   [ ] Custom note templates

MIT

## Support

For issues or feature requests, please create an issue in the repository.
