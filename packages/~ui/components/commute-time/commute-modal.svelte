<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte'
    import { Button } from '~ui/components'
    import { Tabs, TabList, TabTrigger, TabContent } from '~ui/components'
    import { MapPinSVG, CarSVG, BikeSVG, BusSVG, WalkSVG } from '~ui/assets'
    import { MOCK_ADDRESSES } from '~core/database/mock-data'
    import { storage } from '~core/helpers/storage'
    import type { MaxDurations } from '~core/database'
    import { DEFAULT_MAX_DURATIONS } from '~core/constants'
    
    export let currentAddress = ''
        
    // Address tab variables
    let inputValue = ''
    let filteredSuggestions: string[] = []
    let showSuggestions = false
    
    // Max durations tab variables
    let maxDurations: MaxDurations = { ...DEFAULT_MAX_DURATIONS }
    
    // Current active tab
    let activeTab = 'address'
    
    // References for click handling
    let suggestionsContainer: HTMLElement
    let modalContent: HTMLElement

    const transportModes: { mode: keyof MaxDurations; label: string; icon: any }[] = [
      { mode: 'driving', label: 'Driving', icon: CarSVG },
      { mode: 'transit', label: 'Transit', icon: BusSVG },
      { mode: 'biking', label: 'Biking', icon: BikeSVG },
      { mode: 'walking', label: 'Walking', icon: WalkSVG }
    ];
  
    const dispatch = createEventDispatcher<{
      close: undefined
      save: { address: string; maxDurations: MaxDurations; maxDurationsOnly: boolean }
    }>()
    
    function close() {
      dispatch('close')
    }
    
    function save() {
      // When saving from maxDurations tab, we can save even with empty address
      if (activeTab === 'maxDurations') {
        const completeMaxDurations: MaxDurations = {
          ...DEFAULT_MAX_DURATIONS,
          ...maxDurations
        }
        
        // Save max durations to storage
        storage.saveMaxDurations(completeMaxDurations)
        
        // For max durations only, use a special event that doesn't update address
        dispatch('save', { 
          address: '', // Empty address indicates we're only updating maxDurations
          maxDurations: completeMaxDurations,
          maxDurationsOnly: true // Flag to indicate we only want to update max durations
        })
        
        close()
        return
      }
      
      // Standard save with address validation
      if (inputValue.trim()) {
        // Ensure all max duration values exist
        const completeMaxDurations: MaxDurations = {
          ...DEFAULT_MAX_DURATIONS,
          ...maxDurations
        }
        
        dispatch('save', { 
          address: inputValue.trim(),
          maxDurations: completeMaxDurations,
          maxDurationsOnly: false
        })
        
        // Also save max durations to storage
        storage.saveMaxDurations(completeMaxDurations)
        
        close()
      }
    }
    
    function handleInput() {
      if (inputValue.trim() === '') {
        showSuggestions = false
        return
      }
      
      const query = inputValue.toLowerCase()
      filteredSuggestions = MOCK_ADDRESSES.filter(address => 
        address.toLowerCase().includes(query)
      ).slice(0, 5)
      
      showSuggestions = filteredSuggestions.length > 0
    }
    
    function selectSuggestion(suggestion: string) {
      inputValue = suggestion
      showSuggestions = false
    }
    
    // Handle clicks outside elements
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      
      
      // Handle suggestions dropdown
      if (showSuggestions && suggestionsContainer && !suggestionsContainer.contains(target)) {
        showSuggestions = false;
      }
      
      // Handle modal closing when clicking on backdrop
      // Only close if clicking directly on the backdrop (not on any child elements)
      const modalBackdrop = document.querySelector('.modal-backdrop');
      if (modalBackdrop && target === modalBackdrop && modalContent && !modalContent.contains(target)) {
        close();
      }
    }
    
    // Set up document click listener
    onMount(() => {
      document.addEventListener('click', handleClickOutside)
      
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    })
    
    // Handle tab change
    function handleTabChange(event: CustomEvent<{ value: string }>) {
      activeTab = event.detail.value
    }
    
    // Initialize input value and max durations when modal opens
    $: {
        inputValue = currentAddress || '';
        
        // Get stored max durations or use defaults
        const storedMaxDurations = storage.getMaxDurations();
        maxDurations = {
          ...DEFAULT_MAX_DURATIONS,
          ...storedMaxDurations
        }
    }
    
    // Updates a specific max duration value
    function updateMaxDuration(mode: keyof MaxDurations, value: string) {
      // Parse the input value to a number (or default to current value if invalid)
      const numValue = parseInt(value, 10);
      // Ensure the value is between 1 and 120 minutes
      if (!isNaN(numValue) && numValue > 0) {
        // Limit to maximum of 120 minutes
        const limitedValue = Math.min(numValue, 120);
        maxDurations = { ...maxDurations, [mode]: limitedValue };
      }
    }
  </script>
  
    <!-- Adding inert to prevent interaction with elements behind the modal -->
    <div class="modal-backdrop !.fixed !.inset-0 !.bg-black !.bg-opacity-50 !.flex !.items-center !.justify-center !.z-50 uprent-modal-overlay">
      <div bind:this={modalContent} class="modal-content !.bg-white !.rounded-lg !.p-5 !.max-w-md !.w-full !.shadow-xl !.relative">
        <h3 class="!.text-lg !.font-bold !.mb-4">
          {activeTab === 'address' ? 'Enter Destination Address' : 'Set Max Travel Durations'}
        </h3>
        
        <Tabs value={activeTab} on:change={handleTabChange}>
          <TabList>
            <TabTrigger value="address">Address</TabTrigger>
            <TabTrigger value="maxDurations">Max Durations</TabTrigger>
          </TabList>
          
          <TabContent value="address">
            <div class="!.relative !.mt-2">
              <label for="address-input" class="!.text-sm">Enter address</label>
              <input
                id="address-input"
                type="text"
                class="uprent !.w-full !.text-sm !.p-2 !.mt-1 !.border !.border-gray-300 !.rounded-md !.focus:outline-none !.focus:ring-2 !.focus:ring-primary"
                placeholder="Type an address..."
                bind:value={inputValue}
                on:input={handleInput}
              />
              
              {#if showSuggestions}
                <div 
                  bind:this={suggestionsContainer}
                  style="border: 1px solid #D1D5DB" 
                  class="!.absolute !.w-full !.bg-white !.rounded-md !.mt-1 !.shadow-md !.z-10"
                >
                  {#each filteredSuggestions as suggestion, i}
                    <button 
                      type="button"
                      style={`border-bottom: ${i !== filteredSuggestions.length - 1 ? '1px solid #D1D5DB !important' : 'none'}`}
                      class="!.p-2 !.flex !.w-full !.items-center !.gap-2 !.bg-white !.border-0 !.cursor-pointer hover:!.bg-gray-100 !.text-sm {i === 0 && filteredSuggestions.length === 1 ? '!.rounded-md' : i === 0 ? '!.rounded-t-md' : i === filteredSuggestions.length - 1 ? '!.rounded-b-md' : ''}"
                      on:click={() => selectSuggestion(suggestion)}
                    >
                      <span class="!.flex !.items-center !.justify-center !.bg-primary/10 !.text-primary !.rounded-full !.p-1">
                        <MapPinSVG />
                      </span>
                      {suggestion}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </TabContent>
          
          <TabContent value="maxDurations">
            <div class="!.flex !.flex-col !.gap-4 !.mt-2">
              <div class="!.bg-blue-50 !.p-3 !.rounded-md !.mb-1">
                <p class="!.text-sm !.text-blue-700 !.m-0">
                  <span class="!.font-medium">Note:</span> These maximum travel times apply to all saved destinations, not just the current address.
                </p>
              </div>
              
              {#each transportModes as { mode, label, icon }, i}
                <div class="!.flex !.items-center !.gap-3">
                  <div class="!.flex-1">
                    <label for={`duration-${String(mode)}`} class="!.block !.text-sm !.font-medium !.text-gray-700 !.mb-1 !.flex !.items-center !.gap-2">                  
                      <span class="!.flex !.items-center !.justify-center !.text-primary">
                        <svelte:component this={icon} />
                      </span>
                      {label} (minutes)
                    </label>
                    <input 
                      id={`duration-${String(mode)}`}
                      type="number" 
                      class="uprent !.w-full !.text-sm !.p-2 !.border !.border-gray-300 !.rounded-md !.focus:outline-none !.focus:ring-2 !.focus:ring-primary" 
                      min="1"
                      max="120"
                      bind:value={maxDurations[mode]}
                      on:input={(e) => updateMaxDuration(mode, e.currentTarget.value)}
                      on:blur={(e) => {
                        // Enforce max on blur (when the user finishes typing)
                        if (parseInt(e.currentTarget.value) > 120) {
                          e.currentTarget.value = "120";
                          updateMaxDuration(mode, "120");
                        }
                      }}
                    />
                  </div>
                </div>
              {/each}
            </div>
          </TabContent>
        </Tabs>
        
        <div class="!.flex !.justify-end !.space-x-2 !.mt-4">
          <Button onClick={close}>Cancel</Button>
          <Button primary onClick={save} disabled={activeTab === 'address' && !inputValue.trim()}>Save</Button>
        </div>
      </div>
    </div>