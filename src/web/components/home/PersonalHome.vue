<script setup lang="ts">
// T23 · W1 pentru un cont personal conectat (Vizitator / Localnic), ca Acasă din aplicație (design/final web `/`): data de azi,
// „Ce faci în Arad?”, căutare (→ /events?q=), Azi / Weekend / 7 zile, până la 6 evenimente; în dreapta harta de azi (pinii din
// useMapData, chips pe tip, „Deschide harta”), punctele (localnic) sau ce e Comunitatea, următoarele 2 acțiuni; jos câteva oferte.
// Lăsate deoparte din design: „Locuri din Arad” și cardul planificatorului AI (web-ul nu are paginile de obiective / planificator).
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppChip, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventCardWeb from '@/shared/components/events/EventCardWeb.vue'
import OfferCard from '@/shared/components/offers/OfferCard.vue'
import PointsCard from '@/shared/components/community/PointsCard.vue'
import MapView from '@/shared/components/map/MapView.vue'
import { periodRange, useEventList } from '@/shared/composables/useEvents'
import { filterItems, useMapData, type MapKind, type MapPeriod } from '@/shared/composables/useMapData'
import { useOfferList, type OfferFilter } from '@/shared/composables/useOffers'
import { useActions, usePoints } from '@/shared/composables/useCommunity'
import { useFormat } from '@/shared/composables/useFormat'
import { useAuthStore } from '@/shared/stores/auth'
import type { EventQuery } from '@/shared/types/events'

type Period = 'today' | 'weekend' | 'week'
const { t } = useI18n()
const router = useRouter()
const f = useFormat()
const auth = useAuthStore()
const isLocal = computed(() => auth.role === 'LOCAL')
const firstName = computed(() => (auth.user?.displayName ?? '').trim().split(/\s+/)[0])
const today = f.longDate(new Date().toISOString())

// căutare → lista de evenimente
const q = ref('')
function search() {
  const term = q.value.trim()
  router.push(term ? { path: '/events', query: { q: term } } : '/events')
}

// evenimente
const period = ref<Period>('today')
const periods: { key: Period; label: string }[] = [
  { key: 'today', label: 'events.period.today' }, { key: 'weekend', label: 'events.period.weekendShort' }, { key: 'week', label: 'events.period.weekShort' },
]
const query = computed<EventQuery>(() => ({ ...periodRange(period.value), size: 6 }))
const events = useEventList(query)
const shownEvents = computed(() => events.items.value.slice(0, 6))

// hartă (azi)
const mapPeriod = ref<MapPeriod>('today')
const map = useMapData(mapPeriod)
const kind = ref<'all' | MapKind>('all')
const kinds: ('all' | MapKind)[] = ['all', 'event', 'offer', 'place']
const mapItems = computed(() => filterItems(map.items.value, kind.value))
const markers = computed(() => mapItems.value.map((i) => ({ id: i.key, lat: i.lat, lng: i.lng, kind: i.kind })))
function openPin(id: string | null) {
  const item = id ? map.items.value.find((i) => i.key === id) : undefined
  if (!item) return
  // obiectivele n-au pagină pe web: se deschid pe hartă
  router.push(item.kind === 'place' ? { path: '/map', query: { to: item.key } } : item.href)
}

// comunitate + oferte
const actions = useActions()
const nextActions = computed(() => actions.actions.value.slice(0, 2))
const pts = usePoints()
const offers = useOfferList(ref<OfferFilter>('ALL'))
const shownOffers = computed(() => offers.items.value.slice(0, 4))

