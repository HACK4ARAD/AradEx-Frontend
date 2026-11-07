// Planificator de itinerar · T13. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.
import type { GeoPoint, Transport } from './common'

export interface ItineraryStop {
  order: number; kind: 'PLACE' | 'EVENT' | 'OFFER'; refId: number; name: string; lat: number; lng: number
  arriveAt: string; leaveAt: string; durationMin: number; travelMinutesFromPrev: number; travelMode: Transport
  note?: string; parkingHint?: string; hasGuide: boolean; imageUrl?: string
}
export interface ItineraryRequest {
  date: string; startTime?: string; hours?: number; days?: number; transport: Transport
  interests: string[]; freeText?: string; start?: GeoPoint
}
export interface ItineraryDto {
  id?: number; shareCode?: string; title: string; summary: string; date: string; transport: Transport
  totalMinutes: number; stops: ItineraryStop[]
}
