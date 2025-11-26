/**
 * Message Utility Module
 * Handles communication between extension components with logging
 */

const MessageUtil = (() => {
    const PREFIX = "[MessageUtil]";

    return {
        /**
         * Send message from content script to service worker
         * @param {Object} message - Message object with type and data
         * @returns {Promise<Object>} - Response from service worker
         */
        async sendToServiceWorker(message) {
            console.log(
                `${PREFIX} Sending message to service worker:`,
                message
            );
            try {
                const response = await chrome.runtime.sendMessage(message);
                console.log(`${PREFIX} Service worker response:`, response);
                return response;
            } catch (error) {
                console.error(
                    `${PREFIX} Failed to send message to service worker:`,
                    error
                );
                throw error;
            }
        },

        /**
         * Send message from side panel to service worker
         * @param {Object} message - Message object
         * @returns {Promise<Object>} - Response from service worker
         */
        async sendFromSidePanel(message) {
            console.log(`${PREFIX} Side panel sending message:`, message);
            try {
                const response = await chrome.runtime.sendMessage(message);
                console.log(
                    `${PREFIX} Side panel received response:`,
                    response
                );
                return response;
            } catch (error) {
                console.error(`${PREFIX} Side panel message failed:`, error);
                throw error;
            }
        },

        /**
         * Establish port connection from side panel to service worker
         * @returns {chrome.runtime.Port}
         */
        connectSidePanel() {
            console.log(`${PREFIX} Establishing side panel connection...`);
            const port = chrome.runtime.connect({
                name: "sidepanel-connection",
            });

            port.onDisconnect.addListener(() => {
                console.log(`${PREFIX} Side panel connection disconnected`);
            });

            port.onMessage.addListener((msg) => {
                console.log(`${PREFIX} Side panel received port message:`, msg);
            });

            console.log(`${PREFIX} Side panel connection established`);
            return port;
        },

        /**
         * Register listener for messages in service worker
         * @param {Function} callback - Callback to handle messages
         */
        registerServiceWorkerListener(callback) {
            console.log(`${PREFIX} Registering service worker listener...`);
            chrome.runtime.onMessage.addListener(
                (request, sender, sendResponse) => {
                    console.log(
                        `${PREFIX} Service worker received message:`,
                        request,
                        "from:",
                        sender
                    );
                    try {
                        callback(request, sender, sendResponse);
                    } catch (error) {
                        console.error(
                            `${PREFIX} Listener callback error:`,
                            error
                        );
                        sendResponse({ error: error.message });
                    }
                }
            );
        },

        /**
         * Register listener for port connections
         * @param {Function} callback - Callback to handle port connections
         */
        registerPortListener(callback) {
            console.log(`${PREFIX} Registering port listener...`);
            chrome.runtime.onConnect.addListener((port) => {
                console.log(
                    `${PREFIX} Port connection established: ${port.name}`
                );
                port.onMessage.addListener((msg) => {
                    console.log(`${PREFIX} Port received message:`, msg);
                    try {
                        callback(port, msg);
                    } catch (error) {
                        console.error(`${PREFIX} Port callback error:`, error);
                        port.postMessage({ error: error.message });
                    }
                });

                port.onDisconnect.addListener(() => {
                    console.log(`${PREFIX} Port disconnected: ${port.name}`);
                });
            });
        },

        /**
         * Message types (constants)
         */
        TYPES: {
            TRANSCRIPT_UPDATE: "TRANSCRIPT_UPDATE",
            SUBMIT_TRANSCRIPT: "SUBMIT_TRANSCRIPT",
            WEBHOOK_CONFIGURED: "WEBHOOK_CONFIGURED",
            NOTES_UPDATED: "NOTES_UPDATED",
            ERROR: "ERROR",
            STATUS_REQUEST: "STATUS_REQUEST",
            STATUS_RESPONSE: "STATUS_RESPONSE",
        },
    };
})();
