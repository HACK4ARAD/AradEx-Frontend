// Auth & utilizator · T03. Toate conturile cu login (Vizitator, Localnic, Firmă, Primărie, Admin) intră cu e-mail + parolă. Fiecare
// cont primește la creare un cod de recuperare (arătat o singură dată): parola uitată se schimbă cu e-mailul + codul
// (/auth/password/recover); fără cod, Adminul dă o parolă temporară, iar la prima intrare cu ea contul își alege alta
// (`mustChangePassword`). Voluntarii au login-ul lor (/vol/login, cod de la Primărie). Oglinda DTO-urilor din docs/API.md.
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
  /** a intrat cu o parolă temporară (de la Admin): până își alege alta, aplicația îl ține pe ecranul „Parolă nouă” */
  mustChangePassword: boolean
  /** are un cod de recuperare valabil (altfel „Am uitat parola” nu-l ajută; își poate genera unul din cont) */
  hasRecoveryCode: boolean
}

export interface AuthResponse {
  token: string
  user: UserDto
  /**
   * Codul de recuperare, doar după înregistrare și după recuperare (unul nou; cel vechi s-a consumat); se arată o singură dată.
   * 12 caractere în 3 grupe (`K7QM-4XPT-9DWA`); BE acceptă orice majuscule/minuscule și ignoră spațiile și cratimele.
   */
  recoveryCode?: string
}

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

/**
 * POST /auth/password/recover → AuthResponse cu un `recoveryCode` nou (utilizatorul e conectat); 401 e-mail sau cod greșit,
 * 403 cont dezactivat, 429 `{ retryAfterSeconds }` prea multe încercări, 400 date invalide.
 */
export interface RecoverPasswordRequest { email: string; recoveryCode: string; password: string }

/** POST /me/password: 400 = parola actuală greșită (nu 401, care ar deloga), 403 = cont demo. Șterge `mustChangePassword`. */
export interface ChangePasswordRequest { currentPassword: string; newPassword: string }
/** `recoveryCode` ≠ null când s-a generat unul nou (după o parolă temporară sau dacă contul n-avea cod) */
export interface ChangePasswordResponse { recoveryCode: string | null }

/** POST /me/recovery-code `{ password }` → codul nou (cel vechi nu mai merge); 400 parolă greșită, 403 cont demo */
export interface RecoveryCodeResponse { recoveryCode: string }

export interface UpdateMeRequest { displayName?: string; locale?: 'ro' | 'en' | 'hu' }
