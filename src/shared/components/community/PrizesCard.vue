<script setup lang="ts">
/** „Premiile anului 2026” (design/final/shared/data.js PRIZES) + nota despre Gala Voluntarilor. */
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'

defineProps<{ flat?: boolean }>()
const { t } = useI18n()
const PRIZES = [1, 2, 3] as const
const tone = ['bg-[#FFE08A]', 'bg-[#E6E6E6]', 'bg-[#F0C9A8]']
</script>

<template>
  <div class="bg-white rounded-[16px] border border-line p-4">
    <div class="flex items-center gap-2 font-semibold"><AppIcon name="emoji_events" :size="20" />{{ t('community.prizes.title') }}</div>
    <div v-for="(n, i) in PRIZES" :key="n" class="flex items-center gap-3 mt-3">
      <span class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0" :class="tone[i]">{{ n }}</span>
      <span><span class="text-muted text-[12.5px]">{{ t('community.prizes.place', { n }) }}</span><br><b class="text-[14.5px]">{{ t(`community.prizes.p${n}`) }}</b></span>
    </div>
    <p class="text-muted text-[12.5px] mt-3 mb-0">{{ t('community.prizes.note') }}</p>
  </div>
</template>
