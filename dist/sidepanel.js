/**
 * Side Panel Script - Main Logic
 * Handles UI interactions, real-time updates, and webhook configuration
 */

console.log("[SidePanel] Interview Assistant side panel loaded");

const PREFIX = "[SidePanel]";

// ===== DOM Elements =====
const elements = {
    transcriptContent: document.getElementById("transcriptContent"),
    notesContent: document.getElementById("notesContent"),
    submitBtn: document.getElementById("submitBtn"),
    clearBtn: document.getElementById("clearBtn"),
    settingsBtn: document.getElementById("settingsBtn"),
    transcriptStatus: document.getElementById("transcriptStatus"),
    syncIndicator: document.getElementById("syncIndicator"),
    // Modal elements
    settingsModal: document.getElementById("settingsModal"),
    modalOverlay: document.getElementById("modalOverlay"),
    webhookInput: document.getElementById("webhookInput"),
    closeModalBtn: document.getElementById("closeModalBtn"),
    saveWebhookBtn: document.getElementById("saveWebhookBtn"),
    cancelBtn: document.getElementById("cancelBtn"),
};

// ===== State Management =====
const state = {
    currentTranscript: null,
    meetingNotes: [],
    webhookConfigured: false,
    serviceWorkerPort: null,
    transcriptItems: [], // Track transcript items in UI
};

// ===== Service Worker Communication =====

/**
 * Connect to service worker via port
 */
function connectToServiceWorker() {
    console.log(`${PREFIX} Connecting to service worker...`);

    state.serviceWorkerPort = chrome.runtime.connect({
        name: "sidepanel-connection",
    });

    state.serviceWorkerPort.onMessage.addListener((message) => {
        console.log(`${PREFIX} Service worker message:`, message.type);

        switch (message.type) {
            case "CONNECTION_ESTABLISHED":
                console.log(`${PREFIX} Connection established`);
                updateWebhookStatus();
                loadMeetingNotes();
                break;

            case "TRANSCRIPT_UPDATED":
                console.log(
                    `${PREFIX} Transcript update received:`,
                    message.data
                );
                updateTranscriptUI(message.data);
                break;

            case "NOTES_UPDATED":
                console.log(`${PREFIX} Notes updated:`, message.data);
                updateNotesUI(message.data);
                break;

            case "WEBHOOK_CONFIGURED":
                console.log(`${PREFIX} Webhook configured notification`);
                updateWebhookStatus();
                break;

            default:
                console.log(`${PREFIX} Unknown message type: ${message.type}`);
        }
    });

    state.serviceWorkerPort.onDisconnect.addListener(() => {
        console.log(`${PREFIX} Service worker port disconnected`);
    });

    console.log(`${PREFIX} Port connection established`);
}

// ===== Transcript UI Functions =====

/**
 * Update transcript display with new content
 */
function updateTranscriptUI(transcriptData) {
    console.log(
        `${PREFIX} [updateTranscriptUI] Adding transcript:`,
        transcriptData
    );

    if (!elements.transcriptContent) {
        console.error(`${PREFIX} Transcript content element not found`);
        return;
    }

    // Clear placeholder
    const placeholder =
        elements.transcriptContent.querySelector(".placeholder");
    if (placeholder) {
        placeholder.remove();
        console.log(`${PREFIX} Placeholder removed`);
    }

    // Create transcript item
    const item = document.createElement("div");
    item.className = "message-item";
    item.innerHTML = `
    <div class="message-speaker">${escapeHtml(transcriptData.speaker)}</div>
    <div class="message-text">${escapeHtml(transcriptData.text)}</div>
    <div class="message-time">${formatTime(transcriptData.timestamp)}</div>
  `;

    elements.transcriptContent.appendChild(item);
    state.transcriptItems.push({
        speaker: transcriptData.speaker,
        text: transcriptData.text,
        timestamp: transcriptData.timestamp,
        element: item,
    });

    console.log(
        `${PREFIX} Transcript item added. Total: ${state.transcriptItems.length}`
    );

    // Auto scroll to bottom
    elements.transcriptContent.scrollTop =
        elements.transcriptContent.scrollHeight;

    // Update status
    elements.transcriptStatus.textContent = "Recording";
    elements.transcriptStatus.classList.add("recording");

    // Save to state for submission
    state.currentTranscript = transcriptData;
}

