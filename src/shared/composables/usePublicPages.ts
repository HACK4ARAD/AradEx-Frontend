import { ref, shallowRef, watch, type Ref } from 'vue'
import { eventsApi } from '@/shared/api/events'
import { placesApi } from '@/shared/api/places'
import { ApiError } from '@/shared/api/client'
import { isoDay } from '@/shared/composables/useEvents'
import type { EventDto, EventSummary } from '@/shared/types/events'
import type { PlaceDto, PlaceSummary, PlaceType } from '@/shared/types/places'

/**
 * Paginile publice ale site-ului pentru căutări („evenimente Arad”, „obiective turistice Arad”): doar citire, fără cont
 * (GET-urile publice /events și /places). Evenimentele demo din seed nu apar și n-au pagină (404 + noindex).
 * Regulile pure (filtrare, sortare, grupare) sunt exportate separat și testate în usePublicPages.test.ts.
 */

/** Tipurile de locuri care sunt „obiective turistice” (restaurantele, cafenelele, cramele și sălile nu intră). */
export const SIGHT_TYPES = ['ATTRACTION', 'MUSEUM', 'NATURE', 'PARK'] as const satisfies readonly PlaceType[]
export type SightType = (typeof SIGHT_TYPES)[number]
export const isSightType = (t: PlaceType): t is SightType => (SIGHT_TYPES as readonly PlaceType[]).includes(t)

/** Evenimentele publice: fără cele demo și fără cele deja încheiate, în ordinea datei. */
export function publicEvents(list: EventSummary[], now: Date = new Date()): EventSummary[] {
  const t = now.getTime()
  return list
    .filter((e) => !e.isDemo && Date.parse(e.endAt ?? e.startAt) >= t)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
}

/**
 * Grupate pe ziua începerii (calendarul Aradului): `[{ day: '2026-11-12', items }]`, în ordine. Ce a început deja și încă
 * ține (o expoziție) intră la ziua de azi, nu la o zi trecută.
 */
export function groupByDay(list: EventSummary[], now: Date = new Date()): { day: string; items: EventSummary[] }[] {
  const today = isoDay(now)
  const out: { day: string; items: EventSummary[] }[] = []
  for (const e of list) {
    const start = isoDay(new Date(e.startAt))
    const day = start < today ? today : start
    const last = out[out.length - 1]
    if (last?.day === day) last.items.push(e)
    else out.push({ day, items: [e] })
  }
  return out
}

/** Obiectivele: doar cele 4 tipuri turistice, întâi cele cu ghid audio (mai multe puncte primele), apoi după nume. */
export function sortSights(list: PlaceSummary[]): PlaceSummary[] {
  return list
    .filter((p) => isSightType(p.type))
    .sort((a, b) => (b.guidePointsCount > 0 ? 1 : 0) - (a.guidePointsCount > 0 ? 1 : 0)
      || b.guidePointsCount - a.guidePointsCount
      || a.name.localeCompare(b.name, 'ro'))
}

/** Lista evenimentelor publice viitoare (GET /events, după dată). */
export function useUpcomingEvents() {
  const items = shallowRef<EventSummary[]>([])
  const loading = ref(true)
  const failed = ref(false)
  async function load() {
    loading.value = true
    failed.value = false
    try {
      items.value = publicEvents((await eventsApi.list({ sort: 'date', size: 100 })).content)
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  }
  void load()
  return { items, loading, failed, reload: load }
}

/** Lista obiectivelor turistice (GET /places, un singur apel, filtrat pe tipuri). */
export function useSights() {
  const items = shallowRef<PlaceSummary[]>([])
  const loading = ref(true)
  const failed = ref(false)
  async function load() {
    loading.value = true
    failed.value = false
    try {
      items.value = sortSights(await placesApi.list())
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  }
  void load()
  return { items, loading, failed, reload: load }
}

/** Un singur element după id (eveniment sau obiectiv): `notFound` pentru 404 și pentru ce nu e public (demo, alt tip de loc). */
function useOne<T>(id: Ref<number>, get: (id: number) => Promise<T>, isPublic: (x: T) => boolean) {
  const item = shallowRef<T | null>(null)
  const loading = ref(true)
  const notFound = ref(false)
  const failed = ref(false)
  async function load() {
    loading.value = true
    notFound.value = false
    failed.value = false
    try {
      const x = await get(id.value)
      item.value = isPublic(x) ? x : null
      notFound.value = !isPublic(x)
    } catch (e) {
      item.value = null
      if (e instanceof ApiError && (e.status === 404 || e.status === 400)) notFound.value = true
      else failed.value = true
    } finally {
      loading.value = false
    }
  }
  watch(id, () => { void load() }, { immediate: true })
  return { item, loading, notFound, failed, reload: load }
}

export const usePublicEvent = (id: Ref<number>) => useOne<EventDto>(id, (n) => eventsApi.get(n), (e) => !e.isDemo)
export const usePublicPlace = (id: Ref<number>) => useOne<PlaceDto>(id, (n) => placesApi.get(n), (p) => isSightType(p.type))
