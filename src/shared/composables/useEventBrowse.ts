import { computed, ref, watch } from 'vue'
import { isoDay, periodRange, useEventFilters, useEventList } from '@/shared/composables/useEvents'
import type { EventQuery } from '@/shared/types/events'

export type BrowsePeriod = 'today' | 'weekend' | 'week' | 'all'
export type BrowseSort = 'date' | 'distance'

/** Câte carduri pe pagină în grid-ul W5 (design/final: „9 pe pagină”). */
export const PER_PAGE = 9
/** „Toate” = următoarele 30 de zile (design/final W5: „… evenimente în următoarele 30 de zile”). */
export const ALL_DAYS = 30

/** Intervalul trimis la GET /events pentru perioada aleasă; „Toate” se oprește după 30 de zile. */
export function browseRange(period: BrowsePeriod, now = new Date()): { from?: string; to?: string } {
  if (period === 'all') return { to: isoDay(new Date(now.getTime() + (ALL_DAYS - 1) * 86_400_000)) }
  return periodRange(period, now)
}

/** Numărul de pagini (minim 1, ca paginarea să nu dispară pe o listă goală). */
export function pageCount(n: number, per = PER_PAGE): number {
  return Math.max(1, Math.ceil(n / per))
}

/** Elementele paginii `page` (de la 0), cu pagina adusă în interval. */
export function paginate<T>(list: T[], page: number, per = PER_PAGE): T[] {
  const p = Math.min(Math.max(0, page), pageCount(list.length, per) - 1)
  return list.slice(p * per, p * per + per)
}

/**
 * T23 · lista de evenimente de pe web (W5): căutare, perioadă, sortare, filtrele comune (`useEventFilters`, coloana din stânga)
 * și paginarea în FE (lista vine într-o singură cerere, max 100, ca filtrul de distanță să numere corect).
 */
export function useEventBrowse(initialQ = '') {
  const q = ref(initialQ)
  const period = ref<BrowsePeriod>('all')
  const sort = ref<BrowseSort>('date')
  const page = ref(0)
  const { filters, active, clear, query: filterQuery, byDistance } = useEventFilters()

  const query = computed<EventQuery>(() => ({
    ...filterQuery.value,
    ...browseRange(period.value),
    q: q.value.trim() || undefined,
    sort: sort.value,
    size: 100,
  }))
  const { items, loading, error, reload, geo } = useEventList(query)
  const list = computed(() => byDistance(items.value))
  const pages = computed(() => pageCount(list.value.length))
  const shown = computed(() => paginate(list.value, page.value))

  // orice schimbare de filtru / căutare / perioadă începe de la prima pagină
  watch([query, () => filters.dist], () => { page.value = 0 }, { deep: true })
  watch(pages, (n) => { if (page.value > n - 1) page.value = n - 1 })

  function toggleSort() {
    sort.value = sort.value === 'date' ? 'distance' : 'date'
    if (sort.value === 'distance') void geo.locate()
  }
  function reset() {
    clear()
    q.value = ''
    period.value = 'all'
  }
  return { q, period, sort, page, pages, list, shown, loading, error, reload, filters, active, clear, reset, toggleSort }
}
