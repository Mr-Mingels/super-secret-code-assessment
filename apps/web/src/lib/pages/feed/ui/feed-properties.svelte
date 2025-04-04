<script lang="ts">
  import { browser } from '$app/environment'
  import { feed } from '$lib/shared/stores'
  import { LoadingSpinnerSVG } from '~ui/assets'
  import { FeedProperty, FeedAutoLoader } from '.'

  let scrollContainer: HTMLDivElement
</script>

<div
  bind:this={scrollContainer}
  class=".flex .flex-1 .flex-col .overflow-y-auto .pb-4 .px-4 .pt-2 xs:.px-2"
>
  {#if browser && !$feed.isLoading}
    <div class=".grid .grid-cols-3 md:.grid-cols-1 lg:.grid-cols-2 .gap-6">
      {#each $feed.properties as property (property.id)}
        <FeedProperty {property} />
      {/each}
    </div>
    
    {#if !$feed.hasMore && $feed.properties.length}
      <div class=".text-center .mt-6 .text-gray-500">
        You've reached the end of the Feed!
      </div>
    {/if}
    
    {#if scrollContainer}
      <FeedAutoLoader {scrollContainer}>
        <div class=".text-center .py-4 .text-gray-500 .flex .items-center .justify-center .gap-2">
          <LoadingSpinnerSVG class=".h-5 .w-5 .stroke-gray-400" />
          Loading more properties...
        </div>
      </FeedAutoLoader>
    {/if}
  {:else}
    <div class=".flex .items-center .justify-center .gap-2 .text-gray-500 .py-8">
      <LoadingSpinnerSVG class=".h-6 .w-6 .stroke-gray-400" />
      Loading properties...
    </div>
  {/if}
</div>
