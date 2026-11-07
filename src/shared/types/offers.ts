// Oferte & coduri · T10. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export interface OfferSummary {
  id: number; businessId: number; businessName: string; title: string; discountLabel: string
  localProduct: boolean; validUntil: string; pointsPrice?: number; imageUrl?: string; distanceKm?: number; rating?: number
}
export interface RedemptionDto {
  id: number; code: string; offerId: number; offerTitle: string; businessName: string; pointsSpent: number
  status: 'ISSUED' | 'USED' | 'CANCELLED'; issuedAt: string; usedAt?: string
}
export interface OfferDto extends OfferSummary {
  description: string; validFrom: string; status: string; viewsCount: number; redemptionsCount: number
  usedCount: number; myRedemption?: RedemptionDto
}
