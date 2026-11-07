// Evenimente · T06. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export type TicketType = 'FREE' | 'IN_APP' | 'EXTERNAL'
export type EventCategory = 'CONCERT' | 'THEATRE' | 'FAMILY' | 'EXHIBITION' | 'SPORT' | 'OUTDOOR' | 'FAIR' | 'FOOD'
export type OrganizerType = 'CITY' | 'BUSINESS' | 'ADMIN' | 'EXTERNAL'
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN'

export const EVENT_CATEGORIES: readonly EventCategory[] = ['CONCERT', 'THEATRE', 'FAMILY', 'EXHIBITION', 'SPORT', 'OUTDOOR', 'FAIR', 'FOOD']

export interface EventSummary {
  id: number; title: string; category: EventCategory; startAt: string; endAt?: string; locationName: string
  lat: number; lng: number; imageUrl?: string; ticketType: TicketType; priceFrom?: number; isHot: boolean; isDemo: boolean
  participantsCount: number; organizerName: string; organizerType: OrganizerType; distanceKm?: number; saved?: boolean
  ratingAvg?: number; ratingCount: number
}
export interface EventDto extends EventSummary {
  description: string; address?: string; placeId?: number; organizerBusinessId?: number
  priceAdult?: number; priceChild?: number; externalUrl?: string; capacity?: number; spotsLeft?: number
  savesCount: number; status: EventStatus; imageCredit?: string
}
/** GET /events — listele se trimit ca CSV (`category=CONCERT,THEATRE`). Fără `from`: doar ce nu s-a terminat. */
export interface EventQuery {
  from?: string; to?: string; category?: string; near?: string; radiusKm?: number
  organizerBusinessId?: number; organizerType?: string; ticketType?: string; hot?: boolean; q?: string
  sort?: 'date' | 'distance'; status?: 'DRAFT' | 'HIDDEN' | 'ALL'; page?: number; size?: number
}
/** POST / PUT /events (Primăria, Adminul). Locul: `placeId` (obiectiv) sau `locationName` + `lat` + `lng`. */
export interface EventCreate {
  title: string; description: string; category: EventCategory; placeId?: number; locationName?: string; address?: string
  lat?: number; lng?: number; startAt: string; endAt?: string; ticketType: TicketType; priceFrom?: number
  priceAdult?: number; priceChild?: number; externalUrl?: string; capacity?: number; imageUrl?: string; status?: 'DRAFT' | 'PUBLISHED'
}
