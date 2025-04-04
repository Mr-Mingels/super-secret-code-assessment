<script lang="ts">
    import type { AddressDuration, CommuteAddress, MaxDurations } from '~core/database'
    import { RouteSVG, PlusSVG, MapPinSVG } from '~ui/assets'
    import { Button } from '~ui/components'
    import { storage } from '~core/helpers/storage'
    import CommuteModal from './commute-modal.svelte'
    import CommuteResults from './commute-results.svelte'
    import { onMount } from 'svelte';
  
    /**
     * Prop: Function to fetch commute durations
     * This is provided by the parent component and will differ between web and extension
     */
    export let fetchDurations: () => Promise<{
      addressDurations: AddressDuration[] | null;
      error: string | null | any; // Allow any type of error
    }>;
  
    // Component states
    let loading = false
    let error: string | null = null
    let addressDurations: AddressDuration[] | null = null
    
    // Address management
    let addresses: CommuteAddress[] = []
    let maxDurations: MaxDurations = storage.getMaxDurations()
    let showCommuteModal = false
    let editingAddressId: string | null = null
    let currentEditAddress = ''
    
    // Load saved addresses on component initialization
    function initializeAddresses() {
      addresses = storage.getCommuteAddresses()
      maxDurations = storage.getMaxDurations()
    }
  
    /**
     * Open modal to add a new address
     */
    function addAddress() {
      editingAddressId = null
      currentEditAddress = ''
      showCommuteModal = true
    }
  
    /**
     * Open modal to edit an existing address
     */
    function editAddress(address: CommuteAddress) {
      editingAddressId = address.id
      currentEditAddress = address.address
      showCommuteModal = true
    }
  
    /**
     * Handle address save from modal
     */
    function handleAddressSave(event: CustomEvent<{ address: string; maxDurations: MaxDurations; maxDurationsOnly?: boolean }>) {
      const { address, maxDurations: newMaxDurations, maxDurationsOnly = false } = event.detail
      
      // Update max durations
      maxDurations = newMaxDurations;
      
      // If we're only updating max durations, don't update addresses
      if (maxDurationsOnly) {
        // Just save the max durations to storage
        storage.saveMaxDurations(maxDurations)
        return;
      }
      
      // Otherwise handle address updates
      if (editingAddressId) {
        // Update existing address
        addresses = addresses.map(item => 
          item.id === editingAddressId 
            ? { ...item, address }
            : item
        )
      } else {
        // Add new address (max 2) with a new ID
        if (addresses.length < 2) {
          addresses = [...addresses, { id: Date.now().toString(), address }]
        }
      }
      
      // Save to local storage
      storage.saveCommuteAddresses(addresses)
      storage.saveMaxDurations(maxDurations)
    }
  
    /**
     * Remove an address
     */
    function removeAddress(id: string) {
      // Filter out the address
      addresses = addresses.filter(address => address.id !== id);
      storage.saveCommuteAddresses(addresses);
      
      // Also filter out durations for the removed address
      if (addressDurations) {
        addressDurations = addressDurations.filter(duration => duration.address.id !== id);
        
        // If no durations left, set to null
        if (addressDurations.length === 0) {
          addressDurations = null;
        }
      }
    }
  
    /**
     * Load commute durations data using the provided fetch function
     */
    const load = async () => {
      // Don't allow loading if no addresses are set
      if (addresses.length === 0) {
        error = "Please add at least one address first"
        return
      }
      
      loading = true
      error = null
      
      try {
        const result = await fetchDurations();
        
        if (result.error) {
          error = result.error;
          addressDurations = null;
          return;
        }
        
        addressDurations = result.addressDurations;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Unknown error';
        addressDurations = null;
      } finally {
        loading = false;
      }
    }
  
    onMount(() => {
      // Initial load
      initializeAddresses();
      
      // Request addresses from extension if available
      if (typeof window !== 'undefined') {
        console.log('Component requesting addresses from extension');
        window.postMessage({ type: 'GET_ADDRESSES_FROM_EXTENSION' }, '*');
        window.postMessage({ type: 'GET_MAX_DURATIONS_FROM_EXTENSION' }, '*');
      }
      
      // Set up listener for address updates from extension
      const handleAddressesUpdated = (event: CustomEvent) => {
        const { addresses: updatedAddresses } = event.detail;
        if (updatedAddresses && Array.isArray(updatedAddresses)) {
          // Update the component's addresses
          addresses = updatedAddresses;
          
          // Also update addressDurations - remove any duration for addresses that no longer exist
          if (addressDurations) {
            // Get a set of all current address IDs
            const addressIds = new Set(updatedAddresses.map(addr => addr.id));
            
            // Filter out any duration for addresses that no longer exist
            addressDurations = addressDurations.filter(duration => addressIds.has(duration.address.id));
            
            // If no durations left, set to null
            if (addressDurations.length === 0) {
              addressDurations = null;
            }
          }
        }
      };
      
      // Set up listener for max durations updates from extension
      const handleMaxDurationsUpdated = (event: CustomEvent) => {
        const { maxDurations: updatedMaxDurations } = event.detail;
        if (updatedMaxDurations) {
          maxDurations = updatedMaxDurations;
        }
      };
      
      // Also listen for the clean-address-durations event
      const handleCleanAddressDurations = (event: CustomEvent) => {
        const { validAddressIds } = event.detail;
        if (validAddressIds && Array.isArray(validAddressIds)) {
          // Filter out any addressDuration for addresses that are no longer valid
          if (addressDurations) {
            addressDurations = addressDurations.filter(duration => 
              validAddressIds.includes(duration.address.id)
            );
            
            // If no durations left, set to null
            if (addressDurations.length === 0) {
              addressDurations = null;
            }
          }
        }
      };
      
      // Listen for custom events from extension
      window.addEventListener('uprent:addresses-updated', handleAddressesUpdated as EventListener);
      window.addEventListener('uprent:max-durations-updated', handleMaxDurationsUpdated as EventListener);
      window.addEventListener('uprent:clean-address-durations', handleCleanAddressDurations as EventListener);
      
      // Clean up listener on component destruction
      return () => {
        window.removeEventListener('uprent:addresses-updated', handleAddressesUpdated as EventListener);
        window.removeEventListener('uprent:max-durations-updated', handleMaxDurationsUpdated as EventListener);
        window.removeEventListener('uprent:clean-address-durations', handleCleanAddressDurations as EventListener);
      };
    });
