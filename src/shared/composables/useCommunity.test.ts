import { describe, expect, it } from 'vitest'
import {
  emptyActionForm, isActiveRegistration, isEnded, levelFor, normalizeCode, CODE_RE, spotsLeft, toActionCreate, validateActionForm,
} from './useCommunity'

describe('levelFor', () => {
  it('uses the design thresholds and the progress to the next level', () => {
    expect(levelFor(0)).toMatchObject({ key: 'newcomer', toNext: 150, progress: 0 })
    expect(levelFor(270)).toMatchObject({ key: 'volunteer', toNext: 230, progress: 34 })
    expect(levelFor(500).key).toBe('ambassador')
    expect(levelFor(1200)).toMatchObject({ key: 'legend', toNext: 0, progress: 100 })
  })
})

describe('codes', () => {
  it('normalizes typed codes and validates the AX format', () => {
    expect(normalizeCode(' ax-c1-k4n7pa ')).toBe('AX-C1-K4N7PA')
    expect(CODE_RE.test('AX-C1-K4N7PA')).toBe(true)
    expect(CODE_RE.test('AX-C1-K4N0PA')).toBe(false)   // fără 0/O/1/I
  })
})

describe('action helpers', () => {
  it('spots, ended and active registration', () => {
    expect(spotsLeft({ capacity: 40, registeredCount: 18 })).toBe(22)
    expect(spotsLeft({ capacity: 10, registeredCount: 12 })).toBe(0)
    expect(isEnded({ endAt: '2026-11-07T13:00:00+02:00' }, Date.parse('2026-11-07T12:00:00+02:00'))).toBe(false)
    expect(isEnded({ endAt: '2026-11-07T13:00:00+02:00' }, Date.parse('2026-11-07T13:30:00+02:00'))).toBe(true)
    expect(isActiveRegistration(undefined)).toBe(false)
  })
})

describe('action form', () => {
  it('requires the main fields and an end after the start', () => {
    const f = { ...emptyActionForm('2026-11-21'), end: '08:00', pointsReward: 5, capacity: 0 }
    expect(validateActionForm(f)).toEqual({
      title: 'community.form.required', description: 'community.form.required', locationName: 'community.form.required',
      end: 'community.form.endAfterStart', pointsReward: 'community.form.pointsRange', capacity: 'community.form.capacityRange',
    })
  })

  it('does not let capacity drop below the people already registered', () => {
    const f = { ...emptyActionForm('2026-11-21'), title: 'T', description: 'D', locationName: 'L', capacity: 10 }
    expect(validateActionForm(f, 18).capacity).toBe('community.form.capacityBelowRegistered')
  })

  it('builds the request in Arad time with the image credit', () => {
    const f = { ...emptyActionForm('2026-11-21'), title: ' Plantăm ', description: 'D', locationName: 'Parc', imageUrl: '/img/actiune-curatenie.jpg' }
    const req = toActionCreate(f, 'DRAFT')
    expect(req.startAt).toBe('2026-11-21T09:00:00+02:00')
    expect(req.endAt).toBe('2026-11-21T12:00:00+02:00')
    expect(req.title).toBe('Plantăm')
    expect(req.organizer).toBeUndefined()
    expect(req.imageCredit).toContain('David Lally')
    expect(req.status).toBe('DRAFT')
  })
})
