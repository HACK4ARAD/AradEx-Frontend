<script setup lang="ts">
// S1 Acasă — cochilie (T02) după design/final `/home`: antet, căutare + filtre, cele 3 moduri; fiecare mod e componenta story-ului lui
// (T06 evenimente, T10 oferte, T11 comunitate). Vizitatorul nu are Comunitate (punctele sunt pentru localnici).
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import ApiStatus from '@/shared/components/ui/ApiStatus.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { useEventFilters } from '@/shared/composables/useEvents'
import { eventsApi } from '@/shared/api/events'
import { offersApi } from '@/shared/api/offers'
import { useAuthStore } from '@/shared/stores/auth'
import HomeEventsTab from '@/mobile/components/home/HomeEventsTab.vue'
import HomeOffersTab from '@/mobile/components/home/HomeOffersTab.vue'
import HomeCommunityTab from '@/mobile/components/home/HomeCommunityTab.vue'

type Mode = 'events' | 'offers' | 'community'
const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const f = useFormat()
const { filters, active: filtersActive } = useEventFilters()
const mode = ref<Mode>('events')
const todayCount = ref<number | null>(null)
const offersCount = ref<number | null>(null)

const isVisitor = computed(() => !auth.user || auth.user.role === 'VISITOR')
const initials = computed(() => (auth.user?.displayName ?? '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase())
const modes = computed(() => [
  { key: 'events' as const, emoji: '🎭', label: t('nav.events'), sub: todayCount.value == null ? '' : t('home.todayCount', { n: todayCount.value }) },
  { key: 'offers' as const, emoji: '🏷️', label: t('nav.offers'), sub: offersCount.value == null ? '' : t('home.offersCount', offersCount.value) },
  ...(isVisitor.value ? [] : [{ key: 'community' as const, emoji: '🌳', label: t('nav.community'), sub: f.points(auth.user?.pointsBalance ?? 0) }]),
])

function openFilters() {
  mode.value = 'events'
  filters.sheetOpen = true
}

onMounted(async () => {
  await Promise.all([
    eventsApi.list({ to: f.todayIso(), size: 1 }).then((p) => { todayCount.value = p.totalElements }).catch(() => { /* fără număr */ }),
    offersApi.list().then((l) => { offersCount.value = l.length }).catch(() => { /* fără număr */ }),
  ])
})
</script>

<template>
  <div class="flex items-start justify-between gap-3 pt-2 mb-3.5">
    <div class="flex flex-col gap-1.5">
      <div class="text-[14px] text-muted font-medium">{{ f.longDate(new Date().toISOString()) }}</div>
      <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ t('home.title') }}</h1>
    </div>
    <router-link v-if="auth.user" to="/profile" class="w-11 h-11 shrink-0 rounded-full bg-ink text-white text-[17px] font-bold flex items-center justify-center no-underline" :aria-label="t('nav.profile')">{{ initials }}</router-link>
    <router-link v-else to="/profile" class="w-11 h-11 shrink-0 rounded-full bg-white border border-line text-ink flex items-center justify-center no-underline" :aria-label="t('nav.profile')"><AppIcon name="person" /></router-link>
  </div>

  <div class="flex items-center gap-2.5">
    <button type="button" class="flex-1 min-w-0 h-[52px] px-4 rounded-[16px] bg-white border border-line text-muted text-[16px] flex items-center gap-2.5 text-left" @click="router.push('/search')">
      <AppIcon name="search" /><span class="truncate">{{ t('common.search') }}</span>
    </button>
    <button type="button" class="relative w-[52px] h-[52px] shrink-0 rounded-[16px] bg-white border border-line flex items-center justify-center" :aria-label="t('events.filters.aria')" @click="openFilters">
      <AppIcon name="tune" />
      <span v-if="filtersActive" class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent" />
    </button>
  </div>

  <div class="grid gap-2.5 mt-4 mb-3.5" :class="modes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'">
    <button v-for="m in modes" :key="m.key" type="button" :aria-pressed="mode === m.key"
      class="relative h-[92px] rounded-[20px] border px-3 pt-3 pb-2.5 flex flex-col justify-end gap-px text-left transition-colors"
      :class="mode === m.key ? 'bg-ink text-white border-ink shadow-[0_10px_24px_rgba(17,17,17,.18)]' : 'bg-white border-line shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)]'"
      @click="mode = m.key">
      <span class="absolute top-2.5 right-3 text-[24px]" aria-hidden="true">{{ m.emoji }}</span>
      <b class="text-[15.5px] whitespace-nowrap">{{ m.label }}</b>
      <span class="text-[12.5px] whitespace-nowrap" :class="mode === m.key ? 'opacity-75' : 'text-muted'">{{ m.sub || ' ' }}</span>
    </button>
  </div>

  <HomeEventsTab v-if="mode === 'events'" />
  <HomeOffersTab v-else-if="mode === 'offers'" />
  <HomeCommunityTab v-else />

  <div class="flex justify-center mt-2"><ApiStatus /></div>
</template>
