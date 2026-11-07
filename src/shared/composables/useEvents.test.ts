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

describe('liveUntil', () => {
  it('multi-day exhibition is live only during the daily hours', async () => {
    const { useEventFormat } = await import('./useEvents')
    const { createApp } = await import('vue')
    const { i18n } = await import('@/shared/i18n')
    let fmt!: ReturnType<typeof useEventFormat>
    createApp({ setup() { fmt = useEventFormat(); return () => null } }).use(i18n).mount(document.createElement('div'))
    const ex = { startAt: '2026-11-06T07:00:00Z', endAt: '2026-11-30T15:00:00Z' } // 09:00–17:00 în Arad, 6–30 nov.
    expect(fmt.liveUntil(ex, Date.parse('2026-11-07T10:00:00Z'))).toBe('17:00')
    expect(fmt.liveUntil(ex, Date.parse('2026-11-07T17:00:00Z'))).toBeNull()
    expect(fmt.liveUntil({ startAt: '2026-11-07T15:00:00Z', endAt: '2026-11-07T16:00:00Z' }, Date.parse('2026-11-07T15:30:00Z'))).toBe('18:00')
  })
})
