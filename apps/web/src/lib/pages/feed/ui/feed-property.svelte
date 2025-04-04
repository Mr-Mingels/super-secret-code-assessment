<script lang="ts">
  import { CashSVG, DimensionsSVG } from '~ui/assets'
  import type { Property, CommuteAddress } from '~core/database'
  import { CommuteTime } from '~ui/components'
  import { storage } from '~core/helpers'
  import api from '~api'

  export let property: Property
  
  /**
   * Web-specific implementation to fetch commute durations
   * Uses the web API client directly
   * Since this is a "one-off" request, I don't think we need to store this function in a sharable folder for reuse
   */
  const fetchDurations = async () => {
    try {
      const addresses: CommuteAddress[] = storage.getCommuteAddresses()
      
      const { data, error } = await api.commute.durations.get({ $query: { addresses: JSON.stringify(addresses) } });
      
      if (error || !data || data.status === 'error') {
        return {
          addressDurations: null,
          error: error || 'Failed to load commute times'
        };
      }
      
      return {
        addressDurations: data.payload.addressDurations,
        error: null
      };
    } catch (e) {
      return {
        addressDurations: null,
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }
  };
</script>

<div class=".flex .flex-col .rounded-md .bg-white .text-left .shadow-md .h-full">
  <!-- Property Image -->
  <div class=".relative .w-full .h-[180px] .overflow-hidden .rounded-t-md">
    <img
      alt="property preview"
      class=".h-full .w-full .object-cover .object-center"
      src={property.previewImageURL}
     />
  </div>
  
  <!-- Property Details -->
  <div class=".p-4 .flex .flex-col .flex-grow">
    <div class=".flex .flex-col .gap-1 .mb-3">
      <a
        href={property.sourceURL}
        target="_blank"
        class=".font-semibold .text-primary .text-lg .hover:underline .line-clamp-2"
      >
        {property.title}
      </a>
      <span class=".text-gray-600">{property.cityName}</span>
    </div>
    
    <div class=".flex .gap-6 .mb-4">
      {#if property.price}
        <span class=".flex .items-center .gap-2">
          <CashSVG />
          <span><b>{property.price}</b> /month</span>
        </span>
      {/if}
      {#if property.area}
        <span class=".flex .items-center .gap-2">
          <DimensionsSVG />
          <span><b>{property.area}</b> m²</span>
        </span>
      {/if}
    </div>
    
    <!-- Commute Time Component -->
    <div class=".border-t .border-gray-200 .pt-4 .mt-auto .flex .items-center .justify-center">
      <CommuteTime {fetchDurations} />
    </div>
  </div>
</div>
