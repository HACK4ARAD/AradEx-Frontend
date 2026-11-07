<script setup lang="ts">
/** Cardul „Informații” al unui obiectiv: program și tarife, durata vizitei, parcare, adresă (+ butoane în slot). */
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { PlaceDto } from '@/shared/types/places'

defineProps<{ place: PlaceDto }>()
const { t } = useI18n()
</script>

<template>
  <div class="bg-white rounded-[16px] p-4">
    <h3 class="text-[16px] font-semibold m-0 mb-1">{{ t('places.detail.info') }}</h3>
    <div v-if="place.openingHours" class="flex gap-3 py-2.5 text-[14px] leading-snug"><AppIcon name="schedule" :size="20" class="text-muted shrink-0" /><span>{{ place.openingHours }}</span></div>
    <div class="flex gap-3 py-2.5 text-[14px]"><AppIcon name="timer" :size="20" class="text-muted shrink-0" /><span>{{ t('places.detail.visit', { n: place.visitMinutes }) }}</span></div>
    <div v-if="place.parkingHint" class="flex gap-3 py-2.5 text-[14px] leading-snug"><AppIcon name="local_parking" :size="20" class="text-muted shrink-0" /><span>{{ t('places.detail.parking', { p: place.parkingHint }) }}</span></div>
    <div v-if="place.address" class="flex gap-3 py-2.5 text-[14px] leading-snug"><AppIcon name="location_on" :size="20" class="text-muted shrink-0" /><span>{{ place.address }}</span></div>
    <div v-if="place.rating" class="flex gap-3 py-2.5 text-[14px]"><AppIcon name="star" :size="20" class="text-muted shrink-0" /><span>{{ t('places.detail.rating', { r: String(place.rating).replace('.', ',') }) }}</span></div>
    <slot />
  </div>
</template>
