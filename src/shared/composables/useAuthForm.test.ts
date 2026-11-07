import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import type { Role } from '@/shared/types/common'
import { authErrorMessage, emptyAuthForm, homeFor, landingFor, safeNext, validateAuthForm } from './useAuthForm'

describe('validateAuthForm', () => {
  const ok = { ...emptyAuthForm(), email: 'ana@exemplu.ro', password: 'demo1234', displayName: 'Ana' }

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

  it('requires business name and address for a business account', () => {
    expect(validateAuthForm(ok, 'business')).toBe('auth.errors.businessName')
    expect(validateAuthForm({ ...ok, businessName: 'Ceainăria' }, 'business')).toBe('auth.errors.businessAddress')
    expect(validateAuthForm({ ...ok, businessName: 'Ceainăria', businessAddress: 'Str. X 1' }, 'business')).toBeNull()
  })
})

describe('authErrorMessage', () => {
  it('maps known statuses to Romanian messages', () => {
    expect(authErrorMessage(new ApiError(401, 'Invalid email or password'), 'login')).toEqual({ key: 'auth.errors.invalid' })
    expect(authErrorMessage(new ApiError(409, 'Email already registered'), 'register')).toEqual({ key: 'auth.errors.emailTaken' })
    expect(authErrorMessage(new ApiError(0, 'offline'), 'login')).toEqual({ key: 'auth.errors.network' })
  })

  it('falls back to the ProblemDetail detail', () => {
    expect(authErrorMessage(new ApiError(400, 'Unknown business category: X'), 'business')).toEqual({ text: 'Unknown business category: X' })
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
})
