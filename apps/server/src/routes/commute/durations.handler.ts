import { app, res } from '@/handler'
import { t, AddressDurationSchema } from '@schemas'
import type { CommuteAddress, AddressDuration } from '~core/database'
import { randomInt } from '~core/helpers'

const resDTO = t.Object({
  addressDurations: t.Array(AddressDurationSchema),
})

export const commuteDurationsEndpointHandler = app.get(
  '/durations',
  ({ query, res }) => {
    
    // Try to parse the addresses JSON string
    let addresses: CommuteAddress[] = []
    try {
      if (query.addresses) {
        addresses = JSON.parse(query.addresses)
        console.log('parsed addresses', addresses)
      }
    } catch (error) {
      console.error('Failed to parse addresses', error)
    }

    // mock commute times
    const addressDurations: AddressDuration[] = addresses.map((address) => ({
      address,
      durations: {
        walking: randomInt(45, 90),
        biking: randomInt(25, 60),
        driving: randomInt(10, 30),
        transit: randomInt(10, 30),
      },
    }))

    return res.ok({
      addressDurations,
    })
  },
  { response: res(resDTO) },
)