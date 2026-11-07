// Comunitate & puncte · T11. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export interface RegistrationDto {
  id: number; actionId: number; actionTitle: string; code: string
  status: 'REGISTERED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW'; registeredAt: string; confirmedAt?: string
  user?: { id: number; displayName: string }
}
export interface ActionSummary {
  id: number; title: string; category: string; startAt: string; endAt: string; locationName: string
  lat: number; lng: number; pointsReward: number; capacity: number; registeredCount: number; imageUrl?: string
  goingPreview: string[]; myRegistration?: RegistrationDto
}
export interface ActionDto extends ActionSummary { description: string; address: string; status: string; confirmedCount: number }
export interface ConfirmResultDto extends RegistrationDto { alreadyConfirmed: boolean; pointsAwarded: number }

export interface PointsDto {
  balance: number; monthEarned: number; rank?: number
  transactions: { id: number; amount: number; type: string; note?: string; createdAt: string }[]
}
export interface LeaderboardDto {
  period: 'month' | 'year'
  entries: { rank: number; userId: number; displayName: string; points: number }[]
  me?: { rank: number; points: number }
}
