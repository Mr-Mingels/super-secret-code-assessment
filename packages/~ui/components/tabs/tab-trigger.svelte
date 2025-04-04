<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte'
  import type { Writable } from 'svelte/store'

  export let value: string
  export let className: string = ''
  export let disabled = false
  export { className as class }

  // Get active tab from parent
  const activeTab = getContext<Writable<string | undefined>>('activeTab')
  const setActiveTab = getContext<(value: string) => void>('setActiveTab')
  const registerTrigger = getContext<(id: string) => { unregister: () => void }>('registerTrigger')
  
  // Register this trigger with parent
  let unregister: () => void
  
  onMount(() => {
    if (registerTrigger) {
      const registration = registerTrigger(value)
      unregister = registration.unregister
    }
  })
  
  onDestroy(() => {
    if (unregister) unregister()
  })
  
  function handleClick() {
    if (disabled) return
    if (setActiveTab) setActiveTab(value)
  }
  
  $: isActive = $activeTab === value
  
  // Classes for active and inactive states
  $: triggerClasses = [
    '.flex !.w-full !.border-0 !.cursor-pointer uprent-font-poppins !.items-center !.gap-1.5 !.justify-center !.whitespace-nowrap !.rounded-md !.px-3 !.py-1.5 !.text-sm !.font-medium !.ring-offset-white !.transition-all !.focus-visible:.outline-none !.focus-visible:.ring-2 !.focus-visible:.ring-primary-200 !.focus-visible:.ring-offset-2 !.disabled:.pointer-events-none !.disabled:.opacity-50',
    isActive ? 
      '.bg-white .text-primary .shadow-sm' : 
      '.text-black-600 !.bg-transparent hover:!.bg-black-200 hover:!.text-black-900'
  ].join(' ')
</script>

<button
  class="{className} {triggerClasses}"
  role="tab"
  aria-selected={isActive}
  aria-controls={`panel-${value}`}
  id={`tab-${value}`}
  tabindex={isActive ? 0 : -1}
  {disabled}
  on:click={handleClick}
  {...$$restProps}
>
  <slot />
</button> 