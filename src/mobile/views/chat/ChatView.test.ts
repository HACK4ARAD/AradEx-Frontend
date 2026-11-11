import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/shared/i18n'
import ChatView from './ChatView.vue'
import PlanView from '../plan/PlanView.vue'

const chat = vi.fn()
const itinerary = vi.fn()
vi.mock('@/shared/api/auth', () => ({ authApi: { config: () => Promise.resolve({ demoOnly: true }), updateMe: vi.fn() } }))
vi.mock('@/shared/api/ai', () => ({ aiApi: { chat: (b: unknown) => chat(b), itinerary: (b: unknown) => itinerary(b) } }))

async function render(component: typeof ChatView) {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'ro'
  const router = createRouter({ history: createMemoryHistory(), routes: ['/', '/profile', '/itineraries', '/chat', '/plan'].map((path) => ({ path, component: { render: () => null } })) })
  await router.push('/')
  await router.isReady()
  const w = mount(component, { global: { plugins: [i18n, router] } })
  await flushPromises()
  return w
}

describe('AI screens in demo mode (demoOnly)', () => {
  beforeEach(() => { sessionStorage.clear(); chat.mockReset(); itinerary.mockReset() })

  it('chat: the history stays, the input is replaced by the notice and nothing can be sent', async () => {
    const w = await render(ChatView)
    expect(w.find('[data-test=demo-paused]').text()).toContain('Asistentul AI și planificatorul se deschid la lansare')
    expect(w.find('#chat-input').exists()).toBe(false)
    expect(w.text()).toContain(i18n.global.t('chat.greeting').slice(0, 20))     // salutul (istoricul) rămâne
    const starters = w.findAll('button').filter((b) => b.attributes('disabled') !== undefined)
    expect(starters.length).toBeGreaterThan(0)                                  // întrebările de început sunt dezactivate
    for (const b of starters) await b.trigger('click')
    expect(chat).not.toHaveBeenCalled()
  })

  it('planner: the notice shows and "Generează programul" is disabled', async () => {
    const w = await render(PlanView)
    expect(w.find('[data-test=demo-paused]').exists()).toBe(true)
    const go = w.find('[data-test=plan-generate]')
    expect(go.attributes('disabled')).toBeDefined()
    await go.trigger('click')
    expect(itinerary).not.toHaveBeenCalled()
  })
})
