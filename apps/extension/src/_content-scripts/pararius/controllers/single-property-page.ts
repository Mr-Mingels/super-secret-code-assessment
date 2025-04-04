import { SinglePropertyPageController } from '@features'
import { CommuteTime } from '~ui/components'
import type { ApiResponse, CommuteResponse, CommuteAddress } from '~core/database'
import { extensionFetch } from '../../../shared/lib'
import { storage } from '~core/helpers'

class ParariusController extends SinglePropertyPageController {
  initialized = false

  constructor() {
    super()
  }

  onPageMutation() {
    if (this.initialized) {
      return
    }
    this.initialized = true

    const container = document.querySelector<HTMLDivElement>(
      '.agent-summary__buttons',
    )
    if (!container) return

    this.insertCommuteTime()
  }

  /**
   * Extension-specific implementation to fetch commute durations
   * Uses the extensionFetch utility to communicate via the background script
   * Since this is a "one-off" request, I don't think we need to store this function in a sharable folder for reuse
   */
  private fetchDurations = async () => {
    try {
      const addresses: CommuteAddress[] = storage.getCommuteAddresses()

      // Send addresses as params object with an addresses property
      const response = await extensionFetch<ApiResponse<CommuteResponse>>(
        '/commute/durations', 
        'GET', 
        null,
        { addresses }
      );
      
      const { data } = response;
      
      if (!data || data.status === 'error') {
        return {
          addressDurations: null,
          error: data?.message || 'Failed to load commute times'
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
  }

  insertCommuteTime() {
    const commuteButtonContainer = document.querySelector(
      '.listing-detail-summary',
    )
    if (!commuteButtonContainer) return

    const travelTimeTarget = document.createElement('div')
    travelTimeTarget.classList.add('uprent-travel-time')
    travelTimeTarget.classList.add('uprent-pararius-travel-time')
    commuteButtonContainer.append(travelTimeTarget)

    new CommuteTime({
      target: travelTimeTarget,
      props: {
        fetchDurations: this.fetchDurations
      }
    })
  }
}

export const singlePropertyPageController = new ParariusController()
