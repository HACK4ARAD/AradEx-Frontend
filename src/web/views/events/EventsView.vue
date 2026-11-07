<script setup lang="ts">
// T23 · W5 Evenimente — design/final web `/events`: titlu + număr, în stânga filtrele (Categorie / Preț / Organizator / Distanță),
// în dreapta căutarea, perioada (Azi / Weekend / 7 zile / Toate), sortarea, grid-ul de carduri și paginarea (9 pe pagină).
// Sub `lg` filtrele se deschid din butonul „Filtre”. Primește `?q=` (căutarea din Acasă).
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import EventFiltersPanel from '@/shared/components/events/EventFiltersPanel.vue'
import { PER_PAGE, useEventBrowse, type BrowsePeriod } from '@/shared/composables/useEventBrowse'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const urlQ = () => (typeof route.query.q === 'string' ? route.query.q : '')
const { q, period, sort, page, pages, list, shown, loading, error, reload, active, reset, toggleSort } = useEventBrowse(urlQ())
const text = ref(q.value)
const filtersOpen = ref(false)

// căutarea: după 300 ms de la ultima tastă (sau Enter), păstrată în URL ca linkul să poată fi trimis
let timer: number | undefined
watch(text, (v) => { window.clearTimeout(timer); timer = window.setTimeout(() => search(v), 300) })
function search(v: string) {
  window.clearTimeout(timer)
  q.value = v.trim()
  if (q.value !== urlQ()) void router.replace({ query: { ...route.query, q: q.value || undefined } })
}
watch(() => route.query.q, () => { if (urlQ() !== q.value) { text.value = urlQ(); q.value = urlQ() } })

const periods: { key: BrowsePeriod; label: string }[] = [
  { key: 'today', label: 'events.period.today' }, { key: 'weekend', label: 'events.period.weekendShort' },
  { key: 'week', label: 'events.period.weekShort' }, { key: 'all', label: 'events.period.all' },
]
const sub = computed(() => t('events.web.sub', { n: list.value.length, range: period.value === 'all' ? t('events.web.next30') : '' }))
function clearAll() { reset(); text.value = '' }
function go(p: number) { page.value = p; window.scrollTo({ top: 0, behavior: 'smooth' }) }
const chip = 'h-9 px-3.5 rounded-full inline-flex items-center gap-1.5 border text-[13.5px] whitespace-nowrap transition-colors'
const chipOn = (on: boolean) => (on ? 'bg-ink text-white border-ink font-semibold' : 'bg-white border-line text-ink font-medium')
</script>

<template>
  <h1 class="text-[28px] md:text-[36px] leading-[1.1] tracking-[-0.03em] font-semibold m-0">{{ t('events.web.title') }}</h1>
  <p class="text-muted text-[14.5px] mt-1.5 mb-0">{{ sub }}</p>

  <div class="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-6 items-start mt-5">
    <aside :class="filtersOpen ? 'block' : 'hidden lg:block'" class="bg-white lg:bg-transparent border border-line lg:border-0 rounded-[16px] p-4 lg:p-0">
      <EventFiltersPanel />
    </aside>

    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-2.5 mb-4">
        <label class="flex items-center gap-2.5 h-[46px] px-3.5 rounded-[14px] bg-white border border-line text-muted w-full sm:w-[300px] focus-within:border-ink">
          <AppIcon name="search" :size="20" />
          <input v-model="text" type="search" enterkeyhint="search" :placeholder="t('events.search.placeholderWeb')" :aria-label="t('events.search.title')"
            class="flex-1 min-w-0 border-0 outline-none bg-transparent text-ink text-[14px]" @keydown.enter.prevent="search(text)">
          <button v-if="text" type="button" class="w-7 h-7 rounded-full flex items-center justify-center" :aria-label="t('events.search.clear')" @click="text = ''; search('')"><AppIcon name="close" :size="18" /></button>
        </label>
        <div class="flex flex-wrap gap-2">
          <button v-for="p in periods" :key="p.key" type="button" :aria-pressed="period === p.key" :class="[chip, chipOn(period === p.key)]" @click="period = p.key">{{ t(p.label) }}</button>
        </div>
        <span class="flex-1" />
        <button type="button" class="lg:hidden" :class="[chip, chipOn(filtersOpen)]" :aria-expanded="filtersOpen" @click="filtersOpen = !filtersOpen">
          <AppIcon name="tune" :size="18" />{{ t('events.filters.title') }}<template v-if="active"> · {{ t('events.filtered') }}</template>
        </button>
        <button type="button" :class="[chip, chipOn(false)]" class="h-[30px] px-[11px] text-[12.5px]" @click="toggleSort">
          <AppIcon name="swap_vert" :size="16" />{{ sort === 'date' ? t('events.sort.date') : t('events.sort.distance') }}
        </button>
      </div>

      <Skeleton v-if="loading && !list.length" :rows="3" :height="220" />
      <EmptyState v-else-if="error && !list.length" icon="cloud_off" :title="error" :action="t('common.retry')" @action="reload" />
      <template v-else-if="list.length">
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <EventCardWeb v-for="e in shown" :key="e.id" :event="e" :to="`/events/${e.id}`" />
        </div>
        <nav v-if="pages > 1" class="flex flex-wrap items-center justify-center gap-1.5 mt-[22px]" :aria-label="t('events.web.title')">
          <button v-for="i in pages" :key="i" type="button" :aria-current="page === i - 1 ? 'page' : undefined"
            :class="[chip, chipOn(page === i - 1)]" class="h-[30px] min-w-[30px] px-[11px] justify-center text-[12.5px]" @click="go(i - 1)">{{ i }}</button>
          <span class="text-muted text-[12.5px] ml-2">{{ t('events.web.perPage', { n: PER_PAGE }) }}</span>
        </nav>
      </template>
      <EmptyState v-else-if="q" icon="search_off" :title="t('events.search.noResults', { q })" :text="t('events.search.noResultsText')" :action="t('events.filters.clearWeb')" @action="clearAll" />
      <EmptyState v-else icon="event_busy" :title="t('events.empty.title')" :text="t('events.empty.text')" :action="t('events.filters.clearWeb')" @action="clearAll" />
    </div>
  </div>
</template>
