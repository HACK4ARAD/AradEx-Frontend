import { computed, effectScope, getCurrentScope, onScopeDispose, ref, shallowRef, watch, type EffectScope } from 'vue'
import { loadTransitStops, transitMarkers, useTransitVehicles } from '@/shared/composables/useTransit'
import type { TransitMarker, TransitStopDto, TransitVehicleDto } from '@/shared/types/transit'

/**
 * T22 / T23 · stratul „Transport” al hărții (aplicație S7, web W9): stațiile CTP și vehiculele live (la 30 s, doar cât
 * stratul e pornit și ecranul e vizibil). Pornit de utilizator; oprit, nu face nicio cerere.
 */
export type TransitPick = { kind: 'stop'; stop: TransitStopDto } | { kind: 'vehicle'; vehicle: TransitVehicleDto }

/** Ce stă în spatele unui pin de transport (`stop:<id>` / `vehicle:<id>`); orice alt pin → null. */
export function findTransit(id: string | null, stops: TransitStopDto[], vehicles: TransitVehicleDto[]): TransitPick | null {
  if (!id) return null
  if (id.startsWith('stop:')) {
    const stop = stops.find((s) => `stop:${s.id}` === id)
    return stop ? { kind: 'stop', stop } : null
  }
  if (id.startsWith('vehicle:')) {
    const vehicle = vehicles.find((v) => `vehicle:${v.id}` === id)
    return vehicle ? { kind: 'vehicle', vehicle } : null
  }
  return null
}

export function useTransitLayer() {
  const on = ref(false)
  const stops = shallowRef<TransitStopDto[]>([])
  const vehicles = shallowRef<TransitVehicleDto[]>([])
  const live = ref(false)
  let scope: EffectScope | null = null

  watch(on, async (v) => {
    scope?.stop()
    scope = null
    if (!v) { vehicles.value = []; return }
    scope = effectScope()
    scope.run(() => {
      const tv = useTransitVehicles()
      watch(tv.data, (d) => { vehicles.value = d?.vehicles ?? []; live.value = d?.live ?? false }, { immediate: true })
    })
    try { stops.value = await loadTransitStops() } catch { stops.value = [] }
  })
  if (getCurrentScope()) onScopeDispose(() => scope?.stop())

  const markers = computed<TransitMarker[]>(() => (on.value ? transitMarkers(stops.value, vehicles.value) : []))
  const find = (id: string | null) => (on.value ? findTransit(id, stops.value, vehicles.value) : null)

  return { on, stops, vehicles, live, markers, find }
}
