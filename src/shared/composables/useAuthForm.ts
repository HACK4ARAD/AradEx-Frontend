import { ApiError } from '@/shared/api/client'
import type { Role } from '@/shared/types/common'
import type { SelfRegisterRole } from '@/shared/types/auth'
import type { BusinessCategory } from '@/shared/types/business'

/** Logica formularelor de cont (S12 mobil, W0 web), fără UI: validare, mesaje de eroare, unde ajungi după login. */

export type AuthMode = 'login' | 'register' | 'business'
export type Ui = 'm' | 'w'

export interface AuthFormValues {
  email: string
  password: string
  displayName: string
  role: SelfRegisterRole
  businessName: string
  businessCategory: BusinessCategory
  businessAddress: string
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = ['CAFE', 'RESTAURANT', 'PRODUCER', 'WINERY', 'SHOP', 'OTHER']

/** Scurtăturile spre conturile demo (chips, cardurile de panouri) apar doar în dev sau cu VITE_DEMO=true. */
export const DEMO_ENABLED = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true'
export const DEMO_PASSWORD = 'demo1234'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function emptyAuthForm(): AuthFormValues {
  return { email: '', password: '', displayName: '', role: 'VISITOR', businessName: '', businessCategory: 'CAFE', businessAddress: '' }
}

/**
 * Validarea de formă, înainte de a trimite — aceleași reguli ca DTO-urile din BE: la login (LoginRequest) parola doar nevidă,
 * la cont nou (RegisterRequest) minimum 8 caractere. Întoarce cheia i18n a primei erori sau null.
 */
export function validateAuthForm(v: AuthFormValues, mode: AuthMode): string | null {
  if (mode !== 'login' && !v.displayName.trim()) return 'auth.errors.nameRequired'
  if (!EMAIL_RE.test(v.email.trim())) return 'auth.errors.email'
  if (mode === 'login' ? !v.password : v.password.length < 8) return mode === 'login' ? 'auth.errors.passwordRequired' : 'auth.errors.password'
  if (mode === 'business') {
    if (!v.businessName.trim()) return 'auth.errors.businessName'
    if (!v.businessAddress.trim()) return 'auth.errors.businessAddress'
  }
  return null
}

/**
 * Eroarea API → mesaj pentru utilizator: cheie i18n pentru cazurile cunoscute (401, 409), altfel `detail` din ProblemDetail.
 * `{ key }` se traduce cu t(), `{ text }` se afișează ca atare.
 */
export function authErrorMessage(err: unknown, mode: AuthMode): { key: string } | { text: string } {
  if (err instanceof ApiError) {
    if (err.status === 401 && mode === 'login') return { key: 'auth.errors.invalid' }
    if (err.status === 409) return { key: 'auth.errors.emailTaken' }
    // T21: conturile personale (Vizitator, Localnic) intră cu telefonul, în aplicație
    if (err.status === 403 && mode === 'login') return { key: 'auth.errors.usePhone' }
    if (err.status === 0) return { key: 'auth.errors.network' }
    if (err.status === 400 && err.problem?.errors?.length) return { key: 'auth.errors.validation' }
    return { text: err.message }
  }
  return { key: 'auth.errors.generic' }
}

/**
 * Unde ajunge fiecare rol după login. Mobil (`m`): voluntarul la acțiunile lui (T18), firma și Primăria în panoul de teren,
 * restul acasă. Web (`w`): firma, Primăria și Adminul în panoul lor, restul pe prezentare.
 */
export function homeFor(role: Role, ui: Ui): string {
  if (ui === 'm') {
    if (role === 'VOLUNTEER') return '/vol/actions'
    return role === 'BUSINESS' || role === 'CITY_HALL' ? '/panel' : '/'
  }
  switch (role) {
    case 'BUSINESS': return '/business'
    case 'CITY_HALL': return '/city'
    case 'ADMIN': return '/admin'
    default: return '/'
  }
}

/**
 * `?next=` acceptat doar dacă e o cale internă (fără redirect deschis spre alt site). Prefixele vechi (`/m`, `/w`) se scot.
 * Pagina de start (`/`) și login-ul nu contează ca destinație: atunci fiecare rol merge acasă la el (homeFor).
 */
export function safeNext(next: unknown): string | null {
  if (typeof next !== 'string') return null
  const path = next.replace(/^\/[mw](?=\/|$|\?)/, '') || '/'
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return null
  const bare = path.split(/[?#]/)[0]
  if (bare === '/' || bare === '/login' || bare === '/vol/login') return null
  return path
}

/**
 * Unde ajunge utilizatorul după login (sau dacă deschide login-ul deja conectat): `next` dacă e sigur, e o rută a aplicației
 * curente și rolul are voie pe ea, altfel pagina rolului. `rolesOf(path)` = `meta.roles` al rutei (din router.resolve),
 * sau `null` dacă nu există o asemenea rută în aplicația curentă.
 */
export function landingFor(role: Role, ui: Ui, next: unknown, rolesOf: (path: string) => Role[] | undefined | null): string {
  const target = safeNext(next)
  if (target) {
    const roles = rolesOf(target)
    if (roles !== null && (!roles?.length || role === 'ADMIN' || roles.includes(role))) return target
  }
  return homeFor(role, ui)
}
