/**
 * Content Script - Google Meet Transcript Capture
 * Monitors Google Meet for speakers and captions
 */

console.log("[ContentScript] Google Meet Interview Assistant loaded");

// ===== Transcript Tracking =====
let currentTranscript = {
    speaker: "",
    text: "",
    timestamp: new Date().toISOString(),
};

let transcriptObserver = null;

/**
 * Detect speaker name from the page
 * @returns {string|null}
 */
function detectSpeaker() {
    const PREFIX = "[ContentScript-DetectSpeaker]";
    console.log(`${PREFIX} Attempting to detect speaker...`);

    // Try multiple selectors for speaker detection
    const possibleSelectors = [
        "[data-speaker-name]",
        '[aria-label*="speaking"]',
        ".speaker-name",
        '[role="log"] [aria-label]',
        "[data-is-caption] [aria-label]",
        ".gXE8Rb", // Google Meet speaker label class (may change)
    ];

    for (let selector of possibleSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            for (let el of elements) {
                if (el.textContent && el.textContent.trim().length > 0) {
                    const name = el.textContent.trim();
                    console.log(`${PREFIX} Speaker detected: ${name}`);
                    return name;
                }
            }
        } catch (error) {
            console.log(`${PREFIX} Selector error (${selector}):`, error);
        }
    }

    console.log(`${PREFIX} No speaker detected`);
    return null;
}

/**
 * Detect caption/transcript text from the page
 * @returns {string|null}
 */
function detectCaption() {
    const PREFIX = "[ContentScript-DetectCaption]";
    console.log(`${PREFIX} Attempting to detect caption...`);

    // Try multiple selectors for caption detection
    const possibleSelectors = [
        "[data-is-caption]",
        '[aria-label*="caption"]',
        ".caption-text",
        '[role="log"]',
        ".gwEWpd", // Google Meet caption class (may change)
    ];

    for (let selector of possibleSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            for (let el of elements) {
                const text = el.textContent?.trim();
                if (text && text.length > 0) {
                    console.log(`${PREFIX} Caption detected: ${text}`);
                    return text;
                }
            }
        } catch (error) {
            console.log(`${PREFIX} Selector error (${selector}):`, error);
        }
    }

    console.log(`${PREFIX} No caption detected`);
    return null;
}

/**
 * Initialize MutationObserver to monitor for changes
 */
function initializeTranscriptMonitoring() {
    const PREFIX = "[ContentScript-Monitor]";
    console.log(`${PREFIX} Initializing transcript monitoring...`);

    const config = {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["aria-label", "data-is-caption"],
        debounce: 100,
    };

    transcriptObserver = new MutationObserver((mutations) => {
        console.log(`${PREFIX} Mutation detected. Count:`, mutations.length);

        // Debounce rapid mutations
        clearTimeout(transcriptObserver.debounceTimer);
        transcriptObserver.debounceTimer = setTimeout(() => {
            const speaker = detectSpeaker();
            const caption = detectCaption();

            if (speaker && caption) {
                const newTranscript = {
                    speaker: speaker,
                    text: caption,
                    timestamp: new Date().toISOString(),
                };

                // Only send if content changed
                if (
                    newTranscript.speaker !== currentTranscript.speaker ||
                    newTranscript.text !== currentTranscript.text
                ) {
                    console.log(
                        `${PREFIX} New transcript detected:`,
                        newTranscript
                    );
                    currentTranscript = newTranscript;

                    // Send to service worker
                    chrome.runtime.sendMessage(
                        {
                            type: "TRANSCRIPT_UPDATE",
                            data: newTranscript,
                        },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                console.error(
                                    `${PREFIX} Message send error:`,
                                    chrome.runtime.lastError
                                );
                            } else {
                                console.log(
                                    `${PREFIX} Service worker acknowledged:`,
                                    response
                                );
                            }
                        }
                    );
                }
            }
        }, 300);
    });

    try {
        transcriptObserver.observe(document.body, config);
        console.log(`${PREFIX} Monitoring started on document.body`);
    } catch (error) {
        console.error(`${PREFIX} Failed to initialize observer:`, error);
    }
}

/**
 * Stop monitoring
 */
function stopTranscriptMonitoring() {
    const PREFIX = "[ContentScript-Monitor]";
    console.log(`${PREFIX} Stopping transcript monitoring...`);

    if (transcriptObserver) {
        transcriptObserver.disconnect();
        console.log(`${PREFIX} Monitoring stopped`);
    }
}

/**
 * Inject status indicator into page (optional visual feedback)
 */
function injectStatusIndicator() {
    const PREFIX = "[ContentScript-Indicator]";
    console.log(`${PREFIX} Injecting status indicator...`);

    try {
        // Check if already injected
        if (document.getElementById("gm-assistant-status")) {
            console.log(`${PREFIX} Status indicator already exists`);
            return;
        }

        const indicator = document.createElement("div");
        indicator.id = "gm-assistant-status";
        indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      font-family: system-ui, -apple-system, sans-serif;
    `;
        indicator.textContent = "🎤 Assistant Ready";

        document.body.appendChild(indicator);
        console.log(`${PREFIX} Status indicator injected`);
    } catch (error) {
        console.error(`${PREFIX} Failed to inject indicator:`, error);
    }
}

/**
 * Listen for messages from service worker
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const PREFIX = "[ContentScript-Listener]";
    console.log(`${PREFIX} Message received:`, request);

    try {
        switch (request.type) {
            case "GET_CURRENT_TRANSCRIPT":
                console.log(
                    `${PREFIX} Returning current transcript:`,
                    currentTranscript
                );
                sendResponse({ success: true, data: currentTranscript });
                break;

            case "START_MONITORING":
                console.log(`${PREFIX} Starting monitoring...`);
                initializeTranscriptMonitoring();
                sendResponse({ success: true, message: "Monitoring started" });
                break;

            case "STOP_MONITORING":
                console.log(`${PREFIX} Stopping monitoring...`);
                stopTranscriptMonitoring();
                sendResponse({ success: true, message: "Monitoring stopped" });
                break;

            default:
                console.log(`${PREFIX} Unknown message type: ${request.type}`);
                sendResponse({ success: false, error: "Unknown message type" });
        }
    } catch (error) {
        console.error(`${PREFIX} Error handling message:`, error);
        sendResponse({ success: false, error: error.message });
    }
});

// ===== Initialize =====
console.log("[ContentScript] Initialization started");
injectStatusIndicator();
initializeTranscriptMonitoring();
console.log("[ContentScript] Initialization complete");

// ===== Cleanup =====
window.addEventListener("beforeunload", () => {
    console.log("[ContentScript] Page unloading, stopping monitoring...");
    stopTranscriptMonitoring();
});
