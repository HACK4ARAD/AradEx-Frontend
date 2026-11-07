import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import PlaceCard from './PlaceCard.vue'
import type { PlaceSummary } from '@/shared/types/places'

const place = (over: Partial<PlaceSummary> = {}): PlaceSummary => ({
  id: 8, name: 'Turnul de Apă', type: 'ATTRACTION', imageUrl: '/img/loc-ta.jpg', lat: 46.18, lng: 21.31, visitMinutes: 15,
  tags: ['istorie'], guidePointsCount: 2, guideMinutes: 3, exteriorOnly: true, ...over,
})
const opts = { global: { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } } }

describe('PlaceCard', () => {
  it('row: type, visit time, distance, guide badge and "doar exterior"', () => {
    const w = mount(PlaceCard, { props: { place: place({ distanceKm: 0.6 }), to: '/m/places/8' }, ...opts })
    const text = w.text()
    expect(text).toContain('Turnul de Apă')
    expect(text).toContain('Obiectiv turistic · 15 min · 0,6 km')
    expect(text).toContain('Ghid · 2 puncte')
    expect(text).toContain('doar exterior')
    expect(w.findComponent(RouterLinkStub).props('to')).toBe('/m/places/8')
  })


  it('hides the guide badge when a place has no guide points', () => {
    const w = mount(PlaceCard, { props: { place: place({ guidePointsCount: 0, guideMinutes: 0 }), to: '/m/places/8' }, ...opts })
    expect(w.text()).not.toContain('Ghid')
  })
})
