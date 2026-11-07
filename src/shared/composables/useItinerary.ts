import { computed, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { itinerariesApi } from '@/shared/api/itineraries'
import { ApiError } from '@/shared/api/client'
import { fetchDirections, googleMapsUrl, type TravelMode } from '@/shared/composables/useDirections'
import { intlLocale, useFormat } from '@/shared/composables/useFormat'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { GeoPoint, Transport } from '@/shared/types/common'
import type { ItineraryDto, ItineraryStop } from '@/shared/types/plan'

/**
 * T13 · E2 programul / E4 harta traseului / lista „Itinerariile tale”: încărcarea după id (sau shareCode), zilele,
 * opririle bifate (localStorage, per itinerariu), legăturile dintre opriri și traseul pe străzi (OSRM, legat pas cu pas).
 */

// ---------- funcții pure (testate) ----------

/** Zilele itinerariului: [1] sau [1, 2]. */
export function daysOf(it: Pick<ItineraryDto, 'days' | 'stops'>): (1 | 2)[] {
  return it.days === 2 || it.stops.some((s) => s.day === 2) ? [1, 2] : [1]
}

/** Opririle unei zile, în ordine; la un itinerariu de o zi, toate. */
export function stopsForDay(stops: ItineraryStop[], day: 1 | 2, days: number): ItineraryStop[] {
  const sorted = [...stops].sort((a, b) => a.order - b.order)
  return days === 2 ? sorted.filter((s) => (s.day ?? 1) === day) : sorted
}

/** Drumul de la o oprire la următoarea, în aceeași zi (linia „🚶 18 min · 1,3 km” de sub oprire). */
export interface Leg { from: ItineraryStop; to: ItineraryStop; minutes: number; km: number; mode: Transport }

export function legsOf(stops: ItineraryStop[]): Leg[] {
  const legs: Leg[] = []
  for (let i = 1; i < stops.length; i++) {
    const to = stops[i]
    legs.push({ from: stops[i - 1], to, minutes: to.travelMinutesFromPrev, km: to.travelKmFromPrev, mode: to.travelMode })
  }
  return legs
}

/** Totalul drumurilor dintre opririle afișate (fără drumul spre prima oprire a zilei). */
export function legTotals(stops: ItineraryStop[]): { km: number; minutes: number } {
  return legsOf(stops).reduce((a, l) => ({ km: a.km + (l.km || 0), minutes: a.minutes + (l.minutes || 0) }), { km: 0, minutes: 0 })
}

/** Modul OSRM / Google Maps pentru transportul itinerariului (transportul public: pe jos pe hartă, „transit” în Google Maps). */
export function travelModeOf(t: Transport): TravelMode {
  return t === 'CAR' ? 'car' : 'foot'
}

export const MODE_ICON: Record<Transport, string> = { WALK: 'directions_walk', CAR: 'directions_car', PUBLIC: 'tram' }

/** „Navighează”: indicațiile Google Maps spre oprire, în modul itinerariului. */
export function navigateUrl(to: GeoPoint, t: Transport): string {
  const url = googleMapsUrl(to, travelModeOf(t))
  return t === 'PUBLIC' ? url.replace(/travelmode=\w+/, 'travelmode=transit') : url
}

/** „Cum ajung” → harta cu traseul spre oprire. */
export function mapTarget(s: Pick<ItineraryStop, 'kind' | 'refId'>): string {
  return `/map?to=${s.kind.toLowerCase()}:${s.refId}`
}

/** Pagina opririi: obiectivul (cu ghidul), evenimentul sau oferta. */
export function stopHref(s: Pick<ItineraryStop, 'kind' | 'refId'>): string {
  return s.kind === 'PLACE' ? `/places/${s.refId}` : s.kind === 'EVENT' ? `/events/${s.refId}` : `/offers/${s.refId}`
}

/** Traseul pe străzi: legăturile dintre opriri cerute la OSRM și lipite într-o singură linie (fiecare cade singură pe linie dreaptă). */
export async function buildRoute(stops: GeoPoint[], mode: TravelMode, fetchFn: typeof fetch = fetch): Promise<{ line: [number, number][]; approximate: boolean } | null> {
  if (stops.length < 2) return null
  const parts = await Promise.all(stops.slice(1).map((to, i) => fetchDirections(stops[i], to, mode, fetchFn)))
  const line: [number, number][] = []
  for (const p of parts) {
    const pts = line.length && p.line.length ? p.line.slice(1) : p.line
    line.push(...pts)
  }
  return { line, approximate: parts.some((p) => p.approximate) }
}

// ---------- opririle bifate (localStorage, per itinerariu) ----------

const doneKey = (id: string | number) => `ax.itinerary.done.${id}`

export function loadDone(id: string | number): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(doneKey(id)) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((x): x is number => typeof x === 'number') : []
  } catch { return [] }
}

