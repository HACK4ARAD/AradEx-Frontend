import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import VolActionCard from './VolActionCard.vue'
import type { VolunteerActionDto } from '@/shared/types/volunteer'

const action = (over: Partial<VolunteerActionDto> = {}): VolunteerActionDto => ({
  id: 1, title: 'Plantăm copaci pe Faleza Mureșului', category: 'ENVIRONMENT', startAt: '2026-11-07T08:00:00Z', endAt: '2026-11-07T11:00:00Z',
  locationName: 'Faleza Mureșului', lat: 46.17, lng: 21.31, pointsReward: 50, registered: 5, confirmed: 3, confirmedByMe: 2,
  state: 'OPEN', opensAt: '2026-11-07T07:30:00Z', ...over,
})
const opts = { global: { plugins: [i18n] } }

describe('VolActionCard', () => {
  it('open: progress, my scans, scan button emits the action', async () => {
    const w = mount(VolActionCard, { props: { action: action() }, ...opts })
    expect(w.text()).toContain('3/5 confirmați')
    expect(w.text()).toContain('2 de tine')
    expect(w.find('[data-test="vol-locked"]').exists()).toBe(false)
    await w.find('[data-test="vol-scan-here"]').trigger('click')
    expect(w.emitted('scan')?.[0]).toEqual([1])
  })

  it('locked: lock over the card with the opening time, scanning disabled', () => {
    const w = mount(VolActionCard, { props: { action: action({ state: 'LOCKED', startAt: '2026-11-08T07:00:00Z', opensAt: '2026-11-08T06:30:00Z' }), now: Date.parse('2026-11-07T10:00:00Z') }, ...opts })
    expect(w.find('[data-test="vol-locked"]').text()).toContain('Se deschide dum., 8 nov.')
    expect(w.find('[data-test="vol-locked"]').text()).toContain('08:30')
    expect(w.find('[data-test="vol-locked"]').text()).toContain('peste o zi')
    expect(w.find('[data-test="vol-scan-here"]').attributes('disabled')).toBeDefined()
  })

  it('green check when everyone is confirmed', () => {
    const w = mount(VolActionCard, { props: { action: action({ confirmed: 5 }), firstName: 'Andrei' }, ...opts })
    expect(w.find('[data-test="vol-done"]').text()).toContain('Gata! Toți au fost confirmați')
    expect(w.find('[data-test="vol-done"]').text()).toContain('mulțumim, Andrei')
  })
})
