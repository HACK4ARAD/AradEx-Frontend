import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/client'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import type { AuthResponse, UserDto } from '@/shared/types/auth'
import { VISITOR_DEMO_EMAIL, useVisitorLogin } from './useVisitorLogin'

vi.mock('@/shared/api/auth', () => ({
  authApi: { login: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const visitor: UserDto = { id: 1, email: VISITOR_DEMO_EMAIL, displayName: 'Ana Vizitator', role: 'VISITOR', locale: 'ro', pointsBalance: 0 }

describe('useVisitorLogin', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); vi.clearAllMocks() })

  it('signs straight in to the demo visitor with the normal email login, nothing typed', async () => {
    api.login.mockResolvedValue({ token: 'jwt', user: visitor })
    const v = useVisitorLogin()
    const u = await v.enter()
    expect(api.login).toHaveBeenCalledWith('visitor@demo.ro', 'demo1234')
    expect(u?.role).toBe('VISITOR')
    expect(useAuthStore().token).toBe('jwt')
    expect(useAuthStore().user).toEqual(visitor)
    expect(v.busy.value).toBe(false)
    expect(v.error.value).toBe('')
  })

  it('on a server error it shows the visitor error, offline the network error, and stays signed out', async () => {
    api.login.mockRejectedValue(new ApiError(401, 'Invalid email or password'))
    const v = useVisitorLogin()
    expect(await v.enter()).toBeNull()
    expect(v.error.value).toBe('auth.visitor.error')
    api.login.mockRejectedValue(new ApiError(0, 'offline'))
    expect(await v.enter()).toBeNull()
    expect(v.error.value).toBe('auth.errors.network')
    expect(useAuthStore().token).toBeFalsy()
    expect(v.busy.value).toBe(false)
  })

  it('a second click while signing in does nothing', async () => {
    let done: (v: AuthResponse) => void = () => {}
    api.login.mockReturnValue(new Promise<AuthResponse>((r) => { done = r }))
    const v = useVisitorLogin()
    const first = v.enter()
    expect(await v.enter()).toBeNull()
    done({ token: 'jwt', user: visitor })
    expect((await first)?.id).toBe(1)
    expect(api.login).toHaveBeenCalledTimes(1)
  })
})
