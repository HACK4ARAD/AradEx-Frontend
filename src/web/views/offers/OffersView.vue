<script setup lang="ts">
// T23 · W11 — ofertele pe web (design/final web `/offers`): titlu, bannerul galben, categoriile, soldul de puncte (conturile care
// strâng puncte) și grila de carduri spre /offers/:id. Aceleași date și componente ca tab-ul Oferte din aplicație (useOfferList).
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import OfferBanner from '@/shared/components/offers/OfferBanner.vue'
import OfferCard from '@/shared/components/offers/OfferCard.vue'
import OfferCategoryBar from '@/shared/components/offers/OfferCategoryBar.vue'
import { useOfferList, type OfferFilter } from '@/shared/composables/useOffers'
import { earnsPoints, usePoints } from '@/shared/composables/useCommunity'
import { useFormat } from '@/shared/composables/useFormat'
import { useAuthStore } from '@/shared/stores/auth'

const { t } = useI18n()
const f = useFormat()
const auth = useAuthStore()
const filter = ref<OfferFilter>('ALL')
const { items, loading, error, reload } = useOfferList(filter)

const pts = usePoints()
const canEarn = computed(() => earnsPoints(auth.role))
if (canEarn.value) void pts.load()
const balance = computed(() => pts.points.value?.balance ?? auth.user?.pointsBalance ?? 0)
</script>

<template>
  <h1 class="text-[30px] md:text-[34px] font-semibold tracking-[-0.025em] leading-tight m-0">{{ t('offers.web.title') }}</h1>
  <p class="text-muted text-[15px] m-0 mt-1.5 max-w-[640px]">{{ t('offers.web.sub') }}</p>

  <div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
    <OfferBanner @pick="filter = 'CAFE'" />
    <OfferCategoryBar v-model="filter" />
  </div>

  <div v-if="canEarn" class="mt-4 rounded-[16px] bg-green-soft text-green-deep p-3.5 flex items-center gap-3 text-[14px]">
    <AppIcon name="stars" class="text-green shrink-0" />
    <span>{{ t('offers.web.points', { points: f.points(balance) }) }}</span>
  </div>

  <div v-if="!loading && !error" class="mt-5 mb-3 text-muted text-[14px]">
    {{ t('offers.count', items.length) }}<template v-if="filter !== 'ALL'"> · {{ t('offers.filtered') }}</template>
  </div>
  <div :class="{ 'mt-5': loading || !!error }">
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" :rows="1" :height="250" />
    </div>
    <EmptyState v-else-if="error" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />
    <EmptyState v-else-if="!items.length" icon="sell" :title="t('offers.empty')" :text="t('offers.emptyText')" :action="t('offers.cats.ALL')" @action="filter = 'ALL'" />
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <OfferCard v-for="o in items" :key="o.id" :offer="o" :to="`/offers/${o.id}`" class="border border-line" />
    </div>
  </div>
</template>
