// Admin & firme partenere · T14. Oglinda DTO-urilor din docs/API.md §Admin; se schimbă în același PR cu secțiunea din API.md.
import type { BusinessCategory, BusinessSummary, ContentStatus } from './business'
import type { Role } from './common'
import type { ActionStatus } from './community'

export interface AdminStatsDto {
  usersByRole: Record<Role, number>
  /** evenimente publicate */
  events: number
  /** locuri (adulți + copii) pe biletele neanulate */
  ticketsSold: number
  /** coduri de ofertă revendicate (emise sau folosite) */
  offersRedeemed: number
  /** coduri folosite la casă */
  codesUsed: number
  /** puncte câștigate la acțiuni */
  pointsAwarded: number
  /** acțiuni comunitare publicate */
  actions: number
}

export type ContentKind = 'events' | 'offers' | 'actions'

/** Un rând din „Conținut & moderare”, același pentru evenimente, oferte și acțiuni. */
export interface AdminContentDto {
  id: number
  title: string
  category: string
  organizer?: string
  businessId?: number
  /** null/absent când organizatorul nu e o firmă */
  organizerVerified?: boolean
  imageUrl?: string
  startAt?: string
  endAt?: string
  validFrom?: string
  validUntil?: string
  participants?: number
  capacity?: number
  used?: number
  views?: number
  status: ContentStatus | ActionStatus
}

export interface AdminUserDto {
  id: number
  email?: string
  phone?: string
  displayName: string
  role: Role
  locale: string
  pointsBalance: number
  business?: BusinessSummary
  disabled: boolean
  createdAt: string
  ticketsCount: number
}

export interface AdminUserUpdate { role?: Role; pointsAdjust?: number; note?: string; disabled?: boolean }

export interface CityBusinessDto {
  id: number
  name: string
  category: BusinessCategory
  verified: boolean
  imageUrl?: string
  address?: string
  phone?: string
  contactName?: string
  email?: string
  activeOffers: number
  draftOffers: number
  codesUsed: number
  createdAt: string
  rejectedAt?: string
  rejectReason?: string
}

export interface CityBusinessCreate { email: string; name: string; category: BusinessCategory; address: string; contactName: string; phone?: string }
/** Invitația pe e-mail e simulată: parola de unică folosință vine o singură dată, aici. */
export interface CityBusinessCreated { business: CityBusinessDto; invitePassword: string }
