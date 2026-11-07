import { describe, expect, it } from 'vitest'
import { bucharestIso, emptyEventForm, fromEvent, splitBucharest, toEventCreate, validateEventForm } from './useEventForm'
import type { EventDto } from '@/shared/types/events'

describe('useEventForm', () => {
  const base = () => ({ ...emptyEventForm('2026-11-29'), title: 'Atelier latte art', description: 'Cafea inclusă.' })

  it('builds ISO times in Arad time, winter and summer', () => {
    expect(bucharestIso('2026-11-29', '16:00')).toBe('2026-11-29T16:00:00+02:00')
    expect(bucharestIso('2026-07-01', '09:30')).toBe('2026-07-01T09:30:00+03:00')
    expect(splitBucharest('2026-11-29T14:00:00Z')).toEqual({ date: '2026-11-29', time: '16:00' })
  })

  it('valid free event → request without prices', () => {
    const f = { ...base(), priceAdult: '40' }
    expect(validateEventForm(f)).toEqual({})
    const req = toEventCreate(f)
    expect(req).toMatchObject({ title: 'Atelier latte art', ticketType: 'FREE', startAt: '2026-11-29T19:00:00+02:00' })
    expect(req.priceAdult).toBeUndefined()
    expect(req.endAt).toBeUndefined()
    expect(req.lat).toBeUndefined()
  })

  it('in-app tickets need an adult price; numbers accept commas', () => {
    expect(validateEventForm({ ...base(), ticketType: 'IN_APP' }).priceAdult).toBe('business.form.priceRequired')
    const req = toEventCreate({ ...base(), ticketType: 'IN_APP', priceAdult: '40', priceChild: '25,5', capacity: '10', end: '21:00' })
    expect(req).toMatchObject({ priceAdult: 40, priceChild: 25.5, capacity: 10, endAt: '2026-11-29T21:00:00+02:00' })
  })

  it('accepts numbers from <input type="number"> (v-model gives a number)', () => {
    const f = { ...base(), ticketType: 'IN_APP' as const, priceAdult: 40 as unknown as string, capacity: 30 as unknown as string }
    expect(validateEventForm(f)).toEqual({})
    expect(toEventCreate(f)).toMatchObject({ priceAdult: 40, capacity: 30 })
  })

  it('rejects end before start, bad capacity, missing title and external without link', () => {
    const e = validateEventForm({ ...base(), title: ' ', end: '18:00', capacity: '0', ticketType: 'EXTERNAL', externalUrl: 'site.ro' })
    expect(Object.keys(e).sort()).toEqual(['capacity', 'end', 'externalUrl', 'title'])
  })

  it('round-trips an existing event for editing', () => {
    const ev = {
      id: 31, title: 'Atelier', description: 'D', category: 'FOOD', startAt: '2026-11-29T14:00:00Z', endAt: '2026-11-29T15:30:00Z',
      locationName: 'Cafeneaua din Pasaj', lat: 46.17, lng: 21.31, ticketType: 'IN_APP', priceFrom: 40, priceAdult: 40, isHot: false,
      isDemo: false, participantsCount: 0, organizerName: 'Cafeneaua din Pasaj', organizerType: 'BUSINESS', ratingCount: 0,
      address: 'Str. Vasile Alecsandri 1, Arad', capacity: 10, savesCount: 0, status: 'PUBLISHED',
    } satisfies EventDto
    const f = fromEvent(ev)
    expect(f).toMatchObject({ date: '2026-11-29', start: '16:00', end: '17:30', priceAdult: '40', capacity: '10' })
    expect(toEventCreate(f).startAt).toBe('2026-11-29T16:00:00+02:00')
  })
})
