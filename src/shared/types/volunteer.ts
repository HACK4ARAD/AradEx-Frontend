// Voluntari · T18. Oglinda DTO-urilor din docs/API.md §Voluntari; se schimbă în același PR cu secțiunea din API.md.
import type { ActionCategory } from './community'

export type VolunteerStatus = 'ACTIVE' | 'SUSPENDED'
/** LOCKED până cu 30 de min înainte de start, OPEN până la miezul nopții zilei acțiunii, ENDED după. */
export type VolunteerActionState = 'LOCKED' | 'OPEN' | 'ENDED'

export interface VolunteerMessageDto {
  id: number; fromCity: boolean; authorName?: string; text: string; createdAt: string; readAt?: string
}

export interface VolunteerDto {
  id: number; name: string; phone: string; email?: string; loginCode: string; oneTime: boolean; status: VolunteerStatus
  expired: boolean; coordinatorId: number; coordinatorName?: string; actionIds: number[]; scans: number; unread: number
  lastMessage?: VolunteerMessageDto; createdAt: string; lastLoginAt?: string
}

export interface VolunteerCreate {
  name: string; phone: string; email?: string; coordinatorId?: number; actionIds: number[]; oneTime: boolean
}
export interface VolunteerUpdate { actionIds?: number[]; status?: VolunteerStatus; coordinatorId?: number }
export interface CoordinatorDto { id: number; name: string }

export interface VolunteerMeDto {
  id: number; name: string; coordinatorName?: string; oneTime: boolean; actions: number; scanned: number; toScan: number
  unreadMessages: number
}

export interface VolunteerActionDto {
  id: number; title: string; category: ActionCategory; startAt: string; endAt: string; locationName: string; address?: string
  lat: number; lng: number; pointsReward: number; imageUrl?: string; registered: number; confirmed: number; confirmedByMe: number
  state: VolunteerActionState; opensAt: string
}
