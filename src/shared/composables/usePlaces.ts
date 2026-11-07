import { computed, reactive, ref, watch, type Ref } from 'vue'
import { placesApi } from '@/shared/api/places'
import type { PlaceDto, PlaceSummary, PlaceType } from '@/shared/types/places'
import { useGeo } from './useGeo'

/** Toate tipurile din `PlaceType` (DATA-MODEL), în ordinea din formular. */
export const PLACE_TYPES: PlaceType[] = ['ATTRACTION', 'MUSEUM', 'VENUE', 'WINERY', 'NATURE', 'PARK', 'RESTAURANT', 'CAFE']

/** Filtrele pe etichete din design (W7 / „Locuri din Arad”): cheia = eticheta din seed (V3_1), textul vine din i18n. */
export const PLACE_TAG_FILTERS = ['istorie', 'muzee', 'natura', 'vin', 'familie', 'foto'] as const

/** „Ești aici” (FEATURES §4): în raza de 150 m. */
export const HERE_KM = 0.15

/**
 * Poziția e comună listei și detaliului (o dată cerută prin „Lângă mine”, rămâne pentru toată sesiunea).
 * Fără GPS rămâne pe centrul Aradului.
 */
const geo = useGeo()

export function usePlaceGeo() {
  return geo
}

/** Lista obiectivelor (W7, „Locuri din Arad”) cu filtru pe etichetă; distanța e față de poziția ta sau de centrul orașului. */
export function usePlaces() {
  const items = ref<PlaceSummary[]>([])
  /** Câte obiective sunt în total (din ultima listă fără filtre), pentru subtitlu. */
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const filters = reactive<{ tag: string | null; type: PlaceType | null; q: string }>({ tag: null, type: null, q: '' })
  let seq = 0

  async function reload() {
    const mine = ++seq
    loading.value = true
    error.value = null
    try {
      const data = await placesApi.list({
        tags: filters.tag ?? undefined, type: filters.type ?? undefined, q: filters.q.trim() || undefined, near: geo.near(),
      })
      if (mine !== seq) return
      items.value = data
      if (!filters.tag && !filters.type && !filters.q.trim()) total.value = data.length
    } catch (e) {
      if (mine === seq) error.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  async function locate() {
    await geo.locate()
    await reload()
  }

  watch(() => [filters.tag, filters.type], reload)
  reload()

  return { items, total, loading, error, filters, reload, locate, located: computed(() => !geo.isFallback.value), locating: geo.loading }
}

/** Detaliul unui obiectiv = ghidul. Cu poziție reală (după „Lângă mine” / „Unde sunt?”) aduce și distanța. */
export function usePlace(id: Ref<number>) {
  const place = ref<PlaceDto | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const notFound = ref(false)
  let seq = 0

  async function reload() {
    const mine = ++seq
    loading.value = true
    error.value = null
    notFound.value = false
    try {
      const data = await placesApi.get(id.value, geo.isFallback.value ? undefined : geo.near())
      if (mine === seq) place.value = data
    } catch (e) {
      if (mine !== seq) return
      place.value = null
      notFound.value = (e as { status?: number }).status === 404
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  async function locate() {
    await geo.locate()
    if (!geo.isFallback.value) await reload()
  }

  const isHere = computed(() => place.value?.distanceKm !== undefined && place.value.distanceKm <= HERE_KM)

  watch(id, reload, { immediate: true })

  return { place, loading, error, notFound, reload, locate, isHere, located: computed(() => !geo.isFallback.value), locating: geo.loading }
}
