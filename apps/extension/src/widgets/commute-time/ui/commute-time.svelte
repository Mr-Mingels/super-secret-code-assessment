<script lang="ts">
  import type { Durations } from '~core/database'
  import { RouteSVG } from '~ui/assets'
  import { Button } from '~ui/components'
  import { extensionFetch } from '../../../shared/lib'
  import type { ApiResponse, CommuteResponse } from '../../../shared/types'

  // Component states
  let loading = false
  // Added an error state to handle errors from the background script, cus why not?
  let error: string | null = null
  let durations: Durations | null = null

  /**
   * Load commute durations data via the background script
   * This avoids CORS issues by using the extension's background script
   * to make API requests instead of making them directly from the content script
   */
  const load = async () => {
    loading = true
    error = null
    
    try {
      // Use the extensionFetch utility to make the API request through the background script
      const response = await extensionFetch<ApiResponse<CommuteResponse>>('/commute/durations');
      
      // Handle the response
      const { data } = response;
      
      if (!data || data.status === 'error') {
        error = 'Failed to load commute times';
        durations = null;
        return;
      }
      
      durations = data.payload.durations;
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