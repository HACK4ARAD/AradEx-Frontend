import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const loadParking = vi.fn()
vi.mock('@/shared/data/parking/parking', async (orig) => ({
  ...(await orig<typeof import('@/shared/data/parking/parking')>()),
  loadParking: () => loadParking(),
}))

import { useParkingLayer } from './useParkingLayer'

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('useParkingLayer', () => {
  it('switches itself off and reports when the data cannot be loaded; retries on the next switch-on', async () => {
    const onError = vi.fn()
    loadParking.mockRejectedValueOnce(new Error('chunk'))
    const layer = useParkingLayer(onError)
    layer.on.value = true
    await nextTick(); await flush()
    expect(layer.on.value).toBe(false)
    expect(onError).toHaveBeenCalledOnce()

    loadParking.mockResolvedValueOnce({ source: '', retrievedAt: '', tariffs: { meter: [], sms: [] }, spots: [
      { id: 'a', name: 'Str. A', zone: 2, capacity: 5, maxStayMin: null, lat: 46.18, lng: 21.31, paths: [[[46.1, 21.3], [46.2, 21.4]]] },
      { id: 'b', name: 'Str. B', zone: 1, capacity: 5, maxStayMin: null, lat: 46.18, lng: 21.31, paths: [] },
    ] })
    layer.on.value = true
    await nextTick(); await flush()
    expect(layer.markers.value).toHaveLength(2)
    expect(layer.zones.value).toEqual([1, 2])
    expect(onError).toHaveBeenCalledOnce()
  })
})
