<script setup lang="ts">
// T06 · cardul mic din „Locuri din Arad” de pe Acasă — design/final `placeCard` (`.pcard`): poză 104 px, „Ghid · N puncte”, nume, tip · distanță.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import type { PlaceSummary } from '@/shared/types/places'

defineProps<{ place: PlaceSummary }>()
const { t } = useI18n()
const { km } = useFormat()
</script>

<template>
  <router-link :to="`/places/${place.id}`" class="shrink-0 w-[168px] rounded-[18px] overflow-hidden bg-white border border-line shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] no-underline text-ink text-left">
    <div class="relative h-[104px] bg-[#555] bg-center bg-cover" :style="place.imageUrl ? { backgroundImage: `url('${place.imageUrl}')` } : undefined">
      <span v-if="place.guidePointsCount" class="absolute left-2 top-2 inline-flex items-center gap-[5px] text-[11.5px] font-medium px-2 py-[3px] rounded-full bg-white/95">
        <AppIcon name="headphones" :size="16" />{{ t('places.card.guide', { n: place.guidePointsCount }, place.guidePointsCount) }}
      </span>
    </div>
    <div class="px-3 pt-2.5 pb-3">
      <b class="block text-[14px] leading-[1.25]">{{ place.name }}</b>
      <span class="text-[12.5px] text-muted">{{ t(`places.type.${place.type}`) }}<template v-if="place.distanceKm != null"> · {{ km(place.distanceKm) }}</template></span>
    </div>
  </router-link>
</template>
