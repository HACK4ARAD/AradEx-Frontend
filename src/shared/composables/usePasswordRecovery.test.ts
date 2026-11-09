import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/client'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { UserDto } from '@/shared/types/auth'
import { usePasswordRecovery } from './usePasswordRecovery'

vi.mock('@/shared/api/auth', () => ({
  authApi: { recoverPassword: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const local: UserDto = {
  id: 2, email: 'ana@exemplu.ro', displayName: 'Ana Popescu', role: 'LOCAL', locale: 'ro', pointsBalance: 270, mustChangePassword: false, hasRecoveryCode: true,
}

function filled() {
  const f = usePasswordRecovery(' ana@exemplu.ro ')
  f.recoveryCode.value = 'k7qm 4xpt-9dwa'
  f.password.value = 'parola-noua'
  return f
}

describe('usePasswordRecovery', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('success signs the user in and returns the NEW recovery code to show', async () => {
    api.recoverPassword.mockResolvedValue({ token: 'jwt', user: local, recoveryCode: 'P4HW-8RTX-2MNB' })
    const f = filled()
    const res = await f.recover()

    expect(api.recoverPassword).toHaveBeenCalledWith({ email: 'ana@exemplu.ro', recoveryCode: 'K7QM-4XPT-9DWA', password: 'parola-noua' })
    expect(res).toEqual({ user: local, recoveryCode: 'P4HW-8RTX-2MNB' })
    const auth = useAuthStore()
    expect(auth.token).toBe('jwt')
    expect(auth.user).toEqual(local)
    expect(f.error.value).toBe('')
    expect(f.busy.value).toBe(false)
  })

  it('401 shows the generic wrong email/code error and keeps you signed out', async () => {
    api.recoverPassword.mockRejectedValue(new ApiError(401, 'Invalid email or recovery code', { status: 401 }))
    const f = filled()
    expect(await f.recover()).toBeNull()
    expect(f.error.value).toBe('auth.recover.errors.invalid')
    expect(useAuthStore().token).toBeFalsy()
  })

  it('429 shows the server message in a toast', async () => {
    api.recoverPassword.mockRejectedValue(new ApiError(429, 'Prea multe încercări. Încearcă peste o oră.', { status: 429, retryAfterSeconds: 3600 }))
    const f = filled()
    expect(await f.recover()).toBeNull()
    expect(useUiStore().toasts.map((t) => t.message)).toContain('Prea multe încercări. Încearcă peste o oră.')
    expect(f.error.value).toBe('')
  })

  it('403 says the account is disabled', async () => {
    api.recoverPassword.mockRejectedValue(new ApiError(403, 'Account disabled', { status: 403 }))
    const f = filled()
    await f.recover()
    expect(f.error.value).toBe('auth.errors.disabled')
  })

  it('checks the email, the code shape and the new password before calling the API', async () => {
    const f = filled()
    f.email.value = 'nu-e-email'
    await f.recover()
    expect(f.error.value).toBe('auth.errors.email')
    f.email.value = 'ana@exemplu.ro'
    f.recoveryCode.value = 'K7QM-4XPT'                 // prea scurt
    await f.recover()
    expect(f.error.value).toBe('auth.recover.errors.codeFormat')
    f.recoveryCode.value = 'K7QM-4XPT-9DW0'            // 0 nu e în alfabet
    await f.recover()
    expect(f.error.value).toBe('auth.recover.errors.codeFormat')
    f.recoveryCode.value = 'K7QM-4XPT-9DWA'
    f.password.value = 'scurta'
    await f.recover()
    expect(f.error.value).toBe('auth.errors.password')
    expect(api.recoverPassword).not.toHaveBeenCalled()
  })
})
