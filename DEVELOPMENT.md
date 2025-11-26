# Development Setup Guide

## Prerequisites

-   Node.js 14+ and npm
-   Chrome/Chromium browser
-   Code editor (VS Code recommended)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Build

```bash
npm run dev
```

This starts webpack in watch mode and auto-rebuilds on file changes.

### 3. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Navigate to your `dist/` folder
5. Extension is now loaded!

### 4. Test on Google Meet

1. Go to [meet.google.com](https://meet.google.com)
2. Start a new meeting (or join existing one)
3. Click extension icon → Open side panel
4. The panel should show on the right side

## Debugging

### View Service Worker Logs

1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Service worker" link
4. DevTools window will open

### View Content Script Logs

1. Open Google Meet page
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for `[ContentScript]` messages

### View Side Panel Logs

1. Right-click on side panel
2. Select "Inspect"
3. DevTools for side panel will open
4. Look for `[SidePanel]` messages

## File Structure for Development

```
src/
├── content-script.js       # Google Meet monitoring (injected into page)
├── service-worker.js       # Background process (always running)
└── utils/
    ├── storage.js         # Chrome storage operations
    ├── webhook.js         # n8n webhook handling
    └── message.js         # Component communication

public/
├── sidepanel.html         # Side panel UI structure
├── sidepanel.js          # Side panel logic
└── styles.css            # UI styling

manifest.json            # Extension configuration
package.json            # Dependencies
webpack.config.js       # Build configuration
```

## Message Flow Example

### User submits transcript:

1. **SidePanel** → User clicks "Submit Q&A"
2. **SidePanel** calls: `chrome.runtime.sendMessage({ type: 'SUBMIT_TRANSCRIPT', ... })`
3. **ServiceWorker** receives message via `chrome.runtime.onMessage`
4. **ServiceWorker** sends POST to n8n webhook
5. **ServiceWorker** receives response from n8n
6. **ServiceWorker** broadcasts update via port.postMessage()
7. **SidePanel** receives update and refreshes UI

## Common Development Tasks

### Add New Console Logs

```javascript
console.log(`${PREFIX} [FunctionName] Message:`, variable);
```

All logging uses consistent prefixes:

-   `[ContentScript]`
-   `[ServiceWorker]`
-   `[SidePanel]`
-   `[StorageUtil]`
-   `[WebhookUtil]`
-   `[MessageUtil]`

### Test Local Storage

Open DevTools Console and run:

```javascript
chrome.storage.local.get(null, (data) => console.log(data));
```

### Simulate Webhook Failure

Modify webhook URL in side panel settings to an invalid address, then submit.

### Clear All Storage

DevTools Console:

```javascript
chrome.storage.local.clear(() => console.log("Storage cleared"));
```

## Build & Package

### Production Build

```bash
npm run build
```

### Create .crx Package

Chrome will auto-create when packaging the extension.

## Testing Checklist

-   [ ] Extension loads without errors
-   [ ] Side panel opens on Google Meet
-   [ ] Content script detects speakers and captions
-   [ ] Console logs appear with correct prefixes
-   [ ] Webhook URL can be configured
-   [ ] Transcript submits to webhook
-   [ ] Meeting notes update from n8n response
-   [ ] UI is responsive on different zoom levels
-   [ ] No console errors on any component

## Useful Chrome Extensions APIs

-   `chrome.runtime.sendMessage()` - Send message to service worker
-   `chrome.runtime.connect()` - Create persistent connection
-   `chrome.storage.local` - Local data storage
-   `chrome.tabs` - Tab management
-   `chrome.sidePanel` - Side panel management

## Tips

1. **Hot Reload**: After code changes, right-click extension icon → Reload
2. **Source Maps**: Build includes source maps for easier debugging
3. **Port Not Connection**: If side panel connection fails, check service worker is running
4. **DOM Selectors**: Google Meet UI changes frequently - update selectors if capture stops working

## Next Steps

1. Set up n8n webhook endpoint
2. Test message flow between components
3. Customize n8n workflow for your needs
4. Deploy on Chrome Web Store
