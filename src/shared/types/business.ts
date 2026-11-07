// Firme · T09. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.
import type { EventSummary, TicketType } from './events'
import type { OfferSummary } from './offers'

export type BusinessCategory = 'CAFE' | 'RESTAURANT' | 'PRODUCER' | 'WINERY' | 'SHOP' | 'OTHER'

export interface BusinessSummary { id: number; name: string; category: string; verified: boolean; imageUrl?: string }

/** Starea conținutului (evenimente, oferte, anunțuri). Firma neverificată publică doar DRAFT. */
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN'

/** BusinessDto = BusinessSummary + profilul complet. */
export interface BusinessDto extends BusinessSummary {
  description?: string; address?: string; lat?: number; lng?: number; phone?: string; website?: string; viewsCount: number
}
/** PUT /business/me: BusinessDto fără id, verified, viewsCount. */
export interface BusinessUpdate {
  name: string; category: BusinessCategory; description?: string; address: string; lat: number; lng: number
  phone?: string; website?: string; imageUrl?: string
}
export interface AnnouncementDto { id: number; title: string; body: string; imageUrl?: string; status: ContentStatus; createdAt: string }
export interface AnnouncementCreate { title: string; body: string; imageUrl?: string }
export interface BusinessStats { views: number; codesUsed: number; pointsPayments: number; upcomingEvents: number }
export interface BusinessMeDto { business: BusinessDto; stats: BusinessStats }
/** GET /businesses/{id}: profil + oferte active (T10) + evenimente viitoare + anunțuri publicate. */
export interface BusinessPageDto { business: BusinessDto; offers: OfferSummary[]; events: EventSummary[]; announcements: AnnouncementDto[] }
export type BusinessActivityType = 'CODE_USED' | 'OFFER_SAVED' | 'OFFER_REDEEMED' | 'TICKET' | 'POINTS_PAYMENT'
export interface BusinessActivityDto { items: { type: BusinessActivityType; text: string; at: string }[] }

/**
 * EventCreate + EventCategory: introduse de T09 pentru `/business/events` (în `events.ts` nu există încă).
 * T06 le folosește pentru `POST /events` importându-le de aici (sau le mută în `events.ts` și le șterge de aici —
 * același nume în două module ar da conflict în `types/api.ts`, care re-exportă tot).
 */
export type EventCategory = 'CONCERT' | 'THEATRE' | 'FAMILY' | 'EXHIBITION' | 'SPORT' | 'OUTDOOR' | 'FAIR' | 'FOOD'
export interface EventCreate {
  title: string; description: string; category: EventCategory; placeId?: number
  locationName?: string; address?: string; lat?: number; lng?: number
  startAt: string; endAt?: string; ticketType: TicketType; priceAdult?: number; priceChild?: number
  externalUrl?: string; capacity?: number; imageUrl?: string
}
