// Auth & utilizator · T03. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.
import type { Role } from './common'
import type { BusinessCategory, BusinessSummary } from './business'

export type SelfRegisterRole = 'VISITOR' | 'LOCAL' | 'BUSINESS'

export interface UserDto {
  id: number
  email: string
  displayName: string
  role: Role
  locale: 'ro' | 'en'
  pointsBalance: number
  business?: BusinessSummary
}

export interface AuthResponse { token: string; user: UserDto }

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  role: SelfRegisterRole
  business?: { name: string; category: BusinessCategory; address: string; lat?: number; lng?: number }
}

export interface UpdateMeRequest { displayName?: string; locale?: 'ro' | 'en' }
