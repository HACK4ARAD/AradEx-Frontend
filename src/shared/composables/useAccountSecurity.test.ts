import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/client'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import type { UserDto } from '@/shared/types/auth'
import { useChangePassword, useNewRecoveryCode } from './useAccountSecurity'

vi.mock('@/shared/api/auth', () => ({
  authApi: { changePassword: vi.fn(), newRecoveryCode: vi.fn(), me: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const user = (patch: Partial<UserDto> = {}): UserDto => ({
  id: 4, email: 'ion@exemplu.ro', displayName: 'Ion', role: 'LOCAL', locale: 'ro', pointsBalance: 0, mustChangePassword: true, hasRecoveryCode: false, ...patch,
})

function signedIn(u: UserDto) {
  const auth = useAuthStore()
  auth.user = u
  auth.token = 'jwt'
  return auth
}

describe('useChangePassword', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); vi.clearAllMocks() })

  it('after a temporary password: returns the new recovery code to show and refreshes the user from /me', async () => {
    const auth = signedIn(user())
    api.changePassword.mockResolvedValue({ recoveryCode: 'P4HW-8RTX-2MNB' })
    api.me.mockResolvedValue(user({ mustChangePassword: false, hasRecoveryCode: true }))
    const f = useChangePassword()
    f.currentPassword.value = 'K7QM-4XPT-9DWA'
    f.newPassword.value = 'parola-noua'
    const res = await f.submit()

    expect(api.changePassword).toHaveBeenCalledWith({ currentPassword: 'K7QM-4XPT-9DWA', newPassword: 'parola-noua' })
    expect(res).toEqual({ recoveryCode: 'P4HW-8RTX-2MNB' })
    expect(api.me).toHaveBeenCalled()
    expect(auth.user?.mustChangePassword).toBe(false)
    expect(auth.user?.hasRecoveryCode).toBe(true)
    expect(f.currentPassword.value).toBe('')
  })

  it('a plain change returns no code', async () => {
    signedIn(user({ mustChangePassword: false, hasRecoveryCode: true }))
    api.changePassword.mockResolvedValue({ recoveryCode: null })
    api.me.mockResolvedValue(user({ mustChangePassword: false, hasRecoveryCode: true }))
    const f = useChangePassword()
    f.currentPassword.value = 'parola-veche'
    f.newPassword.value = 'parola-noua'
    expect(await f.submit()).toEqual({ recoveryCode: null })
  })

  it('400 = wrong current password (and the session stays)', async () => {
    const auth = signedIn(user())
    api.changePassword.mockRejectedValue(new ApiError(400, 'Current password is wrong', { status: 400 }))
    const f = useChangePassword()
    f.currentPassword.value = 'gresita'
    f.newPassword.value = 'parola-noua'
    expect(await f.submit()).toBeNull()
    expect(f.error.value).toBe('auth.passwordChange.errors.wrongCurrent')
    expect(auth.token).toBe('jwt')
    expect(auth.user?.mustChangePassword).toBe(true)
  })

  it('403 = demo account; the new password is checked before calling the API', async () => {
    signedIn(user({ email: 'local@demo.ro' }))
    const f = useChangePassword()
    f.currentPassword.value = 'demo1234'
    f.newPassword.value = 'scurta'
    await f.submit()
    expect(f.error.value).toBe('auth.errors.password')
    expect(api.changePassword).not.toHaveBeenCalled()
    api.changePassword.mockRejectedValue(new ApiError(403, 'Demo accounts cannot change their password', { status: 403 }))
    f.newPassword.value = 'parola-noua'
    await f.submit()
    expect(f.error.value).toBe('auth.passwordChange.errors.demo')
  })

  it('if /me fails after the change, the forced-change flag is cleared locally', async () => {
    const auth = signedIn(user())
    api.changePassword.mockResolvedValue({ recoveryCode: 'P4HW-8RTX-2MNB' })
    api.me.mockRejectedValue(new ApiError(0, 'offline'))
    const f = useChangePassword()
    f.currentPassword.value = 'K7QM-4XPT-9DWA'
    f.newPassword.value = 'parola-noua'
    await f.submit()
    expect(auth.user?.mustChangePassword).toBe(false)
    expect(auth.user?.hasRecoveryCode).toBe(true)
  })
})

describe('useNewRecoveryCode', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); vi.clearAllMocks() })

  it('returns the new code and refreshes the user', async () => {
    const auth = signedIn(user({ mustChangePassword: false }))
    api.newRecoveryCode.mockResolvedValue({ recoveryCode: 'P4HW-8RTX-2MNB' })
    api.me.mockResolvedValue(user({ mustChangePassword: false, hasRecoveryCode: true }))
    const r = useNewRecoveryCode()
    r.password.value = 'parola-mea'
    expect(await r.submit()).toBe('P4HW-8RTX-2MNB')
    expect(api.newRecoveryCode).toHaveBeenCalledWith('parola-mea')
    expect(auth.user?.hasRecoveryCode).toBe(true)
  })

  it('400 = wrong password; empty password is not sent', async () => {
    signedIn(user({ mustChangePassword: false }))
    const r = useNewRecoveryCode()
    await r.submit()
    expect(r.error.value).toBe('auth.errors.passwordRequired')
    api.newRecoveryCode.mockRejectedValue(new ApiError(400, 'Wrong password', { status: 400 }))
    r.password.value = 'gresita'
    expect(await r.submit()).toBeNull()
    expect(r.error.value).toBe('auth.passwordChange.errors.wrongPassword')
  })
})
