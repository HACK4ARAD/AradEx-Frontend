<script setup lang="ts">
/** Un obiectiv în liste: `row` = rândul din „Locuri din Arad” (mobil), `tile` = cardul din grila W7 (web). */
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import type { PlaceSummary } from '@/shared/types/places'

withDefaults(defineProps<{ place: PlaceSummary; to: string; variant?: 'row' | 'tile' }>(), { variant: 'row' })
const { t } = useI18n()
const { km } = useFormat()
</script>

<template>
  <router-link v-if="variant === 'row'" :to="to" class="flex gap-3 py-3 border-b border-line no-underline text-ink" data-test="place-row">
    <div class="w-[72px] h-[72px] rounded-[14px] shrink-0 bg-[#7a7a72] bg-cover bg-center flex items-center justify-center text-white"
      :style="place.imageUrl ? { backgroundImage: `url('${place.imageUrl}')` } : undefined">
      <AppIcon v-if="!place.imageUrl" name="location_on" :size="28" />
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="text-[15.5px] leading-tight font-semibold m-0 mt-0.5">{{ place.name }}</h3>
      <div class="text-muted text-[13px] mt-0.5">
        {{ t(`places.type.${place.type}`) }} · {{ t('places.card.visit', { n: place.visitMinutes }) }}<template v-if="place.distanceKm !== undefined"> · {{ km(place.distanceKm) }}</template>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-1.5">
        <span v-if="place.guidePointsCount" class="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white border border-line text-[12px] font-medium">
          <AppIcon name="headphones" :size="14" /> {{ t('places.card.guide', { n: place.guidePointsCount }, place.guidePointsCount) }}
        </span>
        <span v-if="place.exteriorOnly" class="inline-flex items-center h-6 px-2 rounded-full border border-line text-[12px]">{{ t('places.card.exterior') }}</span>
      </div>
    </div>
    <AppIcon name="chevron_right" class="text-muted self-center" />
  </router-link>

  <router-link v-else :to="to" class="block bg-white rounded-[16px] overflow-hidden no-underline text-ink border border-line hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition" data-test="place-tile">
    <div class="h-[140px] bg-[#7a7a72] bg-cover bg-center relative flex items-center justify-center text-white"
      :style="place.imageUrl ? { backgroundImage: `url('${place.imageUrl}')` } : undefined">
      <AppIcon v-if="!place.imageUrl" name="location_on" :size="36" />
      <div class="absolute top-2.5 left-2.5 flex gap-1.5">
        <span v-if="place.guidePointsCount" class="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white text-ink text-[12px] font-medium">
          <AppIcon name="headphones" :size="14" /> {{ t('places.card.guideMinutes', { n: place.guidePointsCount, m: place.guideMinutes }, place.guidePointsCount) }}
        </span>
        <span v-if="place.exteriorOnly" class="inline-flex items-center h-6 px-2 rounded-full bg-white text-ink text-[12px]">{{ t('places.card.exterior') }}</span>
      </div>
    </div>
    <div class="p-3.5">
      <b class="block text-[15px] leading-snug">{{ place.name }}</b>
      <span class="block text-muted text-[13px] mt-1">
        {{ t(`places.type.${place.type}`) }} · {{ t('places.card.visit', { n: place.visitMinutes }) }}<template v-if="place.distanceKm !== undefined"> · {{ km(place.distanceKm) }}</template>
      </span>
    </div>
  </router-link>
</template>
