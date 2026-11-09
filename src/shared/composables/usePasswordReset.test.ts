import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/client'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { UserDto } from '@/shared/types/auth'
import { RESEND_COOLDOWN_S, usePasswordReset } from './usePasswordReset'

vi.mock('@/shared/api/auth', () => ({
  authApi: { forgotPassword: vi.fn(), resetPassword: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const local: UserDto = { id: 2, email: 'ana@exemplu.ro', displayName: 'Ana Popescu', role: 'LOCAL', locale: 'ro', pointsBalance: 270 }

/** pasul 2, după un 204 */
async function atCodeStep() {
  api.forgotPassword.mockResolvedValue(undefined)
  const f = usePasswordReset(' ana@exemplu.ro ')
  expect(await f.send()).toBe(true)
  return f
}

describe('usePasswordReset', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  afterEach(() => vi.useRealTimers())

  it('rejects an invalid email without calling the API', async () => {
    const f = usePasswordReset('nu-e-email')
    expect(await f.send()).toBe(false)
    expect(f.error.value).toBe('auth.errors.email')
    expect(f.step.value).toBe('email')
    expect(api.forgotPassword).not.toHaveBeenCalled()
  })

  it('204 → code step for the trimmed address, with the resend cooldown', async () => {
    const f = await atCodeStep()
    expect(api.forgotPassword).toHaveBeenCalledWith('ana@exemplu.ro')
    expect(f.step.value).toBe('code')
    expect(f.email.value).toBe('ana@exemplu.ro')
    expect(f.error.value).toBe('')
    expect(f.cooldown.value).toBe(RESEND_COOLDOWN_S)
    vi.advanceTimersByTime(5000)
    expect(f.cooldown.value).toBe(RESEND_COOLDOWN_S - 5)
  })

  it('429 shows the server detail in a toast and stays on the email step', async () => {
    api.forgotPassword.mockRejectedValue(new ApiError(429, 'Prea multe cereri. Încearcă peste 10 minute.', { status: 429, retryAfterSeconds: 600 }))
    const f = usePasswordReset('ana@exemplu.ro')
    expect(await f.send()).toBe(false)
    expect(f.step.value).toBe('email')
    expect(f.error.value).toBe('')
    expect(useUiStore().toasts.map((t) => t.message)).toContain('Prea multe cereri. Încearcă peste 10 minute.')
    expect(f.cooldown.value).toBe(600)
  })

  it('reset success signs the user in (session accepted)', async () => {
    const f = await atCodeStep()
    api.resetPassword.mockResolvedValue({ token: 'jwt', user: local })
    f.code.value = '482 913'
    f.password.value = 'parola-noua'
    const u = await f.reset()

    expect(api.resetPassword).toHaveBeenCalledWith({ email: 'ana@exemplu.ro', code: '482913', password: 'parola-noua' })
    expect(u).toEqual(local)
    const auth = useAuthStore()
    expect(auth.token).toBe('jwt')
    expect(auth.user).toEqual(local)
    expect(localStorage.getItem('ax.token')).toBe('jwt')
  })

  it('401 shows the wrong-code error, stays on the code step and keeps you signed out', async () => {
    const f = await atCodeStep()
    api.resetPassword.mockRejectedValue(new ApiError(401, 'Invalid or expired code', { status: 401 }))
    f.code.value = '000000'
    f.password.value = 'parola-noua'
    expect(await f.reset()).toBeNull()
    expect(f.error.value).toBe('auth.forgot.errors.code')
    expect(f.step.value).toBe('code')
    expect(useAuthStore().token).toBeFalsy()
  })

  it('403 says the account is disabled', async () => {
    const f = await atCodeStep()
    api.resetPassword.mockRejectedValue(new ApiError(403, 'Account disabled', { status: 403 }))
    f.code.value = '123456'
    f.password.value = 'parola-noua'
    await f.reset()
    expect(f.error.value).toBe('auth.errors.disabled')
  })

  it('checks the code and the new password before calling the API', async () => {
    const f = await atCodeStep()
    f.code.value = '123'
    f.password.value = 'parola-noua'
    await f.reset()
    expect(f.error.value).toBe('auth.forgot.errors.codeFormat')
    f.code.value = '123456'
    f.password.value = 'scurta'
    await f.reset()
    expect(f.error.value).toBe('auth.errors.password')
    f.password.value = 'x'.repeat(73)
    await f.reset()
    expect(f.error.value).toBe('auth.errors.passwordLong')
    expect(api.resetPassword).not.toHaveBeenCalled()
  })

  it('resend asks for a new code again; another address goes back to the email step', async () => {
    const f = await atCodeStep()
    expect(await f.send()).toBe(true)
    expect(api.forgotPassword).toHaveBeenCalledTimes(2)
    expect(f.step.value).toBe('code')
    f.code.value = '12'
    f.restart()
    expect(f.step.value).toBe('email')
    expect(f.code.value).toBe('')
  })
})
