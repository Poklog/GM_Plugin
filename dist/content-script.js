/**
 * Content Script - Google Meet Transcript Capture
 * Uses Web Speech API to transcribe audio in real-time
 */

console.log("[ContentScript] Google Meet Interview Assistant loaded");

// ===== Web Speech API Setup =====
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    console.error(
        "[ContentScript] Web Speech API not supported in this browser"
    );
}

let recognition = null;
let isListening = false;
let isStarting = false; // 防止重複啟動
let extensionContextValid = true; // 追蹤 extension 上下文狀態
let currentTranscript = {
    speaker: "Participant",
    text: "",
    timestamp: new Date().toISOString(),
};

let lastTranscriptTime = 0;
const TRANSCRIPT_DEBOUNCE = 500; // ms
let restartTimeout = null; // 用於追蹤重啟計時器

/**
 * 檢查 extension 上下文是否仍然有效
 */
function isExtensionContextValid() {
    try {
        // 訪問任何 chrome API 來檢查是否有效
        return !!chrome.runtime?.id;
    } catch (error) {
        console.error("[ContentScript] Extension context check failed:", error);
        return false;
    }
}

/**
 * Initialize Web Speech API for real-time transcription
 */
function initializeSpeechRecognition() {
    const PREFIX = "[ContentScript-SpeechAPI]";

    if (!SpeechRecognition) {
        console.error(`${PREFIX} Speech Recognition API not available`);
        return;
    }

    recognition = new SpeechRecognition();

    // Configuration
    recognition.continuous = true; // Keep recognizing
    recognition.interimResults = true; // Get interim results
    recognition.language = "en-US"; // Can be changed dynamically

    // Start result handler
    recognition.onstart = () => {
        console.log(`${PREFIX} Speech recognition started`);
        isListening = true;
        isStarting = false; // 清除啟動標記
    };

    // Result handler
    recognition.onresult = (event) => {
        try {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + " ";
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update current transcript
            if (finalTranscript.length > 0) {
                currentTranscript.text = finalTranscript.trim();
                currentTranscript.timestamp = new Date().toISOString();

                console.log(`${PREFIX} Final: "${finalTranscript.trim()}"`);

                // 檢查上下文，然後發送
                if (isExtensionContextValid()) {
                    const now = Date.now();
                    if (now - lastTranscriptTime > TRANSCRIPT_DEBOUNCE) {
                        sendTranscriptUpdate(currentTranscript);
                        lastTranscriptTime = now;
                    }
                } else {
                    console.warn(
                        `${PREFIX} Extension context invalid, not sending`
                    );
                    extensionContextValid = false;
                    window.monitoringActive = false;
                }
            }

            if (interimTranscript.length > 0) {
                console.log(`${PREFIX} Interim: "${interimTranscript}"`);
            }
        } catch (error) {
            console.error(`${PREFIX} Error processing result:`, error);
        }
    };

    // Error handler
    recognition.onerror = (event) => {
        console.error(`${PREFIX} Error: ${event.error}`);
        isListening = false;

        // 某些錯誤需要重啟
        if (event.error === "no-speech" || event.error === "audio-capture") {
            console.log(
                `${PREFIX} Attempting to recover from "${event.error}"...`
            );

            // 清除舊的計時器
            if (restartTimeout) {
                clearTimeout(restartTimeout);
            }

            // 標記為未聽狀態，準備重啟
            isListening = false;
            isStarting = false;

            // 1.5 秒後重試
            if (window.monitoringActive) {
                restartTimeout = setTimeout(() => {
                    console.log(`${PREFIX} Restarting after error...`);
                    startListening();
                }, 1500);
            }
        }
    };

    // End handler
    recognition.onend = () => {
        console.log(`${PREFIX} Speech recognition ended`);
        isListening = false;
        isStarting = false; // 確保清除啟動標記

        // 檢查上下文是否仍然有效
        if (!isExtensionContextValid()) {
            console.warn(
                `${PREFIX} Extension context lost during onend, stopping monitoring`
            );
            extensionContextValid = false;
            window.monitoringActive = false;
            return;
        }

        // 監控處於活動狀態時自動重啟（但避免衝突）
        if (window.monitoringActive) {
            // 清除舊的計時器
            if (restartTimeout) {
                clearTimeout(restartTimeout);
            }

            console.log(`${PREFIX} Auto-restarting in 1.5 seconds...`);
            restartTimeout = setTimeout(() => {
                if (
                    window.monitoringActive &&
                    !isListening &&
                    !isStarting &&
                    isExtensionContextValid()
                ) {
                    console.log(`${PREFIX} Restarting listening...`);
                    startListening();
                } else {
                    console.log(
                        `${PREFIX} Restart cancelled (monitoring=${
                            window.monitoringActive
                        }, listening=${isListening}, starting=${isStarting}, contextValid=${isExtensionContextValid()})`
                    );
                }
            }, 1500); // 增加延遲到 1.5 秒
        }
    };
}

/**
 * Send transcript update to service worker
 */
function sendTranscriptUpdate(transcript) {
    const PREFIX = "[ContentScript-Send]";

    // 首先檢查上下文是否有效
    if (!isExtensionContextValid()) {
        console.error(`${PREFIX} Extension context not valid, aborting send`);
        extensionContextValid = false;
        window.monitoringActive = false;
        return;
    }

    try {
        chrome.runtime.sendMessage(
            {
                type: "TRANSCRIPT_UPDATE",
                data: transcript,
            },
            (response) => {
                // 檢查是否有錯誤
                if (chrome.runtime.lastError) {
                    const error = chrome.runtime.lastError;
                    console.warn(`${PREFIX} Error:`, error);

                    // 檢測上下文失效
                    if (
                        error.message &&
                        error.message.includes("context invalidated")
                    ) {
                        console.error(
                            `${PREFIX} Context invalidated detected!`
                        );
                        extensionContextValid = false;
                        window.monitoringActive = false;
                    }
                } else {
                    console.log(`${PREFIX} OK`);
                }
            }
        );
    } catch (error) {
        console.error(`${PREFIX} Exception:`, error);

        // 檢測上下文失效異常
        if (error.message && error.message.includes("context invalidated")) {
            console.error(`${PREFIX} Context invalidated in catch!`);
            extensionContextValid = false;
            window.monitoringActive = false;
        }
    }
}

