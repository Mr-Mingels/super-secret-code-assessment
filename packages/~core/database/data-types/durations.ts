import type { CommuteAddress } from './addresses'

export type Durations = {
  walking: number | null
  driving: number | null
  transit: number | null
  biking: number | null
}

export type AddressDuration = {
  address: CommuteAddress
  durations: Durations
}

export type MaxDurations = {
  driving?: number;
  transit?: number;
  biking?: number;
  walking?: number;
}