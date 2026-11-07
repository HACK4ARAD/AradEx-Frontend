import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import EventCard from './EventCard.vue'
import type { EventSummary } from '@/shared/types/events'

const base: EventSummary = {
  id: 22, title: 'Teatru de păpuși', category: 'FAMILY', startAt: '2099-11-07T09:00:00Z', endAt: '2099-11-07T09:50:00Z',
  locationName: 'Teatrul Clasic', lat: 46.17, lng: 21.31, ticketType: 'IN_APP', priceFrom: 25, isHot: true, isDemo: true,
  participantsCount: 86, organizerName: 'Teatrul Clasic', organizerType: 'EXTERNAL', distanceKm: 0.4, saved: false, ratingCount: 0,
}
const mountCard = (e: EventSummary) => mount(EventCard, { props: { event: e, to: '/m/events/22' }, global: { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } } })

describe('EventCard', () => {
  it('shows the Popular badge, distance and price', () => {
    const text = mountCard(base).text()
    expect(text).toContain('Popular · 86 participă')
    expect(text).toContain('0,4 km')
    expect(text).toContain('de la 25 lei')
    expect(text).toContain('Bilete în aplicație')
  })
  it('free event without capacity: no price, “Gratuit · fără bilet”', () => {
    const text = mountCard({ ...base, isHot: false, ticketType: 'FREE', priceFrom: undefined }).text()
    expect(text).not.toContain('Popular')
    expect(text).toContain('Gratuit · fără bilet')
    expect(text).not.toContain('lei')
  })
  it('bookmark emits toggleSave', async () => {
    const w = mountCard(base)
    await w.find('button[aria-pressed]').trigger('click')
    expect(w.emitted('toggleSave')).toHaveLength(1)
  })
})
