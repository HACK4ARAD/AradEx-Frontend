import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import { transitApi } from '@/shared/api/transit'
import type {
  StopArrivalsDto, TransitArrivalDto, TransitMarker, TransitStopDto, TransitVehicleDto, TransitVehiclesDto,
} from '@/shared/types/transit'

/**
 * T22 · transport public CTP. Datele live trec prin BE (cache comun 25 s spre Telelink), deci aici doar citim:
 * cel mult o cerere la 30 s, niciodată două în paralel, și **doar cât ecranul e vizibil** (regulile din ARAD-DATA.md).
 * Stațiile/liniile sunt statice: o singură încărcare pe sesiune, păstrate și pe telefon (`cachedStatic`), ca ecranele să
 * pornească instant la următoarea deschidere. Între două cereri, „în N min” scade singur (`useArrivals`).
 */
export const TRANSIT_POLL_MS = 30_000
/** „Stația cea mai apropiată” are sens doar la mers pe jos: peste 1,5 km rândul nu se arată. */
export const NEAREST_MAX_KM = 1.5
/** Cât de des se recalculează „în N min” între două cereri (fără rețea). */
export const COUNTDOWN_TICK_MS = 15_000
/** Rețeaua păstrată pe telefon e folosită cel mult atât; oricum se reîmprospătează în fundal la fiecare pornire. */
export const STATIC_MAX_AGE_MS = 7 * 24 * 3600_000

/**
 * Date statice (stațiile, liniile) păstrate în `localStorage`: dacă există o copie de cel mult {@link STATIC_MAX_AGE_MS},
 * se întoarce imediat, iar cererea pleacă în fundal și o înlocuiește pentru data viitoare; altfel se așteaptă cererea.
 * Storage-ul poate lipsi (mod privat): atunci e doar cererea.
 */
export function cachedStatic<T>(name: string, fetch: () => Promise<T[]>): Promise<T[]> {
  const key = `ax.transit.${name}.v1`
  let saved: T[] | null = null
  try {
    const raw = localStorage.getItem(key)
    const v = raw ? (JSON.parse(raw) as { at: number; data: T[] }) : null
    if (v && Array.isArray(v.data) && v.data.length && Date.now() - v.at < STATIC_MAX_AGE_MS) saved = v.data
  } catch { /* copie stricată / storage blocat */ }
  const fresh = fetch().then((data) => {
    try { if (data.length) localStorage.setItem(key, JSON.stringify({ at: Date.now(), data })) } catch { /* plin / blocat */ }
    return data
  })
  if (!saved) return fresh
  fresh.catch(() => { /* rămâne copia de pe telefon */ })
  return Promise.resolve(saved)
}

/** Sosirile „îmbătrânite” cu minutele trecute de la răspuns: „în 4 min” devine „în 3 min” fără o cerere nouă. */
export function ageArrivals(d: StopArrivalsDto, elapsedMs: number): StopArrivalsDto {
  const gone = Math.floor(elapsedMs / 60_000)
  if (gone <= 0) return d
  const arrivals = d.arrivals
    .map((a) => ({ ...a, minutes: a.minutes - gone }))
    .filter((a) => a.minutes >= -1) // a plecat de mai mult de un minut: dispare (ca în BE)
    .map((a) => (a.minutes < 0 ? { ...a, minutes: 0 } : a))
  return { ...d, arrivals }
}

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
 * Markerele pentru `MapView` (T08): stațiile (`stop:<id>`) și vehiculele live (`vehicle:<id>`). `label` e textul mic din
 * pin (`MapMarker.label`, pus ca HTML de Leaflet): la vehicule numărul liniei din seed („3”, „39b”), la stații nimic —
 * numele stației și „Tramvaiul 3 → Gara” se iau din `stopTitle` / `vehicleTitle` pentru cardul de jos.
 * Vehiculele cu poziție învechită (`stale`, > 120 s) nu apar — nu le arătăm ca live.
 */
export function transitMarkers(stops: TransitStopDto[], vehicles: TransitVehicleDto[]): TransitMarker[] {
  const out: TransitMarker[] = stops.map((s) => ({ id: `stop:${s.id}`, lat: s.lat, lng: s.lng, kind: 'stop', label: '' }))
  for (const v of vehicles) {
    if (v.stale) continue
    out.push({ id: `vehicle:${v.id}`, lat: v.lat, lng: v.lng, kind: 'vehicle', label: v.routeShortName ?? '' })
  }
  return out
}

/** Titlul unui vehicul pentru cardul de pe hartă: „Tramvaiul 3 → Gara”. */
export function vehicleTitle(t: T, v: TransitVehicleDto): string {
  const name = lineName(t, v)
  return v.headsign ? `${name} → ${v.headsign}` : name
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
  /** Următoarea rulare peste `ms` de acum (datele tocmai au fost aduse altfel). */
  function later() {
    if (running || !active || hidden()) return
    clear()
    timer = setTimeout(tick, ms)
  }
  if (getCurrentScope()) onScopeDispose(stop)
  void tick()
  return { refresh: tick, stop, later }
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
  stopsCache ??= cachedStatic('stops', () => transitApi.stops()).catch((err) => { stopsCache = null; throw err })
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
  const raw = shallowRef<StopArrivalsDto | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  // „în N min” scade singur între cereri: minutele trecute de la răspuns (ceasul telefonului doar măsoară scurgerea timpului)
  let receivedAt = 0
  const now = ref(Date.now())
  const ticker = setInterval(() => { now.value = Date.now() }, COUNTDOWN_TICK_MS)
  if (getCurrentScope()) onScopeDispose(() => clearInterval(ticker))
  const data = computed(() => (raw.value ? ageArrivals(raw.value, now.value - receivedAt) : null))
  let seq = 0
  const polling = useVisiblePolling(async () => {
    const req = fetch()
    if (!req) { raw.value = null; return }
    const mine = ++seq
    loading.value = raw.value == null
    try {
      const res = await req
      if (mine === seq) { receivedAt = Date.now(); now.value = receivedAt; raw.value = res; error.value = null }
    } catch (err) {
      if (mine === seq) error.value = err instanceof Error ? err.message : String(err)
    } finally {
      if (mine === seq) loading.value = false
    }
  })
  // seq++: răspunsul unei cereri pornite pentru punctul vechi nu mai are voie să scrie peste cel nou
  watch(deps, () => { seq++; raw.value = null; void polling.refresh() })
  return { data, loading, error, refresh: polling.refresh, stop: polling.stop }
}
