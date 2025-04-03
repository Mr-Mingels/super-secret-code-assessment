import type { ApiResponse, CommuteResponse } from '~core/database'

const API_BASE_URL = 'http://localhost:5002';

/**
 * Handles API requests from content scripts, bypassing CORS restrictions
 * since background scripts have different security permissions.
 */
const apiProxy = {
    commute: {
        durations: {
            /**
             * Fetch commute durations from the API
             * @returns Promise with commute duration data or error information
             */
            async get(): Promise<ApiResponse<CommuteResponse>> {
                try {
                    const response = await fetch(`${API_BASE_URL}/commute/durations`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`API responded with status: ${response.status}`);
                    }

                    const data = await response.json();
                    return { data, error: null };
                } catch (error) {
                    console.error('API request error:', error);
                    return {
                        data: null,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }
        }
    }
};

/**
 * Message handler for one-time requests from content scripts
 * Uses the standard chrome.runtime.sendMessage API
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Validate message format
    if (!message || typeof message !== 'object' || !message.type) {
        sendResponse({ error: 'Invalid message format' });
        return false;
    }

    if (message.type === 'API_REQUEST') {
        const { endpoint, method } = message;

        // Route to the appropriate API handler
        if (endpoint === '/commute/durations' && method === 'GET') {
            apiProxy.commute.durations.get()
                .then(sendResponse)
                .catch(error => {
                    console.error('Error in API proxy:', error);
                    sendResponse({
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                });
            return true; // Required to indicate async response
        } else {
            sendResponse({ error: `Unsupported endpoint: ${endpoint}` });
        }
    }

    return false; // No async response expected for other message types
});