/**
 * Clear transcript content
 */
function clearTranscript() {
    console.log(`${PREFIX} [clearTranscript] Clearing transcript...`);

    elements.transcriptContent.innerHTML =
        '<p class="placeholder">Waiting for Google Meet to start...</p>';
    state.transcriptItems = [];
    state.currentTranscript = null;

    elements.transcriptStatus.textContent = "Idle";
    elements.transcriptStatus.classList.remove("recording", "submitted");

    console.log(`${PREFIX} Transcript cleared`);
}

/**
 * Submit current transcript to webhook
 */
async function submitTranscript() {
    console.log(`${PREFIX} [submitTranscript] Submitting transcript...`);

    if (!state.currentTranscript) {
        showNotification("No transcript to submit", "warning");
        console.log(`${PREFIX} No transcript available`);
        return;
    }

    if (!state.webhookConfigured) {
        showNotification("Please configure webhook first", "error");
        console.log(`${PREFIX} Webhook not configured`);
        return;
    }

    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = "Submitting...";
    elements.syncIndicator.textContent = "⟳";
    elements.syncIndicator.classList.add("syncing");

    try {
        console.log(
            `${PREFIX} Sending submission message to service worker...`
        );
        const response = await chrome.runtime.sendMessage({
            type: "SUBMIT_TRANSCRIPT",
            data: {
                ...state.currentTranscript,
                meetingId: getCurrentMeetingId(),
            },
        });

        console.log(`${PREFIX} Submission response:`, response);

        if (response.success) {
            console.log(`${PREFIX} Submission successful`);
            elements.transcriptStatus.textContent = "Submitted";
            elements.transcriptStatus.classList.add("submitted");
            elements.syncIndicator.textContent = "✓";
            elements.syncIndicator.classList.remove("syncing");
            showNotification("Transcript submitted successfully", "success");

            // Update notes if provided
            if (response.updatedNotes) {
                updateNotesUI({
                    notes: response.updatedNotes,
                    removed: response.removedQuestions,
                });
            }

            // Clear transcript after short delay
            setTimeout(() => {
                clearTranscript();
            }, 1500);
        } else {
            throw new Error(response.error || "Unknown error");
        }
    } catch (error) {
        console.error(`${PREFIX} Submission failed:`, error);
        elements.syncIndicator.textContent = "✕";
        elements.syncIndicator.classList.remove("syncing");
        elements.syncIndicator.classList.add("error");
        showNotification(`Submission failed: ${error.message}`, "error");
    } finally {
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = "Submit Q&A";
    }
}

// ===== Notes UI Functions =====

/**
 * Load and display meeting notes
 */
async function loadMeetingNotes() {
    console.log(`${PREFIX} [loadMeetingNotes] Loading notes...`);

    try {
        const response = await chrome.runtime.sendMessage({
            type: "GET_MEETING_NOTES",
        });

        if (response.success) {
            console.log(
                `${PREFIX} Notes loaded. Count: ${response.notes.length}`
            );
            updateNotesUI({ notes: response.notes });
        }
    } catch (error) {
        console.error(`${PREFIX} Failed to load notes:`, error);
    }
}

/**
 * Update notes display
 */
