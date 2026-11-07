<script setup lang="ts">
// W15 — Pagina publică a firmei (T09; design/final web.html #/businesses/:id): antet cu insigne și acțiuni, oferte (T10),
// evenimente viitoare, anunțuri; în dreapta despre + contact. Harta din design vine cu MapView (T08).
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import AnnouncementItem from '@/shared/components/business/AnnouncementItem.vue'
import BusinessContact from '@/shared/components/business/BusinessContact.vue'
import PublicEventRow from '@/shared/components/business/PublicEventRow.vue'
import { directionsUrl, useBusinessPage } from '@/shared/composables/useBusiness'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const id = computed(() => Number(route.params.id))
const { data, loading, error, notFound, reload } = useBusinessPage(id)
const b = computed(() => data.value?.business)
const maps = computed(() => (b.value ? directionsUrl(b.value.lat, b.value.lng, b.value.address) : null))
</script>

<template>
  <Skeleton v-if="loading" :rows="4" :height="96" />
  <EmptyState v-else-if="notFound" icon="storefront" :title="t('business.public.notFound')" :text="t('business.public.notFoundText')" :action="t('business.public.back')" @action="router.push('/w')" />
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
          <PublicEventRow v-for="e in data.events" :key="e.id" :event="e" :to="`/w/events/${e.id}`" />
        </div>
        <div v-else class="bg-white rounded-[16px] p-4 text-[14px] text-muted">{{ t('business.public.noEventsText') }}</div>

        <template v-if="data.announcements.length">
          <h2 class="text-[20px] font-semibold m-0 mt-7 mb-3">{{ t('business.public.announcements') }}</h2>
          <div class="flex flex-col gap-2.5">
            <AnnouncementItem v-for="a in data.announcements" :key="a.id" :announcement="a" />
          </div>
        </template>
      </div>
      <BusinessContact :business="b" />
    </div>
  </template>
</template>
