import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/client'
import type { Role } from '@/shared/types/api'
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
  it('sends panels to their dashboards', () => {
    expect(homeFor('BUSINESS', 'w')).toBe('/w/business')
    expect(homeFor('CITY_HALL', 'w')).toBe('/w/city')
    expect(homeFor('ADMIN', 'w')).toBe('/w/admin')
    expect(homeFor('LOCAL', 'w')).toBe('/w')
    expect(homeFor('CITY_HALL', 'm')).toBe('/m/panel')
    expect(homeFor('VISITOR', 'm')).toBe('/m')
  })
})

describe('safeNext', () => {
  it('only accepts internal paths of the same UI', () => {
    expect(safeNext('/m/tickets', 'm')).toBe('/m/tickets')
    expect(safeNext('/w/account', 'm')).toBeNull()
    expect(safeNext('//evil.example', 'm')).toBeNull()
    expect(safeNext('https://evil.example', 'w')).toBeNull()
    expect(safeNext('/m/login', 'm')).toBeNull()
    expect(safeNext(undefined, 'w')).toBeNull()
  })

  it('ignores the bare start page', () => {
    expect(safeNext('/w', 'w')).toBeNull()
    expect(safeNext('/m', 'm')).toBeNull()
  })
})

describe('landingFor', () => {
  const rolesOf = (p: string) => (p.startsWith('/w/city') ? (['CITY_HALL'] as Role[]) : p.startsWith('/m/tickets') ? (['VISITOR', 'LOCAL'] as Role[]) : undefined)

  it('uses next when the role may open it', () => {
    expect(landingFor('LOCAL', 'm', '/m/tickets', rolesOf)).toBe('/m/tickets')
    expect(landingFor('VISITOR', 'w', '/w/events', rolesOf)).toBe('/w/events')
    expect(landingFor('ADMIN', 'w', '/w/city/actions', rolesOf)).toBe('/w/city/actions')
  })

  it('falls back to the role home when next is missing, the start page, or forbidden', () => {
    expect(landingFor('CITY_HALL', 'w', '/w', rolesOf)).toBe('/w/city')
    expect(landingFor('BUSINESS', 'w', undefined, rolesOf)).toBe('/w/business')
    expect(landingFor('CITY_HALL', 'm', '/m/tickets', rolesOf)).toBe('/m/panel')
    expect(landingFor('LOCAL', 'w', '/w/city', rolesOf)).toBe('/w')
  })
})
