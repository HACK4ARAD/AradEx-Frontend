<script setup lang="ts">
/**
 * Cardul verde „Punctele tale” (design/final: `ptscard`): nivelul, soldul, progresul spre nivelul următor, seria de luni active
 * și locul în clasamentul lunii. Cu `to` e link (spre clasament).
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { levelFor } from '@/shared/composables/useCommunity'
import type { PointsDto } from '@/shared/types/community'

const props = defineProps<{ points: PointsDto; to?: string }>()
const { t } = useI18n()
const level = computed(() => levelFor(props.points.balance))
</script>

<template>
  <component :is="to ? 'router-link' : 'div'" :to="to" class="block rounded-[22px] bg-green-deep text-white no-underline px-[18px] pt-[18px] pb-4">
    <div class="flex items-center justify-between text-[14px]">
      <span class="opacity-90">{{ t('community.points.yours') }}</span>
      <span class="bg-[#BEDBA3] text-green-deep font-bold text-[13px] px-3 py-1 rounded-full">{{ t(`community.levels.${level.key}`) }}</span>
    </div>
    <div class="font-bold tracking-[-0.04em] leading-none text-[54px] mt-2 mb-2.5">
      {{ points.balance }}<small class="text-[15px] font-medium tracking-normal ml-2 opacity-90">{{ t('community.points.available') }}</small>
    </div>
    <div class="h-2.5 rounded-[5px] bg-white/20 overflow-hidden"><i class="block h-full bg-[#8FD14F] rounded-[5px]" :style="{ width: `${level.progress}%` }" /></div>
    <div v-if="level.next" class="text-[12.5px] opacity-80 mt-1.5">{{ t('community.points.toNext', { n: level.toNext, level: t(`community.levels.${level.next.key}`) }) }}</div>
    <div class="flex items-center justify-between mt-3 text-[14px]">
      <span>{{ points.streakMonths > 0 ? t('community.points.streak', { n: points.streakMonths }, points.streakMonths) : t('community.points.noStreak') }}</span>
      <b class="flex items-center">{{ t('community.points.rank', { n: points.rank }) }}<AppIcon v-if="to" name="chevron_right" :size="18" /></b>
    </div>
  </component>
</template>
