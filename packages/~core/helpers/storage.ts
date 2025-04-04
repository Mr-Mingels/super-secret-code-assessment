import type { CommuteAddress, MaxDurations } from '../database'
import { STORAGE_KEYS } from '../constants'

// Chrome API type definitions
declare namespace chrome {
  export namespace runtime {
    const id: string | undefined;
  }
  export namespace storage {
    interface StorageArea {
      get(keys: string | string[] | Record<string, any> | null, callback: (items: Record<string, any>) => void): void;
      set(items: Record<string, any>, callback?: () => void): void;
    }
    const local: StorageArea;
  }
}

/**
 * Detects if code is running in extension context
 */
const isExtension = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
}

/**
 * Storage utility for managing commute addresses consistently across web and extension
 */
export const storage = {
  /**
   * Save commute addresses to the appropriate storage
   * In extension: Uses chrome.storage.local
   * In web: Uses localStorage + messaging to extension
   */
  saveCommuteAddresses(addresses: CommuteAddress[]): void {
    try {
      // Save to localStorage first (works in both contexts)
      localStorage.setItem(STORAGE_KEYS.COMMUTE_ADDRESSES, JSON.stringify(addresses));
      
      // In extension context: also save to chrome.storage
      if (isExtension()) {
        chrome.storage.local.set({ [STORAGE_KEYS.COMMUTE_ADDRESSES]: addresses });
      } 
      // In web context: notify extension via messaging
      else if (typeof window !== 'undefined') {
        window.postMessage({ 
          type: 'SAVE_ADDRESSES_TO_EXTENSION',
          addresses 
        }, '*');
      }
    } catch (e) {
      console.error('Failed to save commute addresses', e);
    }
  },

  /**
   * Get commute addresses from storage
   * Returns immediately from localStorage if available
   * Requests from extension asynchronously if needed
   */
  getCommuteAddresses(): CommuteAddress[] {
    try {
      // Check localStorage first (immediate, works in both contexts)
      const data = localStorage.getItem(STORAGE_KEYS.COMMUTE_ADDRESSES);
      if (data) {
        return JSON.parse(data);
      }

      // If no localStorage data and in web context, request from extension
      if (!isExtension() && typeof window !== 'undefined') {
        window.postMessage({ type: 'GET_ADDRESSES_FROM_EXTENSION' }, '*');
      }
      
      return []; // Will be updated via events if extension responds
    } catch (e) {
      console.error('Failed to get commute addresses', e);
      return [];
    }
  },
  
  /**
   * Save max durations for different travel modes
   * Uses the same sync mechanism as addresses
   */
  saveMaxDurations(maxDurations: MaxDurations): void {
    try {
      // Save to localStorage first (works in both contexts)
      localStorage.setItem(STORAGE_KEYS.MAX_DURATIONS, JSON.stringify(maxDurations));
      
      // In extension context: also save to chrome.storage
      if (isExtension()) {
        chrome.storage.local.set({ [STORAGE_KEYS.MAX_DURATIONS]: maxDurations });
      } 
      // In web context: notify extension via messaging
      else if (typeof window !== 'undefined') {
        window.postMessage({ 
          type: 'SAVE_MAX_DURATIONS_TO_EXTENSION',
          maxDurations 
        }, '*');
      }
    } catch (e) {
      console.error('Failed to save max durations', e);
    }
  },

  /**
   * Get max durations from storage
   * Returns immediately from localStorage if available
   * Requests from extension asynchronously if needed
   */
  getMaxDurations(): MaxDurations {
    try {
      // Check localStorage first (immediate, works in both contexts)
      const data = localStorage.getItem(STORAGE_KEYS.MAX_DURATIONS);
      if (data) {
        return JSON.parse(data);
      }

      // If no localStorage data and in web context, request from extension
      if (!isExtension() && typeof window !== 'undefined') {
        window.postMessage({ type: 'GET_MAX_DURATIONS_FROM_EXTENSION' }, '*');
      }
      
      // Return default values if no data found
      return {
        driving: 30,
        transit: 45,
        biking: 20,
        walking: 15
      };
    } catch (e) {
      console.error('Failed to get max durations', e);
      // Return defaults on error
      return {
        driving: 30,
        transit: 45,
        biking: 20,
        walking: 15
      };
    }
  },
  
  /**
   * Clear all stored addresses and max durations
   * Used primarily for debugging/reset functionality
   */
  clearAddresses(): void {
    try {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.COMMUTE_ADDRESSES);
      localStorage.removeItem(STORAGE_KEYS.MAX_DURATIONS);
      
      // In extension context: also clear chrome.storage
      if (isExtension()) {
        chrome.storage.local.set({ 
          [STORAGE_KEYS.COMMUTE_ADDRESSES]: [],
          [STORAGE_KEYS.MAX_DURATIONS]: {}
        });
      }
      // In web context: notify extension to clear
      else if (typeof window !== 'undefined') {
        window.postMessage({ type: 'CLEAR_ADDRESSES' }, '*');
      }
    } catch (e) {
      console.error('Failed to clear addresses', e);
    }
  }
}

// Initialize: listen for extension messages in web context
if (typeof window !== 'undefined' && !isExtension()) {
  // Listen for address update events from extension
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    const { type, addresses } = event.data || {};
    
    if ((type === 'EXTENSION_ADDRESSES_RESPONSE' || type === 'EXTENSION_ADDRESSES_UPDATED') && addresses) {
      console.log('Received addresses from extension via message:', addresses);
      
      // Update localStorage when extension sends addresses
      localStorage.setItem(STORAGE_KEYS.COMMUTE_ADDRESSES, JSON.stringify(addresses));
      
      // Notify components
      window.dispatchEvent(new CustomEvent('uprent:addresses-updated', {
        detail: { addresses }
      }));
    }
  });
} 