function updateNotesUI(data) {
    console.log(`${PREFIX} [updateNotesUI] Updating notes:`, data);

    const { notes = [], removed = [] } = data;
    state.meetingNotes = notes;

    if (notes.length === 0) {
        elements.notesContent.innerHTML =
            '<p class="placeholder">No notes yet. Configure webhook to start receiving notes from n8n.</p>';
        console.log(`${PREFIX} No notes to display`);
        return;
    }

    // Clear placeholder
    const placeholder = elements.notesContent.querySelector(".placeholder");
    if (placeholder) {
        placeholder.remove();
    }

    // Update or create note items
    elements.notesContent.innerHTML = "";

    notes.forEach((note, index) => {
        const isRemoved = removed.includes(note.id || note);
        const noteItem = document.createElement("div");
        noteItem.className = "note-item";
        if (isRemoved) {
            noteItem.classList.add("completed");
        }

        const questionText =
            typeof note === "string" ? note : note.question || note.text || "";
        noteItem.innerHTML = `
      <div class="note-question ${isRemoved ? "completed" : ""}">
        ${index + 1}. ${escapeHtml(questionText)}
      </div>
      ${
          note.hint
              ? `<div class="note-text">Hint: ${escapeHtml(note.hint)}</div>`
              : ""
      }
      ${
          note.notes
              ? `<div class="note-text">Notes: ${escapeHtml(note.notes)}</div>`
              : ""
      }
    `;

        elements.notesContent.appendChild(noteItem);
    });

    console.log(`${PREFIX} Notes UI updated. Count: ${notes.length}`);
}

// ===== Webhook Configuration =====

/**
 * Open webhook configuration modal
 */
function openWebhookModal() {
    console.log(`${PREFIX} [openWebhookModal] Opening modal...`);

    elements.settingsModal.classList.add("active");
    elements.modalOverlay.classList.add("active");

    // Load existing webhook URL
    loadWebhookUrl();

    console.log(`${PREFIX} Modal opened`);
}

/**
 * Close webhook configuration modal
 */
function closeWebhookModal() {
    console.log(`${PREFIX} [closeWebhookModal] Closing modal...`);

    elements.settingsModal.classList.remove("active");
    elements.modalOverlay.classList.remove("active");
    elements.webhookInput.value = "";

    console.log(`${PREFIX} Modal closed`);
}

/**
 * Load existing webhook URL into input
 */
async function loadWebhookUrl() {
    console.log(`${PREFIX} [loadWebhookUrl] Loading webhook URL...`);

    try {
        const response = await chrome.runtime.sendMessage({
            type: "GET_WEBHOOK_URL",
        });

        if (response.success && response.webhookUrl) {
            elements.webhookInput.value = response.webhookUrl;
            console.log(`${PREFIX} Webhook URL loaded`);
        }
    } catch (error) {
        console.error(`${PREFIX} Failed to load webhook URL:`, error);
    }
}

/**
 * Save webhook URL
 */
async function saveWebhookUrl() {
    console.log(`${PREFIX} [saveWebhookUrl] Saving webhook...`);

    const url = elements.webhookInput.value.trim();

    if (!url) {
        showNotification("Please enter a webhook URL", "warning");
        console.log(`${PREFIX} Empty URL provided`);
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (error) {
        showNotification("Invalid URL format", "error");
        console.error(`${PREFIX} Invalid URL:`, error);
        return;
    }

    elements.saveWebhookBtn.disabled = true;
    elements.saveWebhookBtn.textContent = "Saving...";

    try {
        const response = await chrome.runtime.sendMessage({
            type: "SAVE_WEBHOOK_URL",
            url: url,
        });

        if (response.success) {
            console.log(`${PREFIX} Webhook saved successfully`);
            state.webhookConfigured = true;
            showNotification("Webhook configured successfully", "success");
            closeWebhookModal();

            // Update status indicator
            updateWebhookStatus();
        } else {
            throw new Error(response.error || "Failed to save");
        }
    } catch (error) {
        console.error(`${PREFIX} Failed to save webhook:`, error);
        showNotification(`Failed to save webhook: ${error.message}`, "error");
    } finally {
        elements.saveWebhookBtn.disabled = false;
        elements.saveWebhookBtn.textContent = "Save Webhook";
    }
}

/**
 * Check webhook configuration status
 */
async function updateWebhookStatus() {
    console.log(`${PREFIX} [updateWebhookStatus] Checking webhook status...`);

    try {
        const response = await chrome.runtime.sendMessage({
            type: "GET_WEBHOOK_URL",
        });

        state.webhookConfigured = !!(response.success && response.webhookUrl);
        console.log(`${PREFIX} Webhook configured: ${state.webhookConfigured}`);
    } catch (error) {
        console.error(`${PREFIX} Failed to check webhook status:`, error);
    }
}

// ===== Utility Functions =====

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch (error) {
        return "N/A";
    }
}

