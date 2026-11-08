import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick, ref, shallowRef } from 'vue'
import type { MapItem } from './useMapData'

const toast = vi.fn()
const locate = vi.fn()
const fetchDirections = vi.fn()
const ensure = vi.fn()
const mapItems = shallowRef<MapItem[]>([])

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }))
vi.mock('@/shared/composables/useEvents', () => ({ periodRange: () => ({}), useEventFormat: () => ({}) }))
vi.mock('@/shared/stores/ui', () => ({ useUiStore: () => ({ toast }) }))
vi.mock('@/shared/composables/useGeo', () => ({
  useGeo: () => ({ position: ref({ lat: 46.1866, lng: 21.3123 }), isFallback: ref(true), heading: ref(null), locate, track: vi.fn() }),
}))
vi.mock('@/shared/composables/useDirections', async (orig) => ({
  ...(await orig<typeof import('./useDirections')>()),
  fetchDirections: (...a: unknown[]) => fetchDirections(...a),
}))
vi.mock('@/shared/api/transit', () => ({ transitApi: {
  stops: async () => [], routes: async () => [], vehicles: async () => ({ live: false, attribution: '', vehicles: [] }),
} }))
vi.mock('@/shared/composables/useMapData', async (orig) => ({
  ...(await orig<typeof import('./useMapData')>()),
  useMapData: () => ({ items: mapItems, loading: ref(false), load: async () => {}, ensure: (k: string) => ensure(k) }),
}))

import { byDistance, searchItems, useMapScreen, visibleItems } from './useMapScreen'

const item = (key: string, title = key, lat = 46.18, lng = 21.31): MapItem =>
  ({ key, kind: key.split(':')[0] as MapItem['kind'], lat, lng, title, sub: 'Arad', href: '/' })
const dir = (km: number) => ({ line: [[0, 0], [1, 1]] as [number, number][], durationMin: 5, distanceKm: km, approximate: false })
const flush = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  toast.mockReset(); locate.mockReset(); fetchDirections.mockReset(); ensure.mockReset()
  locate.mockResolvedValue({ lat: 46.18, lng: 21.31 })
  mapItems.value = [item('event:1'), item('place:2'), item('offer:3')]
})

describe('searchItems', () => {
  const all = [item('event:1', 'Concert în Piața Avram Iancu'), item('place:2', 'Cetatea Aradului'), item('offer:3', 'Cafenea')]

  it('matches title or subtitle, ignoring case and diacritics', () => {
    expect(searchItems(all, 'piata').map((i) => i.key)).toEqual(['event:1'])
    expect(searchItems(all, 'CETATEA').map((i) => i.key)).toEqual(['place:2'])
    expect(searchItems(all, '  ')).toHaveLength(3)
  })

  it('keeps the route target even when it does not match', () => {
    expect(searchItems(all, 'cetatea', 'offer:3').map((i) => i.key)).toEqual(['place:2', 'offer:3'])
  })
})

describe('byDistance', () => {
  it('sorts the nearest first and reports km', () => {
    const near = item('place:1', 'near', 46.187, 21.313)
    const far = item('place:2', 'far', 46.25, 21.4)
    const out = byDistance([far, near], { lat: 46.1866, lng: 21.3123 })
    expect(out.map((r) => r.item.key)).toEqual(['place:1', 'place:2'])
    expect(out[0].km).toBeLessThan(0.2)
    expect(out[1].km).toBeGreaterThan(5)
  })
})

describe('useMapScreen', () => {
  it('?to= opens the route to the target directly', async () => {
    ensure.mockResolvedValue(true)
    fetchDirections.mockResolvedValue(dir(1.2))
    const s = useMapScreen('place:2')
    await s.init()
    expect(s.selected.value).toBe('place:2')
    expect(s.routing.value).toBe(true)
    expect(s.directions.value?.distanceKm).toBe(1.2)
  })

  it('an unknown ?to= target shows a toast and clears the selection', async () => {
    ensure.mockResolvedValue(false)
    const s = useMapScreen('event:99')
    await s.init()
    expect(toast).toHaveBeenCalledWith('map.notFound', 'info')
    expect(s.selected.value).toBeNull()
    expect(s.target.value).toBeNull()
  })

  it('drops a late route response after another pin was selected', async () => {
    let resolve!: (d: unknown) => void
    fetchDirections.mockImplementationOnce(() => new Promise((r) => { resolve = r }))
    const s = useMapScreen(undefined)
    s.select('event:1')
    const pending = s.showRoute()
    await flush()
    s.select('offer:3')
    resolve(dir(3)); await pending
    expect(s.directions.value).toBeNull()
    expect(s.routing.value).toBe(false)
  })

  it('switching foot → car while routing fetches the route again by car', async () => {
    fetchDirections.mockResolvedValue(dir(2))
    const s = useMapScreen(undefined)
    s.select('place:2')
    await s.showRoute()
    s.mode.value = 'car'
    await nextTick(); await flush()
    expect(fetchDirections).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ key: 'place:2' }), 'car')
  })

  it('closes the card when the selected pin disappears (period change)', async () => {
    const s = useMapScreen(undefined)
    s.select('event:1')
    await nextTick()
    expect(s.sel.value?.key).toBe('event:1')
    mapItems.value = [item('place:2')]
    await nextTick()
    expect(s.selected.value).toBeNull()
  })
})

