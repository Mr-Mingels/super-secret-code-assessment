<script lang="ts">
  import { CashSVG, DimensionsSVG } from '~ui/assets'
  import type { Property } from '~core/database'
  import { CommuteTime } from '~ui/components'
  import api from '~api'

  export let property: Property
  
  /**
   * Web-specific implementation to fetch commute durations
   * Uses the web API client directly
   * Since this is a "one-off" request, I don't think we need to store this function in a sharable folder for reuse
   */
  const fetchDurations = async () => {
    try {
      const { data, error } = await api.commute.durations.get();
      
      if (error || !data || data.status === 'error') {
        return {
          durations: null,
          error: error || 'Failed to load commute times'
        };
      }
      
      return {
        durations: data.payload.durations,
        error: null
      };
    } catch (e) {
      return {
        durations: null,
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }
  };
</script>

<div
  class=".relative .flex .h-[200px] .min-w-[540px] .grow .rounded-md .bg-white .text-left .shadow-md"
>
  <span class=".contents">
    <span
      class=".relative .h-full .w-[250px] .overflow-hidden .rounded-l-md xl:.w-[200px]"
    >
      <span
        class=".absolute .bottom-0 .left-0 .right-0 .top-0 .bg-cover .bg-center"
        style="background-image: url({property.previewImageURL})"
      ></span>
    </span>
  </span>
  <div class=".flex .min-h-[180px] .flex-1 .flex-col .p-3 .pl-6 xs:.pl-3">
    <div class=".flex .flex-col .gap-1">
      <span
        class=".relative .max-w-[calc(100%-6rem)] .self-start .text-left .font-bold .text-primary hover:.underline"
      >
        <a
          href={property.sourceURL}
          target="_blank"
          class=".font-semibold .text-primary"
        >
          {property.title}
        </a>
      </span>
      <span class=".text-gray-600">{property.cityName}</span>
    </div>
    <div class=".mt-2 .flex .grow .flex-col .justify-center .gap-1">
      {#if property.price}
        <span class=".flex .gap-2">
          <CashSVG />
          <b>{property.price}</b> /month
        </span>
      {/if}
      {#if property.area}
        <span class=".flex .gap-2">
          <DimensionsSVG />
          <span>
            <b>{property.area}</b> m²
          </span>
        </span>
      {/if}
    </div>
  </div>
  <CommuteTime {fetchDurations} />
</div>
