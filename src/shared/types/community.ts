// Comunitate & puncte · T11. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export type ActionCategory = 'ENVIRONMENT' | 'HEALTH' | 'SOCIAL' | 'CULTURE'
export type ActionStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'DONE'
export type RegistrationStatus = 'REGISTERED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW'
export type PointsType = 'EARN_ACTION' | 'SPEND_OFFER' | 'ADJUST'
export type LeaderboardPeriod = 'month' | 'year'

export interface RegistrationDto {
  id: number; actionId: number; actionTitle: string; actionStartAt: string; locationName: string; pointsReward: number
  code: string; status: RegistrationStatus; registeredAt: string; confirmedAt?: string
  /** numele celui care a confirmat / respins (Primăria sau voluntarul) */
  confirmedBy?: string
  /** doar în listele Primăriei */
  user?: { id: number; displayName: string }
}
export interface ActionSummary {
  id: number; title: string; category: ActionCategory; organizer?: string; startAt: string; endAt: string; locationName: string
  lat: number; lng: number; pointsReward: number; capacity: number; registeredCount: number; imageUrl?: string
  goingPreview: string[]; myRegistration?: RegistrationDto
}
export interface ActionDto extends ActionSummary {
  description: string; address?: string; status: ActionStatus; confirmedCount: number; imageCredit?: string
}
export interface ActionCreate {
  title: string; description: string; category: ActionCategory; organizer?: string; startAt: string; endAt: string
  locationName: string; address?: string; lat?: number; lng?: number; pointsReward: number; capacity: number
  imageUrl?: string; imageCredit?: string; status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'DONE'
}
export interface ConfirmResultDto extends RegistrationDto { alreadyConfirmed: boolean; pointsAwarded: number }

export interface PointsTransaction { id: number; amount: number; type: PointsType; note?: string; createdAt: string }
export interface PointsDto {
  balance: number; monthEarned: number
  /** locul în clasamentul lunii */
  rank: number
  /** luni consecutive cu puncte câștigate („Activ 2 luni la rând”) */
  streakMonths: number
  transactions: PointsTransaction[]
}
export interface LeaderboardEntry {
  rank: number; userId: number; displayName: string; points: number
  actionsCount: number; lastAt?: string; lastActionTitle?: string
}
export interface LeaderboardDto {
  period: LeaderboardPeriod
  entries: LeaderboardEntry[]
  me?: { rank: number; points: number }
}
export interface CityDashboardDto {
  upcomingEvents: number; registrations: number; pointsAwarded: number; pendingValidations: number; activeVolunteers: number
  actions: { id: number; title: string; startAt: string; registeredCount: number; capacity: number; pendingCount: number; imageUrl?: string }[]
  activity: { type: RegistrationStatus; userName: string; actionTitle: string; points: number; by?: string; at: string }[]
}
