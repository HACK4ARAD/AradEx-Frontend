import { computed, shallowRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { distanceKm } from '@/shared/composables/useDirections'
import { loadTransitStops } from '@/shared/composables/useTransit'
import { loadTransitRoutes } from '@/shared/composables/useTransitLayer'
import { loadPlacesForSearch } from '@/shared/composables/useTransport'
import { stopLabel } from '@/shared/composables/useTripPlanner'
import { POIS } from '@/shared/data/transport/destinations'
import type { EventSummary } from '@/shared/types/events'
import type { GeoPoint } from '@/shared/types/common'
import type { PlaceSummary } from '@/shared/types/places'
import type { TransitRouteDto, TransitStopDto } from '@/shared/types/transit'

/**
 * Lista derulantă cu sugestii din Căutare (S2) și din „Unde vrei să ajungi?” (Transport, T19): pe măsură ce scrii, locurile
 * care se potrivesc după primele litere (întâi cele care încep cu ele, apoi cele cu un cuvânt care începe cu ele, apoi restul),
 * fiecare cu liniile CTP care opresc lângă el; cu câmpul gol, cele mai populare. Datele sunt cele deja încărcate pe sesiune.
 */
export const LINES_NEAR_KM = 0.4
export const MAX_SUGGESTIONS = 8

export interface Suggestion {
  /** `poi:gara`, `place:3`, `stop:120`, `event:5` */
  key: string
  kind: 'poi' | 'place' | 'stop' | 'event'
  name: string
  sub: string
  icon: string
  imageUrl?: string
  /** liniile care opresc la ≤ 400 m (la stații: liniile stației), tramvaiele întâi */
  lines: TransitRouteDto[]
}

export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Cât de bine se potrivește un nume cu literele scrise: 0 începe cu ele, 1 un cuvânt începe cu ele, 2 le conține, -1 deloc. */
export function matchRank(name: string, q: string): number {
  const n = fold(name), k = fold(q)
  if (!k) return 0
  if (n.startsWith(k)) return 0
  if (n.split(/[\s\-–„”"'.,()/]+/).some((w) => w.startsWith(k))) return 1
  return n.includes(k) ? 2 : -1
}

/** Liniile care opresc lângă un punct (sau la o stație), fără dubluri, tramvaiele întâi, apoi după număr. */
export function linesNear(p: GeoPoint, stops: TransitStopDto[], routes: TransitRouteDto[], km = LINES_NEAR_KM): TransitRouteDto[] {
  const ids = new Set<number>()
  for (const s of stops) if (distanceKm(p, s) <= km) s.routeIds.forEach((id) => ids.add(id))
  return sortLines(routes.filter((r) => ids.has(r.id)))
}

export function sortLines(routes: TransitRouteDto[]): TransitRouteDto[] {
  return [...routes].sort((a, b) => (a.mode === b.mode ? a.shortName.localeCompare(b.shortName, 'ro', { numeric: true }) : a.mode === 'TRAM' ? -1 : 1))
}

/** Sortează după potrivire, apoi după popularitate (ordinea primită). */
export function rankBy<T>(items: T[], name: (x: T) => string, q: string): T[] {
  return items.map((x, i) => ({ x, i, r: matchRank(name(x), q) })).filter((e) => e.r >= 0).sort((a, b) => a.r - b.r || a.i - b.i).map((e) => e.x)
}

/** Obiectivele după popularitate: cu ghid virtual (mai multe puncte = mai sus), apoi restul în ordinea din API. */
export function popularPlaces(places: PlaceSummary[]): PlaceSummary[] {
  return [...places].sort((a, b) => (b.guidePointsCount ?? 0) - (a.guidePointsCount ?? 0))
}

/** Stațiile mari (cele mai multe linii), câte una pe nume. */
export function busiestStops(stops: TransitStopDto[], max = 3): TransitStopDto[] {
  const seen = new Set<string>()
  return [...stops].sort((a, b) => b.routeIds.length - a.routeIds.length).filter((s) => {
    const k = fold(stopLabel(s.name))
    if (seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, max)
}

/**
 * `mode`: `transport` = repere, obiective și stații (alegi o destinație); `search` = obiective și evenimente (deschizi pagina).
 * `events` = evenimentele deja încărcate de ecran (Căutare), pentru potrivire și pentru „populare”.
 */
export function useSuggest(q: Ref<string>, mode: 'transport' | 'search', events?: Ref<EventSummary[]>) {
  const { t } = useI18n()
  const places = shallowRef<PlaceSummary[]>([])
  const stops = shallowRef<TransitStopDto[]>([])
  const routes = shallowRef<TransitRouteDto[]>([])

  async function load() {
    const [p, s, r] = await Promise.allSettled([loadPlacesForSearch(), loadTransitStops(), loadTransitRoutes()])
    if (p.status === 'fulfilled') places.value = p.value
    if (s.status === 'fulfilled') stops.value = s.value
    if (r.status === 'fulfilled') routes.value = r.value
  }

  const near = (p: GeoPoint) => linesNear(p, stops.value, routes.value)
  const fromPlace = (p: PlaceSummary): Suggestion => ({ key: `place:${p.id}`, kind: 'place', name: p.name, sub: t(`places.type.${p.type}`), icon: 'account_balance', imageUrl: p.imageUrl, lines: near(p) })
  const fromPoi = (p: (typeof POIS)[number]): Suggestion => ({ key: `poi:${p.id}`, kind: 'poi', name: t(`transport.poi.${p.id}.name`), sub: t(`transport.poi.${p.id}.type`), icon: p.icon, lines: near(p) })
  const fromStop = (s: TransitStopDto): Suggestion => {
    const ids = new Set(s.routeIds)
    return { key: `stop:${s.id}`, kind: 'stop', name: stopLabel(s.name), sub: t('suggest.stop'), icon: 'signpost', lines: sortLines(routes.value.filter((r) => ids.has(r.id))) }
  }
  const fromEvent = (e: EventSummary): Suggestion => ({ key: `event:${e.id}`, kind: 'event', name: e.title, sub: e.locationName, icon: 'event', imageUrl: e.imageUrl, lines: e.lat != null && e.lng != null ? near(e) : [] })

  /** o singură stație pe nume (peroanele de vizavi) */
  const uniqueStops = computed(() => {
    const seen = new Set<string>()
    return stops.value.filter((s) => { const k = fold(stopLabel(s.name)); if (seen.has(k)) return false; seen.add(k); return true })
  })

  const items = computed<Suggestion[]>(() => {
    const k = q.value.trim()
    const pois = mode === 'transport' ? POIS : []
    if (!k) {
      // câmpul gol: cele mai populare
      if (mode === 'transport') return [...pois.map(fromPoi), ...popularPlaces(places.value).slice(0, 3).map(fromPlace), ...busiestStops(stops.value, 2).map(fromStop)].slice(0, MAX_SUGGESTIONS)
      const hot = [...(events?.value ?? [])].sort((a, b) => Number(b.isHot) - Number(a.isHot) || b.participantsCount - a.participantsCount).slice(0, 3)
      return [...popularPlaces(places.value).slice(0, 5).map(fromPlace), ...hot.map(fromEvent)].slice(0, MAX_SUGGESTIONS)
    }
    // potrivirea după primele litere, pe toate sursele, apoi amestecate după cât de bine se potrivesc
    const all: { s: Suggestion; r: number; i: number }[] = []
    const push = (list: Suggestion[]) => list.forEach((s) => { const r = matchRank(s.name, k); if (r >= 0) all.push({ s, r, i: all.length }) })
    push(rankBy(pois, (p) => t(`transport.poi.${p.id}.name`), k).map(fromPoi))
    // în Transport și stațiile au loc în listă (altfel restaurantele cu același început le-ar acoperi pe toate)
    push(rankBy(popularPlaces(places.value), (p) => p.name, k).slice(0, mode === 'transport' ? 5 : MAX_SUGGESTIONS).map(fromPlace))
    if (mode === 'transport') push(rankBy(uniqueStops.value, (s) => stopLabel(s.name), k).slice(0, 4).map(fromStop))
    else push(rankBy(events?.value ?? [], (e) => e.title, k).slice(0, MAX_SUGGESTIONS).map(fromEvent))
    const seen = new Set<string>()
    return all.sort((a, b) => a.r - b.r || a.i - b.i).map((e) => e.s)
      .filter((s) => { const n = fold(s.name); if (seen.has(n)) return false; seen.add(n); return true })
      .slice(0, MAX_SUGGESTIONS)
  })

  return { items, load }
}
