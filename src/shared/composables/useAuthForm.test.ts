import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import type { Role } from '@/shared/types/common'
import {
  authErrorMessage, buildRegisterRequest, emptyAuthForm, homeFor, isDemoAccount, landingFor, normalizeRecoveryCode, safeNext, validateAuthForm,
} from './useAuthForm'

describe('validateAuthForm', () => {
  const ok = { ...emptyAuthForm(), email: 'ana@exemplu.ro', password: 'demo1234', displayName: 'Ana', acceptTerms: true }

  it('accepts a valid login and register', () => {
    expect(validateAuthForm(ok, 'login')).toBeNull()
    expect(validateAuthForm(ok, 'register')).toBeNull()
  })

  it('rejects bad email; login needs a password, register needs 8+ characters (same as the BE DTOs)', () => {
    expect(validateAuthForm({ ...ok, email: 'nu-e-email' }, 'login')).toBe('auth.errors.email')
    expect(validateAuthForm({ ...ok, password: '' }, 'login')).toBe('auth.errors.passwordRequired')
    expect(validateAuthForm({ ...ok, password: '1234' }, 'login')).toBeNull()
    expect(validateAuthForm({ ...ok, password: '1234' }, 'register')).toBe('auth.errors.password')
  })

  it('requires a name only when creating an account', () => {
    expect(validateAuthForm({ ...ok, displayName: ' ' }, 'login')).toBeNull()
    expect(validateAuthForm({ ...ok, displayName: ' ' }, 'register')).toBe('auth.errors.nameRequired')
  })

  it('a new account keeps the BE limits: password up to 72 characters, name up to 80', () => {
    expect(validateAuthForm({ ...ok, password: 'x'.repeat(72) }, 'register')).toBeNull()
    expect(validateAuthForm({ ...ok, password: 'x'.repeat(73) }, 'register')).toBe('auth.errors.passwordLong')
    expect(validateAuthForm({ ...ok, password: 'x'.repeat(73) }, 'login')).toBeNull()
    expect(validateAuthForm({ ...ok, displayName: 'A'.repeat(81) }, 'register')).toBe('auth.errors.nameLong')
  })

  it('a personal account needs the terms ticked too', () => {
    expect(validateAuthForm({ ...ok, acceptTerms: false }, 'register')).toBe('auth.consent.required')
  })

  it('requires business name and address for a business account', () => {
    expect(validateAuthForm(ok, 'business')).toBe('auth.errors.businessName')
    expect(validateAuthForm({ ...ok, businessName: 'Ceainăria' }, 'business')).toBe('auth.errors.businessAddress')
    expect(validateAuthForm({ ...ok, businessName: 'Ceainăria', businessAddress: 'Str. X 1', acceptTerms: false }, 'business')).toBe('auth.consent.required')
    expect(validateAuthForm({ ...ok, acceptTerms: false }, 'login')).toBeNull() // la conectare nu se cere
    expect(validateAuthForm({ ...ok, businessName: 'Ceainăria', businessAddress: 'Str. X 1' }, 'business')).toBeNull()
  })
})

describe('authErrorMessage', () => {
  it('maps known statuses to Romanian messages', () => {
    expect(authErrorMessage(new ApiError(401, 'Invalid email or password'), 'login')).toEqual({ key: 'auth.errors.invalid' })
    expect(authErrorMessage(new ApiError(409, 'Email already registered'), 'register')).toEqual({ key: 'auth.errors.emailTaken' })
    expect(authErrorMessage(new ApiError(0, 'offline'), 'login')).toEqual({ key: 'auth.errors.network' })
  })

  it('403 on login means the account is disabled', () => {
    expect(authErrorMessage(new ApiError(403, 'Account disabled'), 'login')).toEqual({ key: 'auth.errors.disabled' })
  })

  it('falls back to the ProblemDetail detail', () => {
    expect(authErrorMessage(new ApiError(400, 'Unknown business category: X'), 'business')).toEqual({ text: 'Unknown business category: X' })
  })
})

describe('buildRegisterRequest', () => {
  const v = { ...emptyAuthForm(), email: ' ana@exemplu.ro ', password: 'demo1234', displayName: ' Ana Pop ', acceptTerms: true }

  it('a visitor or a local signs up without business', () => {
    const visitor = buildRegisterRequest({ ...v, role: 'VISITOR' }, 'register')
    expect(visitor).toEqual({ email: 'ana@exemplu.ro', password: 'demo1234', displayName: 'Ana Pop', role: 'VISITOR', acceptTerms: true })
    expect('business' in visitor).toBe(false)
    expect(buildRegisterRequest({ ...v, role: 'LOCAL' }, 'register').role).toBe('LOCAL')
  })

  it('a business signs up as BUSINESS with its details', () => {
    const req = buildRegisterRequest({ ...v, businessName: ' Ceainăria ', businessCategory: 'CAFE', businessAddress: ' Str. X 1 ' }, 'business')
    expect(req).toEqual({
      email: 'ana@exemplu.ro', password: 'demo1234', displayName: 'Ana Pop', acceptTerms: true,
      role: 'BUSINESS', business: { name: 'Ceainăria', category: 'CAFE', address: 'Str. X 1' },
    })
  })
})

