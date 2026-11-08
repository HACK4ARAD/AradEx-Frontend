// Auth & utilizator · T03 (+ T21: conturile personale intră cu telefon + cod OTP). Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.
import type { Role } from './common'
import type { BusinessCategory, BusinessSummary } from './business'

export type SelfRegisterRole = 'VISITOR' | 'LOCAL' | 'BUSINESS'

export interface UserDto {
  id: number
  /** firme, Primărie, Admin (și conturile demo din seed) */
  email?: string
  /** conturile personale, E.164 (+40…) */
  phone?: string
  displayName: string
  role: Role
  locale: 'ro' | 'en' | 'hu'
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

/** POST /auth/otp/request → 202 */
export interface OtpRequestResponse { retryAfterSeconds: number; demoCode?: string; alreadySent?: boolean }

/** POST /auth/otp/verify: cont existent → token + user; număr nou → signupToken (pentru /auth/otp/register) */
export interface OtpVerifyResponse { token?: string; user?: UserDto; signupToken?: string }

export interface OtpRegisterRequest { signupToken: string; displayName: string; role: 'VISITOR' | 'LOCAL' }

export interface UpdateMeRequest { displayName?: string; locale?: 'ro' | 'en' | 'hu' }
