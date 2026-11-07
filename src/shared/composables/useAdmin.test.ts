import { describe, expect, it } from 'vitest'
import {
  adminErrorKey, canChangeRole, emptyPartnerForm, nextStatus, parsePointsAdjust, partnerFilter, toPartnerCreate, totalUsers,
  validatePartnerForm,
} from './useAdmin'
import type { CityBusinessDto } from '@/shared/types/admin'

const biz = (id: number, verified: boolean, rejectedAt?: string): CityBusinessDto => ({
  id, name: `F${id}`, category: 'CAFE', verified, activeOffers: 0, draftOffers: 0, codesUsed: 0, createdAt: '2026-11-07T10:00:00Z', rejectedAt,
})

describe('partnerFilter', () => {
  const list = [biz(1, true), biz(2, false), biz(3, false, '2026-11-07T12:00:00Z')]
  it('splits to-verify, active and rejected firms', () => {
    expect(partnerFilter(list, 'all').map((b) => b.id)).toEqual([1, 2, 3])
    expect(partnerFilter(list, 'verify').map((b) => b.id)).toEqual([2])
    expect(partnerFilter(list, 'active').map((b) => b.id)).toEqual([1])
    expect(partnerFilter(list, 'rejected').map((b) => b.id)).toEqual([3])
  })
})

describe('partner form', () => {
  it('requires name, address, contact and a valid email', () => {
    expect(Object.keys(validatePartnerForm(emptyPartnerForm())).sort()).toEqual(['address', 'contactName', 'email', 'name'])
    const ok = { ...emptyPartnerForm(), name: ' Ceainăria ', address: 'Bd. Revoluției 10', contactName: 'Ioana', email: 'A@B.ro ' }
    expect(validatePartnerForm(ok)).toEqual({})
    expect(toPartnerCreate(ok)).toEqual({ name: 'Ceainăria', category: 'CAFE', address: 'Bd. Revoluției 10', contactName: 'Ioana', email: 'a@b.ro', phone: undefined })
  })
})

describe('nextStatus', () => {
  it('publishes or hides events and offers', () => {
    expect(nextStatus('events', 'PUBLISHED')).toBe('HIDDEN')
    expect(nextStatus('offers', 'DRAFT')).toBe('PUBLISHED')
    expect(nextStatus('events', 'HIDDEN')).toBe('PUBLISHED')
  })
  it('actions have no HIDDEN: hiding returns them to draft; finished ones stay', () => {
    expect(nextStatus('actions', 'PUBLISHED')).toBe('DRAFT')
    expect(nextStatus('actions', 'DRAFT')).toBe('PUBLISHED')
    expect(nextStatus('actions', 'DONE')).toBeNull()
    expect(nextStatus('actions', 'CANCELLED')).toBeNull()
  })
})

describe('users', () => {
  it('role changes are not offered for firms, volunteers or yourself', () => {
    expect(canChangeRole({ id: 2, role: 'LOCAL' }, 5)).toBe(true)
    expect(canChangeRole({ id: 3, role: 'BUSINESS' }, 5)).toBe(false)
    expect(canChangeRole({ id: 9, role: 'VOLUNTEER' }, 5)).toBe(false)
    expect(canChangeRole({ id: 5, role: 'ADMIN' }, 5)).toBe(false)
  })
  it('parses a points adjustment', () => {
    expect(parsePointsAdjust('+25')).toBe(25)
    expect(parsePointsAdjust(' -10 ')).toBe(-10)
    expect(parsePointsAdjust(40)).toBe(40)
    expect(parsePointsAdjust('0')).toBeNull()
    expect(parsePointsAdjust('2.5')).toBeNull()
    expect(parsePointsAdjust('100001')).toBeNull()
  })
  it('sums users over roles and maps known API errors', () => {
    expect(totalUsers({ usersByRole: { VISITOR: 1, LOCAL: 19, BUSINESS: 6, CITY_HALL: 1, ADMIN: 1, VOLUNTEER: 0 } })).toBe(28)
    expect(adminErrorKey(new Error('Email already registered'))).toBe('admin.errors.emailTaken')
    expect(adminErrorKey(new Error('other'))).toBeNull()
  })
})
