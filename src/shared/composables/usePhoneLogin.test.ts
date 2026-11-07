import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/client'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import type { UserDto } from '@/shared/types/auth'
import { isDemoPhone, normalizePhone, usePhoneLogin } from './usePhoneLogin'

vi.mock('@/shared/api/auth', () => ({
  authApi: { otpRequest: vi.fn(), otpVerify: vi.fn(), otpRegister: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const local: UserDto = { id: 2, phone: '+40799000002', displayName: 'Ana Popescu', role: 'LOCAL', locale: 'ro', pointsBalance: 270 }

describe('normalizePhone', () => {
  it.each([
    ['0799 000 001', '+40799000001'],
    ['+40 799-000-001', '+40799000001'],
    ['0040799000001', '+40799000001'],
    ['40799000001', '+40799000001'],
    ['799000001', '+40799000001'],
    ['(0744) 123.456', '+40744123456'],
    ['+4915112345678', '+4915112345678'],
  ])('%s → %s', (raw, e164) => {
    expect(normalizePhone(raw)).toBe(e164)
  })

  it.each(['abc', '07', '', '   ', '+0123456789', '0799 000 0011 22'])('rejects %s', (raw) => {
    expect(normalizePhone(raw)).toBeNull()
  })

  it('spots demo numbers', () => {
    expect(isDemoPhone('+40799000123')).toBe(true)
    expect(isDemoPhone('+40799001123')).toBe(false)
  })
})

describe('usePhoneLogin', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  afterEach(() => vi.useRealTimers())

  it('rejects an invalid number without calling the API', async () => {
    const f = usePhoneLogin()
    f.phone.value = '07'
    await f.send()
    expect(f.error.value).toBe('auth.phone.errors.phone')
    expect(api.otpRequest).not.toHaveBeenCalled()
  })

  it('send → code step with cooldown and the demo code', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60, demoCode: '482913' })
    const f = usePhoneLogin()
    f.phone.value = '0799 000 002'
    await f.send()

    expect(api.otpRequest).toHaveBeenCalledWith('+40799000002')
    expect(f.step.value).toBe('code')
    expect(f.demoCode.value).toBe('482913')
    expect(f.cooldown.value).toBe(60)
    vi.advanceTimersByTime(5000)
    expect(f.cooldown.value).toBe(55)
  })

  it('verify with an existing account signs in', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60 })
    api.otpVerify.mockResolvedValue({ token: 'jwt', user: local })
    const f = usePhoneLogin()
    f.phone.value = '0799000002'
    await f.send()
    f.code.value = '482913'
    const u = await f.verify()

    expect(api.otpVerify).toHaveBeenCalledWith('+40799000002', '482913')
    expect(u).toEqual(local)
    expect(useAuthStore().user).toEqual(local)
  })

  it('verify with a new number goes to the profile step, then register signs in', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60 })
    api.otpVerify.mockResolvedValue({ signupToken: 'signup' })
    api.otpRegister.mockResolvedValue({ token: 'jwt', user: { ...local, id: 99, role: 'VISITOR' } })
    const f = usePhoneLogin()
    f.phone.value = '0799000042'
    await f.send()
    f.code.value = '123456'

    expect(await f.verify()).toBeNull()
    expect(f.step.value).toBe('profile')

    f.displayName.value = ' Ana Pop '
    f.role.value = 'VISITOR'
    const u = await f.register()
    expect(api.otpRegister).toHaveBeenCalledWith({ signupToken: 'signup', displayName: 'Ana Pop', role: 'VISITOR' })
    expect(u?.id).toBe(99)
    expect(useAuthStore().isLoggedIn).toBe(true)
  })

  it('a wrong code shows an error and stays on the code step', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60 })
    api.otpVerify.mockRejectedValue(new ApiError(401, 'Invalid or expired code', { status: 401 }))
    const f = usePhoneLogin()
    f.phone.value = '0799000002'
    await f.send()
    f.code.value = '000000'
    await f.verify()

    expect(f.step.value).toBe('code')
    expect(f.error.value).toBe('auth.phone.errors.code')
  })

  it('429 sets the cooldown from retryAfterSeconds', async () => {
    api.otpRequest.mockRejectedValue(new ApiError(429, 'Wait', { status: 429, retryAfterSeconds: 42 }))
    const f = usePhoneLogin()
    f.phone.value = '0799000002'
    await f.send()

    expect(f.cooldown.value).toBe(42)
    expect(f.error.value).toBe('auth.phone.errors.wait')
  })

  it('503 says SMS is unavailable', async () => {
    api.otpRequest.mockRejectedValue(new ApiError(503, 'SMS unavailable', { status: 503 }))
    const f = usePhoneLogin()
    f.phone.value = '0744123456'
    await f.send()

    expect(f.step.value).toBe('phone')
    expect(f.error.value).toBe('auth.phone.errors.smsUnavailable')
  })

  it('an expired signup token sends you back to the phone step', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60 })
    api.otpVerify.mockResolvedValue({ signupToken: 'signup' })
    api.otpRegister.mockRejectedValue(new ApiError(401, 'Signup expired', { status: 401 }))
    const f = usePhoneLogin()
    f.phone.value = '0799000042'
    await f.send()
    f.code.value = '123456'
    await f.verify()
    f.displayName.value = 'Ana'
    await f.register()

    expect(f.step.value).toBe('phone')
    expect(f.error.value).toBe('auth.phone.errors.expired')
  })

  it('register needs a name', async () => {
    const f = usePhoneLogin()
    f.displayName.value = '  '
    expect(await f.register()).toBeNull()
    expect(f.error.value).toBe('auth.errors.nameRequired')
    expect(api.otpRegister).not.toHaveBeenCalled()
  })
})
