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
  authApi: { login: vi.fn(), register: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const Blank = { render: () => null }

async function render(audience: 'personal' | 'panels' = 'personal') {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'ro'
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: Blank }, { path: '/login', name: 'login', component: Blank }, { path: '/business', name: 'biz', component: Blank }],
  })
  await router.push('/login')
  await router.isReady()
  const w = mount(LoginForm, { props: { ui: 'w', audience }, global: { plugins: [i18n, router] }, attachTo: document.body })
  return { w, router }
}

describe('LoginForm', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks() })

  it('"Cont nou" creates a visitor account without business, signs in and goes home', async () => {
    const user: UserDto = { id: 9, email: 'ana@exemplu.ro', displayName: 'Ana Pop', role: 'VISITOR', locale: 'ro', pointsBalance: 0 }
    api.register.mockResolvedValue({ token: 'jwt', user })
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
    expect(router.currentRoute.value.path).toBe('/')
    w.unmount()
  })

  it('the panels form has no "Cont nou" but has "Am uitat parola"', async () => {
    const { w } = await render('panels')
    expect(w.find('[data-test=to-register]').exists()).toBe(false)
    expect(w.find('[data-test=to-forgot]').exists()).toBe(true)
    w.unmount()
  })

  it('"Am uitat parola": email → neutral message → code + new password signs in', async () => {
    api.forgotPassword.mockResolvedValue(undefined)
    api.resetPassword.mockResolvedValue({ token: 'jwt', user: { id: 3, email: 'firma@demo.ro', displayName: 'Ceainăria', role: 'BUSINESS', locale: 'ro', pointsBalance: 0 } })
    const { w, router } = await render()

    await w.find('input[type=email]').setValue('firma@demo.ro')
    await w.find('[data-test=to-forgot]').trigger('click')
    expect((w.find('[data-test=forgot-email] input').element as HTMLInputElement).value).toBe('firma@demo.ro')
    await w.find('[data-test=forgot-email]').trigger('submit')
    await flushPromises()
    expect(api.forgotPassword).toHaveBeenCalledWith('firma@demo.ro')
    expect(w.find('[data-test=forgot-sent]').text()).toContain('Dacă există un cont cu această adresă')

    const code = w.find('input[autocomplete=one-time-code]')
    expect(code.attributes('inputmode')).toBe('numeric')
    await code.setValue('123456')
    await w.find('[data-test=forgot-code] input[type=password]').setValue('parola-noua')
    await w.find('[data-test=forgot-code]').trigger('submit')
    await flushPromises()

    expect(api.resetPassword).toHaveBeenCalledWith({ email: 'firma@demo.ro', code: '123456', password: 'parola-noua' })
    expect(useAuthStore().user?.role).toBe('BUSINESS')
    expect(router.currentRoute.value.path).toBe('/business')
    w.unmount()
  })
})
