import { describe, expect, it } from 'vitest'
import { emptyOfferForm, fromOffer, normalizeCode, offerBadge, toOfferCreate, validateOfferForm } from './useOfferForm'
import { filterToQuery } from './useOffers'
import type { OfferDto } from '@/shared/types/offers'

describe('useOfferForm', () => {
  const base = () => ({ ...emptyOfferForm('2026-11-07'), title: 'Ceai de iarnă -10%', description: 'Ceaiuri de casă.', discountLabel: '-10%' })

  it('minimal valid offer → published, category from business, permanent', () => {
    expect(validateOfferForm(base())).toEqual({})
    const req = toOfferCreate(base())
    expect(req).toEqual({ title: 'Ceai de iarnă -10%', description: 'Ceaiuri de casă.', discountLabel: '-10%', localProduct: false, status: 'PUBLISHED', validFrom: '2026-11-07' })
  })

  it('paused → DRAFT; points from a number input; until before from is rejected', () => {
    const req = toOfferCreate({ ...base(), paused: true, pointsPrice: 40 as unknown as string, category: 'CAFE', validUntil: '2026-11-30' })
    expect(req).toMatchObject({ status: 'DRAFT', pointsPrice: 40 as unknown as string, category: 'CAFE', validUntil: '2026-11-30' })
    const e = validateOfferForm({ ...base(), title: ' ', validUntil: '2026-11-01', pointsPrice: '0' })
    expect(Object.keys(e).sort()).toEqual(['pointsPrice', 'title', 'validUntil'])
  })

  it('round-trips an existing offer for editing', () => {
    const o = { id: 1, businessId: 1, businessName: 'Cafeneaua din Pasaj', title: 'Cafea -20%', discountLabel: '-20%', localProduct: false,
      validUntil: '2026-11-30', pointsPrice: 30, category: 'CAFE', description: 'D', validFrom: '2026-11-01', status: 'DRAFT',
      viewsCount: 1, redemptionsCount: 0, usedCount: 0 } satisfies OfferDto
    const f = fromOffer(o)
    expect(f).toMatchObject({ paused: true, pointsPrice: '30', validUntil: '2026-11-30' })
    expect(toOfferCreate(f)).toMatchObject({ status: 'DRAFT', pointsPrice: 30, category: 'CAFE' })
  })

  it('normalizes hand-typed codes and picks the card badge', () => {
    expect(normalizeCode(' ax-o1 -k8d2qf ')).toBe('AX-O1-K8D2QF')
    expect(offerBadge({ category: 'EVENT', discountLabel: 'Eveniment' }).kind).toBe('event')
    expect(offerBadge({ category: 'CAFE', discountLabel: '40 p', pointsPrice: 40 }).kind).toBe('points')
    expect(offerBadge({ category: 'CAFE', discountLabel: '-20%', pointsPrice: 30 }).kind).toBe('offer')
  })

  it('maps the category circles to API filters', () => {
    expect(filterToQuery('POINTS')).toMatchObject({ points: true })
    expect(filterToQuery('LOCAL')).toMatchObject({ localProduct: true })
    expect(filterToQuery('CAFE')).toMatchObject({ category: 'CAFE' })
    expect(filterToQuery('ALL').category).toBeUndefined()
  })
})

describe('knownErrorKey', () => {
  it('maps known 409 details to Romanian keys and leaves others alone', async () => {
    const { knownErrorKey } = await import('./useOffers')
    expect(knownErrorKey(new Error('Code already used'))).toBe('offers.codes.errUsed')
    expect(knownErrorKey(new Error('This code belongs to another business'))).toBe('offers.codes.errOther')
    expect(knownErrorKey(new Error('Something else'))).toBeNull()
  })
})
