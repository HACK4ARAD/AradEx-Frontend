import { afterEach, describe, expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import { routeTitle } from '@/router/guard'
import { activityLine } from './useBusiness'

const t = (key: string, values?: Record<string, unknown>) => i18n.global.t(key, values ?? {})

describe('panel texts in the current language', () => {
  afterEach(() => { i18n.global.locale.value = 'ro' })

  it('rebuilds the API activity lines (sent in Romanian) in English', () => {
    i18n.global.locale.value = 'en'
    expect(activityLine({ type: 'CODE_USED', text: 'Cod folosit: 20% reducere la orice cafea', at: '' }, t)).toBe('Code used: 20% reducere la orice cafea')
    expect(activityLine({ type: 'CODE_USED', text: 'Cod folosit (plătit cu 30 de puncte): Cappuccino', at: '' }, t)).toBe('Code used (paid with 30 points): Cappuccino')
    expect(activityLine({ type: 'POINTS_PAYMENT', text: 'Plată cu 40 de puncte: Cappuccino cu puncte', at: '' }, t)).toBe('Paid with 40 points: Cappuccino cu puncte')
    expect(activityLine({ type: 'OFFER_REDEEMED', text: 'Ofertă revendicată: Prăjitura zilei', at: '' }, t)).toBe('Offer claimed: Prăjitura zilei')
  })

  it('keeps the Romanian lines identical in Romanian and leaves unknown text alone', () => {
    expect(activityLine({ type: 'CODE_USED', text: 'Cod folosit: Cafea', at: '' }, t)).toBe('Cod folosit: Cafea')
    expect(activityLine({ type: 'TICKET', text: 'ceva fără titlu', at: '' }, t)).toBe('ceva fără titlu')
  })

  it('translates page titles by route name, with meta.title as the fallback', () => {
    expect(routeTitle({ name: 'w-business-codes', meta: { title: 'Validează coduri' } })).toBe('Validează coduri')
    i18n.global.locale.value = 'en'
    expect(routeTitle({ name: 'w-business-codes', meta: { title: 'Validează coduri' } })).toBe('Validate codes')
    expect(routeTitle({ name: 'w-city-leaderboard', meta: { title: 'Clasament' } })).toBe('Leaderboard')
    expect(routeTitle({ name: 'unknown-route', meta: { title: 'Ceva' } })).toBe('Ceva')
  })
})

describe('mobile route titles', () => {
  afterEach(() => { i18n.global.locale.value = 'ro' })
  it('come from home.routes (mobile-only texts)', () => {
    i18n.global.locale.value = 'en'
    expect(routeTitle({ name: 'm-tickets', meta: { title: 'Biletele mele' } })).toBe('My tickets')
  })
})
