import { computed, ref, shallowRef, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { transitApi } from '@/shared/api/transit'
import { placesApi } from '@/shared/api/places'
import { eventsApi } from '@/shared/api/events'
import { businessApi } from '@/shared/api/business'
import { loadTransitStops, useVisiblePolling } from '@/shared/composables/useTransit'
import { ARAD_CENTER, useGeo } from '@/shared/composables/useGeo'
import { distanceKm } from '@/shared/composables/useDirections'
import { loadTransitRoutes } from '@/shared/composables/useTransitLayer'
import { buildPlan, stopLabel, transitCandidates, withDepartures, type Dest, type TransitOption, type TripOption, type TripPlan } from '@/shared/composables/useTripPlanner'
import { BIKE_STATIONS } from '@/shared/data/bikes/bikes'
import { loadParking } from '@/shared/data/parking/parking'
import { findPoi, parsePt } from '@/shared/data/transport/destinations'
import type { GeoPoint } from '@/shared/types/common'
import type { PlaceSummary } from '@/shared/types/places'
import type { TransitRouteDto, TransitStopDto } from '@/shared/types/transit'

/**
 * T19 · datele tab-ului Transport: rețeaua CTP (stații + linii, statice, o cerere pe sesiune, împărțite cu stratul hărții),
 * destinațiile (`?to=`) și planul de drum cu plecările live. Planul se ține în memorie, ca harta traseului să-l refolosească.
 */
export function useTransitNetwork() {
  const stops = shallowRef<TransitStopDto[]>([])
  const routes = shallowRef<TransitRouteDto[]>([])
  const loading = ref(true)
  const error = ref(false)
  const stopsById = computed(() => new Map(stops.value.map((s) => [s.id, s])))

  async function load() {
    loading.value = true
    error.value = false
    try {
      ;[stops.value, routes.value] = await Promise.all([loadTransitStops(), loadTransitRoutes()])
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }
  return { stops, routes, stopsById, loading, error, load }
}

/** Aceeași variantă de la o reîmprospătare la alta (cardul ales rămâne ales chiar dacă ordinea se schimbă). */
export function optionKey(o: TripOption): string {
  return o.kind === 'transit' ? `transit:${o.route.id}:${o.pattern.index}:${o.board.id}:${o.alight.id}` : o.kind
}

/** La pornirea aplicației: rețeaua (de pe telefon sau din API) e gata până ajungi în Transport. Erorile se ignoră aici. */
export function warmUpTransit() {
  void loadTransitStops().catch(() => {})
  void loadTransitRoutes().catch(() => {})
}

/** Peste atâția km de centru, poziția nu e în Arad (turist care plănuiește dinainte): planul pornește din centru. */
export const OUTSIDE_ARAD_KM = 25

/**
 * Poziția din tab-ul Transport, comună ecranelor lui (planul și harta traseului pornesc din același punct).
 * `origin` = de unde pornește planul: GPS-ul în Arad, altfel centrul; `here` = GPS-ul e în Arad (eticheta „Locația ta”).
 */
let shared: (ReturnType<typeof useGeo> & { origin: ComputedRef<GeoPoint>; here: ComputedRef<boolean> }) | null = null
export function useTransportGeo() {
  if (!shared) {
    const g = useGeo()
    const here = computed(() => !g.isFallback.value && distanceKm(g.position.value, ARAD_CENTER) <= OUTSIDE_ARAD_KM)
    shared = { ...g, here, origin: computed(() => (here.value ? g.position.value : ARAD_CENTER)) }
  }
  return shared
}

let placesCache: Promise<PlaceSummary[]> | null = null
/** Obiectivele pentru sugestii (o cerere pe sesiune). */
export function loadPlacesForSearch(): Promise<PlaceSummary[]> {
  placesCache ??= placesApi.list().catch((err) => { placesCache = null; throw err })
  return placesCache
}

type T = (key: string, params?: Record<string, unknown>) => string

/** Destinația din `?to=`; null dacă nu mai există. */
export async function resolveDest(key: string, t: T, stops: TransitStopDto[]): Promise<Dest | null> {
  const [kind, id] = key.split(':')
  if (kind === 'pt') {
    const p = parsePt(key)
    return p ? { key, name: t('transport.picked.name'), type: t('transport.picked.type'), icon: 'location_on', ...p } : null
  }
  try {
    if (kind === 'poi') {
      const p = findPoi(id)
      return p ? { key, name: t(`transport.poi.${p.id}.name`), type: t(`transport.poi.${p.id}.type`), icon: p.icon, lat: p.lat, lng: p.lng } : null
    }
    if (kind === 'stop') {
      const s = stops.find((x) => x.id === Number(id))
      return s ? { key, name: stopLabel(s.name), type: t('transport.stopType', { lines: s.lines.join(', ') }), icon: 'signpost', lat: s.lat, lng: s.lng } : null
    }
    if (kind === 'place') {
      const p = await placesApi.get(Number(id))
      return { key, name: p.name, type: t(`places.type.${p.type}`), icon: 'account_balance', lat: p.lat, lng: p.lng }
    }
    if (kind === 'event') {
      const e = await eventsApi.get(Number(id))
      return e.lat == null || e.lng == null ? null : { key, name: e.locationName, type: e.title, icon: 'event', lat: e.lat, lng: e.lng }
    }
    if (kind === 'offer') {
      const b = (await businessApi.page(Number(id))).business
      return b.lat == null || b.lng == null ? null : { key, name: b.name, type: b.address ?? '', icon: 'storefront', lat: b.lat, lng: b.lng }
    }
  } catch { /* destinația nu mai există */ }
  return null
}

/** Ultimul plan calculat (cheia = destinație + plecare rotunjită), ca harta traseului să nu-l recalculeze. */
type PlanBase = { key: string; dest: Dest; from: GeoPoint; cands: TransitOption[]; boardIds: number[]; parking: Awaited<ReturnType<typeof loadParking>>['spots'] }
let lastPlan: { key: string; at: number; plan: TripPlan; base: PlanBase } | null = null
const PLAN_TTL_MS = 60_000
const planKey = (to: string, from: GeoPoint) => `${to}@${from.lat.toFixed(4)},${from.lng.toFixed(4)}`

/**
 * Planul de drum: candidații pe rețea, apoi plecările live din stațiile de urcare ale celor mai bune (cel mult 5 stații),
 * ca „Urcă la X în N min” să fie real; o linie care nu mai pleacă de acolo dispare din listă.
 */
export function useTripPlan(opts: { live?: boolean } = {}) {
  const { t } = useI18n()
  const plan = shallowRef<TripPlan | null>(null)
  const loading = ref(false)
  const notFound = ref(false)
  let seq = 0
  /** ce trebuie ca plecările să se reîmprospăteze fără să refacem tot planul */
  let base: PlanBase | null = null

  async function departures(cands: TransitOption[], boardIds: number[]): Promise<TransitOption[]> {
    const arr = new Map(await Promise.all(boardIds.map(async (id) => [id, await transitApi.arrivals(id).catch(() => null)] as const)))
    return cands.map((c) => {
      const a = arr.get(c.board.id)
      return a === undefined ? c : withDepartures(c, a?.live ?? false, a?.arrivals ?? [])
    }).filter((c) => c !== null)
  }

  /** `live`: cât ecranul e vizibil, plecările din stațiile de urcare se reiau la 30 s și planul se reface (fără căutări noi). */
  const polling = opts.live ? useVisiblePolling(async () => {
    const b = base
    if (!b || !plan.value) return
    const mine = seq
    const fresh = await departures(b.cands, b.boardIds)
    if (mine !== seq || b !== base) return
    plan.value = buildPlan(b.dest, b.from, fresh, BIKE_STATIONS, b.parking)
    lastPlan = { key: b.key, at: Date.now(), plan: plan.value, base: b }
  }) : null

  async function compute(to: string, from: GeoPoint, net: { stops: TransitStopDto[]; routes: TransitRouteDto[]; stopsById: Map<number, TransitStopDto> }, reuse = true) {
    const key = planKey(to, from)
    if (reuse && lastPlan?.key === key && Date.now() - lastPlan.at < PLAN_TTL_MS) { plan.value = lastPlan.plan; base = lastPlan.base; notFound.value = false; return }
    const mine = ++seq
    loading.value = true
    notFound.value = false
    try {
      const dest = await resolveDest(to, t, net.stops)
      if (mine !== seq) return
      if (!dest) { plan.value = null; notFound.value = true; return }
      const cands = transitCandidates(from, dest, net.routes, net.stopsById).slice(0, 6)
      const boardIds = [...new Set(cands.map((c) => c.board.id))].slice(0, 5)
      // plecările și parcările în paralel
      const [live, parking] = await Promise.all([departures(cands, boardIds), loadParking().then((d) => d.spots).catch(() => [])])
      if (mine !== seq) return
      plan.value = buildPlan(dest, from, live, BIKE_STATIONS, parking)
      base = { key, dest, from, cands, boardIds, parking }
      lastPlan = { key, at: Date.now(), plan: plan.value, base }
      polling?.later()
    } finally {
      if (mine === seq) loading.value = false
    }
  }
  function clear() { seq++; base = null; plan.value = null; notFound.value = false; loading.value = false }
  return { plan, loading, notFound, compute, clear }
}
