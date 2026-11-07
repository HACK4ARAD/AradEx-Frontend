<script setup lang="ts">
// T05 · „Locuri din Arad” (design/final, mobil): obiectivele cu ghid, filtre pe etichete, „Lângă mine”.
// Localurile partenere din același ecran vin cu T09 (pagina firmei).
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import PlaceCard from '@/shared/components/places/PlaceCard.vue'
import PlaceTagFilter from '@/shared/components/places/PlaceTagFilter.vue'
import { usePlaces } from '@/shared/composables/usePlaces'
import { useBack } from '@/shared/composables/useBack'

const { t } = useI18n()
const back = useBack('/m')
const { items, total, loading, error, filters, reload, locate, located, locating } = usePlaces()
</script>

<template>
  <div class="pt-1">
    <button class="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center mb-2" :aria-label="t('common.back')" @click="back">
      <AppIcon name="arrow_back" />
    </button>
    <h1 class="text-[30px] font-semibold tracking-[-0.025em] m-0">{{ t('places.list.title') }}</h1>
    <p class="text-muted text-[14.5px] mt-1 mb-3.5">
      <template v-if="total">{{ t('places.list.subtitle', { n: total }) }}</template>
      <span class="block text-[12.5px] mt-0.5">{{ located ? t('places.list.fromYou') : t('places.list.fromCenter') }}</span>
    </p>
    <PlaceTagFilter v-model="filters.tag" :located="located" :locating="locating" class="mb-2" @locate="locate" />

    <Skeleton v-if="loading && !items.length" :rows="5" :height="84" class="mt-3" />
    <div v-else-if="error" class="mt-6 text-center">
      <EmptyState icon="cloud_off" :title="t('places.list.error')" :text="error" :action="t('common.retry')" @action="reload" />
    </div>
    <EmptyState v-else-if="!items.length" icon="location_off" :title="t('places.list.empty')" :text="t('places.list.emptyText')"
      :action="t('places.list.showAll')" @action="filters.tag = null" />
    <div v-else :class="loading && 'opacity-60 transition-opacity'">
      <PlaceCard v-for="p in items" :key="p.id" :place="p" :to="`/m/places/${p.id}`" />
    </div>
    <AppButton v-if="!loading && items.length" variant="ghost" size="sm" icon="auto_awesome" class="mt-5" block @click="$router.push('/m/plan')">
      {{ t('places.detail.plan') }}
    </AppButton>
  </div>
</template>
