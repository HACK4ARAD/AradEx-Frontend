<script setup lang="ts">
// T06 · S2 Căutare — design/final `/search`: câmp activ, Filtre, sugestii, rezultate ca rânduri.
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventRow from '@/shared/components/events/EventRow.vue'
import EventFiltersSheet from '@/shared/components/events/EventFiltersSheet.vue'
import { periodRange, useEventFilters, useEventList } from '@/shared/composables/useEvents'
import { useBack } from '@/shared/composables/useBack'
import type { EventQuery } from '@/shared/types/events'

const { t } = useI18n()
const back = useBack('/')
const input = ref<HTMLInputElement | null>(null)
const text = ref('')
const q = ref('')
const { filters, query: filterQuery, byDistance } = useEventFilters()
let timer: number | undefined
watch(text, (v) => { window.clearTimeout(timer); timer = window.setTimeout(() => { q.value = v.trim() }, 250) })

const query = computed<EventQuery>(() => q.value ? { ...filterQuery.value, q: q.value } : { ...filterQuery.value, ...periodRange('week'), size: 6 })
const { items, loading } = useEventList(query)
const list = computed(() => byDistance(items.value))
const suggestions = computed(() => t('events.search.chips').split(',').map((s) => s.trim()))
onMounted(() => input.value?.focus())
</script>

<template>
  <div class="flex items-center gap-1 -ml-2.5 pt-2 mb-3.5">
    <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="flex-1 text-[24px] font-semibold tracking-[-0.03em] m-0">{{ t('events.search.title') }}</h1>
  </div>

  <div class="flex items-center gap-2.5 h-[52px] px-4 rounded-[16px] bg-white border border-ink shadow-[0_0_0_3px_rgba(17,17,17,.08)] text-muted">
    <AppIcon name="search" />
    <input ref="input" v-model="text" type="search" enterkeyhint="search" :placeholder="t('events.search.placeholder')" :aria-label="t('events.search.title')"
      class="flex-1 min-w-0 border-0 outline-none bg-transparent text-ink text-[16px]">
    <button v-if="text" type="button" class="w-8 h-8 rounded-full flex items-center justify-center" :aria-label="t('events.search.clear')" @click="text = ''"><AppIcon name="close" :size="18" /></button>
  </div>

  <div class="flex items-center justify-between mt-3.5 mb-1.5">
    <button type="button" class="min-h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-[13px] font-medium border border-line bg-white" @click="filters.sheetOpen = true">
      <AppIcon name="tune" :size="18" />{{ t('events.filters.title') }}
    </button>
    <span class="text-muted text-[13.5px]">{{ q ? t('events.search.results', list.length) : t('events.search.suggestions') }}</span>
  </div>

  <div v-if="!q" class="flex gap-2 overflow-x-auto -mx-5 px-5 py-0.5 mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <button v-for="s in suggestions" :key="s" type="button" class="min-h-9 px-3 rounded-full shrink-0 text-[13px] font-medium border border-line bg-white" @click="text = s; q = s">{{ s }}</button>
  </div>

  <Skeleton v-if="loading && !list.length" :rows="4" :height="84" />
  <template v-else-if="list.length">
    <h3 v-if="q" class="text-[16px] font-semibold mt-2.5 mb-1">{{ t('events.search.events') }}</h3>
    <EventRow v-for="e in list" :key="e.id" :event="e" :to="`/events/${e.id}`" />
  </template>
  <EmptyState v-else-if="q" icon="search_off" :title="t('events.search.noResults', { q })" :text="t('events.search.noResultsText')" />

  <EventFiltersSheet :count="list.length" />
</template>
