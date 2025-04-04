<script lang="ts">
    import type { AddressDuration, MaxDurations } from '~core/database'
    import { BusSVG, BikeSVG, WalkSVG, CarSVG } from '~ui/assets'
    import { Tabs, TabList, TabTrigger, TabContent } from '~ui/components'
    
    export let addressDurations: AddressDuration[] = []
    export let maxDurations: MaxDurations = {}
        
    // Define transport modes with their properties
    const transportModes: Array<{
      value: string;
      label: string;
      icon: any;
      key: 'driving' | 'transit' | 'biking' | 'walking';
    }> = [
      { value: 'driving', label: 'Driving', icon: CarSVG, key: 'driving' },
      { value: 'transit', label: 'Transit', icon: BusSVG, key: 'transit' },
      { value: 'biking', label: 'Biking', icon: BikeSVG, key: 'biking' },
      { value: 'walking', label: 'Walking', icon: WalkSVG, key: 'walking' }
    ];
    
    // Tab management
    let activeTab = 'driving' // default tab
    
    function handleTabChange(event: CustomEvent<{ value: string }>) {
      activeTab = event.detail.value
    }
    
    // Helper to check if a duration exceeds its max
    function exceedsMax(duration: number | null, mode: 'driving' | 'transit' | 'biking' | 'walking'): boolean {
      if (duration === null) return false
      const max = maxDurations[mode]
      return max !== undefined && max !== null && duration > max
    }
</script>

<div class="!.mt-4 !.p-0">
  <Tabs value={activeTab} on:change={handleTabChange} class=".gap-3">
    <TabList>
      {#each transportModes as mode}
        <TabTrigger value={mode.value}>
          <svelte:component this={mode.icon} />
          {mode.label}
        </TabTrigger>
      {/each}
    </TabList>
    
    {#each transportModes as mode}
      <TabContent value={mode.value} class="!.flex !.flex-col !.gap-2">
        {#each addressDurations as addressDuration}
          <div class="!.flex !.items-center !.gap-2 !.p-3 !.rounded-md {exceedsMax(addressDuration.durations[mode.key], mode.key) ? '!.bg-primary-100' : '!.bg-gray-100'}">
            <div class="!.flex !.items-center !.justify-center !.bg-white !.border !.border-primary !.rounded-full .text-primary !.p-1.5">
              <svelte:component this={mode.icon} />
            </div>
            <div class="!.flex !.flex-col">
              <span class="!.text-xs !.text-gray-600 !.font-medium !.truncate !.m-0">{addressDuration.address.address}</span>
              <div class="!.flex !.items-center !.gap-1">
                <span class="!.text-sm !.font-medium !.truncate !.m-0 {exceedsMax(addressDuration.durations[mode.key], mode.key) ? '!.text-red-500' : ''}">
                  {addressDuration.durations[mode.key]} min
                </span>
                {#if exceedsMax(addressDuration.durations[mode.key], mode.key)}
                  <span class="!.text-xs !.text-red-500" style="font-size: 12px;">(exceeds max)</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </TabContent>
    {/each}
  </Tabs>
</div>
