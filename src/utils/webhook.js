/**
 * Webhook Utility Module
 * Handles all n8n webhook communication with logging
 */

const WebhookUtil = (() => {
    const PREFIX = "[WebhookUtil]";

    return {
        /**
         * Send transcript data to n8n webhook
         * @param {Object} transcriptData - Contains speaker, text, timestamp, etc.
         * @param {string} webhookUrl - The n8n webhook endpoint
         * @returns {Promise<Object>} - Response from n8n
         */
        async sendToWebhook(transcriptData, webhookUrl) {
            console.log(
                `${PREFIX} Preparing to send data to webhook:`,
                webhookUrl.substring(0, 50) + "..."
            );
            console.log(`${PREFIX} Transcript data:`, transcriptData);

            if (!webhookUrl) {
                const error = "Webhook URL not configured";
                console.error(`${PREFIX} ${error}`);
                throw new Error(error);
            }

            const payload = {
                meetingId: transcriptData.meetingId || "unknown",
                timestamp: transcriptData.timestamp || new Date().toISOString(),
                speaker: transcriptData.speaker,
                transcript: transcriptData.text,
                metadata: {
                    extensionId: chrome.runtime.id,
                    capturedAt: new Date().toISOString(),
                    type: "TRANSCRIPT_SUBMISSION",
                },
            };

            try {
                console.log(`${PREFIX} Sending POST request to webhook...`);
                const response = await fetch(webhookUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                console.log(`${PREFIX} Response status: ${response.status}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `Webhook returned ${response.status}: ${errorText}`
                    );
                }

                const result = await response.json();
                console.log(`${PREFIX} Webhook response received:`, result);
                return result;
            } catch (error) {
                console.error(`${PREFIX} Failed to send to webhook:`, error);
                throw error;
            }
        },

        /**
         * Validate webhook URL format
         * @param {string} url - The URL to validate
         * @returns {boolean}
         */
        validateWebhookUrl(url) {
            console.log(`${PREFIX} Validating webhook URL...`);
            try {
                const urlObj = new URL(url);
                const isValid =
                    urlObj.protocol === "http:" || urlObj.protocol === "https:";
                console.log(`${PREFIX} URL validation result: ${isValid}`);
                return isValid;
            } catch (error) {
                console.error(`${PREFIX} Invalid URL format:`, error);
                return false;
            }
        },

        /**
         * Handle n8n webhook response with notes update
         * @param {Object} response - The response from n8n
         * @returns {Object} - Parsed response with notes and removed questions
         */
        parseWebhookResponse(response) {
            console.log(`${PREFIX} Parsing webhook response...`);
            try {
                const parsedResponse = {
                    success: response.success !== false,
                    updatedNotes: response.updatedNotes || response.notes || [],
                    removedQuestions:
                        response.removedQuestions || response.removed || [],
                    message: response.message || "",
                    raw: response,
                };
                console.log(`${PREFIX} Parsed response:`, parsedResponse);
                return parsedResponse;
            } catch (error) {
                console.error(
                    `${PREFIX} Failed to parse webhook response:`,
                    error
                );
                throw error;
            }
        },
    };
})();
