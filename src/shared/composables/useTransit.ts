import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import { transitApi } from '@/shared/api/transit'
import type {
  StopArrivalsDto, TransitArrivalDto, TransitMarker, TransitStopDto, TransitVehicleDto, TransitVehiclesDto,
} from '@/shared/types/transit'

/**
 * T22 · transport public CTP. Datele live trec prin BE (cache comun 25 s spre Telelink), deci aici doar citim:
 * cel mult o cerere la 30 s, niciodată două în paralel, și **doar cât ecranul e vizibil** (regulile din ARAD-DATA.md).
 * Stațiile/liniile sunt statice: o singură încărcare pe sesiune.
 */
export const TRANSIT_POLL_MS = 30_000
/** „Stația cea mai apropiată” are sens doar la mers pe jos: peste 1,5 km rândul nu se arată. */
export const NEAREST_MAX_KM = 1.5

type T = (key: string, params?: Record<string, unknown>) => string

/** „Tramvaiul 1” / „Autobuzul 21” / „Linia 7A” (linie necunoscută: routeId). */
export function lineName(t: T, a: { mode?: TransitArrivalDto['mode']; routeShortName?: string; routeId: number }): string {
  const n = a.routeShortName ?? String(a.routeId)
  return t(a.mode === 'TRAM' ? 'transit.tram' : a.mode === 'BUS' ? 'transit.bus' : 'transit.line', { n })
}

/** „acum” / „în 4 min” / „la 18:25” (peste o oră). */
export function arrivalWhen(t: T, a: Pick<TransitArrivalDto, 'minutes' | 'at'>): string {
  if (a.minutes <= 0) return t('transit.now')
  if (a.minutes < 60) return t('transit.inMinutes', { n: a.minutes })
  const hhmm = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' }).format(new Date(a.at))
  return t('transit.at', { time: hhmm })
}

/** Prima sosire a fiecărei linii (sosirile vin deja sortate după oră), cel mult `max`. */
export function nextPerLine(arrivals: TransitArrivalDto[], max = 2): TransitArrivalDto[] {
  const seen = new Set<number>()
  const out: TransitArrivalDto[] = []
  for (const a of arrivals) {
    if (seen.has(a.routeId)) continue
    seen.add(a.routeId)
    out.push(a)
    if (out.length === max) break
  }
  return out
}

/**
 * Markerele pentru `MapView` (T08): stațiile (`stop:<id>`) și vehiculele live (`vehicle:<id>`). Vehiculele cu poziție
 * învechită (`stale`, > 120 s) nu apar — nu le arătăm ca live.
 */
export function transitMarkers(stops: TransitStopDto[], vehicles: TransitVehicleDto[], t: T): TransitMarker[] {
  const out: TransitMarker[] = stops.map((s) => ({ id: `stop:${s.id}`, lat: s.lat, lng: s.lng, kind: 'stop', label: s.name }))
  for (const v of vehicles) {
    if (v.stale) continue
    const name = lineName(t, v)
    out.push({ id: `vehicle:${v.id}`, lat: v.lat, lng: v.lng, kind: 'vehicle', label: v.headsign ? `${name} → ${v.headsign}` : name })
  }
  return out
}

/**
 * Rulează `task` acum și apoi la fiecare `ms`, doar cât documentul e vizibil (la revenire: imediat); o cerere pornește
 * doar după ce s-a terminat cea dinainte. Se oprește singur când componenta dispare.
 */
export function useVisiblePolling(task: () => Promise<void>, ms = TRANSIT_POLL_MS) {
  const visibility = useDocumentVisibility()
  const hidden = () => visibility.value === 'hidden' // funcție: valoarea se poate schimba cât așteptăm cererea
  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false
  let pending = false
  let active = true

  function clear() {
    if (timer) clearTimeout(timer)
    timer = null
  }
  async function tick() {
    clear()
    if (!active || hidden()) return
    if (running) { pending = true; return } // fără cereri suprapuse: repornește imediat după cea în curs
    running = true
    try { await task() } finally {
      running = false
      if (active && !hidden()) timer = setTimeout(tick, pending ? 0 : ms)
      pending = false
    }
  }
  const stopWatch = watch(visibility, (v) => { if (v === 'hidden') clear(); else void tick() })
  function stop() {
    active = false
    clear()
    stopWatch()
  }
  if (getCurrentScope()) onScopeDispose(stop)
  void tick()
  return { refresh: tick, stop }
}

/** Vehiculele live, reîncărcate la 30 s cât ecranul e vizibil (pentru stratul „Transport” al hărții). */
export function useTransitVehicles() {
  const data = shallowRef<TransitVehiclesDto | null>(null)
  const error = ref<string | null>(null)
  const polling = useVisiblePolling(async () => {
    try {
      data.value = await transitApi.vehicles()
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err) // rămân ultimele poziții primite
    }
  })
  const vehicles = computed(() => data.value?.vehicles ?? [])
  const live = computed(() => data.value?.live ?? false)
  return { data, vehicles, live, error, refresh: polling.refresh, stop: polling.stop }
}

let stopsCache: Promise<TransitStopDto[]> | null = null
/** Stațiile (statice): o singură cerere pe sesiune, împărțită de toate ecranele. */
export function loadTransitStops(): Promise<TransitStopDto[]> {
  stopsCache ??= transitApi.stops().catch((err) => { stopsCache = null; throw err })
  return stopsCache
}

/** Sosirile într-o stație, reîncărcate la 30 s cât ecranul e vizibil. `stopId` null = nimic. */
export function useStopArrivals(stopId: Ref<number | null>) {
  return useArrivals(() => (stopId.value == null ? null : transitApi.arrivals(stopId.value)), [stopId])
}

/** Stația cea mai apropiată de un punct (eveniment, obiectiv, poziția mea) + sosirile ei, la 30 s cât e vizibil. */
export function useNearestStop(point: Ref<{ lat: number; lng: number } | null | undefined>) {
  const r = useArrivals(() => (point.value ? transitApi.nearest(point.value.lat, point.value.lng) : null), [point])
  /** Rândul se arată doar dacă stația e la mers pe jos. */
  const nearby = computed(() => {
    const d = r.data.value
    return d && (d.distanceKm == null || d.distanceKm <= NEAREST_MAX_KM) ? d : null
  })
  return { ...r, nearby }
}

function useArrivals(fetch: () => Promise<StopArrivalsDto> | null, deps: Ref<unknown>[]) {
  const data = shallowRef<StopArrivalsDto | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let seq = 0
  const polling = useVisiblePolling(async () => {
    const req = fetch()
    if (!req) { data.value = null; return }
    const mine = ++seq
    loading.value = data.value == null
    try {
      const res = await req
      if (mine === seq) { data.value = res; error.value = null }
    } catch (err) {
      if (mine === seq) error.value = err instanceof Error ? err.message : String(err)
    } finally {
      if (mine === seq) loading.value = false
    }
  })
  // seq++: răspunsul unei cereri pornite pentru punctul vechi nu mai are voie să scrie peste cel nou
  watch(deps, () => { seq++; data.value = null; void polling.refresh() })
  return { data, loading, error, refresh: polling.refresh, stop: polling.stop }
}
