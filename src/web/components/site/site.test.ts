import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/shared/i18n'
import DownloadButtons from './DownloadButtons.vue'
import SiteFeatures from './SiteFeatures.vue'
import CommunityView from '@/web/views/community/CommunityView.vue'

// T11: W12 citește acțiunile și clasamentul din API (publice)
vi.mock('@/shared/api/community', () => ({
  communityApi: {
    actions: vi.fn(async () => [{ id: 1, title: 'Plantăm copaci pe Faleza Mureșului', category: 'ENVIRONMENT', startAt: '2026-11-08T10:00:00+02:00', endAt: '2026-11-08T13:00:00+02:00',
      locationName: 'Faleza Mureșului', lat: 46.17, lng: 21.32, pointsReward: 50, capacity: 40, registeredCount: 18, goingPreview: [] }]),
    leaderboard: vi.fn(async () => ({ period: 'month', entries: [{ rank: 1, userId: 6, displayName: 'Mihai R.', points: 190, actionsCount: 3 }] })),
  },
}))

const opts = { global: { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } } }

describe('SiteFeatures', () => {
  it('shows the six things the app does', () => {
    const w = mount(SiteFeatures, opts)
    expect(w.findAll('[data-feature]')).toHaveLength(6)
    expect(w.text()).toContain('Ghid virtual')
  })
})

describe('DownloadButtons', () => {
  it('links to the stores when the links exist', () => {
    const w = mount(DownloadButtons, { ...opts, props: { links: { android: 'https://play.example/app', ios: 'https://apps.example/app' } } })
    const hrefs = w.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['https://play.example/app', 'https://apps.example/app'])
  })

  it('says "coming soon" and links nowhere when a link is missing', () => {
    const w = mount(DownloadButtons, { ...opts, props: { links: { android: null, ios: null } } })
    expect(w.findAll('a')).toHaveLength(0)
    expect(w.findAll('[aria-disabled="true"]')).toHaveLength(2)
    expect(w.text()).toContain('În curând')
  })
})

describe('CommunityView (web, read-only)', () => {
  it('lists the upcoming actions and the month board, read-only, with the download buttons', async () => {
    setActivePinia(createPinia())
    const w = mount(CommunityView, { global: { ...opts.global, plugins: [i18n, createPinia()] } })
    await flushPromises()
    expect(w.text()).toContain('Comunitate')
    expect(w.text()).toContain('Plantăm copaci pe Faleza Mureșului')
    expect(w.text()).toContain('Mihai R.')
    expect(w.text()).not.toContain('Mă înscriu')
    expect(w.findComponent(DownloadButtons).exists()).toBe(true)
  })
})
