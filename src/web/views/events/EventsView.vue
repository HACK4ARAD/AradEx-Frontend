<script setup lang="ts">
// T06 · W5 Evenimente — design/final `#/events`: coloana de filtre (categorie, preț, organizator, distanță), căutare, perioade,
// sortare după dată / distanță, grid de 3 carduri, paginare (9 pe pagină).
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import { periodRange, useEventFilters, useEventList } from '@/shared/composables/useEvents'
import { EVENT_CATEGORIES, type EventCategory, type EventQuery } from '@/shared/types/events'

type P = 'today' | 'weekend' | 'week' | 'all'
const PER_PAGE = 9
const { t } = useI18n()
const { filters, query: filterQuery, byDistance, clear } = useEventFilters()
const period = ref<P>('all')
const sort = ref<'date' | 'distance'>('date')
const text = ref('')
const q = ref('')
const page = ref(0)

const query = computed<EventQuery>(() => ({
  ...filterQuery.value, ...periodRange(period.value), q: q.value || undefined, sort: sort.value, size: 100,
}))
const { items, loading } = useEventList(query)
const list = computed(() => byDistance(items.value))
const pages = computed(() => Math.max(1, Math.ceil(list.value.length / PER_PAGE)))
const shown = computed(() => list.value.slice(page.value * PER_PAGE, (page.value + 1) * PER_PAGE))
watch([query, () => filters.dist], () => { page.value = 0 }, { deep: true })

function toggleCat(c: EventCategory) {
  const i = filters.cats.indexOf(c)
  if (i >= 0) filters.cats.splice(i, 1)
  else filters.cats.push(c)
}
function pick<K extends 'price' | 'org' | 'dist'>(k: K, v: (typeof filters)[K]) {
  filters[k] = (filters[k] === v ? '' : v) as (typeof filters)[K]
}
function clearAll() { clear(); text.value = ''; q.value = ''; period.value = 'all' }
const periods: { key: P; label: string }[] = [
  { key: 'today', label: 'events.period.today' }, { key: 'weekend', label: 'events.period.weekendShort' },
  { key: 'week', label: 'events.period.weekShort' }, { key: 'all', label: 'events.period.all' },
]
const checkboxes = computed(() => [
  { title: 'events.filters.category', items: EVENT_CATEGORIES.map((c) => ({ label: t(`events.category.${c}`), on: filters.cats.includes(c), click: () => toggleCat(c) })) },
  { title: 'events.filters.price', items: ([['free', 'free'], ['app', 'inAppWeb'], ['ext', 'external']] as const).map(([v, l]) => ({ label: t(`events.filters.${l}`), on: filters.price === v, click: () => pick('price', v) })) },
  { title: 'events.filters.organizer', items: ([['inst', 'institutions'], ['biz', 'businesses'], ['city', 'city']] as const).map(([v, l]) => ({ label: t(`events.filters.${l}`), on: filters.org === v, click: () => pick('org', v) })) },
  { title: 'events.filters.distance', items: ([['city', 'inCity'], ['county', 'countyWeb']] as const).map(([v, l]) => ({ label: t(`events.filters.${l}`), on: filters.dist === v, click: () => pick('dist', v) })) },
])
</script>

<template>
  <h1 class="text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] m-0">{{ t('events.web.title') }}</h1>
  <div class="text-muted text-[14.5px] mt-1.5">{{ t('events.web.sub', { n: list.length, range: period === 'all' ? t('events.web.next30') : '' }) }}</div>

  <div class="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-6 mt-5 items-start">
    <aside>
      <template v-for="g in checkboxes" :key="g.title">
        <h4 class="mt-3.5 mb-1.5 text-[11px] tracking-[.08em] uppercase text-muted font-semibold">{{ t(g.title) }}</h4>
        <button v-for="i in g.items" :key="i.label" type="button" role="checkbox" :aria-checked="i.on" class="flex items-center gap-2 py-[5px] text-[13.5px] w-full text-left" @click="i.click()">
          <i class="w-4 h-4 rounded-[4px] border-[1.5px] inline-flex items-center justify-center not-italic text-white" :class="i.on ? 'bg-ink border-ink' : 'border-[#8C8C86]'"><AppIcon v-if="i.on" name="check" :size="14" /></i>{{ i.label }}
        </button>
      </template>
      <button type="button" class="mt-4 h-8 px-[11px] rounded-[9px] border border-line bg-white text-[13px] font-semibold" @click="clearAll">{{ t('events.filters.clearWeb') }}</button>
    </aside>

    <div class="min-w-0">
      <div class="flex gap-2.5 flex-wrap items-center mb-4">
        <form class="flex items-center gap-2.5 h-[46px] px-3.5 rounded-[14px] bg-white border border-line text-muted w-full sm:w-[300px]" @submit.prevent="q = text.trim()">
          <AppIcon name="search" :size="18" />
          <input v-model="text" type="search" :placeholder="t('events.search.placeholderWeb')" :aria-label="t('events.search.title')" class="flex-1 min-w-0 border-0 outline-none bg-transparent text-ink text-[14px]" @search="q = text.trim()">
        </form>
        <button v-for="p in periods" :key="p.key" type="button" :aria-pressed="period === p.key" class="h-9 px-3.5 rounded-full border text-[13.5px] font-medium"
          :class="period === p.key ? 'bg-ink text-white border-ink font-semibold' : 'bg-white border-line'" @click="period = p.key">{{ t(p.label) }}</button>
        <span class="flex-1" />
        <button type="button" class="h-[30px] px-[11px] rounded-full border border-line bg-white text-[12.5px] font-medium inline-flex items-center gap-1.5" @click="sort = sort === 'date' ? 'distance' : 'date'">
          <AppIcon name="swap_vert" :size="16" />{{ t(`events.sort.${sort}`) }}
        </button>
      </div>

      <Skeleton v-if="loading && !list.length" :rows="3" :height="240" />
      <div v-else-if="shown.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <EventCardWeb v-for="e in shown" :key="e.id" :event="e" />
      </div>
      <EmptyState v-else icon="event_busy" :title="t('events.empty.title')" :text="t('events.empty.text')" />

      <div v-if="pages > 1" class="flex items-center justify-center gap-1.5 mt-[22px]">
        <button v-for="n in pages" :key="n" type="button" class="h-[30px] min-w-[30px] px-2.5 rounded-full border text-[12.5px] font-medium"
          :class="page === n - 1 ? 'bg-ink text-white border-ink' : 'bg-white border-line'" :aria-current="page === n - 1 ? 'page' : undefined" @click="page = n - 1">{{ n }}</button>
        <span class="text-muted text-[12.5px] ml-2">{{ t('events.web.perPage', { n: PER_PAGE }) }}</span>
      </div>
    </div>
  </div>
</template>
