/**
 * Service Worker - Background Process
 * Handles webhook management, storage, and inter-component communication
 */

console.log("[ServiceWorker] Interview Assistant service worker started");

// ===== Import utility modules =====
// Note: In actual implementation, use webpack to bundle these
// For now, include these at build time or inline them

const PREFIX = "[ServiceWorker]";

// ===== Global State =====
const state = {
    activeConnections: new Map(),
    syncInProgress: false,
    lastSyncTime: null,
};

// ===== Side Panel Enable/Disable Logic =====
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    console.log(`${PREFIX} Tab updated:`, tabId, info.status, tab.url);

    if (!tab.url) return;

    const url = new URL(tab.url);
    const isMeetPage = url.origin === "https://meet.google.com";

    console.log(`${PREFIX} Is Google Meet page:`, isMeetPage);

    try {
        if (isMeetPage) {
            await chrome.sidePanel.setOptions({
                tabId,
                path: "sidepanel.html",
                enabled: true,
            });
            console.log(`${PREFIX} Side panel enabled for tab ${tabId}`);
        } else {
            await chrome.sidePanel.setOptions({
                tabId,
                enabled: false,
            });
            console.log(`${PREFIX} Side panel disabled for tab ${tabId}`);
        }
    } catch (error) {
        console.error(`${PREFIX} Failed to update side panel:`, error);
    }
});

// Allow opening side panel via toolbar click
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => console.log(`${PREFIX} Side panel behavior configured`))
    .catch((error) =>
        console.error(
            `${PREFIX} Failed to configure side panel behavior:`,
            error
        )
    );

// ===== Message Handler =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(
        `${PREFIX} Message received:`,
        request.type,
        "from:",
        sender.url || "unknown"
    );

    try {
        switch (request.type) {
            case "TRANSCRIPT_UPDATE":
                handleTranscriptUpdate(request.data, sender, sendResponse);
                return true; // Will call sendResponse asynchronously

            case "SUBMIT_TRANSCRIPT":
                handleSubmitTranscript(request.data, sender, sendResponse);
                return true;

            case "GET_WEBHOOK_URL":
                handleGetWebhookUrl(request, sender, sendResponse);
                return true;

            case "SAVE_WEBHOOK_URL":
                handleSaveWebhookUrl(request.url, sender, sendResponse);
                return true;

            case "GET_MEETING_NOTES":
                handleGetMeetingNotes(request, sender, sendResponse);
                return true;

            case "GET_TRANSCRIPT_HISTORY":
                handleGetTranscriptHistory(request, sender, sendResponse);
                return true;

            default:
                console.log(`${PREFIX} Unknown message type: ${request.type}`);
                sendResponse({ success: false, error: "Unknown message type" });
        }
    } catch (error) {
        console.error(`${PREFIX} Error handling message:`, error);
        sendResponse({ success: false, error: error.message });
    }
});

// ===== Port Connection Handler (for side panel long-lived connection) =====
chrome.runtime.onConnect.addListener((port) => {
    console.log(`${PREFIX} Port connected: ${port.name}`);

    if (port.name === "sidepanel-connection") {
        state.activeConnections.set(port, true);

        port.onMessage.addListener((msg) => {
            console.log(`${PREFIX} Port message received:`, msg.type);
            handlePortMessage(port, msg);
        });

        port.onDisconnect.addListener(() => {
            console.log(`${PREFIX} Port disconnected: ${port.name}`);
            state.activeConnections.delete(port);
        });

        // Send initial status
        port.postMessage({
            type: "CONNECTION_ESTABLISHED",
            data: { timestamp: new Date().toISOString() },
        });
    }
});

// ===== Message Handlers =====

/**
 * Handle incoming transcript updates from content script
 */
