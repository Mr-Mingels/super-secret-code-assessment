import { SinglePropertyPageController } from '@features'
import { CommuteTime } from '~ui/components'
import type { ApiResponse, CommuteResponse } from '~core/database'
import { extensionFetch } from '../../../shared/lib'

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
      const response = await extensionFetch<ApiResponse<CommuteResponse>>('/commute/durations');
      
      const { data } = response;
      
      if (!data || data.status === 'error') {
        return {
          durations: null,
          error: 'Failed to load commute times'
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
