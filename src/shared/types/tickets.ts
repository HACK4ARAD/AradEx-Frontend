// Bilete · T07. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.
import type { TicketType } from './events'

export type TicketStatus = 'CONFIRMED' | 'CANCELLED' | 'USED'

/** Biletul are tot ce trebuie ca să se afișeze offline (loc, adresă, coordonate, prețuri unitare). */
export interface TicketDto {
  code: string; eventId: number; eventTitle: string; startAt: string; endAt?: string; locationName: string; address?: string
  lat: number; lng: number; imageUrl?: string; ticketType: TicketType; qtyAdult: number; qtyChild: number
  priceAdult?: number; priceChild?: number; total: number; status: TicketStatus; email?: string; createdAt: string; usedAt?: string
}
/** `email` opțional (T21: conturile cu telefon) */
export interface TicketRequest { qtyAdult: number; qtyChild: number; email?: string; /** Stripe (modul de test): PaymentIntent-ul plătit */ paymentIntentId?: string }

/** POST /events/{id}/tickets/payment: STRIPE = Payment Element cu `clientSecret` (modul de test), DEMO = plata demonstrativă. */
export type PaymentMode = 'STRIPE' | 'DEMO'
export interface TicketPaymentDto { mode: PaymentMode; amount: number; currency?: string; paymentIntentId?: string; clientSecret?: string; publishableKey?: string }
