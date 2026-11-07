import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MapLine, MapMarker } from '@/shared/components/map/types'
import { filterItems, parseTarget, useMapData, type MapItem, type MapKind, type MapPeriod } from '@/shared/composables/useMapData'
import { distanceKm, fetchDirections, type Directions, type TravelMode } from '@/shared/composables/useDirections'
import { REFINE_MS, useGeo } from '@/shared/composables/useGeo'
import { useParkingLayer } from '@/shared/composables/useParkingLayer'
import { BIKE_STATIONS, bikeMarkers, findBike } from '@/shared/data/bikes/bikes'
import { useTransitLayer } from '@/shared/composables/useTransitLayer'
import { useUiStore } from '@/shared/stores/ui'
import type { GeoPoint } from '@/shared/types/common'

/**
 * T08 / T23 · starea ecranului de hartă, comună aplicației (S7, harta pe tot ecranul) și web-ului (W9, listă + hartă):
 * perioada, tipul, pinul selectat, traseul (OSRM, pe jos / mașină) și ținta din `?to=kind:id`.
 * Fiecare cerere de traseu are un număr: un răspuns întârziat (alt pin, alt mod, card închis) se ignoră.
 */
export const MAP_PERIODS: MapPeriod[] = ['today', 'weekend', 'week']
export const MAP_KINDS: ('all' | MapKind)[] = ['all', 'event', 'place', 'offer', 'action']

/** Modul de deplasare al hărții: ce straturi se văd și cum se calculează traseul. */
export type Travel = 'foot' | 'transit' | 'car'
export const MAP_TRAVEL: { id: Travel; icon: string }[] = [
  { id: 'foot', icon: 'directions_walk' },
  { id: 'transit', icon: 'directions_bus' },
  { id: 'car', icon: 'directions_car' },
]

/**
 * Pinii aplicației (evenimente, locuri, oferte, acțiuni) după tip; în modul „Transport” harta arată doar transportul
 * (stații, vehicule, linii, biciclete) — rămâne doar destinația traseului deschis, dacă există.
 */
export function visibleItems(items: MapItem[], kind: 'all' | MapKind, target: string | null, travel: Travel): MapItem[] {
  if (travel === 'transit') return target ? items.filter((i) => i.key === target) : []
  return filterItems(items, kind, target)
}

/** Căutarea din lista web: titlu + subtitlu, fără diacritice și fără majuscule; ținta rămâne. */
export function searchItems(items: MapItem[], q: string, keep?: string | null): MapItem[] {
  const n = fold(q.trim())
  if (!n) return items
  return items.filter((i) => i.key === keep || fold(`${i.title} ${i.sub}`).includes(n))
}

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Lista W9: fiecare pin cu distanța față de `from` (utilizatorul sau centrul Aradului), cel mai apropiat primul. */
export function byDistance(items: MapItem[], from: GeoPoint): { item: MapItem; km: number }[] {
  return items.map((item) => ({ item, km: distanceKm(from, item) })).sort((a, b) => a.km - b.km)
}

