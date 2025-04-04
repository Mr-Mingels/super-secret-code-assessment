import type { ApiResponse, CommuteResponse, CommuteAddress } from '~core/database'
import { STORAGE_KEYS } from '~core/constants'

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
             * @param addresses Array of addresses to calculate commute times for
             * @returns Promise with commute duration data or error information
             */
            async get(addresses?: CommuteAddress[]): Promise<ApiResponse<CommuteResponse>> {
                try {
                    // Build query string for addresses if provided
                    let url = `${API_BASE_URL}/commute/durations`;
                    
                    if (addresses) {
                        // Convert addresses to a JSON string for the query parameter
                        const addressesParam = encodeURIComponent(JSON.stringify(addresses));
                        url = `${url}?addresses=${addressesParam}`;
                    }
                    
                    const response = await fetch(url, {
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
 * Simplified address service for handling address storage in the extension
 */
const addressService = {
    /**
     * Save addresses to chrome.storage.local
     * @param addresses Array of commute addresses to save
     */
    saveAddresses(addresses: CommuteAddress[]): Promise<void> {
        return new Promise<void>((resolve) => {
            chrome.storage.local.set({ [STORAGE_KEYS.COMMUTE_ADDRESSES]: addresses }, () => {
                resolve();
            });
        });
    },

    /**
     * Get addresses from chrome.storage.local
     * @returns Promise resolving to array of commute addresses
     */
    getAddresses(): Promise<CommuteAddress[]> {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.COMMUTE_ADDRESSES], (result) => {
                resolve(result[STORAGE_KEYS.COMMUTE_ADDRESSES] || []);
            });
        });
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
        const { endpoint, method, params } = message;

        // Route to the appropriate API handler
        if (endpoint === '/commute/durations' && method === 'GET') {
            apiProxy.commute.durations.get(params?.addresses)
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
    } else if (message.type === 'GET_ADDRESSES') {
        addressService.getAddresses()
            .then(addresses => sendResponse({ addresses }))
            .catch(error => {
                console.error('Error retrieving addresses:', error);
                sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
            });
        return true; // Keep connection open for async response
    } else if (message.type === 'SAVE_ADDRESSES') {
        addressService.saveAddresses(message.addresses)
            .then(() => sendResponse({ success: true }))
            .catch(error => {
                console.error('Error saving addresses:', error);
                sendResponse({ 
                    error: error instanceof Error ? error.message : 'Unknown error',
                    success: false
                });
            });
        return true; // Keep connection open for async response
    }

    return false; // No async response expected for other message types
});