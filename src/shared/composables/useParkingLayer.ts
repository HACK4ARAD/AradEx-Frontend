import { computed, ref, shallowRef, watch } from 'vue'
import type { MapLine, MapMarker } from '@/shared/components/map/types'
import { findParking, loadParking, parkingLines, parkingMarkers, type ParkingData, type ParkingZone } from '@/shared/data/parking/parking'

/**
 * Stratul „Parcări” al hărții (aplicație S7, web W9), după modelul stratului „Transport”: străzile cu parcare cu plată,
 * colorate pe zonă, și câte un pin „P”. Date statice din `shared/data/parking/` (fără BE), încărcate la prima pornire.
 * Dacă datele nu se încarcă (aplicație offline, chunk înlocuit de un deploy), stratul se oprește și cheamă `onError`.
 */
export function useParkingLayer(onError?: () => void) {
  const on = ref(false)
  const data = shallowRef<ParkingData | null>(null)

  watch(on, async (v) => {
    if (!v || data.value) return
    try { data.value = await loadParking() } catch { on.value = false; onError?.() }
  })

  const spots = computed(() => (on.value ? data.value?.spots ?? [] : []))
  const markers = computed<MapMarker[]>(() => parkingMarkers(spots.value))
  const lines = computed<MapLine[]>(() => parkingLines(spots.value))
  /** zonele care au străzi pe hartă, pentru legendă */
  const zones = computed<ParkingZone[]>(() => [...new Set(spots.value.map((s) => s.zone))].sort())
  const find = (id: string | null) => findParking(id, spots.value)

  return { on, data, markers, lines, zones, find }
}
