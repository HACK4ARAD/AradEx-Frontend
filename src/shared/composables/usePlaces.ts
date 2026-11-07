import { computed, reactive, ref, watch, type Ref } from 'vue'
import { placesApi } from '@/shared/api/places'
import type { GeoPoint } from '@/shared/types/common'
import type { PlaceDto, PlaceSummary, PlaceType } from '@/shared/types/places'
import { useGeo } from './useGeo'

/** Toate tipurile din `PlaceType` (DATA-MODEL), în ordinea din formular. */
export const PLACE_TYPES: PlaceType[] = ['ATTRACTION', 'MUSEUM', 'VENUE', 'WINERY', 'NATURE', 'PARK', 'RESTAURANT', 'CAFE']

/** Filtrele pe etichete din design (aplicație, „Locuri din Arad”): cheia = eticheta din seed (V3_1), textul vine din i18n. */
export const PLACE_TAG_FILTERS = ['istorie', 'muzee', 'natura', 'vin', 'familie'] as const

/** „Ești aici” (FEATURES §4): în raza de 150 m. */
export const HERE_KM = 0.15

/** Reperul distanțelor când nu știm unde ești: Palatul Administrativ (Primăria), ca în design („x km de la Palatul Administrativ”). */
export const CITY_REF: GeoPoint = { lat: 46.1768, lng: 21.3145 }

/** Distanța pe sferă (haversine), în km, rotunjită la o zecimală ca în BE (`Geo.round1`). */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const r = (d: number) => (d * Math.PI) / 180
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * 6371.0088 * Math.asin(Math.sqrt(h)) * 10) / 10
}

/** Poziția e comună listei și detaliului (cerută o dată, la tap, rămâne pe toată sesiunea). */
const geo = useGeo()
const origin = (): GeoPoint => (geo.isFallback.value ? CITY_REF : geo.position.value)

export function usePlaceGeo() {
  return geo
}

/**
 * Lista obiectivelor („Locuri din Arad”) în ordinea din seed (ca în design), cu filtru pe etichetă.
 * Distanța: de la tine dacă ai dat voie la poziție, altfel de la Palatul Administrativ.
 */
export function usePlaces() {
  const raw = ref<PlaceSummary[]>([])
  /** Câte obiective sunt în total (din ultima listă fără filtre), pentru subtitlu. */
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const filters = reactive<{ tag: string | null; type: PlaceType | null; q: string }>({ tag: null, type: null, q: '' })
  const items = computed(() => raw.value.map((p) => ({ ...p, distanceKm: distanceKm(origin(), p) })))
  let seq = 0

  async function reload() {
    const mine = ++seq
    loading.value = true
    error.value = null
    try {
      const data = await placesApi.list({ tags: filters.tag ?? undefined, type: filters.type ?? undefined, q: filters.q.trim() || undefined })
      if (mine !== seq) return
      raw.value = data
      if (!filters.tag && !filters.type && !filters.q.trim()) total.value = data.length
    } catch (e) {
      if (mine === seq) error.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  watch(() => [filters.tag, filters.type], reload)
  reload()

  return { items, total, loading, error, filters, reload, locate: geo.locate, located: computed(() => !geo.isFallback.value), locating: geo.loading }
}

/** Detaliul unui obiectiv = ghidul (E3). Distanța ca în listă; „Ești aici” doar cu poziția reală. */
export function usePlace(id: Ref<number>) {
  const data = ref<PlaceDto | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const notFound = ref(false)
  const place = computed(() => (data.value ? { ...data.value, distanceKm: distanceKm(origin(), data.value) } : null))
  let seq = 0

  async function reload() {
    const mine = ++seq
    loading.value = true
    error.value = null
    notFound.value = false
    try {
      const d = await placesApi.get(id.value)
      if (mine === seq) data.value = d
    } catch (e) {
      if (mine !== seq) return
      data.value = null
      notFound.value = (e as { status?: number }).status === 404
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  const located = computed(() => !geo.isFallback.value)
  const isHere = computed(() => located.value && !!place.value && place.value.distanceKm <= HERE_KM)

  watch(id, reload, { immediate: true })

  return { place, loading, error, notFound, reload, locate: geo.locate, isHere, located, locating: geo.loading }
}
