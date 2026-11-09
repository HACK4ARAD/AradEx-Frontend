// Auth & utilizator · T03. Toate conturile cu login (Vizitator, Localnic, Firmă, Primărie, Admin) intră cu e-mail + parolă; parola
// uitată se schimbă cu un cod de 6 cifre primit pe e-mail (/auth/password/*). Voluntarii au login-ul lor (/vol/login, cod de la
// Primărie). Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.
import type { Role } from './common'
import type { BusinessCategory, BusinessSummary } from './business'

export type SelfRegisterRole = 'VISITOR' | 'LOCAL' | 'BUSINESS'
/** conturile personale (fără firmă) */
export type PersonalRole = Exclude<SelfRegisterRole, 'BUSINESS'>

export interface UserDto {
  id: number
  /** adresa cu care intră contul (voluntarii pot să n-o aibă) */
  email?: string
  /** E.164 (+40…): voluntarii și conturile personale mai vechi; doar afișat */
  phone?: string
  displayName: string
  role: Role
  locale: 'ro' | 'en' | 'hu'
  pointsBalance: number
  business?: BusinessSummary
}

export interface AuthResponse { token: string; user: UserDto }

export interface BusinessRegistration { name: string; category: BusinessCategory; address: string; lat?: number; lng?: number }

interface RegisterBase {
  email: string
  /** 8..72 caractere */
  password: string
  /** max. 80 caractere */
  displayName: string
  /** GDPR: bifa cu Termenii și condițiile + Confidențialitatea; BE cere `true` și păstrează momentul + versiunea */
  acceptTerms: boolean
}

/** POST /auth/register → 201 AuthResponse; 409 dacă e-mailul are deja cont. `business` doar (și obligatoriu) pentru BUSINESS. */
export type RegisterRequest =
  | (RegisterBase & { role: PersonalRole; business?: undefined })
  | (RegisterBase & { role: 'BUSINESS'; business: BusinessRegistration })

/** POST /auth/password/forgot → 204 mereu (același răspuns și când adresa n-are cont); 429 prea des */
export interface ForgotPasswordRequest { email: string }

/** POST /auth/password/reset → AuthResponse (utilizatorul e conectat); 401 cod invalid/expirat, 403 cont dezactivat, 429 prea des */
export interface ResetPasswordRequest { email: string; code: string; password: string }

export interface UpdateMeRequest { displayName?: string; locale?: 'ro' | 'en' | 'hu' }