export function saveDone(id: string | number, orders: number[]) {
  try { localStorage.setItem(doneKey(id), JSON.stringify(orders)) } catch { /* privat / blocat: bifele țin cât ecranul */ }
}

/** Bifează / debifează o oprire (după `order`); întoarce lista nouă. */
export function toggleDone(list: number[], order: number): number[] {
  return list.includes(order) ? list.filter((o) => o !== order) : [...list, order]
}

/** Procentul pentru inelul de progres. */
export function progressPct(done: number, total: number): number {
  return total ? Math.round((done / total) * 100) : 0
}

// ---------- formatare ----------

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function useItineraryFormat() {
  const f = useFormat()
  const { t } = useI18n()
  /** „Sâm., 7 nov. · 10:00–15:15” sau, pe două zile, „Sâm., 7 nov. – Dum., 8 nov.” */
  function when(it: ItineraryDto): string {
    const first = f.dateTime(`${it.date}T12:00:00Z`, false)
    if (daysOf(it).length === 2) return `${first} – ${f.dateTime(`${addDays(it.date, 1)}T12:00:00Z`, false)}`
    const sorted = [...it.stops].sort((a, b) => a.order - b.order)
    if (!sorted.length) return first
    return `${first} · ${f.timeRange(sorted[0].arriveAt, sorted[sorted.length - 1].leaveAt)}`
  }
  /** „sâm.” / „Sat” pentru segmentul „Ziua 1 · sâm.” */
  function weekday(it: ItineraryDto, day: 1 | 2): string {
    return new Intl.DateTimeFormat(intlLocale(), { weekday: 'short', timeZone: 'Europe/Bucharest' }).format(new Date(`${addDays(it.date, day - 1)}T12:00:00Z`))
  }
  const time = (s: ItineraryStop) => f.timeRange(s.arriveAt)
  const duration = (min: number) => f.minutes(min)
  const legText = (minutes: number, km: number) => (km ? `${t('plan.minutes', { n: minutes })} · ${f.km(km)}` : t('plan.minutes', { n: minutes }))
  return { when, weekday, time, duration, legText, km: f.km }
}

// ---------- ecranele ----------

