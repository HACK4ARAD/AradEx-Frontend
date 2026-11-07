<script setup lang="ts">
// Pagina publică a firmei pe mobil (T09; design/final mobile.html „Pagina firmei”): poză, insigne, oferte (T10), evenimente, anunțuri, despre.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import AnnouncementItem from '@/shared/components/business/AnnouncementItem.vue'
import BusinessContact from '@/shared/components/business/BusinessContact.vue'
import PublicEventRow from '@/shared/components/business/PublicEventRow.vue'
import OfferCard from '@/shared/components/offers/OfferCard.vue'
import GoogleReviews from '@/shared/components/google/GoogleReviews.vue'
import { directionsUrl, useBusinessPage } from '@/shared/composables/useBusiness'
import { useBack } from '@/shared/composables/useBack'

const route = useRoute()
const { t } = useI18n()
const back = useBack('/')
const id = computed(() => Number(route.params.id))
const { data, loading, error, notFound, reload } = useBusinessPage(id)
const b = computed(() => data.value?.business)
const maps = computed(() => (b.value ? directionsUrl(b.value.lat, b.value.lng, b.value.address) : null))
</script>

<template>
  <div class="-mx-5 -mt-3">
    <div class="relative h-[240px] bg-soft bg-cover bg-center" :style="b?.imageUrl ? { backgroundImage: `url('${b.imageUrl}')` } : {}">
      <button class="absolute left-4 top-[max(14px,env(safe-area-inset-top))] w-11 h-11 rounded-full bg-white/90 flex items-center justify-center" :aria-label="t('common.back')" @click="back">
        <AppIcon name="arrow_back" />
      </button>
    </div>
  </div>

  <div class="pt-4">
    <Skeleton v-if="loading" :rows="4" />
    <EmptyState v-else-if="notFound" icon="storefront" :title="t('business.public.notFound')" :text="t('business.public.notFoundText')" :action="t('business.public.back')" @action="back" />
    <EmptyState v-else-if="error || !data" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />
    <template v-else-if="b">
      <div class="flex flex-wrap gap-2">
        <span v-if="b.verified" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-green text-white text-[12.5px] font-semibold"><AppIcon name="verified" :size="16" />{{ t('business.public.verified') }}</span>
        <span v-else class="inline-flex items-center h-7 px-2.5 rounded-full bg-warn-soft text-warn text-[12.5px] font-semibold">{{ t('business.public.pending') }}</span>
      </div>
      <h1 class="text-[28px] font-semibold tracking-[-0.025em] leading-tight m-0 mt-2.5">{{ b.name }}</h1>
      <p class="text-muted text-[14.5px] m-0 mt-1">{{ t(`business.category.${b.category}`) }}<template v-if="b.address"> · {{ b.address }}</template></p>

      <div class="flex gap-2 mt-4">
        <a v-if="maps" :href="maps" target="_blank" rel="noopener" class="flex-1 h-10 rounded-[12px] border border-line bg-white flex items-center justify-center gap-1.5 text-[14px] font-semibold no-underline text-ink">
          <AppIcon name="directions" :size="18" />{{ t('business.public.directions') }}
        </a>
        <a v-if="b.phone" :href="`tel:${b.phone}`" class="flex-1 h-10 rounded-[12px] border border-line bg-white flex items-center justify-center gap-1.5 text-[14px] font-semibold no-underline text-ink">
          <AppIcon name="call" :size="18" />{{ t('business.public.call') }}
        </a>
      </div>

      <template v-if="data.offers.length">
        <h3 class="text-[18px] font-semibold mt-6 mb-2.5">{{ t('business.public.offers') }}</h3>
        <div class="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          <OfferCard v-for="o in data.offers" :key="o.id" :offer="o" :to="`/offers/${o.id}`" compact class="w-[230px] shrink-0" />
        </div>
      </template>

      <h3 class="text-[18px] font-semibold mt-6 mb-2.5">{{ t('business.public.events') }}</h3>
      <div v-if="data.events.length" class="flex flex-col gap-2.5">
        <PublicEventRow v-for="e in data.events" :key="e.id" :event="e" :to="`/events/${e.id}`" />
      </div>
      <div v-else class="bg-white rounded-[16px] p-4 text-[14px] text-muted">{{ t('business.public.noEventsText') }}</div>

      <template v-if="data.announcements.length">
        <h3 class="text-[18px] font-semibold mt-6 mb-2.5">{{ t('business.public.announcements') }}</h3>
        <div class="flex flex-col gap-2.5">
          <AnnouncementItem v-for="a in data.announcements" :key="a.id" :announcement="a" />
        </div>
      </template>

      <!-- T17: ratingul și recenziile Google, doar dacă firma și-a legat pagina de pe Google -->
      <GoogleReviews kind="business" :id="b.id" />

      <div class="mt-6"><BusinessContact :business="b" /></div>
    </template>
  </div>
</template>