/**
 * Start listening with Web Speech API
 */
function startListening() {
    const PREFIX = "[ContentScript-Listen]";

    // 檢查上下文
    if (!isExtensionContextValid()) {
        console.error(`${PREFIX} Extension context not valid, cannot start`);
        extensionContextValid = false;
        window.monitoringActive = false;
        return;
    }

    if (!recognition) {
        console.error(`${PREFIX} Speech recognition not initialized`);
        return;
    }

    // 如果已經在聽，就不要重複啟動
    if (isListening) {
        console.log(`${PREFIX} Already listening`);
        return;
    }

    // 如果正在啟動，等待
    if (isStarting) {
        console.log(`${PREFIX} Already starting...`);
        return;
    }

    // 清除任何待處理的重啟計時器
    if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
    }

    try {
        isStarting = true;
        console.log(`${PREFIX} Calling recognition.start()`);
        recognition.start();
        // 注意: isStarting 會由 onstart 事件清除
    } catch (error) {
        console.error(`${PREFIX} Error calling start():`, error);
        isStarting = false;

        // 如果已經在運行，就不要重試
        if (error.message && error.message.includes("already started")) {
            console.log(`${PREFIX} Recognition already running`);
            isListening = true;
            isStarting = false;
        }
    }
}

/**
 * Stop listening with Web Speech API
 */
function stopListening() {
    const PREFIX = "[ContentScript-Listen]";

    if (!recognition) {
        console.error(`${PREFIX} Speech recognition not initialized`);
        return;
    }

    // 清除任何待處理的重啟計時器
    if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
    }

    try {
        isStarting = false;
        console.log(`${PREFIX} Stopping...`);
        recognition.stop();
        console.log(`${PREFIX} Stop command sent`);
    } catch (error) {
        console.error(`${PREFIX} Error stopping:`, error);
    }
}

/**
 * Initialize monitoring (starts speech recognition)
 */
function initializeTranscriptMonitoring() {
    const PREFIX = "[ContentScript-Monitor]";
    console.log(`${PREFIX} Initializing monitoring...`);

    initializeSpeechRecognition();
    window.monitoringActive = true;
    startListening();

    console.log(`${PREFIX} Monitoring initialized and listening started`);
}

/**
 * Stop monitoring (stops speech recognition)
 */
function stopTranscriptMonitoring() {
    const PREFIX = "[ContentScript-Monitor]";
    console.log(`${PREFIX} Stopping monitoring...`);

    window.monitoringActive = false;

    // 清除計時器
    if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
    }

    stopListening();

    console.log(`${PREFIX} Monitoring stopped`);
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
                    `${PREFIX} Returning transcript:`,
                    currentTranscript
                );
                try {
                    sendResponse({ success: true, data: currentTranscript });
                } catch (error) {
                    console.warn(`${PREFIX} sendResponse failed:`, error);
                }
                break;

            case "START_MONITORING":
                console.log(`${PREFIX} Starting monitoring...`);
                initializeTranscriptMonitoring();
                try {
                    sendResponse({
                        success: true,
                        message: "Monitoring started",
                    });
                } catch (error) {
                    console.warn(`${PREFIX} sendResponse failed:`, error);
                }
                break;

            case "STOP_MONITORING":
                console.log(`${PREFIX} Stopping monitoring...`);
                stopTranscriptMonitoring();
                try {
                    sendResponse({
                        success: true,
                        message: "Monitoring stopped",
                    });
                } catch (error) {
                    console.warn(`${PREFIX} sendResponse failed:`, error);
                }
                break;

            case "SET_LANGUAGE":
                console.log(`${PREFIX} Setting language to:`, request.language);
                if (recognition) {
                    recognition.language = request.language || "en-US";
                    try {
                        sendResponse({
                            success: true,
                            message: "Language set",
                        });
                    } catch (error) {
                        console.warn(`${PREFIX} sendResponse failed:`, error);
                    }
                } else {
                    try {
                        sendResponse({
                            success: false,
                            error: "Recognition not initialized",
                        });
                    } catch (error) {
                        console.warn(`${PREFIX} sendResponse failed:`, error);
                    }
                }
                break;

            default:
                console.log(`${PREFIX} Unknown message type: ${request.type}`);
                try {
                    sendResponse({
                        success: false,
                        error: "Unknown message type",
                    });
                } catch (error) {
                    console.warn(`${PREFIX} sendResponse failed:`, error);
                }
        }
    } catch (error) {
        console.error(`${PREFIX} Error:`, error);
        try {
            sendResponse({ success: false, error: error.message });
        } catch (responseError) {
            console.warn(
                `${PREFIX} Could not send error response:`,
                responseError
            );
        }
    }
});

// ===== Initialize =====
console.log("[ContentScript] Initialization started");
initializeTranscriptMonitoring();
console.log("[ContentScript] Initialization complete");

// ===== Cleanup =====
window.addEventListener("beforeunload", () => {
    console.log("[ContentScript] Page unloading, stopping monitoring...");
    stopTranscriptMonitoring();
});
