<script setup lang="ts">
// T05 · W7 · Obiective cu ghid virtual (design/final/web, „/places”): grila obiectivelor, filtre pe etichete, „Lângă mine”.
// Harta din dreapta (pinii obiectivelor) vine cu MapView în T08; până atunci grila ocupă toată lățimea.
import { useI18n } from 'vue-i18n'
import { EmptyState, Skeleton } from '@/shared/components'
import PlaceCard from '@/shared/components/places/PlaceCard.vue'
import PlaceTagFilter from '@/shared/components/places/PlaceTagFilter.vue'
import { usePlaces } from '@/shared/composables/usePlaces'

const { t } = useI18n()
const { items, total, loading, error, filters, reload, locate, located, locating } = usePlaces()
</script>

<template>
  <div>
    <h1 class="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] m-0">{{ t('places.list.webTitle') }}</h1>
    <p class="text-muted text-[15px] mt-1.5 mb-0">
      <template v-if="total">{{ t('places.list.webSubtitle', { n: total }) }} · </template>{{ located ? t('places.list.fromYou') : t('places.list.fromCenter') }}
    </p>
    <PlaceTagFilter v-model="filters.tag" :located="located" :locating="locating" class="my-5" @locate="locate" />

    <div v-if="loading && !items.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" :rows="1" :height="214" />
    </div>
    <EmptyState v-else-if="error" icon="cloud_off" :title="t('places.list.error')" :text="error" :action="t('common.retry')" @action="reload" />
    <EmptyState v-else-if="!items.length" icon="location_off" :title="t('places.list.empty')" :text="t('places.list.emptyText')"
      :action="t('places.list.showAll')" @action="filters.tag = null" />
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" :class="loading && 'opacity-60 transition-opacity'">
      <PlaceCard v-for="p in items" :key="p.id" :place="p" :to="`/w/places/${p.id}`" variant="tile" />
    </div>
  </div>
</template>