describe('travel mode', () => {
  it('switches the layers and the route mode: transit → CTP + bikes, car → parking + car routes, foot → none', async () => {
    const s = useMapScreen(undefined)
    expect(s.layerMarkers.value).toEqual([])
    s.travel.value = 'transit'
    await nextTick()
    expect(s.transit.on.value).toBe(true)
    expect(s.parking.on.value).toBe(false)
    expect(s.mode.value).toBe('foot')
    expect(s.layerMarkers.value.some((m) => m.kind === 'bike')).toBe(true)
    s.showBikes.value = false
    expect(s.layerMarkers.value.some((m) => m.kind === 'bike')).toBe(false)

    s.travel.value = 'car'
    await nextTick()
    expect(s.transit.on.value).toBe(false)
    expect(s.parking.on.value).toBe(true)
    expect(s.mode.value).toBe('car')
    await vi.waitFor(() => expect(s.layerMarkers.value.some((m) => m.kind === 'parking')).toBe(true))

    s.travel.value = 'foot'
    await nextTick()
    expect(s.layerMarkers.value).toEqual([])
    expect(s.mode.value).toBe('foot')
  })

  it('closes a layer card when its layer goes away', async () => {
    const s = useMapScreen(undefined)
    s.travel.value = 'transit'
    await nextTick()
    const bike = s.layerMarkers.value.find((m) => m.kind === 'bike')!
    s.select(bike.id)
    expect(s.selBike.value?.id).toBe(bike.id.slice(5))
    s.travel.value = 'car'
    await nextTick(); await nextTick()
    expect(s.selected.value).toBeNull()
  })

  it('transit shows only transport: app pins and their open card go away, the route destination stays', async () => {
    const s = useMapScreen(undefined)
    await s.init()
    s.select('event:1')
    s.travel.value = 'transit'
    await nextTick()
    expect(s.visible.value).toEqual([])
    expect(s.markers.value.some((m) => m.kind === 'event' || m.kind === 'place' || m.kind === 'offer')).toBe(false)
    expect(s.selected.value).toBeNull()
    s.travel.value = 'foot'
    await nextTick()
    expect(s.visible.value.map((i) => i.key)).toEqual(['event:1', 'place:2', 'offer:3'])
  })

  it('visibleItems keeps only the route target in transit mode', () => {
    const items = [item('event:1'), item('place:2')]
    expect(visibleItems(items, 'all', null, 'transit')).toEqual([])
    expect(visibleItems(items, 'all', 'place:2', 'transit').map((i) => i.key)).toEqual(['place:2'])
    expect(visibleItems(items, 'event', null, 'car').map((i) => i.key)).toEqual(['event:1'])
  })
})

describe('picked point (long press / ?pick=1)', () => {
  it('a long press drops the point, a short tap closes it, and selecting a pin replaces it', () => {
    const s = useMapScreen(undefined)
    s.press({ lat: 46.123456789, lng: 21.3 }, false)
    expect(s.picked.value).toBeNull()                          // atingere scurtă: nimic
    s.press({ lat: 46.123456789, lng: 21.3 }, true)
    expect(s.picked.value).toEqual({ lat: 46.12346, lng: 21.3 }) // rotunjit la ~1 m
    expect(s.markers.value.some((m) => m.id === 'pick' && m.kind === 'dest')).toBe(true)
    s.press({ lat: 46.2, lng: 21.4 }, false)
    expect(s.picked.value).toBeNull()
    s.press({ lat: 46.2, lng: 21.4 }, true)
    s.select('event:1')
    expect(s.picked.value).toBeNull()
  })

  it('in pick mode a single tap chooses the point, once', () => {
    const s = useMapScreen(undefined, { pick: '1' })
    expect(s.pickMode.value).toBe(true)
    s.press({ lat: 46.17, lng: 21.32 }, false)
    expect(s.picked.value).toEqual({ lat: 46.17, lng: 21.32 })
    expect(s.pickMode.value).toBe(false)
  })

  it('routes to the picked point', async () => {
    fetchDirections.mockResolvedValue(dir(1.2))
    const s = useMapScreen(undefined)
    s.press({ lat: 46.17, lng: 21.32 }, true)
    await s.showRoute()
    expect(s.routing.value).toBe(true)
    expect(fetchDirections).toHaveBeenCalledWith({ lat: 46.18, lng: 21.31 }, expect.objectContaining({ lat: 46.17, lng: 21.32 }), 'foot')
    expect(s.directions.value?.distanceKm).toBe(1.2)
  })
})
