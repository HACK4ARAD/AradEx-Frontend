import { describe, expect, it } from 'vitest'
import { googleCalendarUrl, isoDay, periodRange } from './useEvents'

// sâmbătă 7 nov. 2026, 10:00 în Arad
const SAT = new Date('2026-11-07T08:00:00Z')
const WED = new Date('2026-11-11T08:00:00Z')
const SUN = new Date('2026-11-08T08:00:00Z')

describe('periodRange', () => {
  it('today starts now (no from) and ends today', () => {
    expect(periodRange('today', SAT)).toEqual({ to: '2026-11-07' })
  })
  it('next 7 days', () => {
    expect(periodRange('week', SAT)).toEqual({ to: '2026-11-13' })
  })
  it('weekend: on Saturday it is today + Sunday, midweek it is the coming weekend, on Sunday only today', () => {
    expect(periodRange('weekend', SAT)).toEqual({ from: undefined, to: '2026-11-08' })
    expect(periodRange('weekend', WED)).toEqual({ from: '2026-11-14', to: '2026-11-15' })
    expect(periodRange('weekend', SUN)).toEqual({ to: '2026-11-08' })
  })
})

describe('helpers', () => {
  it('isoDay uses the Arad calendar day', () => {
    expect(isoDay(new Date('2026-11-07T23:30:00Z'))).toBe('2026-11-08')
  })
  it('google calendar link has UTC dates and the place', () => {
    const url = googleCalendarUrl({ title: 'Concert', startAt: '2026-11-07T19:00:00+02:00', locationName: 'Palatul Cultural', address: 'Piața George Enescu 1' })
    expect(url).toContain('dates=20261107T170000Z%2F20261107T190000Z')
    expect(new URL(url).searchParams.get('location')).toBe('Palatul Cultural, Piața George Enescu 1')
  })
})
