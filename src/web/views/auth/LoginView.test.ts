import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/shared/i18n'
import { ApiError } from '@/shared/api/client'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/auth'
import { loadAuthMode, useAuthMode } from '@/shared/composables/useAuthMode'
import type { Role } from '@/shared/types/common'
import LoginView from './LoginView.vue'

vi.mock('@/shared/api/auth', () => ({
  authApi: { config: vi.fn(), login: vi.fn(), register: vi.fn(), recoverPassword: vi.fn(), updateMe: vi.fn() },
}))

const api = vi.mocked(authApi)
const Blank = { render: () => null }
const user = (role: Role, email: string) => ({ id: 1, email, displayName: 'Demo Cont', role, locale: 'ro' as const, pointsBalance: 0, mustChangePassword: false, hasRecoveryCode: true })

async function render(query = '') {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'ro'
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/login', '/city', '/business', '/admin'].map((path) => ({ path, name: path, component: Blank })),
  })
  await router.push('/login' + query)
  await router.isReady()
  const w = mount(LoginView, { global: { plugins: [i18n, router] }, attachTo: document.body })
  await flushPromises()
  return { w, router }
}

describe('web login while AradExperience is not live (demoOnly)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    api.config.mockResolvedValue({ demoOnly: true })
  })

  it('shows the notice and the demo buttons; hides "Cont nou", "Am uitat parola" and business sign-up', async () => {
    const { w } = await render()
    expect(w.find('[data-test=demo-only-notice]').text()).toContain('AradExperience nu e încă live')
    expect(w.find('[data-test=visitor]').exists()).toBe(true)
    expect(w.find('[data-test=demo-LOCAL]').exists()).toBe(true)
    expect(w.find('[data-test=to-register]').exists()).toBe(false)
    expect(w.find('[data-test=to-forgot]').exists()).toBe(false)
    expect(w.find('input[type=email]').exists()).toBe(true)          // formularul rămâne, pentru datele demo tastate

    const { w: panels } = await render('?tab=panels')
    for (const r of ['CITY_HALL', 'BUSINESS', 'ADMIN']) expect(panels.find(`[data-test=demo-${r}]`).exists()).toBe(true)
    expect(panels.text()).not.toContain('Înregistrează-ți firma')
    expect(panels.find('[data-test=to-forgot]').exists()).toBe(false)
    w.unmount(); panels.unmount()
  })

  it('a demo button signs in with its email and the demo password, then goes to the role landing', async () => {
    api.login.mockResolvedValue({ token: 'jwt', user: user('CITY_HALL', 'primaria@demo.ro') })
    const { w, router } = await render('?tab=panels')
    await w.find('[data-test=demo-CITY_HALL]').trigger('click')
    await flushPromises()
    expect(api.login).toHaveBeenCalledWith('primaria@demo.ro', 'demo1234')
    expect(useAuthStore().token).toBe('jwt')
    expect(router.currentRoute.value.path).toBe('/city')
    w.unmount()
  })

  it('the Localnic button in the personal tab signs in as local@demo.ro', async () => {
    api.login.mockResolvedValue({ token: 'jwt', user: user('LOCAL', 'local@demo.ro') })
    const { w } = await render()
    await w.find('[data-test=demo-LOCAL]').trigger('click')
    await flushPromises()
    expect(api.login).toHaveBeenCalledWith('local@demo.ro', 'demo1234')
    w.unmount()
  })

  it('a 403 "Not live yet" on login shows the notice text instead of a generic error', async () => {
    const detail = 'Not live yet: only the demo accounts can sign in'
    api.login.mockRejectedValue(new ApiError(403, detail, { status: 403, detail }))
    const { w } = await render()
    await w.find('input[type=email]').setValue('ana@exemplu.ro')
    await w.find('input[type=password]').setValue('parola123')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('form [role=alert]').text()).toContain('Până la lansare poți încerca aplicația doar cu conturile demo')
    w.unmount()
  })
})

describe('web login when live (demoOnly false)', () => {
  it('keeps "Cont nou" and "Am uitat parola" and shows no notice', async () => {
    vi.clearAllMocks()
    await loadAuthMode()                       // o singură cerere pe pornire: aici schimbăm direct starea comună
    useAuthMode().demoOnly.value = false
    const { w } = await render()
    expect(w.find('[data-test=demo-only-notice]').exists()).toBe(false)
    expect(w.find('[data-test=to-register]').exists()).toBe(true)
    expect(w.find('[data-test=to-forgot]').exists()).toBe(true)
    w.unmount()
  })
})
