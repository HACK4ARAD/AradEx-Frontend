import { describe, expect, it } from 'vitest'
import { initialLoginTab } from './useAuthForm'
import type { Role } from '@/shared/types/common'

const roles: Record<string, Role[] | undefined> = { '/city/validate': ['CITY_HALL'], '/business': ['BUSINESS'], '/admin': ['ADMIN'], '/events/2': ['VISITOR', 'LOCAL'], '/community': undefined }
const rolesOf = (p: string) => (p in roles ? roles[p] : null)

describe('initialLoginTab', () => {
  it('opens the panels tab when the page you were sent from is a panel (expired session)', () => {
    expect(initialLoginTab(undefined, '/city/validate', rolesOf)).toBe('panels')
    expect(initialLoginTab(undefined, '/business', rolesOf)).toBe('panels')
    expect(initialLoginTab(undefined, '/admin', rolesOf)).toBe('panels')
  })

  it('opens the personal tab otherwise', () => {
    expect(initialLoginTab(undefined, '/events/2', rolesOf)).toBe('personal')
    expect(initialLoginTab(undefined, '/community', rolesOf)).toBe('personal')
    expect(initialLoginTab(undefined, undefined, rolesOf)).toBe('personal')
    expect(initialLoginTab(undefined, 'https://evil.example', rolesOf)).toBe('personal')
  })

  it('an explicit ?tab= wins', () => {
    expect(initialLoginTab('panels', undefined, rolesOf)).toBe('panels')
    expect(initialLoginTab('personal', '/city/validate', rolesOf)).toBe('personal')
  })
})
