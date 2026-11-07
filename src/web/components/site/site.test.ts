import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import DownloadButtons from './DownloadButtons.vue'
import SiteFeatures from './SiteFeatures.vue'
import CommunityView from '@/web/views/community/CommunityView.vue'

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
  it('shows the coming-soon state with the download buttons until the community API exists', () => {
    const w = mount(CommunityView, opts)
    expect(w.text()).toContain('Comunitate')
    expect(w.findComponent(DownloadButtons).exists()).toBe(true)
  })
})
