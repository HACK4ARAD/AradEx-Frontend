// Evenimente · T06. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export type TicketType = 'FREE' | 'IN_APP' | 'EXTERNAL'

export interface EventSummary {
  id: number; title: string; category: string; startAt: string; endAt?: string; locationName: string
  lat: number; lng: number; imageUrl?: string; ticketType: TicketType; priceFrom?: number; isHot: boolean; isDemo: boolean
  participantsCount: number; organizerName: string; organizerType: string; distanceKm?: number; saved?: boolean
  ratingAvg?: number; ratingCount: number
}
export interface EventDto extends EventSummary {
  description: string; address: string; placeId?: number; organizerBusinessId?: number
  priceAdult?: number; priceChild?: number; externalUrl?: string; capacity?: number; spotsLeft?: number
  savesCount: number; status: string
}
export interface EventQuery {
  from?: string; to?: string; category?: string; near?: string; radiusKm?: number
  organizerBusinessId?: number; organizerType?: string; hot?: boolean; q?: string; page?: number; size?: number
}
