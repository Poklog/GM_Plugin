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
let currentTranscript = {
    speaker: "Participant",
    text: "",
    timestamp: new Date().toISOString(),
};

let lastTranscriptTime = 0;
const TRANSCRIPT_DEBOUNCE = 500; // ms

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
    };

    // Result handler
    recognition.onresult = (event) => {
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

            // Send to service worker
            const now = Date.now();
            if (now - lastTranscriptTime > TRANSCRIPT_DEBOUNCE) {
                sendTranscriptUpdate(currentTranscript);
                lastTranscriptTime = now;
            }
        }

        if (interimTranscript.length > 0) {
            console.log(`${PREFIX} Interim: "${interimTranscript}"`);
        }
    };

    // Error handler
    recognition.onerror = (event) => {
        console.error(`${PREFIX} Error:`, event.error);

        // Auto-restart on certain errors
        if (event.error === "no-speech") {
            console.log(`${PREFIX} No speech detected, restarting...`);
            setTimeout(() => startListening(), 1000);
        }
    };

    // End handler
    recognition.onend = () => {
        console.log(`${PREFIX} Speech recognition ended`);
        isListening = false;

        // Auto-restart if monitoring is active
        if (window.monitoringActive) {
            setTimeout(() => startListening(), 1000);
        }
    };
}

/**
 * Send transcript update to service worker
 */
function sendTranscriptUpdate(transcript) {
    const PREFIX = "[ContentScript-Send]";

    chrome.runtime.sendMessage(
        {
            type: "TRANSCRIPT_UPDATE",
            data: transcript,
        },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error(`${PREFIX} Error:`, chrome.runtime.lastError);
            } else {
                console.log(`${PREFIX} Service worker acknowledged`);
            }
        }
    );
}

/**
 * Start listening with Web Speech API
 */
function startListening() {
    const PREFIX = "[ContentScript-Listen]";

    if (!recognition) {
        console.error(`${PREFIX} Speech recognition not initialized`);
        return;
    }

    if (isListening) {
        console.log(`${PREFIX} Already listening`);
        return;
    }

    try {
        recognition.start();
        console.log(`${PREFIX} Started listening`);
    } catch (error) {
        console.error(`${PREFIX} Error starting:`, error);
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

    try {
        recognition.stop();
        console.log(`${PREFIX} Stopped listening`);
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

            case "SET_LANGUAGE":
                console.log(`${PREFIX} Setting language to:`, request.language);
                if (recognition) {
                    recognition.language = request.language || "en-US";
                    sendResponse({ success: true, message: "Language set" });
                } else {
                    sendResponse({
                        success: false,
                        error: "Recognition not initialized",
                    });
                }
                break;

            default:
                console.log(`${PREFIX} Unknown message type: ${request.type}`);
                sendResponse({ success: false, error: "Unknown message type" });
        }
    } catch (error) {
        console.error(`${PREFIX} Error:`, error);
        sendResponse({ success: false, error: error.message });
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
