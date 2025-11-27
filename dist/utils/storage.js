/**
 * Storage Utility Module
 * Handles all chrome.storage.local operations with logging
 */

const StorageUtil = (() => {
    const PREFIX = "[StorageUtil]";

    return {
        /**
         * Save webhook URL to chrome storage
         * @param {string} webhookUrl - The n8n webhook URL
         * @returns {Promise<void>}
         */
        async saveWebhookUrl(webhookUrl) {
            console.log(
                `${PREFIX} Saving webhook URL...`,
                webhookUrl.substring(0, 50) + "..."
            );
            try {
                await chrome.storage.local.set({ n8nWebhookUrl: webhookUrl });
                console.log(`${PREFIX} Webhook URL saved successfully`);
            } catch (error) {
                console.error(`${PREFIX} Failed to save webhook URL:`, error);
                throw error;
            }
        },

        /**
         * Get webhook URL from chrome storage
         * @returns {Promise<string|null>}
         */
        async getWebhookUrl() {
            console.log(`${PREFIX} Retrieving webhook URL...`);
            try {
                const result = await chrome.storage.local.get("n8nWebhookUrl");
                const url = result.n8nWebhookUrl || null;
                console.log(
                    `${PREFIX} Webhook URL retrieved:`,
                    url ? url.substring(0, 50) + "..." : "null"
                );
                return url;
            } catch (error) {
                console.error(`${PREFIX} Failed to get webhook URL:`, error);
                throw error;
            }
        },

        /**
         * Save transcript data to storage
         * @param {Object} transcriptData - The transcript entry
         * @returns {Promise<void>}
         */
        async saveTranscript(transcriptData) {
            console.log(`${PREFIX} Saving transcript:`, transcriptData);
            try {
                const { transcripts = [] } = await chrome.storage.local.get(
                    "transcripts"
                );
                const newTranscript = {
                    ...transcriptData,
                    id: Date.now(),
                    synced: false,
                    savedAt: new Date().toISOString(),
                };
                transcripts.push(newTranscript);
                await chrome.storage.local.set({ transcripts });
                console.log(
                    `${PREFIX} Transcript saved. Total count: ${transcripts.length}`
                );
                return newTranscript;
            } catch (error) {
                console.error(`${PREFIX} Failed to save transcript:`, error);
                throw error;
            }
        },

        /**
         * Get all unsynced transcripts
         * @returns {Promise<Array>}
         */
        async getUnsyncedTranscripts() {
            console.log(`${PREFIX} Retrieving unsynced transcripts...`);
            try {
                const { transcripts = [] } = await chrome.storage.local.get(
                    "transcripts"
                );
                const unsynced = transcripts.filter((t) => !t.synced);
                console.log(
                    `${PREFIX} Found ${unsynced.length} unsynced transcripts`
                );
                return unsynced;
            } catch (error) {
                console.error(
                    `${PREFIX} Failed to get unsynced transcripts:`,
                    error
                );
                throw error;
            }
        },

        /**
         * Mark transcript as synced
         * @param {number} transcriptId - The transcript ID
         * @returns {Promise<void>}
         */
        async markTranscriptSynced(transcriptId) {
            console.log(
                `${PREFIX} Marking transcript as synced:`,
                transcriptId
            );
            try {
                const { transcripts = [] } = await chrome.storage.local.get(
                    "transcripts"
                );
                const updated = transcripts.map((t) =>
                    t.id === transcriptId
                        ? {
                              ...t,
                              synced: true,
                              syncedAt: new Date().toISOString(),
                          }
                        : t
                );
                await chrome.storage.local.set({ transcripts: updated });
                console.log(`${PREFIX} Transcript marked as synced`);
            } catch (error) {
                console.error(
                    `${PREFIX} Failed to mark transcript as synced:`,
                    error
                );
                throw error;
            }
        },

        /**
         * Clear current transcript (session data)
         * @returns {Promise<void>}
         */
        async clearCurrentTranscript() {
            console.log(`${PREFIX} Clearing current transcript...`);
            try {
                await chrome.storage.local.set({ currentTranscript: null });
                console.log(`${PREFIX} Current transcript cleared`);
            } catch (error) {
                console.error(
                    `${PREFIX} Failed to clear current transcript:`,
                    error
                );
                throw error;
            }
        },

        /**
         * Save meeting notes
         * @param {Array} notes - Array of meeting notes/questions
         * @returns {Promise<void>}
         */
        async saveMeetingNotes(notes) {
            console.log(`${PREFIX} Saving meeting notes:`, notes);
            try {
                await chrome.storage.local.set({
                    meetingNotes: notes,
                    lastUpdated: new Date().toISOString(),
                });
                console.log(
                    `${PREFIX} Meeting notes saved. Count: ${notes.length}`
                );
            } catch (error) {
                console.error(`${PREFIX} Failed to save meeting notes:`, error);
                throw error;
            }
        },

        /**
         * Get meeting notes
         * @returns {Promise<Array>}
         */
        async getMeetingNotes() {
            console.log(`${PREFIX} Retrieving meeting notes...`);
            try {
                const { meetingNotes = [] } = await chrome.storage.local.get(
                    "meetingNotes"
                );
                console.log(
                    `${PREFIX} Meeting notes retrieved. Count: ${meetingNotes.length}`
                );
                return meetingNotes;
            } catch (error) {
                console.error(`${PREFIX} Failed to get meeting notes:`, error);
                throw error;
            }
        },

        /**
         * Clear all data (for debugging)
         * @returns {Promise<void>}
         */
        async clearAll() {
            console.log(`${PREFIX} Clearing all storage...`);
            try {
                await chrome.storage.local.clear();
                console.log(`${PREFIX} All storage cleared`);
            } catch (error) {
                console.error(`${PREFIX} Failed to clear all storage:`, error);
                throw error;
            }
        },

        /**
         * Get all storage data (for debugging)
         * @returns {Promise<Object>}
         */
        async getAllData() {
            console.log(`${PREFIX} Retrieving all data...`);
            try {
                const data = await chrome.storage.local.get(null);
                console.log(`${PREFIX} All data retrieved:`, data);
                return data;
            } catch (error) {
                console.error(`${PREFIX} Failed to get all data:`, error);
                throw error;
            }
        },
    };
})();
