<script setup lang="ts">
// W15 — Pagina publică a firmei (T09; design/final web.html #/businesses/:id): antet cu insigne și acțiuni, oferte (T10),
// evenimente viitoare, anunțuri; în dreapta harta mică cu pinul firmei (T23) + despre + contact.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import AnnouncementItem from '@/shared/components/business/AnnouncementItem.vue'
import BusinessContact from '@/shared/components/business/BusinessContact.vue'
import GoogleReviews from '@/shared/components/google/GoogleReviews.vue'
import PublicEventRow from '@/shared/components/business/PublicEventRow.vue'
import MapView from '@/shared/components/map/MapView.vue'
import type { MapMarker } from '@/shared/components/map/types'
import { directionsUrl, useBusinessPage } from '@/shared/composables/useBusiness'
import { useAuthStore } from '@/shared/stores/auth'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const id = computed(() => Number(route.params.id))
const { data, loading, error, notFound, reload } = useBusinessPage(id)
const b = computed(() => data.value?.business)
const maps = computed(() => (b.value ? directionsUrl(b.value.lat, b.value.lng, b.value.address) : null))

/* T23 · harta mică: pinul firmei; „Indicații” deschide traseul pe harta noastră (/map?to=offer:<id>) pentru conturile personale
   când firma are oferte (doar atunci e pin pe hartă), altfel Google Maps */
const auth = useAuthStore()
const pin = computed<MapMarker | null>(() => (b.value?.lat != null && b.value.lng != null
  ? { id: `offer:${b.value.id}`, lat: b.value.lat, lng: b.value.lng, kind: 'offer' } : null))
const inAppRoute = computed(() => !!pin.value && !!data.value?.offers.length && auth.hasRole('VISITOR', 'LOCAL'))
</script>

<template>
  <Skeleton v-if="loading" :rows="4" :height="96" />
  <EmptyState v-else-if="notFound" icon="storefront" :title="t('business.public.notFound')" :text="t('business.public.notFoundText')" :action="t('business.public.back')" @action="router.push('/')" />
  <EmptyState v-else-if="error || !data" icon="cloud_off" :title="t('business.loadError')" :action="t('common.retry')" @action="reload" />
  <template v-else-if="b">
    <div class="bg-white rounded-[20px] p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div class="w-[88px] h-[88px] rounded-[16px] bg-soft bg-cover bg-center shrink-0" :style="b.imageUrl ? { backgroundImage: `url('${b.imageUrl}')` } : {}" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2.5">
          <h1 class="text-[30px] font-semibold tracking-[-0.025em] leading-tight m-0">{{ b.name }}</h1>
          <span v-if="b.verified" class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-ok-soft text-ok text-[12.5px] font-semibold"><AppIcon name="verified" :size="16" />{{ t('business.public.verified') }}</span>
          <span v-else class="inline-flex items-center h-7 px-2.5 rounded-full bg-warn-soft text-warn text-[12.5px] font-semibold">{{ t('business.public.pending') }}</span>
        </div>
        <p class="text-muted text-[14.5px] m-0 mt-1">{{ t(`business.category.${b.category}`) }}<template v-if="b.address"> · {{ b.address }}</template></p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a v-if="maps" :href="maps" target="_blank" rel="noopener" class="h-10 px-4 rounded-[12px] border border-line flex items-center gap-1.5 text-[14px] font-semibold no-underline text-ink">
          <AppIcon name="directions" :size="18" />{{ t('business.public.directions') }}
        </a>
        <a v-if="b.phone" :href="`tel:${b.phone}`" class="h-10 px-4 rounded-[12px] border border-line flex items-center gap-1.5 text-[14px] font-semibold no-underline text-ink">
          <AppIcon name="call" :size="18" />{{ b.phone }}
        </a>
        <a v-if="b.website" :href="b.website" target="_blank" rel="noopener" class="h-10 px-4 rounded-[12px] bg-ink text-white flex items-center gap-1.5 text-[14px] font-semibold no-underline">
          <AppIcon name="language" :size="18" />{{ t('business.public.website') }}
        </a>
      </div>
    </div>

    <div class="grid gap-6 mt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="min-w-0">
        <h2 class="text-[20px] font-semibold m-0 mb-3">{{ t('business.public.events') }}</h2>
        <div v-if="data.events.length" class="flex flex-col gap-2.5">
          <PublicEventRow v-for="e in data.events" :key="e.id" :event="e" :to="`/events/${e.id}`" />
        </div>
        <div v-else class="bg-white rounded-[16px] p-4 text-[14px] text-muted">{{ t('business.public.noEventsText') }}</div>

        <template v-if="data.announcements.length">
          <h2 class="text-[20px] font-semibold m-0 mt-7 mb-3">{{ t('business.public.announcements') }}</h2>
          <div class="flex flex-col gap-2.5">
            <AnnouncementItem v-for="a in data.announcements" :key="a.id" :announcement="a" />
          </div>
        </template>

        <!-- T17: ratingul și recenziile Google, doar dacă firma și-a legat pagina de pe Google -->
        <GoogleReviews kind="business" :id="b.id" />
      </div>
      <aside class="flex flex-col gap-3 min-w-0">
        <div v-if="pin" class="bg-white rounded-[16px] overflow-hidden">
          <div class="relative isolate h-[220px] bg-soft">
            <MapView :markers="[pin]" :selected-id="pin.id" :center="pin" :zoom="15" />
          </div>
          <div class="p-3 flex items-center gap-2">
            <span class="flex-1 min-w-0 text-[13.5px] text-muted truncate">{{ b.address }}</span>
            <router-link v-if="inAppRoute" :to="{ path: '/map', query: { to: pin.id } }" class="h-9 px-3.5 rounded-[12px] bg-ink text-white flex items-center gap-1.5 text-[13.5px] font-semibold no-underline shrink-0">
              <AppIcon name="directions" :size="18" />{{ t('business.public.directions') }}
            </router-link>
            <a v-else-if="maps" :href="maps" target="_blank" rel="noopener" class="h-9 px-3.5 rounded-[12px] bg-ink text-white flex items-center gap-1.5 text-[13.5px] font-semibold no-underline shrink-0">
              <AppIcon name="directions" :size="18" />{{ t('business.public.directions') }}
            </a>
          </div>
        </div>
        <BusinessContact :business="b" />
      </aside>
    </div>
  </template>
</template>
