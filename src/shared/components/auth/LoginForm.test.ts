import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/shared/i18n'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import type { UserDto } from '@/shared/types/auth'
import LoginForm from './LoginForm.vue'

vi.mock('@/shared/api/auth', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), recoverPassword: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const Blank = { render: () => null }
const base = { locale: 'ro' as const, pointsBalance: 0, mustChangePassword: false, hasRecoveryCode: true }

async function render(audience: 'personal' | 'panels' = 'personal', contactEmail = '') {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'ro'
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: Blank }, { path: '/login', name: 'login', component: Blank }, { path: '/business', name: 'biz', component: Blank }],
  })
  await router.push('/login')
  await router.isReady()
  const w = mount(LoginForm, { props: { ui: 'w', audience, contactEmail }, global: { plugins: [i18n, router] }, attachTo: document.body })
  return { w, router }
}

describe('LoginForm', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })

  it('"Cont nou" creates a visitor account without business, shows the recovery code, then goes home', async () => {
    const user: UserDto = { id: 9, email: 'ana@exemplu.ro', displayName: 'Ana Pop', role: 'VISITOR', ...base }
    api.register.mockResolvedValue({ token: 'jwt', user, recoveryCode: 'K7QM-4XPT-9DWA' })
    const { w, router } = await render()

    await w.find('[data-test=to-register]').trigger('click')
    const inputs = w.findAll('form input')
    await inputs[0].setValue('Ana Pop')
    await inputs[1].setValue('ana@exemplu.ro')
    await inputs[2].setValue('parola123')
    await w.find('[data-test=role-VISITOR]').trigger('click')
    await w.find('form').trigger('submit')
    expect(w.find('[role=alert]').text()).toContain('Bifează')       // fără bifă nu se creează contul
    expect(api.register).not.toHaveBeenCalled()

    await w.find('[data-test=terms-consent] input').setValue(true)
    await w.find('form').trigger('submit')
    await flushPromises()

    expect(api.register).toHaveBeenCalledWith({ email: 'ana@exemplu.ro', password: 'parola123', displayName: 'Ana Pop', role: 'VISITOR', acceptTerms: true })
    expect(api.register.mock.calls[0][0]).not.toHaveProperty('business')
    expect(useAuthStore().token).toBe('jwt')
    // codul de recuperare se arată înainte de redirect
    expect(w.find('[data-test=secret-code]').text()).toBe('K7QM-4XPT-9DWA')
    expect(router.currentRoute.value.path).toBe('/login')
    await w.find('[data-test=recovery-saved] input').setValue(true)
    await w.find('[data-test=recovery-continue]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    w.unmount()
  })

  it('the panels form has no "Cont nou" but has "Am uitat parola"', async () => {
    const { w } = await render('panels')
    expect(w.find('[data-test=to-register]').exists()).toBe(false)
    expect(w.find('[data-test=to-forgot]').exists()).toBe(true)
    w.unmount()
  })

  it('"Am uitat parola": email + recovery code + new password signs in and shows the NEW code first', async () => {
    api.recoverPassword.mockResolvedValue({
      token: 'jwt', user: { id: 3, email: 'firma@exemplu.ro', displayName: 'Ceainăria', role: 'BUSINESS', ...base }, recoveryCode: 'P4HW-8RTX-2MNB',
    })
    const { w, router } = await render('personal', 'contact@aradexperience.site')

    await w.find('input[type=email]').setValue('firma@exemplu.ro')
    await w.find('[data-test=to-forgot]').trigger('click')
    expect((w.find('[data-test=recover-form] input[type=email]').element as HTMLInputElement).value).toBe('firma@exemplu.ro')
    expect(w.find('[data-test=recover-lost]').text()).toContain('Ai pierdut și codul?')
    expect(w.find('[data-test=recover-lost] a').attributes('href')).toBe('mailto:contact@aradexperience.site')

    await w.find('[data-test=recover-code]').setValue('k7qm 4xpt 9dwa')
    await w.find('[data-test=recover-form] input[type=password]').setValue('parola-noua')
    await w.find('[data-test=recover-form]').trigger('submit')
    await flushPromises()

    expect(api.recoverPassword).toHaveBeenCalledWith({ email: 'firma@exemplu.ro', recoveryCode: 'K7QM-4XPT-9DWA', password: 'parola-noua' })
    expect(useAuthStore().user?.role).toBe('BUSINESS')
    expect(w.find('[data-test=secret-code]').text()).toBe('P4HW-8RTX-2MNB')
    expect(router.currentRoute.value.path).toBe('/login')

    await w.find('[data-test=recovery-saved] input').setValue(true)
    await w.find('[data-test=recovery-continue]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/business')
    w.unmount()
  })

  it('without a contact address the "lost code" note has no link', async () => {
    const { w } = await render()
    await w.find('[data-test=to-forgot]').trigger('click')
    expect(w.find('[data-test=recover-lost]').exists()).toBe(true)
    expect(w.find('[data-test=recover-lost] a').exists()).toBe(false)
    w.unmount()
  })
})
