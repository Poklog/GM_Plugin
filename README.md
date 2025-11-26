# GM Plugin Example

This is a minimal web extension example (Manifest V3) demonstrating a popup, a background service worker, and a content script.

Install / Load in Chromium-based browsers (Chrome, Edge):

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and select this repository's folder.
4. Click the extension icon, then try the "Highlight page" button.

Notes:

-   The example uses `chrome.scripting.executeScript` so it requires a Chromium browser with Manifest V3 support.
-   For Firefox, some parts of MV3 (service workers) may differ; adapt as needed.
