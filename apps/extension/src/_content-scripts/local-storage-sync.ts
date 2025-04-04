import type { CommuteAddress, MaxDurations } from '~core/database';
import { STORAGE_KEYS } from '~core/constants';

/**
 * Content script to handle address synchronization between web app and extension
 * 
 * This content script creates a bridge between the web page's localStorage
 * and the extension's chrome.storage.local to keep addresses in sync.
 */

/**
 * Gets addresses from the extension's storage
 */
function getAddressesFromExtension(): Promise<CommuteAddress[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.COMMUTE_ADDRESSES], (result) => {
      const addresses = result[STORAGE_KEYS.COMMUTE_ADDRESSES] || [];
      resolve(addresses);
    });
  });
}

/**
 * Gets max durations from the extension's storage
 */
function getMaxDurationsFromExtension(): Promise<MaxDurations> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.MAX_DURATIONS], (result) => {
      const maxDurations = result[STORAGE_KEYS.MAX_DURATIONS] || {};
      resolve(maxDurations);
    });
  });
}

/**
 * Saves addresses to the extension's storage
 */
function saveAddressesToExtension(addresses: CommuteAddress[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.COMMUTE_ADDRESSES]: addresses }, () => {
      resolve();
    });
  });
}

/**
 * Saves max durations to the extension's storage
 */
function saveMaxDurationsToExtension(maxDurations: MaxDurations): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.MAX_DURATIONS]: maxDurations }, () => {
      resolve();
    });
  });
}

/**
 * Updates the web page's localStorage with addresses from extension
 * and dispatches a custom event to notify components
 */
function updateWebStorage(key: string, data: CommuteAddress[] | MaxDurations): void {
  try {
    // Don't trigger our own listener
    const jsonData = JSON.stringify(data);
    originalSetItem.call(localStorage, key, jsonData);
    
    // Notify web app components with appropriate event
    if (key === STORAGE_KEYS.COMMUTE_ADDRESSES) {
      // Type assertion to tell TypeScript this is definitely a CommuteAddress array
      const addresses = data as CommuteAddress[];
      
      // Dispatch a custom event for the web app
      window.dispatchEvent(new CustomEvent('uprent:addresses-updated', { 
        detail: { addresses } 
      }));
      
      // Also dispatch an event to clean up address durations
      window.dispatchEvent(new CustomEvent('uprent:clean-address-durations', { 
        detail: { validAddressIds: addresses.map(addr => addr.id) } 
      }));
    } else if (key === STORAGE_KEYS.MAX_DURATIONS) {
      // Type assertion to tell TypeScript this is definitely a MaxDurations object
      const maxDurations = data as MaxDurations;
      
      window.dispatchEvent(new CustomEvent('uprent:max-durations-updated', { 
        detail: { maxDurations } 
      }));
    }
  } catch (error) {
    console.error(`Error updating web storage for ${key}:`, error);
  }
}

// Listen for messages from the web app
window.addEventListener('message', async (event) => {
  // Only accept messages from our own window
  if (event.source !== window) return;

  const { type, addresses, maxDurations } = event.data || {};

  switch (type) {
    case 'GET_ADDRESSES_FROM_EXTENSION':
      try {
        const addresses = await getAddressesFromExtension();
        updateWebStorage(STORAGE_KEYS.COMMUTE_ADDRESSES, addresses);
      } catch (error) {
        console.error('Error retrieving addresses from extension:', error);
      }
      break;
      
    case 'GET_MAX_DURATIONS_FROM_EXTENSION':
      try {
        const maxDurations = await getMaxDurationsFromExtension();
        updateWebStorage(STORAGE_KEYS.MAX_DURATIONS, maxDurations);
      } catch (error) {
        console.error('Error retrieving max durations from extension:', error);
      }
      break;
      
    case 'SAVE_ADDRESSES_TO_EXTENSION':
      if (addresses) {
        try {
          await saveAddressesToExtension(addresses);
        } catch (error) {
          console.error('Error saving addresses to extension:', error);
        }
      }
      break;
      
    case 'SAVE_MAX_DURATIONS_TO_EXTENSION':
      if (maxDurations) {
        try {
          await saveMaxDurationsToExtension(maxDurations);
        } catch (error) {
          console.error('Error saving max durations to extension:', error);
        }
      }
      break;
      
    case 'CLEAR_ADDRESSES':
      try {
        await saveAddressesToExtension([]);
        await saveMaxDurationsToExtension({});
        originalSetItem.call(localStorage, STORAGE_KEYS.COMMUTE_ADDRESSES, '[]');
        originalSetItem.call(localStorage, STORAGE_KEYS.MAX_DURATIONS, '{}');
      } catch (error) {
        console.error('Error clearing data:', error);
      }
      break;
  }
});

