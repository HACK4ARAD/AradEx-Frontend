import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/client'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import type { UserDto } from '@/shared/types/auth'
import { VISITOR_DEMO_PHONE, isDemoPhone, normalizePhone, usePhoneLogin, useVisitorLogin } from './usePhoneLogin'

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

  it.each(['abc', '07', '', '   ', '+0123456789', '0799 000 0011 22', '0257 280 000', '021 312 1234', '0900 123 456', '0800 800 800'])('rejects %s', (raw) => {
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

  it('a code sent seconds ago (e.g. after a logout) → straight to the code step, with a note, no error', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 42, alreadySent: true })
    const f = usePhoneLogin()
    f.phone.value = '0744 123 456'
    await f.send()
    expect(f.step.value).toBe('code')
    expect(f.error.value).toBe('')
    expect(f.info.value).toBe('auth.phone.alreadySent')
    expect(f.cooldown.value).toBe(42)
  })

  it('same number again while the cooldown runs → back to the code step instead of an error', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60 })
    const f = usePhoneLogin()
    f.phone.value = '0744 123 456'
    await f.send()
    f.restart()
    await f.send()
    expect(api.otpRequest).toHaveBeenCalledTimes(1)
    expect(f.step.value).toBe('code')
    expect(f.error.value).toBe('')
    expect(f.info.value).toBe('auth.phone.alreadySent')
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
    expect(await f.register()).toBeNull()                       // fără bifă nu se creează contul
    expect(f.error.value).toBe('auth.consent.required')
    expect(api.otpRegister).not.toHaveBeenCalled()
    f.acceptTerms.value = true
    const u = await f.register()
    expect(api.otpRegister).toHaveBeenCalledWith({ signupToken: 'signup', displayName: 'Ana Pop', role: 'VISITOR', acceptTerms: true })
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
    f.acceptTerms.value = true
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

  it('after 5 wrong codes asks for a new code and goes back to the number', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60 })
    api.otpVerify.mockRejectedValue(new ApiError(401, 'Invalid or expired code', { status: 401 }))
    const f = usePhoneLogin()
    f.phone.value = '0744123456'
    await f.send()
    for (let i = 0; i < 4; i++) { f.code.value = '000000'; await f.verify() }
    expect(f.step.value).toBe('code')

    f.code.value = '000000'
    await f.verify()
    expect(f.step.value).toBe('phone')
    expect(f.error.value).toBe('auth.phone.errors.tooMany')
  })

  it('a 429 on verify asks to wait', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60 })
    api.otpVerify.mockRejectedValue(new ApiError(429, 'Too many', { status: 429, retryAfterSeconds: 60 }))
    const f = usePhoneLogin()
    f.phone.value = '0744123456'
    await f.send()
    f.code.value = '123456'
    await f.verify()

    expect(f.error.value).toBe('auth.phone.errors.wait')
  })
})

describe('useVisitorLogin', () => {
  const visitor: UserDto = { id: 1, phone: '+40799000001', displayName: 'Ana Vizitator', role: 'VISITOR', locale: 'ro', pointsBalance: 0 }
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()); vi.clearAllMocks() })

  it('signs straight in to the demo visitor: asks for the demo code and confirms it, no code typed', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60, demoCode: '482913' })
    api.otpVerify.mockResolvedValue({ token: 'jwt', user: visitor })
    const v = useVisitorLogin()
    const u = await v.enter()
    expect(api.otpRequest).toHaveBeenCalledWith(VISITOR_DEMO_PHONE)
    expect(api.otpVerify).toHaveBeenCalledWith(VISITOR_DEMO_PHONE, '482913')
    expect(u?.role).toBe('VISITOR')
    expect(useAuthStore().token).toBe('jwt')
    expect(v.busy.value).toBe(false)
  })

  it('without a demo code or on a server error it shows an error and stays signed out', async () => {
    api.otpRequest.mockResolvedValue({ retryAfterSeconds: 60 })
    const v = useVisitorLogin()
    expect(await v.enter()).toBeNull()
    expect(v.error.value).toBe('auth.visitor.error')
    api.otpRequest.mockRejectedValue(new ApiError(0, 'offline'))
    expect(await v.enter()).toBeNull()
    expect(v.error.value).toBe('auth.errors.network')
    expect(useAuthStore().token).toBeFalsy()
  })

  it('a second click while signing in does nothing', async () => {
    let done: (v: unknown) => void = () => {}
    api.otpRequest.mockReturnValue(new Promise((r) => { done = r }) as never)
    const v = useVisitorLogin()
    const first = v.enter()
    expect(await v.enter()).toBeNull()
    done({ retryAfterSeconds: 60, demoCode: '111111' })
    api.otpVerify.mockResolvedValue({ token: 'jwt', user: visitor })
    await first
    expect(api.otpRequest).toHaveBeenCalledTimes(1)
  })
})