onMounted(() => {
  void map.load()
  void actions.load()
  if (isLocal.value) void pts.load()
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
    <div class="min-w-0">
      <div class="text-muted text-[13.5px] font-semibold">{{ today }}<template v-if="firstName"> · {{ t('events.personalHome.greeting', { name: firstName }) }}</template></div>
      <h1 class="text-[32px] md:text-[40px] font-semibold tracking-[-0.03em] leading-tight m-0 mt-1">{{ t('events.personalHome.title') }}</h1>

      <form class="flex gap-2 mt-[18px]" role="search" @submit.prevent="search">
        <label class="flex-1 min-w-0 h-[46px] rounded-[14px] bg-white border border-line flex items-center gap-2 px-3.5">
          <AppIcon name="search" :size="20" class="text-muted shrink-0" />
          <input v-model="q" type="search" :placeholder="t('events.personalHome.searchPh')" :aria-label="t('events.personalHome.search')"
            class="flex-1 min-w-0 bg-transparent outline-none text-[15px]">
        </label>
        <router-link to="/events" class="w-[46px] h-[46px] shrink-0 rounded-[14px] bg-white border border-line flex items-center justify-center text-ink"
          :aria-label="t('events.personalHome.filters')"><AppIcon name="tune" :size="20" /></router-link>
      </form>

      <div class="flex flex-wrap gap-2 mt-3.5 mb-[18px]">
        <AppChip v-for="p in periods" :key="p.key" :active="period === p.key" @click="period = p.key">{{ t(p.label) }}</AppChip>
      </div>

      <Skeleton v-if="events.loading.value && !shownEvents.length" :rows="2" :height="220" />
      <EmptyState v-else-if="events.error.value" icon="cloud_off" :title="t('events.personalHome.loadError')" :action="t('common.retry')" @action="events.reload" />
      <EmptyState v-else-if="!shownEvents.length" icon="event_busy" :title="t('events.empty.title')" :text="t('events.empty.text')"
        :action="t('events.empty.action')" @action="period = 'week'" />
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        <EventCardWeb v-for="e in shownEvents" :key="e.id" :event="e" :to="`/events/${e.id}`" />
      </div>
      <router-link to="/events" class="mt-4 inline-flex items-center gap-1 h-10 px-4 rounded-[12px] border border-line bg-white text-[14px] font-semibold text-ink no-underline">
        {{ t('events.personalHome.allEvents') }}<AppIcon name="arrow_forward" :size="18" />
      </router-link>

      <section v-if="shownOffers.length" class="mt-8">
        <div class="flex items-center justify-between gap-3 mb-3">
          <h2 class="text-[22px] font-semibold tracking-[-0.02em] m-0">{{ t('events.personalHome.offersTitle') }}</h2>
          <router-link to="/offers" class="inline-flex items-center gap-1 text-[14px] font-semibold text-ink no-underline hover:underline shrink-0">
            {{ t('events.personalHome.allOffers') }}<AppIcon name="arrow_forward" :size="16" />
          </router-link>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          <OfferCard v-for="o in shownOffers" :key="o.id" :offer="o" :to="`/offers/${o.id}`" compact class="border border-line" />
        </div>
      </section>
    </div>

    <aside class="flex flex-col gap-3.5 min-w-0">
      <div class="bg-white border border-line rounded-[16px] overflow-hidden">
        <div class="flex flex-wrap gap-1.5 px-3 py-2.5">
          <button v-for="k in kinds" :key="k" type="button" :aria-pressed="kind === k"
            class="h-8 px-3 rounded-full border text-[13px] font-medium" :class="kind === k ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line'"
            @click="kind = k">{{ t(`map.kind.${k}`) }}</button>
        </div>
        <div class="h-[300px] relative isolate">
          <MapView :markers="markers" :zoom="13" @select="openPin" />
        </div>
        <div class="flex items-center gap-3 px-3 py-2.5">
          <span class="flex-1 text-muted text-[12.5px]">{{ t('events.personalHome.mapCount', { n: mapItems.length }) }}</span>
          <router-link to="/map" class="h-9 px-3.5 rounded-[12px] bg-ink text-white text-[13.5px] font-semibold no-underline inline-flex items-center">{{ t('events.personalHome.openMap') }}</router-link>
        </div>
      </div>

      <div class="bg-white border border-line rounded-[16px] p-4">
        <template v-if="isLocal">
          <Skeleton v-if="pts.loading.value" :rows="1" :height="150" />
          <PointsCard v-else-if="pts.points.value" :points="pts.points.value" to="/account/points" />
        </template>
        <template v-else>
          <div class="flex items-center gap-2.5"><AppIcon name="volunteer_activism" /><b class="text-[15px]">{{ t('events.personalHome.communityTitle') }}</b></div>
          <p class="text-muted text-[13.5px] leading-relaxed m-0 mt-1.5">{{ t('events.personalHome.communityText') }}</p>
        </template>

        <div class="mt-3">
          <Skeleton v-if="actions.loading.value" :rows="2" :height="48" />
          <p v-else-if="!nextActions.length" class="text-muted text-[13.5px] m-0">{{ t('events.personalHome.noActions') }}</p>
          <template v-else>
            <router-link v-for="a in nextActions" :key="a.id" :to="`/community/actions/${a.id}`"
              class="flex items-center gap-3 py-2.5 border-b border-line last:border-b-0 no-underline text-ink">
              <span class="rounded-full bg-green-soft text-green-deep text-[12px] font-bold px-2 py-0.5 shrink-0">+{{ a.pointsReward }}</span>
              <span class="flex-1 min-w-0">
                <b class="block text-[13.5px] leading-snug">{{ a.title }}</b>
                <span class="block text-muted text-[12.5px]">{{ f.dateTime(a.startAt) }} · {{ a.registeredCount }}/{{ a.capacity }}</span>
              </span>
              <AppIcon name="chevron_right" :size="18" class="text-muted" />
            </router-link>
          </template>
        </div>
        <router-link to="/community" class="mt-2 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink no-underline hover:underline">
          {{ t('events.personalHome.allActions') }}<AppIcon name="arrow_forward" :size="16" />
        </router-link>
      </div>
    </aside>
  </div>
</template>
