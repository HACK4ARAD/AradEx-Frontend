import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { i18n } from '@/shared/i18n'
import ValidateActionCard from './ValidateActionCard.vue'
import type { ActionDto } from '@/shared/types/community'

const day = 864e5
const action = (over: Partial<ActionDto> = {}): ActionDto => ({
  id: 2, title: 'Curățenie în Pădurea Ceala', category: 'ENVIRONMENT', startAt: new Date(Date.now() + 2 * day).toISOString(),
  endAt: new Date(Date.now() + 2 * day + 3 * 36e5).toISOString(), locationName: 'Pădurea Ceala, parcarea de la intrare',
  lat: 46.15, lng: 21.27, pointsReward: 40, capacity: 60, registeredCount: 14, confirmedCount: 0, description: '', status: 'PUBLISHED', ...over,
})
const opts = { global: { plugins: [i18n], stubs: { RouterLink: RouterLinkStub } } }

describe('ValidateActionCard', () => {
  it('shows category without emoji, place, occupancy, points and how many are left to confirm', () => {
    const w = mount(ValidateActionCard, { props: { action: action(), to: { path: '/city/validate', query: { a: 2 } } }, ...opts })
    const text = w.text()
    expect(text).toContain('Mediu')
    expect(text).not.toContain('🌳')
    expect(text).toContain('Urmează')
    expect(text).toContain('Pădurea Ceala, parcarea de la intrare')
    expect(text).toContain('14 / 60 înscriși')
    expect(text).toContain('+40 p')
    expect(text).toContain('14 de validat')
    expect(w.findComponent(RouterLinkStub).props('to')).toEqual({ path: '/city/validate', query: { a: 2 } })
  })

  it('marks finished actions and fully confirmed ones', () => {
    const past = action({ startAt: new Date(Date.now() - 3 * day).toISOString(), endAt: new Date(Date.now() - 3 * day + 36e5).toISOString(), confirmedCount: 14 })
    const w = mount(ValidateActionCard, { props: { action: past, to: '/city/validate?a=2' }, ...opts })
    expect(w.text()).toContain('Încheiată')
    expect(w.text()).toContain('Toți validați')
  })
})
