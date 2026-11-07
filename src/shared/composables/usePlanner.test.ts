import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/client'
import { useUiStore } from '@/shared/stores/ui'

const generate = vi.fn()
const save = vi.fn()
vi.mock('@/shared/api/ai', () => ({ aiApi: { itinerary: (b: unknown) => generate(b) } }))
vi.mock('@/shared/api/itineraries', () => ({ itinerariesApi: { save: (b: unknown) => save(b) } }))
vi.mock('vue-i18n', async (orig) => ({ ...(await orig<typeof import('vue-i18n')>()), useI18n: () => ({ t: (k: string) => k, locale: { value: 'en' } }) }))

import { buildRequest, nextDay, nextStartTime, startsTomorrow, usePlanner, type PlanForm } from './usePlanner'

const form = (over: Partial<PlanForm> = {}): PlanForm => ({ time: 'half', date: '2026-11-07', startTime: '10:00', transport: 'WALK', interests: ['history', 'food'], text: '', ...over })

beforeEach(() => {
  setActivePinia(createPinia()); generate.mockReset(); save.mockReset()
  // sâmbătă, 7 nov. 2026, 10:00 la Arad (după 21:00 formularul ar porni pe mâine)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-07T08:00:00Z'))
})
afterEach(() => { vi.useRealTimers() })

describe('buildRequest', () => {
  it('maps the four time options to hours / days', () => {
    expect(buildRequest(form({ time: '3h' }), 'ro')).toMatchObject({ hours: 3, days: 1 })
    expect(buildRequest(form({ time: 'half' }), 'ro')).toMatchObject({ hours: 4, days: 1 })
    expect(buildRequest(form({ time: 'day' }), 'ro')).toMatchObject({ hours: 8, days: 1 })
    const two = buildRequest(form({ time: '2d' }), 'ro')
    expect(two.days).toBe(2)
    expect(two.hours).toBeUndefined()
  })

  it('sends date, start time, transport, interests in a stable order, trimmed free text and the locale', () => {
    const r = buildRequest(form({ transport: 'CAR', interests: ['food', 'history'], text: '  Cetatea și o cafea  ' }), 'en')
    expect(r).toEqual({ date: '2026-11-07', startTime: '10:00', transport: 'CAR', interests: ['history', 'food'], freeText: 'Cetatea și o cafea', locale: 'en', hours: 4, days: 1 })
    expect(buildRequest(form({ text: '   ' }), 'fr')).not.toHaveProperty('freeText')
    expect(buildRequest(form(), 'fr').locale).toBe('ro')
  })
})

describe('day and start time helpers', () => {
  it('nextDay crosses months and years', () => {
    expect(nextDay('2026-11-07')).toBe('2026-11-08')
    expect(nextDay('2026-11-30')).toBe('2026-12-01')
    expect(nextDay('2026-12-31')).toBe('2027-01-01')
  })
  it('after 21:00 in Arad the form starts on tomorrow', () => {
    expect(startsTomorrow(new Date('2026-11-07T18:59:00Z'))).toBe(false) // 20:59 la Arad
    expect(startsTomorrow(new Date('2026-11-07T19:00:00Z'))).toBe(true) // 21:00
    expect(startsTomorrow(new Date('2026-11-07T21:59:00Z'))).toBe(true) // 23:59
    vi.setSystemTime(new Date('2026-11-07T20:30:00Z'))
    expect(usePlanner().form.date).toBe('2026-11-08')
  })
  it('the start chip cycles 9 → 10 → 11 → 14 → 9', () => {
    expect(['09:00', '10:00', '11:00', '14:00'].map(nextStartTime)).toEqual(['10:00', '11:00', '14:00', '09:00'])
  })
})

describe('usePlanner', () => {
  it('starts with the design defaults and offers today + tomorrow', () => {
    const p = usePlanner()
    expect(p.form).toMatchObject({ time: 'half', startTime: '10:00', transport: 'WALK', interests: ['history', 'food'] })
    expect(p.dayOptions.value).toHaveLength(2)
    expect(p.dayOptions.value[1].iso).toBe(nextDay(p.dayOptions.value[0].iso))
    expect(p.form.date).toBe(p.dayOptions.value[0].iso)
  })

  it('toggles interests and cycles the start time', () => {
    const p = usePlanner()
    p.toggleInterest('history')
    p.toggleInterest('art')
    expect(p.form.interests).toEqual(['food', 'art'])
    p.cycleStart()
    expect(p.form.startTime).toBe('11:00')
  })

  it('generates, then saves the draft right away and returns the saved itinerary', async () => {
    const draft = { title: 'T', stops: [{ order: 1 }] }
    generate.mockResolvedValue(draft)
    save.mockResolvedValue({ ...draft, id: 12, shareCode: 'abc' })
    const p = usePlanner()
    p.form.time = '2d'
    const r = await p.generate()
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ days: 2, locale: 'en', interests: ['history', 'food'] }))
    expect(save).toHaveBeenCalledWith(draft)
    expect(r).toMatchObject({ id: 12 })
    expect(p.generating.value).toBe(false)
  })

  it('an error shows a toast with the message and returns to the form', async () => {
    generate.mockRejectedValue(new ApiError(503, 'AradBot nu răspunde'))
    const p = usePlanner()
    expect(await p.generate()).toBeNull()
    expect(save).not.toHaveBeenCalled()
    expect(p.generating.value).toBe(false)
    expect(useUiStore().toasts[0]).toMatchObject({ message: 'AradBot nu răspunde', kind: 'error' })
  })

  it('a plan without stops is not saved, the form stays with a hint', async () => {
    generate.mockResolvedValue({ title: 'T', stops: [] })
    const p = usePlanner()
    expect(await p.generate()).toBeNull()
    expect(save).not.toHaveBeenCalled()
    expect(useUiStore().toasts[0]).toMatchObject({ message: 'plan.errors.noStops', kind: 'error' })
  })

  it('429 and no network have translated messages', async () => {
    generate.mockRejectedValue(new ApiError(429, 'Too many itinerary requests'))
    const p = usePlanner()
    await p.generate()
    generate.mockRejectedValue(new ApiError(0, 'Failed to fetch'))
    await p.generate()
    expect(useUiStore().toasts.map((x) => x.message)).toEqual(['plan.errors.tooMany', 'plan.errors.network'])
  })

  it('too late for today: switches the form to tomorrow with a translated hint', async () => {
    generate.mockRejectedValue(new ApiError(400, 'Too late to plan for today'))
    const p = usePlanner()
    expect(p.form.date).toBe('2026-11-07')
    await p.generate()
    expect(p.form.date).toBe('2026-11-08')
    expect(useUiStore().toasts[0].message).toBe('plan.errors.tooLate')
  })
})
