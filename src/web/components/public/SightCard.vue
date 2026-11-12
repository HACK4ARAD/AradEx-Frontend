<script setup lang="ts">
// Cardul unui obiectiv turistic pe /obiective: poza, tipul, numele, ghidul audio (dacă are) și durata vizitei; link spre detaliu.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import { placePath } from '@/web/seoPages'
import type { PlaceSummary } from '@/shared/types/places'

defineProps<{ place: PlaceSummary }>()
const { t } = useI18n()
const f = useFormat()
</script>

<template>
  <router-link :to="placePath(place)" class="block rounded-[16px] overflow-hidden bg-white border border-line text-ink no-underline transition-[transform,box-shadow] duration-150 hover:shadow-[0_8px_24px_rgba(0,0,0,.08)] hover:-translate-y-px"
    :data-test="`sight-${place.id}`">
    <div class="relative h-[150px] bg-soft">
      <img v-if="place.imageUrl" :src="place.imageUrl" :alt="place.name" loading="lazy" class="w-full h-full object-cover" />
      <span v-else class="absolute inset-0 flex items-center justify-center text-muted"><AppIcon name="photo_camera" :size="32" /></span>
      <span v-if="place.guidePointsCount" class="absolute left-2.5 top-2.5 inline-flex items-center gap-1 text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-white">
        <AppIcon name="headphones" :size="14" />{{ t('site.public.sights.guide', { n: place.guidePointsCount }, place.guidePointsCount) }}
      </span>
    </div>
    <div class="px-3.5 pt-3 pb-3.5">
      <b class="block text-[15px] leading-[1.3]">{{ place.name }}</b>
      <span class="block text-muted text-[12.5px] mt-[3px]">{{ t(`places.type.${place.type}`) }}<template v-if="place.visitMinutes"> · {{ t('site.public.sights.visit', { time: f.minutes(place.visitMinutes) }) }}</template></span>
    </div>
  </router-link>
</template>
