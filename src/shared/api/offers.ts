import { client } from './client'
import type { OfferCreate, OfferDto, OfferQuery, OfferSummary, RedemptionDto, RedemptionStatus } from '@/shared/types/offers'

/** OffersApi din BE (docs/API.md §Oferte, T10): lista publică, detaliu, revendicare, codurile mele; panoul firmei. */
export const offersApi = {
  list: (q: OfferQuery = {}) => client.get<OfferSummary[]>('/offers', { query: { ...q } }),
  get: (id: number) => client.get<OfferDto>(`/offers/${id}`),
  /** `withPoints` (T11): plătește `pointsPrice` din punctele comunitare; 409 `insufficient_points` dacă soldul nu ajunge. */
  redeem: (id: number, withPoints = false) => client.post<RedemptionDto>(`/offers/${id}/redeem`, undefined, { query: withPoints ? { withPoints: true } : undefined }),
  myRedemptions: () => client.get<RedemptionDto[]>('/me/redemptions'),
  businessOffers: () => client.get<OfferDto[]>('/business/offers'),
  create: (req: OfferCreate) => client.post<OfferDto>('/business/offers', req),
  update: (id: number, req: OfferCreate) => client.put<OfferDto>(`/business/offers/${id}`, req),
  remove: (id: number) => client.delete<void>(`/business/offers/${id}`),
  useCode: (code: string) => client.post<RedemptionDto>('/business/redemptions/use', { code }),
  businessRedemptions: (status?: RedemptionStatus) => client.get<RedemptionDto[]>('/business/redemptions', { query: { status } }),
}
