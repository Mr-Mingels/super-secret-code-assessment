/**
 * Utility functions for browser extension functionality
*/

import type { ApiRequestMessage, RequestMethod } from "./types";

/**
 * Sends a message to the background script and returns the response
 * This function abstracts the chrome.runtime.sendMessage API to provide
 * a more convenient Promise-based interface with error handling
 * 
 * @param message - The message to send to the background script
 * @returns A Promise that resolves with the response from the background script
*/
async function sendToBackground<T>(message: ApiRequestMessage): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
            // Check for extension context errors
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            // Check for API errors
            if (response && response.error) {
                reject(new Error(response.error));
                return;
            }

            resolve(response);
        });
    });
}

/**
 * Makes an API request through the background script
 * This avoids CORS issues by leveraging the background script's
 * ability to make requests without origin restrictions
 * 
 * @param endpoint - The API endpoint to call (e.g., '/commute/durations')
 * @param method - The HTTP method to use
 * @param body - Optional request body for POST/PUT/PATCH requests
 * @returns A Promise that resolves with the API response
 */
export async function extensionFetch<T>(
    endpoint: string,
    method: RequestMethod = 'GET',
    body?: any
): Promise<T> {
    try {
        return await sendToBackground<T>({
            type: 'API_REQUEST',
            endpoint,
            method,
            body
        });
    } catch (error) {
        console.error('Extension API request failed:', error);
        throw error;
    }
} 