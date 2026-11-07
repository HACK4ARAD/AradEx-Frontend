import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'

const list = vi.fn()
const get = vi.fn()
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }))
vi.mock('@/shared/composables/useEvents', () => ({
  periodRange: (p: string) => ({ period: p }),
  useEventFormat: () => ({ when: () => 'when', dateTime: () => 'dt' }),
}))
vi.mock('@/shared/api/events', () => ({ eventsApi: { list: (q: unknown) => list(q), get: (id: number) => get(id) } }))
vi.mock('@/shared/api/places', () => ({ placesApi: { list: async () => [] } }))
vi.mock('@/shared/api/offers', () => ({ offersApi: { list: async () => [] } }))
vi.mock('@/shared/api/business', () => ({ businessApi: { page: async () => ({}) } }))
vi.mock('@/shared/api/community', () => ({ communityApi: { actions: async () => [] } }))

import { useMapData, type MapPeriod } from './useMapData'

const ev = (id: number) => ({ id, title: `E${id}`, lat: 46.18, lng: 21.31, locationName: 'Arad' })
const page = (...ids: number[]) => ({ content: ids.map(ev) })
const flush = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => { list.mockReset(); get.mockReset() })

describe('useMapData', () => {
  it('ensure() fetches a target event outside the period and keeps it after a period change', async () => {
    list.mockResolvedValue(page(1))
    get.mockResolvedValue(ev(99))
    const period = ref<MapPeriod>('today')
    const { items, load, ensure } = useMapData(period)
    await load()
    expect(await ensure('event:99')).toBe(true)
    expect(items.value.map((i) => i.key)).toContain('event:99')
    period.value = 'weekend'
    await nextTick(); await flush()
    expect(items.value.map((i) => i.key)).toEqual(expect.arrayContaining(['event:1', 'event:99']))
  })

  it('ensure() does not duplicate an event already loaded and reports a missing one', async () => {
    list.mockResolvedValue(page(1))
    get.mockRejectedValue(new Error('404'))
    const { items, load, ensure } = useMapData(ref<MapPeriod>('today'))
    await load()
    expect(await ensure('event:1')).toBe(true)
    expect(get).not.toHaveBeenCalled()
    expect(items.value.filter((i) => i.key === 'event:1')).toHaveLength(1)
    expect(await ensure('event:5')).toBe(false)
  })

  it('a slow earlier period load does not overwrite the latest period', async () => {
    let resolveWeekend!: (v: unknown) => void
    list.mockResolvedValueOnce(page(1))
      .mockImplementationOnce(() => new Promise((r) => { resolveWeekend = r }))
      .mockResolvedValueOnce(page(3))
    const period = ref<MapPeriod>('today')
    const { items, load } = useMapData(period)
    await load()
    period.value = 'weekend'; await nextTick()
    period.value = 'week'; await nextTick(); await flush()
    resolveWeekend(page(2)); await flush()
    expect(items.value.map((i) => i.key)).toEqual(['event:3'])
  })
})
