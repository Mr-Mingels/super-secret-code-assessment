/**
 * Type definitions for API responses and requests
 * These types are used throughout the application for communication with the backend
 */

import type { Durations } from "~core/database";

/**
 * Generic wrapper for all API responses
 * @template T The specific data type returned by the API
 */
export type ApiResponse<T> = {
    data: T | null;
    error: string | null;
}

/**
 * Response structure for the commute durations endpoint
 */
export type CommuteResponse = {
    status: string;
    payload: {
        durations: Durations;
    };
} 