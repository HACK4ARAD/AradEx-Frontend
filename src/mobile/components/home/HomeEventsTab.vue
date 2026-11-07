<script setup lang="ts">
// T06 · tab-ul Evenimente din Acasă (S1) — design/final `/home` mode „ev”: planificator (vizitator), chips, număr, lista de EventCard,
// apoi „Locuri din Arad” (obiectivele cu ghid din T05, pe orizontală) și „Toate obiectivele și localurile”.
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventCard from '@/shared/components/events/EventCard.vue'
import EventFiltersSheet from '@/shared/components/events/EventFiltersSheet.vue'
import HomePlaceCard from '@/mobile/components/home/HomePlaceCard.vue'
import { placesApi } from '@/shared/api/places'
import type { PlaceSummary } from '@/shared/types/places'
import { periodRange, useEventFilters, useEventList, useSaveEvent } from '@/shared/composables/useEvents'
import { useAuthStore } from '@/shared/stores/auth'
import type { EventQuery } from '@/shared/types/events'

type Period = 'near' | 'today' | 'weekend' | 'week'
const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const period = ref<Period>('today')
const { active, query: filterQuery, byDistance } = useEventFilters()
const saver = useSaveEvent()

const query = computed<EventQuery>(() => ({
  ...filterQuery.value,
  ...(period.value === 'near' ? { sort: 'distance' as const, radiusKm: 15 } : periodRange(period.value)),
}))
const { items, loading, reload, geo } = useEventList(query)
const list = computed(() => byDistance(items.value))
const isVisitor = computed(() => !auth.user || auth.user.role === 'VISITOR')

function choose(p: Period) {
  period.value = p
  if (p === 'near') void geo.locate()
}
const places = shallowRef<PlaceSummary[]>([])
onMounted(async () => {
  try {
    // design: obiectivele cu ghid din centru, cele mai apropiate primele
    const withGuide = (await placesApi.list({ near: geo.near() })).filter((p) => p.guidePointsCount > 0)
    const FIRST = [1, 2, 3, 8] // design: Cetatea, Palatul Cultural, Teatrul Clasic, Turnul de Apă; apoi cele mai apropiate
    places.value = [...withGuide.filter((p) => FIRST.includes(p.id)).sort((a, b) => FIRST.indexOf(a.id) - FIRST.indexOf(b.id)), ...withGuide.filter((p) => !FIRST.includes(p.id))].slice(0, 6)
  } catch { /* secțiunea rămâne ascunsă */ }
})
const chips: { key: Period; icon?: string }[] = [{ key: 'near', icon: 'near_me' }, { key: 'today' }, { key: 'weekend' }, { key: 'week' }]
</script>

<template>
  <button v-if="isVisitor" type="button" class="w-full flex items-center gap-3 px-4 py-3.5 rounded-[20px] bg-ink text-white mb-3.5 text-left" @click="router.push('/m/plan')">
    <AppIcon name="auto_awesome" />
    <span class="flex-1 min-w-0"><b class="block text-[15px] leading-[1.3]">{{ t('home.planCta') }}</b><span class="block text-[13px] leading-[1.35] opacity-[.78]">{{ t('events.home.plannerSub') }}</span></span>
    <AppIcon name="chevron_right" />
  </button>

  <div class="flex gap-2 overflow-x-auto -mx-5 px-5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <button v-for="c in chips" :key="c.key" type="button" :aria-pressed="period === c.key"
      class="min-h-11 px-4 rounded-full inline-flex items-center gap-1.5 shrink-0 text-[14px] font-medium border whitespace-nowrap transition-colors"
      :class="period === c.key ? 'bg-ink text-white border-ink font-semibold' : 'bg-white border-line text-ink'" @click="choose(c.key)">
      <AppIcon v-if="c.icon" :name="c.icon" :size="18" />{{ c.key === 'near' ? t('events.nearMe') : t(`events.period.${c.key}`) }}
    </button>
  </div>

  <div class="flex items-center justify-between mt-3.5 mb-2.5">
    <span class="text-muted text-[14px]">{{ t('events.count', list.length) }}<template v-if="active"> · {{ t('events.filtered') }}</template></span>
    <span class="text-muted text-[12.5px]">{{ t('events.realAndDemo') }}</span>
  </div>

  <Skeleton v-if="loading && !list.length" :rows="2" :height="300" />
  <template v-else-if="list.length">
    <EventCard v-for="e in list" :key="e.id" :event="e" :to="`/m/events/${e.id}`" @toggle-save="saver.toggle(e, '/m/login')" />
  </template>
  <EmptyState v-else icon="event_busy" :title="t('events.empty.title')" :text="t('events.empty.text')" :action="t('events.empty.action')" @action="choose('week'); reload()" />

  <template v-if="places.length">
    <div class="mt-2.5 mb-2.5">
      <h2 class="text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] m-0">{{ t('events.home.placesTitle') }}</h2>
      <p class="text-muted text-[14px] mt-1 mb-0">{{ t('events.home.placesText') }}</p>
    </div>
    <div class="flex gap-3 overflow-x-auto -mx-5 px-5 pt-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <HomePlaceCard v-for="p in places" :key="p.id" :place="p" />
    </div>
    <router-link to="/m/places" class="mt-1 flex items-center justify-center w-full min-h-[52px] rounded-[16px] bg-white border border-line text-ink text-[16px] font-semibold no-underline">{{ t('events.home.allPlaces') }}</router-link>
  </template>

  <EventFiltersSheet :count="list.length" />
</template>