// Override localStorage.setItem to catch web app changes
// This avoids CSP issues with injected scripts
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  // Call original first
  originalSetItem.call(this, key, value);
  
  // Handle commute addresses
  if (key === STORAGE_KEYS.COMMUTE_ADDRESSES) {
    try {
      const addresses = JSON.parse(value);
      saveAddressesToExtension(addresses)
        .catch(error => console.error('Error syncing addresses to extension:', error));
    } catch (error) {
      console.error('Error processing localStorage change for addresses:', error);
    }
  }
  
  // Handle max durations
  if (key === STORAGE_KEYS.MAX_DURATIONS) {
    try {
      const maxDurations = JSON.parse(value);
      saveMaxDurationsToExtension(maxDurations)
        .catch(error => console.error('Error syncing max durations to extension:', error));
    } catch (error) {
      console.error('Error processing localStorage change for max durations:', error);
    }
  }
};

// Watch for chrome.storage changes to update web app
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    // Handle address changes
    if (changes[STORAGE_KEYS.COMMUTE_ADDRESSES]) {
      const addresses = changes[STORAGE_KEYS.COMMUTE_ADDRESSES].newValue || [];
      updateWebStorage(STORAGE_KEYS.COMMUTE_ADDRESSES, addresses);
      
      // Also directly dispatch the event to clean up durations (in case updateWebStorage is bypassed)
      window.dispatchEvent(new CustomEvent('uprent:clean-address-durations', { 
        detail: { validAddressIds: addresses.map((addr: CommuteAddress) => addr.id) } 
      }));
    }
    
    // Handle max durations changes
    if (changes[STORAGE_KEYS.MAX_DURATIONS]) {
      const maxDurations = changes[STORAGE_KEYS.MAX_DURATIONS].newValue || {};
      updateWebStorage(STORAGE_KEYS.MAX_DURATIONS, maxDurations);
    }
  }
});

// Initialize by checking for stored data in the extension
async function initializeSync() {
  try {
    // Sync addresses
    const addresses = await getAddressesFromExtension();
    updateWebStorage(STORAGE_KEYS.COMMUTE_ADDRESSES, addresses);
    
    // Sync max durations
    const maxDurations = await getMaxDurationsFromExtension();
    updateWebStorage(STORAGE_KEYS.MAX_DURATIONS, maxDurations);
  } catch (error) {
    console.error('Error during sync initialization:', error);
  }
}

// Inject a script to handle special events like cleaning up durations
function injectEventHandlers() {
  const script = document.createElement('script');
  script.textContent = `
    // Listen for the clean-address-durations event
    window.addEventListener('uprent:clean-address-durations', (event) => {
      try {
        const { validAddressIds } = event.detail;
        
        // Clean up any component state that might contain address durations
        if (window.addressDurations) {
          // Update the global addressDurations if it exists
          window.addressDurations = window.addressDurations.filter(
            duration => validAddressIds.includes(duration.address.id)
          );
          
          // If all durations were removed, set to null
          if (window.addressDurations.length === 0) {
            window.addressDurations = null;
          }
          
          // Force any components to update
          window.dispatchEvent(new CustomEvent('uprent:durations-updated'));
        }
        
        // Check for specific component instances that might have their own state
        // This targets Svelte components that might be mounted in the extension UI
        if (window.__UPRENT_COMPONENTS__) {
          // Iterate through any registered components
          for (const componentId in window.__UPRENT_COMPONENTS__) {
            const component = window.__UPRENT_COMPONENTS__[componentId];
            
            // If the component has addressDurations, update them
            if (component && component.addressDurations) {
              component.addressDurations = component.addressDurations.filter(
                duration => validAddressIds.includes(duration.address.id)
              );
              
              // If all durations were removed, set to null
              if (component.addressDurations.length === 0) {
                component.addressDurations = null;
              }
            }
          }
        }
        
        // If we have a single CommuteTime component instance
        if (window.commuteTimeComponent) {
          const component = window.commuteTimeComponent;
          
          // Update the addressDurations if it exists
          if (component.addressDurations) {
            component.addressDurations = component.addressDurations.filter(
              duration => validAddressIds.includes(duration.address.id)
            );
            
            // If all durations were removed, set to null
            if (component.addressDurations.length === 0) {
              component.addressDurations = null;
            }
          }
        }
        
        // Trigger an update in the UI
        document.querySelectorAll('.commute-results').forEach(el => {
          // Force a refresh or add a class to trigger an animation
          el.classList.add('refresh');
          setTimeout(() => el.classList.remove('refresh'), 10);
        });
      } catch (error) {
        console.error('Error handling clean-address-durations event:', error);
      }
    });
  `;
  
  (document.head || document.documentElement).appendChild(script);
  script.remove(); // Script will still execute after removal
}

// Initialize sync and event handlers
export async function initialize() {
  // Inject event handlers
  injectEventHandlers();
  
  // Sync data
  await initializeSync();
}