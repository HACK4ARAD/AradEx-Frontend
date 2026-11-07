import { describe, expect, it } from 'vitest'
import { calendarPlan, calendarSlot, slotHours } from './useCalendarSlot'

// expoziția Complexului Muzeal din seed: 3 nov – 20 dec 2026, zilnic 09:00–17:00 (ora Aradului = UTC+2 iarna)
const exhibition = { startAt: '2026-11-03T07:00:00Z', endAt: '2026-12-20T15:00:00Z' }
const morning = new Date('2026-11-07T08:30:00Z') // 10:30 la Arad

describe('calendarPlan', () => {
  it('single-day events go straight to the calendar', () => {
    expect(calendarPlan({ startAt: '2026-11-07T17:00:00Z', endAt: '2026-11-07T19:00:00Z' }, morning)).toBeNull()
    expect(calendarPlan({ startAt: '2026-11-07T17:00:00Z' }, morning)).toBeNull()
  })

  it('multi-day events get the daily schedule, starting today when they already started', () => {
    expect(calendarPlan(exhibition, morning)).toEqual({ firstDay: '2026-11-07', lastDay: '2026-12-20', open: '09:00', close: '17:00' })
    expect(calendarPlan(exhibition, new Date('2026-10-01T10:00:00Z'))?.firstDay).toBe('2026-11-03')
  })

  it('an ended event has nothing to pick; an overnight schedule falls back to daytime hours', () => {
    expect(calendarPlan(exhibition, new Date('2026-12-21T10:00:00Z'))).toBeNull()
    const overnight = { startAt: '2026-11-20T16:00:00Z', endAt: '2026-11-22T00:00:00Z' } // 18:00 → 02:00
    expect(calendarPlan(overnight, morning)).toMatchObject({ open: '08:00', close: '22:00' })
  })
})

describe('slotHours / calendarSlot', () => {
  const plan = calendarPlan(exhibition, morning)!

  it('offers every hour of the schedule, and only the coming ones today', () => {
    expect(slotHours(plan, '2026-11-10', morning)).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'])
    expect(slotHours(plan, '2026-11-07', morning)).toEqual(['11:00', '12:00', '13:00', '14:00', '15:00', '16:00'])
  })

  it('puts a 2-hour visit in the calendar, cut at closing time', () => {
    expect(calendarSlot(plan, '2026-11-10', '10:00')).toEqual({ startAt: '2026-11-10T10:00:00+02:00', endAt: '2026-11-10T12:00:00+02:00' })
    expect(calendarSlot(plan, '2026-11-10', '16:00')).toEqual({ startAt: '2026-11-10T16:00:00+02:00', endAt: '2026-11-10T17:00:00+02:00' })
  })
})