export function useMapScreen(to: unknown) {
  const { t } = useI18n()
  const ui = useUiStore()
  const geo = useGeo()

  const period = ref<MapPeriod>('today')
  const kind = ref<'all' | MapKind>('all')
  const target = ref<string | null>(parseTarget(to))
  const selected = ref<string | null>(target.value)
  const mode = ref<TravelMode>('foot')
  const directions = ref<Directions | null>(null)

  const { items, loading, load, ensure } = useMapData(period)

  // Modul de deplasare alege straturile: „Transport” = liniile CTP + vehiculele live (T23) + stațiile de biciclete,
  // „Mașină” = parcările cu plată (Recons). Traseul din cardul pinului pornește în modul ales (pe jos / cu mașina).
  const travel = ref<Travel>('foot')
  const visible = computed(() => visibleItems(items.value, kind.value, target.value, travel.value))
  const transit = useTransitLayer()
  // parcările nu s-au încărcat: mesaj și înapoi la „Pe jos”, să nu rămână modul „Mașină” cu o hartă goală
  const parking = useParkingLayer(() => { ui.toast(t('parking.loadError'), 'error'); travel.value = 'foot' })
  /** al treilea comutator al modului „Transport”, lângă Tramvaie / Autobuze */
  const showBikes = ref(true)
  const bikes = computed(() => (transit.on.value && showBikes.value ? BIKE_STATIONS : []))
  watch(travel, (tr) => {
    // în „Transport” pinii aplicației dispar: se închide și cardul unuia deschis (dacă nu e destinația traseului)
    if (tr === 'transit' && selected.value && selected.value !== target.value && items.value.some((i) => i.key === selected.value)) select(null)
    transit.on.value = tr === 'transit'
    parking.on.value = tr === 'car'
    mode.value = tr === 'car' ? 'car' : 'foot'
  })

  const markers = computed<MapMarker[]>(() => [...toMarkers(visible.value), ...layerMarkers.value])
  /** pinii straturilor (parcări, biciclete, transport), peste pinii aplicației */
  const layerMarkers = computed<MapMarker[]>(() => [...parking.markers.value, ...bikeMarkers(bikes.value), ...transit.markers.value])
  /** liniile straturilor: străzile cu parcări sub traseele transportului */
  const lines = computed<MapLine[]>(() => [...parking.lines.value, ...transit.lines.value])
  const sel = computed(() => items.value.find((i) => i.key === selected.value) ?? null)
  /** pinul selectat e o stație sau un vehicul: cardul de transport în locul celui de pin */
  const selTransit = computed(() => transit.find(selected.value))
  /** pinul selectat e o parcare: cardul parcării */
  const selParking = computed(() => parking.find(selected.value))
  /** pinul selectat e o stație de biciclete */
  const selBike = computed(() => findBike(selected.value, bikes.value))
  /** e deschis un card de strat (transport, parcare, bicicletă) */
  const selLayer = computed(() => !!(selTransit.value || selParking.value || selBike.value))
  const routing = computed(() => !!sel.value && target.value === sel.value.key)

  let routeSeq = 0

  async function showRoute() {
    const dest = sel.value
    if (!dest) return
    const seq = ++routeSeq
    const m = mode.value
    target.value = dest.key
    directions.value = null
    const stale = () => seq !== routeSeq || target.value !== dest.key
    const from = await geo.locate()
    if (stale()) return
    const d = await fetchDirections(from, dest, m)
    if (!stale()) directions.value = d
  }

  function select(id: string | null) {
    selected.value = id
    if (id !== target.value) { routeSeq++; target.value = null; directions.value = null }
  }

  watch(mode, () => { if (routing.value) void showRoute() })
  // pinul selectat a dispărut (altă perioadă): închidem cardul și traseul, să nu rămână o linie fără destinație
  watch([sel, selLayer], ([s, l]) => { if (!s && !l && selected.value) select(null) })

  let stopFollow: (() => void) | null = null
  /**
   * „Locația mea”: harta zboară la prima poziție, apoi o urmează cât timp GPS-ul mai trimite citiri mai precise (prima e
   * adesea aproximativă, de la rețea), ca punctul albastru să nu rămână în afara hărții.
   */
  async function locateMe(fly: (p: GeoPoint) => void) {
    stopFollow?.()
    const p = await geo.locate()
    fly(p)
    if (geo.isFallback.value) return
    const stop = watch(geo.position, (q) => fly(q))
    const timer = setTimeout(() => stopFollow?.(), REFINE_MS)
    stopFollow = () => { stop(); clearTimeout(timer); stopFollow = null }
  }

  /** Încarcă pinii; ținta din `?to=` poate fi în afara perioadei afișate: ensure o aduce și deschide direct traseul. */
  async function init() {
    await load()
    if (!target.value) return
    if (await ensure(target.value)) { selected.value = target.value; await showRoute() }
    else { ui.toast(t('map.notFound'), 'info'); target.value = null; selected.value = null }
  }

  return { geo, period, kind, target, selected, mode, directions, items, loading, visible, markers, layerMarkers, lines, sel, selTransit, selParking, selBike, selLayer, travel, transit, parking, showBikes, routing, showRoute, select, init, locateMe }
}

export function toMarkers(items: MapItem[]): MapMarker[] {
  return items.map((i) => ({ id: i.key, lat: i.lat, lng: i.lng, kind: i.kind }))
}