/** Un itinerariu după `id` sau shareCode: încărcare, ziua aleasă, bifele, progresul. */
export function useItinerary(idOrCode: Ref<string>, initialDay: 1 | 2 = 1) {
  const { t } = useI18n()
  const ui = useUiStore()
  const it = ref<ItineraryDto | null>(null)
  const loading = ref(false)
  const notFound = ref(false)
  const failed = ref(false)
  const day = ref<1 | 2>(initialDay)
  const done = ref<number[]>([])

  /** bifele se țin după id-ul numeric când îl știm (același itinerariu deschis cu shareCode le găsește) */
  const storeKey = computed(() => String(it.value?.id ?? idOrCode.value))

  async function load() {
    loading.value = true
    notFound.value = false
    failed.value = false
    try {
      it.value = await itinerariesApi.get(idOrCode.value)
      done.value = loadDone(storeKey.value)
      if (!daysOf(it.value).includes(day.value)) day.value = 1
    } catch (e) {
      it.value = null
      if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound.value = true
      else { failed.value = true; ui.error(e) }
    } finally {
      loading.value = false
    }
  }
  watch(idOrCode, () => { void load() }, { immediate: true })

  const days = computed(() => (it.value ? daysOf(it.value) : [1 as const]))
  const all = computed(() => (it.value ? stopsForDay(it.value.stops, 1, 1) : []))
  const stops = computed(() => (it.value ? stopsForDay(it.value.stops, day.value, it.value.days) : []))
  /** drumul de după fiecare oprire a zilei, după `order` */
  const legAfter = computed(() => new Map(legsOf(stops.value).map((l) => [l.from.order, l])))
  const doneCount = computed(() => all.value.filter((s) => done.value.includes(s.order)).length)
  const total = computed(() => all.value.length)
  const allDone = computed(() => total.value > 0 && doneCount.value === total.value)
  const next = computed(() => all.value.find((s) => !done.value.includes(s.order)) ?? null)
  const pct = computed(() => progressPct(doneCount.value, total.value))
  const cover = computed(() => all.value.find((s) => s.imageUrl)?.imageUrl ?? null)

  function toggle(s: ItineraryStop) {
    done.value = toggleDone(done.value, s.order)
    saveDone(storeKey.value, done.value)
    if (allDone.value) ui.toast(t('plan.detail.allDone'), 'success')
  }

  return { it, loading, notFound, failed, load, day, days, all, stops, legAfter, done, doneCount, total, allDone, next, pct, cover, toggle }
}

/** E4: traseul pe străzi al opririlor afișate (se recalculează când se schimbă ziua). */
export function useItineraryRoute(stops: Ref<ItineraryStop[]>, transport: Ref<Transport | undefined>) {
  const route = ref<{ line: [number, number][]; approximate: boolean } | null>(null)
  let seq = 0
  watch([stops, transport], async ([list, tr]) => {
    const mine = ++seq
    // fără străzi încă: linia dreaptă punctată, ca harta să arate ordinea imediat
    route.value = list.length > 1 ? { line: list.map((s) => [s.lat, s.lng] as [number, number]), approximate: true } : null
    const r = await buildRoute(list, travelModeOf(tr ?? 'WALK'))
    if (mine === seq) route.value = r
  }, { immediate: true })
  return route
}

/** „Itinerariile tale” (GET /me/itineraries), cu progresul din localStorage. */
export function useMyItineraries() {
  const auth = useAuthStore()
  const ui = useUiStore()
  const items = ref<ItineraryDto[]>([])
  const loading = ref(false)
  const failed = ref(false)

  async function load() {
    if (!auth.user) { items.value = []; return }
    loading.value = true
    failed.value = false
    try {
      items.value = await itinerariesApi.mine()
    } catch (e) {
      failed.value = true
      ui.error(e)
    } finally {
      loading.value = false
    }
  }
  watch(() => auth.user?.id, () => { void load() }, { immediate: true })

  function progress(it: ItineraryDto) {
    const ds = it.id != null ? loadDone(it.id) : []
    const n = it.stops.filter((s) => ds.includes(s.order)).length
    return { done: n, total: it.stops.length, pct: progressPct(n, it.stops.length) }
  }
  const coverOf = (it: ItineraryDto) => [...it.stops].sort((a, b) => a.order - b.order).find((s) => s.imageUrl)?.imageUrl ?? null

  /** sesiunea încă se încarcă (`/me`): arătăm lista în așteptare, nu invitația de conectare */
  const booting = computed(() => !auth.user && !auth.ready && !!auth.token)
  return {
    items, failed, load, progress, coverOf,
    loading: computed(() => loading.value || booting.value),
    loggedIn: computed(() => !!auth.user || booting.value),
  }
}
