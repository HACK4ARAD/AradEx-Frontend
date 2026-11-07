<script setup lang="ts">
/** Un obiectiv în lista „Locuri din Arad” (design: `.evrow` — poză 72×72 cu pin, titlu, tip · vizită · distanță, badge-uri). */
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import type { PlaceSummary } from '@/shared/types/places'

defineProps<{ place: PlaceSummary; to: string }>()
const { t } = useI18n()
const { km } = useFormat()
</script>

<template>
  <router-link :to="to" class="flex gap-3 w-full py-3 border-b border-line no-underline text-ink text-left" data-test="place-row">
    <div class="w-[72px] h-[72px] rounded-[14px] shrink-0 bg-[#777] bg-cover bg-center flex items-center justify-center"
      :style="place.imageUrl ? { backgroundImage: `url('${place.imageUrl}')` } : undefined">
      <AppIcon name="location_on" />
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="text-[15.5px] leading-[1.25] font-semibold my-0.5">{{ place.name }}</h3>
      <div class="text-muted text-[13px]">
        {{ t(`places.type.${place.type}`) }} · {{ t('places.card.visit', { n: place.visitMinutes }) }}<template v-if="place.distanceKm !== undefined"> · {{ km(place.distanceKm) }}</template>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-1.5">
        <span v-if="place.guidePointsCount" class="inline-flex items-center gap-[5px] px-2.5 py-1 rounded-full bg-soft text-[12px] font-medium leading-[1.3]">
          <AppIcon name="headphones" :size="16" /> {{ t('places.card.guide', { n: place.guidePointsCount }, place.guidePointsCount) }}
        </span>
        <span v-if="place.exteriorOnly" class="inline-flex items-center px-2.5 py-1 rounded-full border border-[#8C8C86] text-[12px] font-medium leading-[1.3]">{{ t('places.card.exterior') }}</span>
      </div>
    </div>
  </router-link>
</template>
