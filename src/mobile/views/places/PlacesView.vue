<script setup lang="ts">
// T05 · „Locuri din Arad” (design/final/mobile, „/places”): obiectivele cu ghid, filtre pe etichete, distanța față de tine
// sau de Palatul Administrativ. Secțiunea „Localuri partenere” din design cere o listă publică de firme (T09, `GET /businesses`).
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import PlaceCard from '@/shared/components/places/PlaceCard.vue'
import PlaceTagFilter from '@/shared/components/places/PlaceTagFilter.vue'
import { usePlaces } from '@/shared/composables/usePlaces'
import { useBack } from '@/shared/composables/useBack'

const { t } = useI18n()
const back = useBack('/')
const { items, total, loading, error, filters, reload } = usePlaces()
</script>

<template>
  <div>
    <div class="flex items-center gap-1 -ml-2.5 pt-2 mb-3.5">
      <button class="w-11 h-11 rounded-full flex items-center justify-center shrink-0" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
      <h1 class="flex-1 text-[24px] leading-[1.08] font-semibold tracking-[-0.03em] m-0">{{ t('places.list.title') }}</h1>
    </div>
    <p class="text-muted text-[14.5px] -mt-1 mb-3.5">{{ total ? t('places.list.subtitle', { n: total }) : ' ' }}</p>
    <PlaceTagFilter v-model="filters.tag" class="mb-3.5" />

    <Skeleton v-if="loading && !items.length" :rows="5" :height="84" />
    <EmptyState v-else-if="error" icon="cloud_off" :title="t('places.list.error')" :text="error" :action="t('common.retry')" @action="reload" />
    <EmptyState v-else-if="!items.length" icon="location_off" :title="t('places.list.empty')" :text="t('places.list.emptyText')"
      :action="t('places.list.showAll')" @action="filters.tag = null" />
    <div v-else :class="loading && 'opacity-60 transition-opacity'">
      <PlaceCard v-for="p in items" :key="p.id" :place="p" :to="`/places/${p.id}`" />
    </div>
  </div>
</template>