</script>
  
<div class="commute-widget !.w-full !.max-w-[500px] !.rounded-lg !.flex !.flex-col !.overflow-hidden !.my-2 !.shadow-sm uprent-font-poppins">
  
  {#if showCommuteModal}
    <CommuteModal 
      currentAddress={currentEditAddress}
      on:close={() => showCommuteModal = false}
      on:save={handleAddressSave}
    />
  {/if}
  
  <!-- Header -->
  <div class="!.bg-primary !.text-white !.py-3 !.px-4 !.rounded-t-lg">
    <h3 class="!.font-medium !.text-base !.m-0">Commute Times</h3>
  </div>

  <!-- Content -->
  <div style="border-bottom: 1px solid #D1D5DB !important; border-right: 1px solid #D1D5DB !important; border-left: 1px solid #D1D5DB !important" class="!.p-4 !.rounded-b-lg !.border-gray-200">
    {#if addresses.length === 0}
      <!-- Empty state -->
      <div class="!.flex !.flex-col !.items-center !.justify-center !.py-8">
        <div class=".flex !.items-center !.justify-center !.bg-primary-100 !.text-primary !.rounded-full !.p-4 !.mb-4">
          <MapPinSVG />
        </div>
        <p class="!.text-sm !.text-gray-600 !.mb-4">Add addresses to calculate commute times</p>
        <Button primary onClick={addAddress}>
          <PlusSVG slot="icon" />
          Add address
        </Button>
      </div>
    {:else}
      <!-- Destinations section -->
      <div class="!.mb-4">
        <h4 class="!.text-gray-600 !.text-sm !.uppercase !.font-medium !.mb-3">YOUR DESTINATIONS</h4>
        
        <!-- Address list -->
         <div class="!.flex !.flex-col !.gap-2.5">
            {#each addresses as address}
                <div class="!.flex !.items-center !.justify-between !.group !.bg-gray-100 !.rounded-md !.p-2 !.gap-2">
                    <span class=".flex !.items-center !.justify-center !.text-primary">
                        <MapPinSVG />
                    </span>
                    <p class="!.flex-1 !.text-sm !.font-medium !.truncate !.m-0">
                        {address.address}
                    </p>
                    <div class="!.flex !.gap-2 !.text-xs">
                        <button 
                            class="uprent-font-poppins hover:!.text-primary !.text-gray-600 !.bg-gray-100 hover:!.bg-primary/10 !.cursor-pointer !.border-none !.h-6 !.px-2 !.rounded-md !.transition-colors"
                            on:click={() => editAddress(address)}
                        >
                            Edit
                        </button>
                        <button 
                            class="uprent-font-poppins hover:!.text-primary !.text-gray-600 !.bg-gray-100 hover:!.bg-primary/10 !.cursor-pointer !.border-none !.h-6 !.px-2 !.rounded-md !.transition-colors"
                            on:click={() => removeAddress(address.id)}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            {/each}
         </div>
        
        <!-- Add another address -->
        {#if addresses.length < 2}
          <button 
            class="uprent-font-poppins !.text-sm !.border !.bg-white !.cursor-pointer !.border-dashed !.rounded-md !.gap-2 !.h-9 !.w-full !.items-center !.justify-center !.border-gray-400 !.transition-colors !.text-gray-400 hover:!.bg-gray-50 hover:!.border-primary hover:!.text-primary !.flex !.mt-3" 
            on:click={addAddress}
          >
            <PlusSVG />
            <span>Add another destination</span>
          </button>
        {/if}
      </div>

      <!-- Commute times results -->
      {#if addressDurations && addressDurations.length > 0}
      <CommuteResults {addressDurations} {maxDurations} />
      {/if}

      <!-- Load commutes button -->
      <Button primary {loading} onClick={load} class=".w-full !.mt-4">
        <RouteSVG slot="icon" />
        Load commutes
      </Button>
      
      {#if error}
        <p class="!.text-red-500 !.mt-2 !.text-sm">{error}</p>
      {/if}
    {/if}
  </div>
</div>