/**
 * Show notification (temporary message)
 */
function showNotification(message, type = "info") {
    console.log(`${PREFIX} Notification [${type}]:`, message);

    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  `;

    const typeStyles = {
        success:
            "background: #c6f6d5; color: #22543d; border: 1px solid #9ae6b4;",
        error: "background: #fed7d7; color: #c53030; border: 1px solid #fc8181;",
        warning:
            "background: #feebc8; color: #7c2d12; border: 1px solid #fbd38d;",
        info: "background: #bee3f8; color: #2c5282; border: 1px solid #90cdf4;",
    };

    notification.style.cssText += typeStyles[type] || typeStyles["info"];
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease-in";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Get current meeting ID from URL
 */
function getCurrentMeetingId() {
    try {
        // Extract from Google Meet URL pattern: meet.google.com/xxx-xxxx-xxx
        const match = window.location.href.match(
            /meet\.google\.com\/([a-z\-]+)/
        );
        return match ? match[1] : "unknown";
    } catch (error) {
        console.error(`${PREFIX} Failed to get meeting ID:`, error);
        return "unknown";
    }
}

// ===== Dark Mode Functions =====

/**
 * Initialize dark mode preference from storage
 */
function initializeDarkMode() {
    console.log(`${PREFIX} Initializing dark mode...`);
    
    chrome.storage.local.get(["darkModePreference"], (result) => {
        const isDarkMode = result.darkModePreference || false;
        console.log(`${PREFIX} Dark mode preference: ${isDarkMode}`);
        
        if (isDarkMode) {
            document.documentElement.classList.add("dark-mode");
            updateDarkModeButton(true);
        }
    });
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    console.log(`${PREFIX} Toggling dark mode...`);
    
    const isDarkMode = document.documentElement.classList.toggle("dark-mode");
    
    // Save preference to storage
    chrome.storage.local.set({ darkModePreference: isDarkMode }, () => {
        console.log(`${PREFIX} Dark mode preference saved: ${isDarkMode}`);
    });
    
    updateDarkModeButton(isDarkMode);
}

/**
 * Update dark mode button appearance
 */
function updateDarkModeButton(isDarkMode) {
    const darkModeBtn = document.getElementById("darkModeBtn");
    if (!darkModeBtn) return;
    
    const sunIcon = darkModeBtn.querySelector(".sun-icon");
    const moonIcon = darkModeBtn.querySelector(".moon-icon");
    
    if (isDarkMode) {
        sunIcon.style.display = "none";
        moonIcon.style.display = "block";
    } else {
        sunIcon.style.display = "block";
        moonIcon.style.display = "none";
    }
}

// ===== Event Listeners =====

elements.submitBtn.addEventListener("click", submitTranscript);
elements.clearBtn.addEventListener("click", clearTranscript);
elements.settingsBtn.addEventListener("click", openWebhookModal);
elements.closeModalBtn.addEventListener("click", closeWebhookModal);
elements.cancelBtn.addEventListener("click", closeWebhookModal);
elements.saveWebhookBtn.addEventListener("click", saveWebhookUrl);

// Dark mode toggle
const darkModeBtn = document.getElementById("darkModeBtn");
if (darkModeBtn) {
    darkModeBtn.addEventListener("click", toggleDarkMode);
}

// Close modal when clicking overlay
elements.modalOverlay.addEventListener("click", closeWebhookModal);

// Prevent modal close when clicking inside modal
elements.settingsModal.addEventListener("click", (e) => {
    e.stopPropagation();
});

// Enter key to save webhook
elements.webhookInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        saveWebhookUrl();
    }
});

// ===== Initialization =====

console.log(`${PREFIX} Initializing side panel...`);

// Add CSS animation styles
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Connect to service worker and initialize
initializeDarkMode();
connectToServiceWorker();
updateWebhookStatus();
loadMeetingNotes();

console.log(`${PREFIX} Side panel initialization complete`);
