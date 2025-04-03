<script lang="ts">
  import type { Durations } from '~core/database'
  import { RouteSVG } from '~ui/assets'
  import { Button } from '~ui/components'

  /**
   * Function to fetch commute durations
   * This is provided by the parent component and will differ between web and extension
   */
  export let fetchDurations: () => Promise<{
    durations: Durations | null;
    error: string | null;
  }>;

  // Component states
  let loading = false
  let error: string | null = null
  let durations: Durations | null = null

  /**
   * Load commute durations data using the provided fetch function
   */
  const load = async () => {
    loading = true
    error = null
    
    try {
      const result = await fetchDurations();
      
      if (result.error) {
        error = result.error;
        durations = null;
        return;
      }
      
      durations = result.durations;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      durations = null;
    } finally {
      loading = false;
    }
  }
</script>

<div>
  {#if !durations}
    <Button primary {loading} onClick={load}>
      <RouteSVG slot="icon" />
      Load commutes
    </Button>
    
    {#if error}
      <p class="text-red-500 mt-2 text-sm">{error}</p>
    {/if}
  {:else}
    <!-- TODO: make it pretty! -->
    {JSON.stringify(durations, null, 2)}
  {/if}
</div> 