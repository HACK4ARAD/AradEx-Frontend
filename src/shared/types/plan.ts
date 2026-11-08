// Planificator de itinerar · T13. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.
import type { GeoPoint, Transport } from './common'

export type StopKind = 'PLACE' | 'EVENT' | 'OFFER'

export interface ItineraryStop {
  order: number
  /** ziua din itinerar (1 sau 2) */
  day: 1 | 2
  kind: StopKind
  refId: number
  name: string
  subtitle: string
  lat: number
  lng: number
  /** ISO */
  arriveAt: string
  leaveAt: string
  durationMin: number
  travelMinutesFromPrev: number
  travelKmFromPrev: number
  travelMode: Transport
  note?: string
  parkingHint?: string
  hasGuide: boolean
  imageUrl?: string
}

/** POST /ai/itinerary. Timpul: `hours` (3 / 4 / 8) sau `days: 2`. */
export interface ItineraryRequest {
  /** YYYY-MM-DD */
  date: string
  /** HH:mm */
  startTime?: string
  hours?: number
  days?: 1 | 2
  transport: Transport
  interests: string[]
  freeText?: string
  start?: GeoPoint
  locale?: 'ro' | 'en' | 'hu'
}

export interface ItineraryDto {
  /** doar după POST /itineraries */
  id?: number
  shareCode?: string
  title: string
  summary: string
  /** cererea omului, cum o arată ecranul („Jumătate de zi, pe jos, istorie”) */
  ask: string
  /** YYYY-MM-DD, prima zi */
  date: string
  days: 1 | 2
  transport: Transport
  /** HH:mm */
  startTime: string
  totalMinutes: number
  totalKm: number
  /** făcut fără AI (răspuns pregătit), când modelul nu a răspuns */
  offline: boolean
  stops: ItineraryStop[]
  createdAt?: string
}
