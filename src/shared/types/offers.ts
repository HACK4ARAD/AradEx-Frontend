// Oferte & coduri · T10. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.
import type { ContentStatus } from './business'

/** Cercurile din tab-ul Oferte; „Cu puncte” e filtrul `points`, nu o categorie. */
export type OfferCategory = 'CAFE' | 'RESTAURANT' | 'LOCAL' | 'EVENT' | 'OTHER'
export type RedemptionStatus = 'ISSUED' | 'USED' | 'CANCELLED'

/** `validUntil` lipsă = permanentă; `distanceKm` doar cu `near`; `rating` vine în T17. */
export interface OfferSummary {
  id: number; businessId: number; businessName: string; title: string; discountLabel: string
  localProduct: boolean; validUntil?: string; pointsPrice?: number; imageUrl?: string; distanceKm?: number; rating?: number
  category: OfferCategory
}
/** Codul `AX-O{offerId}-XXXXXX`; QR-ul conține exact codul. `pointsSpent` e 0 până la T11. */
export interface RedemptionDto {
  id: number; code: string; offerId: number; offerTitle: string; businessName: string; pointsSpent: number
  status: RedemptionStatus; issuedAt: string; usedAt?: string
}
export interface OfferDto extends OfferSummary {
  description: string; validFrom: string; status: ContentStatus; viewsCount: number; redemptionsCount: number
  usedCount: number; myRedemption?: RedemptionDto
}
/** POST/PUT /business/offers. `status`: DRAFT = pauză (firma neverificată rămâne oricum DRAFT). */
export interface OfferCreate {
  title: string; description: string; discountLabel: string; category?: OfferCategory; localProduct: boolean
  validFrom?: string; validUntil?: string; pointsPrice?: number; imageUrl?: string; status?: 'DRAFT' | 'PUBLISHED'
}
export interface OfferQuery { category?: OfferCategory; localProduct?: boolean; points?: boolean; near?: string; q?: string }
