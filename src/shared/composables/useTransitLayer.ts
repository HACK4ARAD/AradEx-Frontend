import { computed, effectScope, getCurrentScope, onScopeDispose, ref, shallowRef, watch, type EffectScope } from 'vue'
import { transitApi } from '@/shared/api/transit'
import { loadTransitStops, transitMarkers, useTransitVehicles } from '@/shared/composables/useTransit'
import type { MapLine } from '@/shared/components/map/types'
import type { TransitMarker, TransitMode, TransitRouteDto, TransitStopDto, TransitVehicleDto } from '@/shared/types/transit'

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

/** Traseele liniilor (`/transit/routes`): fiecare variantă (dus / întors…) în culoarea liniei; fără culoare → albastrul transportului. */
export function transitLines(routes: TransitRouteDto[]): MapLine[] {
  const out: MapLine[] = []
  for (const r of routes) {
    for (const p of r.patterns) {
      if (p.path.length < 2) continue
      out.push({ id: `line:${r.id}:${p.index}`, color: r.color ?? '#1D5FD1', path: p.path })
    }
  }
  return out
}

/**
 * Filtrul Tramvaie / Autobuze al modului „Transport”: liniile și vehiculele după `mode`, stațiile după liniile care opresc
 * acolo (o stație rămâne dacă măcar o linie e din modurile alese). Fără trasee încărcate încă, stațiile rămân toate.
 */
export function filterTransitModes(modes: readonly TransitMode[], routes: TransitRouteDto[], stops: TransitStopDto[], vehicles: TransitVehicleDto[]) {
  const all = modes.includes('TRAM') && modes.includes('BUS')
  if (all) return { routes, stops, vehicles }
  const keep = new Set(routes.filter((r) => modes.includes(r.mode)).map((r) => r.id))
  return {
    routes: routes.filter((r) => keep.has(r.id)),
    stops: routes.length ? stops.filter((s) => s.routeIds.some((id) => keep.has(id))) : modes.length ? stops : [],
    vehicles: vehicles.filter((v) => (v.mode ? modes.includes(v.mode) : keep.has(v.routeId))),
  }
}

let routesCache: Promise<TransitRouteDto[]> | null = null
/** Liniile sunt statice: o singură cerere pe sesiune. */
function loadTransitRoutes(): Promise<TransitRouteDto[]> {
  routesCache ??= transitApi.routes().catch((err) => { routesCache = null; throw err })
  return routesCache
}

export function useTransitLayer() {
  const on = ref(false)
  const stops = shallowRef<TransitStopDto[]>([])
  const routes = shallowRef<TransitRouteDto[]>([])
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
    const [s, r] = await Promise.allSettled([loadTransitStops(), loadTransitRoutes()])
    stops.value = s.status === 'fulfilled' ? s.value : []
    routes.value = r.status === 'fulfilled' ? r.value : []
  })
  if (getCurrentScope()) onScopeDispose(() => scope?.stop())

  /** Tramvaie / Autobuze afișate (modul „Transport” al hărții) */
  const modes = ref<TransitMode[]>(['TRAM', 'BUS'])
  const shown = computed(() => filterTransitModes(modes.value, routes.value, stops.value, vehicles.value))

  const markers = computed<TransitMarker[]>(() => (on.value ? transitMarkers(shown.value.stops, shown.value.vehicles) : []))
  const lines = computed<MapLine[]>(() => (on.value ? transitLines(shown.value.routes) : []))
  const find = (id: string | null) => (on.value ? findTransit(id, shown.value.stops, shown.value.vehicles) : null)

  return { on, modes, stops, vehicles, live, markers, lines, find }
}
