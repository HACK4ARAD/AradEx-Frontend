<script setup lang="ts">
// T06 / T23 · coloana „Filtre” din W5 (design/final `.fcol`): Categorie, Preț, Organizator, Distanță ca bife + „Șterge filtrele”.
// Aceleași filtre ca sheet-ul din aplicație (`useEventFilters`), altă așezare.
import { useI18n } from 'vue-i18n'
import AppIcon from '@/shared/components/ui/AppIcon.vue'
import { useEventFilters, type EventFilters } from '@/shared/composables/useEvents'
import { EVENT_CATEGORIES, type EventCategory } from '@/shared/types/events'

const { t } = useI18n()
const { filters, clear } = useEventFilters()

function toggleCat(c: EventCategory) {
  const i = filters.cats.indexOf(c)
  if (i >= 0) filters.cats.splice(i, 1)
  else filters.cats.push(c)
}
/** O singură opțiune pe grup (a doua apăsare o scoate), ca în design. */
function pick(k: 'price' | 'org' | 'dist', v: string) {
  const next = filters[k] === v ? '' : v
  if (k === 'price') filters.price = next as EventFilters['price']
  else if (k === 'org') filters.org = next as EventFilters['org']
  else filters.dist = next as EventFilters['dist']
}
const groups = [
  { key: 'price' as const, title: 'events.filters.price', opts: [['free', 'events.filters.free'], ['app', 'events.filters.inAppWeb'], ['ext', 'events.filters.external']] as const },
  { key: 'org' as const, title: 'events.filters.organizer', opts: [['inst', 'events.filters.institutions'], ['biz', 'events.filters.businesses'], ['city', 'events.filters.city']] as const },
  { key: 'dist' as const, title: 'events.filters.distance', opts: [['city', 'events.filters.inCity'], ['county', 'events.filters.countyWeb']] as const },
]
const h4 = 'mt-3.5 mb-1.5 text-[11px] tracking-[.08em] uppercase text-muted font-semibold'
const row = 'flex items-center gap-2 py-[5px] text-[13.5px] cursor-pointer text-left w-full'
const box = (on: boolean) => ['w-4 h-4 rounded-[4px] border-[1.5px] inline-flex items-center justify-center text-white shrink-0', on ? 'bg-ink border-ink' : 'border-[#C9C9C2]']
</script>

<template>
  <div>
    <h4 :class="h4" class="mt-0">{{ t('events.filters.category') }}</h4>
    <button v-for="c in EVENT_CATEGORIES" :key="c" type="button" role="checkbox" :aria-checked="filters.cats.includes(c)" :class="row" @click="toggleCat(c)">
      <i :class="box(filters.cats.includes(c))"><AppIcon v-if="filters.cats.includes(c)" name="check" :size="13" /></i>{{ t(`events.category.${c}`) }}
    </button>
    <template v-for="g in groups" :key="g.key">
      <h4 :class="h4">{{ t(g.title) }}</h4>
      <button v-for="[v, l] in g.opts" :key="v" type="button" role="checkbox" :aria-checked="filters[g.key] === v" :class="row" @click="pick(g.key, v)">
        <i :class="box(filters[g.key] === v)"><AppIcon v-if="filters[g.key] === v" name="check" :size="13" /></i>{{ t(l) }}
      </button>
    </template>
    <button type="button" class="mt-4 h-8 px-[11px] rounded-[9px] border border-line bg-white text-[13px] font-semibold" @click="clear">{{ t('events.filters.clearWeb') }}</button>
  </div>
</template>
