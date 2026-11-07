import { computed, reactive, ref, watch, type Ref } from 'vue'
import { placesApi } from '@/shared/api/places'
import type { GuidePointDto, PlaceDto, PlaceSummary } from '@/shared/types/places'
import {
  emptyPlaceForm, guidePointFormToRequest, guidePointRequestFrom, placeFormToRequest, placeToForm,
  type FormErrors, type GuidePointForm,
} from './usePlaceForm'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')

/**
 * „Obiective & ghiduri” (W25, Primărie + Admin): lista din stânga, obiectivul selectat (`selectedId`, null = obiectiv nou) cu formularul
 * lui și punctele de ghid. Erorile de API se aruncă mai departe (view-ul le arată în toast cu `detail`).
 */
export function useCityPlaces(selectedId: Ref<number | null>) {
  const items = ref<PlaceSummary[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const q = ref('')
  const filtered = computed(() => (q.value.trim() ? items.value.filter((p) => norm(p.name).includes(norm(q.value.trim()))) : items.value))

  const place = ref<PlaceDto | null>(null)
  const loadingPlace = ref(false)
  const placeError = ref<string | null>(null)
  const form = reactive(emptyPlaceForm())
  const errors = ref<FormErrors>({})
  const saving = ref(false)

  async function reloadList() {
    loading.value = true
    error.value = null
    try { items.value = await placesApi.list() } catch (e) { error.value = e instanceof Error ? e.message : String(e) } finally { loading.value = false }
  }

  async function loadPlace() {
    errors.value = {}
    placeError.value = null
    const id = selectedId.value
    if (id === null) { place.value = null; Object.assign(form, emptyPlaceForm()); return }
    loadingPlace.value = true
    try {
      const p = await placesApi.get(id)
      if (selectedId.value !== id) return
      place.value = p
      Object.assign(form, placeToForm(p))
    } catch (e) {
      place.value = null
      placeError.value = e instanceof Error ? e.message : String(e)
    } finally {
      loadingPlace.value = false
    }
  }

  /** Salvează obiectivul (nou sau existent); întoarce id-ul sau null dacă formularul are erori. */
  async function save(): Promise<number | null> {
    const { request, errors: errs } = placeFormToRequest(form)
    errors.value = errs
    if (!request) return null
    saving.value = true
    try {
      const saved = selectedId.value === null ? await placesApi.create(request) : await placesApi.update(selectedId.value, request)
      place.value = saved
      Object.assign(form, placeToForm(saved))
      await reloadList()
      return saved.id
    } finally {
      saving.value = false
    }
  }

  async function remove() {
    if (selectedId.value === null) return
    await placesApi.remove(selectedId.value)
    place.value = null
    await reloadList()
  }

  async function refreshPlace() {
    if (selectedId.value === null) return
    place.value = await placesApi.get(selectedId.value)
    await reloadList()
  }

  /** Punct nou (la final) sau modificarea unuia existent; întoarce erorile formularului (gol = salvat). */
  async function savePoint(f: GuidePointForm, existing?: GuidePointDto): Promise<FormErrors> {
    if (selectedId.value === null) return {}
    const { request, errors: errs } = guidePointFormToRequest(f, existing?.position)
    if (!request) return errs
    if (existing) await placesApi.updateGuidePoint(selectedId.value, existing.id, { ...guidePointRequestFrom(existing), ...request })
    else await placesApi.addGuidePoint(selectedId.value, request)
    await refreshPlace()
    return {}
  }

  async function removePoint(g: GuidePointDto) {
    if (selectedId.value === null) return
    await placesApi.removeGuidePoint(selectedId.value, g.id)
    await refreshPlace()
  }

  /** Mută un punct cu o poziție mai sus / jos: BE face schimb cu vecinul (aceeași poziție). */
  async function movePoint(g: GuidePointDto, dir: -1 | 1) {
    const pts = place.value?.guidePoints ?? []
    const i = pts.findIndex((p) => p.id === g.id)
    const other = pts[i + dir]
    if (selectedId.value === null || !other) return
    await placesApi.updateGuidePoint(selectedId.value, g.id, guidePointRequestFrom(g, other.position))
    await refreshPlace()
  }

  watch(selectedId, loadPlace, { immediate: true })
  reloadList()

  return {
    items, filtered, loading, error, q, reloadList,
    place, loadingPlace, placeError, loadPlace, form, errors, saving, save, remove,
    savePoint, removePoint, movePoint,
  }
}
