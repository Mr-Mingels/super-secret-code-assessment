<script lang="ts">
  import { getContext } from 'svelte'
  import type { Writable } from 'svelte/store'

  export let value: string
  export let className: string = ''
  export { className as class }

  // Get active tab from parent
  const activeTab = getContext<Writable<string | undefined>>('activeTab')
  $: isActive = $activeTab === value
</script>

<div
  class="{className} {isActive ? '!.block' : '!.hidden'} .ring-offset-white .focus-visible:.outline-none .focus-visible:.ring-2 .focus-visible:.ring-primary-200 .focus-visible:.ring-offset-2"
  role="tabpanel"
  id={`panel-${value}`}
  aria-labelledby={`tab-${value}`}
  tabindex={isActive ? 0 : -1}
  {...$$restProps}
>
  {#if isActive}
  <slot />
  {/if}
</div>