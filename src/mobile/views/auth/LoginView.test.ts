import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/shared/i18n'
import { authApi } from '@/shared/api/auth'
import LoginView from './LoginView.vue'

vi.mock('@/shared/api/auth', () => ({
  authApi: { config: vi.fn(), login: vi.fn(), register: vi.fn(), recoverPassword: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const Blank = { render: () => null }

describe('app login while AradExperience is not live (demoOnly)', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); api.config.mockResolvedValue({ demoOnly: true }) })

  it('one-click demo buttons for every role; no "Cont nou" or "Am uitat parola"', async () => {
    setActivePinia(createPinia())
    i18n.global.locale.value = 'ro'
    const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/login', '/panel'].map((path) => ({ path, name: path, component: Blank })) })
    await router.push('/login')
    await router.isReady()
    const w = mount(LoginView, { global: { plugins: [i18n, router] } })
    await flushPromises()

    expect(w.find('[data-test=demo-only-notice]').exists()).toBe(true)
    for (const r of ['VISITOR', 'LOCAL', 'BUSINESS', 'CITY_HALL', 'ADMIN']) expect(w.find(`[data-test=demo-${r}]`).exists()).toBe(true)
    expect(w.find('[data-test=to-register]').exists()).toBe(false)
    expect(w.find('[data-test=to-forgot]').exists()).toBe(false)
    expect(w.find('[data-test=vol-login-link]').exists()).toBe(true)

    api.login.mockResolvedValue({ token: 'jwt', user: { id: 3, email: 'firma@demo.ro', displayName: 'Ceainăria', role: 'BUSINESS', locale: 'ro', pointsBalance: 0, mustChangePassword: false, hasRecoveryCode: true } })
    await w.find('[data-test=demo-BUSINESS]').trigger('click')
    await flushPromises()
    expect(api.login).toHaveBeenCalledWith('firma@demo.ro', 'demo1234')
    expect(router.currentRoute.value.path).toBe('/panel')
  })
})
