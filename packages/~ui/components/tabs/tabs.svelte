<script lang="ts">
  import { writable } from 'svelte/store'
  import { createEventDispatcher, setContext } from 'svelte'
  import type { Writable } from 'svelte/store'
  import { get } from 'svelte/store'

  export let value: string | undefined = undefined
  export let className: string = ''
  export { className as class }

  const dispatch = createEventDispatcher<{
    change: { value: string }
  }>()

  // The active tab store
  const activeTab: Writable<string | undefined> = writable(value)

  // Update the active tab when value prop changes
  $: if (value !== undefined) {
    activeTab.set(value)
  }

  // Tab triggers list
  const triggers: Writable<string[]> = writable([])
  console.log('triggers', triggers)
  
  // Add or remove triggers from the list
  function registerTrigger(id: string) {
    triggers.update((ids) => {
      if (!ids.includes(id)) {
        ids.push(id)
        // Set the first tab as active if no default was provided
        if (ids.length === 1 && !get(activeTab)) {
          activeTab.set(id)
        }
      }
      return ids
    })
    
    return {
      unregister: () => {
        triggers.update((ids) => ids.filter((existingId) => existingId !== id))
      }
    }
  }

  // Change the active tab
  function setActiveTab(id: string) {
    if (value === undefined) {
      activeTab.set(id)
    }
    dispatch('change', { value: id })
  }

  // Make these functions available to children via context
  setContext('activeTab', activeTab)
  setContext('setActiveTab', setActiveTab)
  setContext('registerTrigger', registerTrigger)
</script>

<div class="{className} .flex .flex-col .gap-2">
  <slot />
</div> 