async function handleTranscriptUpdate(transcriptData, sender, sendResponse) {
    console.log(`${PREFIX} [handleTranscriptUpdate] Received:`, transcriptData);

    try {
        // Store in local cache for side panel to access
        await chrome.storage.local.set({ currentTranscript: transcriptData });
        console.log(`${PREFIX} [handleTranscriptUpdate] Transcript stored`);

        // Broadcast to all side panel connections
        broadcastToSidePanels({
            type: "TRANSCRIPT_UPDATED",
            data: transcriptData,
        });

        sendResponse({ success: true, message: "Transcript received" });
    } catch (error) {
        console.error(`${PREFIX} [handleTranscriptUpdate] Error:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle transcript submission to n8n webhook
 */
async function handleSubmitTranscript(transcriptData, sender, sendResponse) {
    console.log(
        `${PREFIX} [handleSubmitTranscript] Processing submission:`,
        transcriptData
    );

    try {
        state.syncInProgress = true;

        // Get webhook URL from storage
        const { n8nWebhookUrl } = await chrome.storage.local.get(
            "n8nWebhookUrl"
        );

        if (!n8nWebhookUrl) {
            throw new Error("Webhook URL not configured");
        }

        console.log(
            `${PREFIX} [handleSubmitTranscript] Webhook URL found, sending...`
        );
        console.log(`${PREFIX} [handleSubmitTranscript] URL: ${n8nWebhookUrl}`);

        // Send to n8n with improved error handling
        let response;
        try {
            response = await fetch(n8nWebhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetingId: transcriptData.meetingId || "unknown",
                    timestamp:
                        transcriptData.timestamp || new Date().toISOString(),
                    speaker: transcriptData.speaker,
                    transcript: transcriptData.text,
                    metadata: {
                        extensionId: chrome.runtime.id,
                        capturedAt: new Date().toISOString(),
                        type: "TRANSCRIPT_SUBMISSION",
                    },
                }),
            });
        } catch (fetchError) {
            console.error(
                `${PREFIX} [handleSubmitTranscript] Fetch error:`,
                fetchError
            );

            // 提供更详细的错误信息
            if (fetchError.message.includes("Failed to fetch")) {
                throw new Error(
                    `Network error: Cannot reach webhook URL. Check if the URL is correct and accessible. Error: ${fetchError.message}`
                );
            }
            throw fetchError;
        }

        console.log(
            `${PREFIX} [handleSubmitTranscript] Response status: ${response.status}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Webhook returned ${response.status}: ${errorText}`
            );
        }

        const result = await response.json();
        console.log(`${PREFIX} [handleSubmitTranscript] n8n response:`, result);

        // Parse and store updated notes
        const updatedNotes = result.updatedNotes || result.notes || [];
        const removedQuestions =
            result.removedQuestions || result.removed || [];

        await chrome.storage.local.set({
            meetingNotes: updatedNotes,
            lastUpdated: new Date().toISOString(),
        });

        console.log(
            `${PREFIX} [handleSubmitTranscript] Notes updated. Count: ${updatedNotes.length}`
        );

        // Broadcast updated notes to side panels
        broadcastToSidePanels({
            type: "NOTES_UPDATED",
            data: {
                notes: updatedNotes,
                removed: removedQuestions,
            },
        });

        // Mark transcript as synced
        await markTranscriptSynced(transcriptData);

        state.syncInProgress = false;
        state.lastSyncTime = new Date().toISOString();

        sendResponse({
            success: true,
            message: "Transcript submitted successfully",
            updatedNotes: updatedNotes,
            removedQuestions: removedQuestions,
        });
    } catch (error) {
        console.error(`${PREFIX} [handleSubmitTranscript] Error:`, error);
        state.syncInProgress = false;

        sendResponse({
            success: false,
            error: error.message,
        });
    }
}

/**
 * Handle webhook URL retrieval
 */
async function handleGetWebhookUrl(request, sender, sendResponse) {
    console.log(`${PREFIX} [handleGetWebhookUrl] Retrieving webhook URL...`);

    try {
        const { n8nWebhookUrl } = await chrome.storage.local.get(
            "n8nWebhookUrl"
        );
        console.log(
            `${PREFIX} [handleGetWebhookUrl] URL found:`,
            n8nWebhookUrl ? "Yes" : "No"
        );

        sendResponse({
            success: true,
            webhookUrl: n8nWebhookUrl || null,
        });
    } catch (error) {
        console.error(`${PREFIX} [handleGetWebhookUrl] Error:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle webhook URL save
 */
async function handleSaveWebhookUrl(webhookUrl, sender, sendResponse) {
    console.log(
        `${PREFIX} [handleSaveWebhookUrl] Saving webhook URL...`,
        webhookUrl.substring(0, 50) + "..."
    );

    try {
        // Validate URL
        new URL(webhookUrl);

        await chrome.storage.local.set({ n8nWebhookUrl: webhookUrl });
        console.log(
            `${PREFIX} [handleSaveWebhookUrl] Webhook URL saved successfully`
        );

        // Broadcast to side panels
        broadcastToSidePanels({
            type: "WEBHOOK_CONFIGURED",
            data: { configured: true },
        });

        sendResponse({ success: true, message: "Webhook URL saved" });
    } catch (error) {
        console.error(`${PREFIX} [handleSaveWebhookUrl] Error:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle meeting notes retrieval
 */
async function handleGetMeetingNotes(request, sender, sendResponse) {
    console.log(
        `${PREFIX} [handleGetMeetingNotes] Retrieving meeting notes...`
    );

    try {
        const { meetingNotes = [] } = await chrome.storage.local.get(
            "meetingNotes"
        );
        console.log(
            `${PREFIX} [handleGetMeetingNotes] Notes count: ${meetingNotes.length}`
        );

        sendResponse({
            success: true,
            notes: meetingNotes,
        });
    } catch (error) {
        console.error(`${PREFIX} [handleGetMeetingNotes] Error:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle transcript history retrieval
 */
async function handleGetTranscriptHistory(request, sender, sendResponse) {
    console.log(
        `${PREFIX} [handleGetTranscriptHistory] Retrieving transcript history...`
    );

    try {
        const { transcripts = [] } = await chrome.storage.local.get(
            "transcripts"
        );
        console.log(
            `${PREFIX} [handleGetTranscriptHistory] Total transcripts: ${transcripts.length}`
        );

        sendResponse({
            success: true,
            transcripts: transcripts,
        });
    } catch (error) {
        console.error(`${PREFIX} [handleGetTranscriptHistory] Error:`, error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle port messages
 */
async function handlePortMessage(port, message) {
    console.log(`${PREFIX} [handlePortMessage] Type:`, message.type);

    try {
        switch (message.type) {
            case "GET_STATUS":
                port.postMessage({
                    type: "STATUS",
                    data: {
                        syncInProgress: state.syncInProgress,
                        lastSyncTime: state.lastSyncTime,
                        timestamp: new Date().toISOString(),
                    },
                });
                break;

            default:
                console.log(
                    `${PREFIX} [handlePortMessage] Unknown type: ${message.type}`
                );
        }
    } catch (error) {
        console.error(`${PREFIX} [handlePortMessage] Error:`, error);
    }
}

// ===== Utility Functions =====

/**
 * Broadcast message to all active side panel connections
 */
function broadcastToSidePanels(message) {
    console.log(
        `${PREFIX} [broadcast] Sending to ${state.activeConnections.size} connections:`,
        message.type
    );

    for (const [port] of state.activeConnections) {
        try {
            port.postMessage(message);
        } catch (error) {
            console.error(
                `${PREFIX} [broadcast] Failed to send to port:`,
                error
            );
        }
    }
}

/**
 * Mark transcript as synced
 */
async function markTranscriptSynced(transcriptData) {
    console.log(
        `${PREFIX} [markTranscriptSynced] Marking transcript as synced...`
    );

    try {
        const { transcripts = [] } = await chrome.storage.local.get(
            "transcripts"
        );
        const updated = transcripts.map((t) => {
            if (
                t.speaker === transcriptData.speaker &&
                t.text === transcriptData.text
            ) {
                return {
                    ...t,
                    synced: true,
                    syncedAt: new Date().toISOString(),
                };
            }
            return t;
        });

        await chrome.storage.local.set({ transcripts: updated });
        console.log(`${PREFIX} [markTranscriptSynced] Complete`);
    } catch (error) {
        console.error(`${PREFIX} [markTranscriptSynced] Error:`, error);
    }
}

console.log(`${PREFIX} Service worker initialization complete`);