describe('recovery code and demo accounts', () => {
  it('normalizes a typed recovery code like the BE (any case, no spaces or dashes)', () => {
    expect(normalizeRecoveryCode('k7qm-4xpt-9dwa')).toBe('K7QM-4XPT-9DWA')
    expect(normalizeRecoveryCode(' K7QM 4XPT 9DWA ')).toBe('K7QM-4XPT-9DWA')
    expect(normalizeRecoveryCode('K7QM4XPT9DWA')).toBe('K7QM-4XPT-9DWA')
  })

  it('rejects a wrong length or letters outside the alphabet (0, O, 1, I, L)', () => {
    expect(normalizeRecoveryCode('K7QM-4XPT')).toBeNull()
    expect(normalizeRecoveryCode('K7QM-4XPT-9DWAB')).toBeNull()
    expect(normalizeRecoveryCode('K7QM-4XPT-9DW0')).toBeNull()
    expect(normalizeRecoveryCode('K7QM-4XPT-9DWI')).toBeNull()
    expect(normalizeRecoveryCode('')).toBeNull()
  })

  it('spots demo accounts by their @demo.ro email', () => {
    expect(isDemoAccount({ email: 'visitor@demo.ro' })).toBe(true)
    expect(isDemoAccount({ email: 'Admin@Demo.RO' })).toBe(true)
    expect(isDemoAccount({ email: 'ana@exemplu.ro' })).toBe(false)
    expect(isDemoAccount({})).toBe(false)
    expect(isDemoAccount(null)).toBe(false)
  })
})

describe('homeFor', () => {
  it('sends each role home, without a prefix', () => {
    expect(homeFor('BUSINESS', 'w')).toBe('/business')
    expect(homeFor('CITY_HALL', 'w')).toBe('/city')
    expect(homeFor('ADMIN', 'w')).toBe('/admin')
    expect(homeFor('LOCAL', 'w')).toBe('/')
    expect(homeFor('CITY_HALL', 'm')).toBe('/panel')
    expect(homeFor('BUSINESS', 'm')).toBe('/panel')
    expect(homeFor('VISITOR', 'm')).toBe('/')
    expect(homeFor('VOLUNTEER', 'm')).toBe('/vol/actions')
  })
})

describe('safeNext', () => {
  it('only accepts internal paths', () => {
    expect(safeNext('/tickets')).toBe('/tickets')
    expect(safeNext('/city/actions?x=1')).toBe('/city/actions?x=1')
    expect(safeNext('//evil.example')).toBeNull()
    expect(safeNext('/\\evil.example')).toBeNull()
    expect(safeNext('https://evil.example')).toBeNull()
    expect(safeNext('tickets')).toBeNull()
    expect(safeNext(undefined)).toBeNull()
  })

  it('ignores the start page and the login pages', () => {
    expect(safeNext('/')).toBeNull()
    expect(safeNext('/login')).toBeNull()
    expect(safeNext('/login?next=/x')).toBeNull()
    expect(safeNext('/vol/login')).toBeNull()
  })

  it('strips the old /m and /w prefixes', () => {
    expect(safeNext('/m/tickets')).toBe('/tickets')
    expect(safeNext('/w/city')).toBe('/city')
    expect(safeNext('/m')).toBeNull()
    expect(safeNext('/w/login')).toBeNull()
    expect(safeNext('/m//evil.example')).toBeNull()
  })
})

describe('landingFor', () => {
  const rolesOf = (p: string) => (p.startsWith('/city') ? (['CITY_HALL'] as Role[]) : p.startsWith('/tickets') ? (['VISITOR', 'LOCAL'] as Role[]) : undefined)

  it('uses next when the role may open it', () => {
    expect(landingFor('LOCAL', 'm', '/tickets', rolesOf)).toBe('/tickets')
    expect(landingFor('LOCAL', 'm', '/m/tickets', rolesOf)).toBe('/tickets')
    expect(landingFor('VISITOR', 'w', '/community', rolesOf)).toBe('/community')
    expect(landingFor('ADMIN', 'w', '/city/actions', rolesOf)).toBe('/city/actions')
  })

  it('falls back to the role home when next is missing, the start page, or forbidden', () => {
    expect(landingFor('CITY_HALL', 'w', '/', rolesOf)).toBe('/city')
    expect(landingFor('BUSINESS', 'w', undefined, rolesOf)).toBe('/business')
    expect(landingFor('CITY_HALL', 'm', '/tickets', rolesOf)).toBe('/panel')
    expect(landingFor('LOCAL', 'w', '/city', rolesOf)).toBe('/')
  })

  it('falls back to the role home when next is not a route in this app', () => {
    const notHere = (p: string) => (p.startsWith('/events') || p.startsWith('/tickets') ? null : rolesOf(p))
    expect(landingFor('BUSINESS', 'w', '/w/events/5', notHere)).toBe('/business')
    expect(landingFor('CITY_HALL', 'w', '/m/tickets', notHere)).toBe('/city')
  })
})
