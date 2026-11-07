<script setup lang="ts">
// T06 · sheet-ul „Filtre” din aplicație (S1 / S2) — design/final ACT.filters.
import { useI18n } from 'vue-i18n'
import { AppSheet } from '@/shared/components'
import { useEventFilters } from '@/shared/composables/useEvents'
import { EVENT_CATEGORIES, type EventCategory } from '@/shared/types/events'

defineProps<{ count: number }>()
const { t } = useI18n()
const { filters, clear } = useEventFilters()

function toggleCat(c: EventCategory) {
  const i = filters.cats.indexOf(c)
  if (i >= 0) filters.cats.splice(i, 1)
  else filters.cats.push(c)
}
function pick<K extends 'price' | 'org' | 'dist'>(k: K, v: (typeof filters)[K]) {
  filters[k] = (filters[k] === v ? '' : v) as (typeof filters)[K]
}
const chip = 'min-h-9 px-3 rounded-full inline-flex items-center text-[13px] font-medium border transition-colors'
const on = (b: boolean) => b ? 'bg-ink text-white border-ink font-semibold' : 'bg-white border-line text-ink'
</script>

<template>
  <AppSheet v-model:open="filters.sheetOpen" :title="t('events.filters.title')">
    <template #action><button type="button" class="font-semibold underline underline-offset-[3px]" @click="clear">{{ t('events.filters.clear') }}</button></template>
    <div class="flex flex-col gap-[18px]">
      <div>
        <div class="text-[13px] font-semibold mb-2">{{ t('events.filters.category') }}</div>
        <div class="flex flex-wrap gap-2">
          <button v-for="c in EVENT_CATEGORIES" :key="c" type="button" :class="[chip, on(filters.cats.includes(c))]" :aria-pressed="filters.cats.includes(c)" @click="toggleCat(c)">{{ t(`events.category.${c}`) }}</button>
        </div>
      </div>
      <div>
        <div class="text-[13px] font-semibold mb-2">{{ t('events.filters.price') }}</div>
        <div class="flex flex-wrap gap-2">
          <button v-for="[v, l] in ([['free', 'free'], ['app', 'inApp'], ['ext', 'external']] as const)" :key="v" type="button" :class="[chip, on(filters.price === v)]" @click="pick('price', v)">{{ t(`events.filters.${l}`) }}</button>
        </div>
      </div>
      <div>
        <div class="text-[13px] font-semibold mb-2">{{ t('events.filters.organizer') }}</div>
        <div class="flex flex-wrap gap-2">
          <button v-for="[v, l] in ([['inst', 'institutions'], ['biz', 'businesses'], ['city', 'city']] as const)" :key="v" type="button" :class="[chip, on(filters.org === v)]" @click="pick('org', v)">{{ t(`events.filters.${l}`) }}</button>
        </div>
      </div>
      <div>
        <div class="text-[13px] font-semibold mb-2">{{ t('events.filters.distance') }}</div>
        <div class="flex flex-wrap gap-2">
          <button v-for="[v, l] in ([['city', 'inCity'], ['county', 'county']] as const)" :key="v" type="button" :class="[chip, on(filters.dist === v)]" @click="pick('dist', v)">{{ t(`events.filters.${l}`) }}</button>
        </div>
      </div>
      <button type="button" class="w-full min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold" @click="filters.sheetOpen = false">{{ t('events.filters.show', { n: count }) }}</button>
    </div>
  </AppSheet>
</template>
