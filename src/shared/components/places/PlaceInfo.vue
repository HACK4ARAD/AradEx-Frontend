<script setup lang="ts">
/** Cardul „Informații” din E3 (design: `.card.pad` cu `.kv`): program și tarife, durata vizitei, parcare, adresă. */
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { PlaceDto } from '@/shared/types/places'

defineProps<{ place: PlaceDto }>()
const { t } = useI18n()
const row = 'flex items-center gap-3 py-2.5 border-b border-line last:border-b-0 text-[14px] leading-snug'
</script>

<template>
  <div class="bg-white rounded-[20px] border border-line p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.05)]">
    <h3 class="text-[16px] font-semibold m-0">{{ t('places.detail.info') }}</h3>
    <div v-if="place.openingHours" :class="row"><AppIcon name="schedule" :size="18" class="text-muted" /><span>{{ place.openingHours }}</span></div>
    <div :class="row"><AppIcon name="timer" :size="18" class="text-muted" /><span>{{ t('places.detail.visit', { n: place.visitMinutes }) }}</span></div>
    <div v-if="place.parkingHint" :class="row"><AppIcon name="local_parking" :size="18" class="text-muted" /><span>{{ t('places.detail.parking', { p: place.parkingHint }) }}</span></div>
    <div v-if="place.address" :class="row"><AppIcon name="location_on" :size="18" class="text-muted" /><span>{{ place.address }}</span></div>
  </div>
</template>
