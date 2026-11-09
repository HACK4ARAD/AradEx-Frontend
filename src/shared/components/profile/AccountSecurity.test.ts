import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/shared/i18n'
import { ApiError } from '@/shared/api/client'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import type { UserDto } from '@/shared/types/auth'
import AccountSecurity from './AccountSecurity.vue'

vi.mock('@/shared/api/auth', () => ({
  authApi: { changePassword: vi.fn(), newRecoveryCode: vi.fn(), me: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const user = (patch: Partial<UserDto> = {}): UserDto => ({
  id: 4, email: 'ion@exemplu.ro', displayName: 'Ion', role: 'LOCAL', locale: 'ro', pointsBalance: 0, mustChangePassword: false, hasRecoveryCode: true, ...patch,
})

let w: VueWrapper | null = null
function render(u: UserDto) {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'ro'
  const auth = useAuthStore()
  auth.user = u
  auth.token = 'jwt'
  w = mount(AccountSecurity, { props: { ui: 'w' }, global: { plugins: [i18n] }, attachTo: document.body })
  return w
}
const $ = (sel: string) => document.querySelector(sel)
async function type(sel: string, value: string) {
  const el = $(sel) as HTMLInputElement
  el.value = value
  el.dispatchEvent(new Event('input'))
  await flushPromises()
}

describe('AccountSecurity', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })
  afterEach(() => { w?.unmount(); w = null })

  it('a demo account sees only a note, no actions', () => {
    const v = render(user({ email: 'local@demo.ro' }))
    expect(v.find('[data-test=security-demo]').text()).toContain('contului demo nu se poate schimba')
    expect(v.find('[data-test=security-password]').exists()).toBe(false)
    expect(v.find('[data-test=security-code]').exists()).toBe(false)
  })

  it('warns when the account has no recovery code yet', () => {
    expect(render(user({ hasRecoveryCode: false })).find('[data-test=security-no-code]').exists()).toBe(true)
    w?.unmount()
    expect(render(user()).find('[data-test=security-no-code]').exists()).toBe(false)
  })

  it('"Schimbă parola": a wrong current password shows the error; a returned code is shown', async () => {
    const v = render(user({ hasRecoveryCode: false }))
    await v.find('[data-test=security-password]').trigger('click')
    await flushPromises()
    const inputs = () => document.querySelectorAll<HTMLInputElement>('[data-test=password-form] input')
    expect(inputs()).toHaveLength(2)

    api.changePassword.mockRejectedValueOnce(new ApiError(400, 'Current password is wrong', { status: 400 }))
    inputs()[0].value = 'gresita'; inputs()[0].dispatchEvent(new Event('input'))
    inputs()[1].value = 'parola-noua'; inputs()[1].dispatchEvent(new Event('input'))
    $('[data-test=password-form]')!.dispatchEvent(new Event('submit'))
    await flushPromises()
    expect($('[data-test=password-form] [role=alert]')?.textContent).toContain('Parola actuală nu e corectă.')

    api.changePassword.mockResolvedValueOnce({ recoveryCode: 'P4HW-8RTX-2MNB' })
    api.me.mockResolvedValueOnce(user({ hasRecoveryCode: true }))
    await type('[data-test=password-form] input', 'parola-veche')
    $('[data-test=password-form]')!.dispatchEvent(new Event('submit'))
    await flushPromises()
    expect($('[data-test=secret-code]')?.textContent).toBe('P4HW-8RTX-2MNB')
    expect(api.changePassword).toHaveBeenLastCalledWith({ currentPassword: 'parola-veche', newPassword: 'parola-noua' })
  })

  it('"Cod de recuperare nou": password → the new code', async () => {
    const v = render(user())
    await v.find('[data-test=security-code]').trigger('click')
    await flushPromises()
    api.newRecoveryCode.mockResolvedValueOnce({ recoveryCode: 'H3KD-9QWP-7XTB' })
    api.me.mockResolvedValueOnce(user())
    await type('[data-test=recovery-form] input', 'parola-mea')
    $('[data-test=recovery-form]')!.dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(api.newRecoveryCode).toHaveBeenCalledWith('parola-mea')
    expect($('[data-test=secret-code]')?.textContent).toBe('H3KD-9QWP-7XTB')
  })
})
