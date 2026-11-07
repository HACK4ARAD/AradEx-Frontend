<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { BusinessStats } from '@/shared/types/business'

/** Cele 3 statistici ale panoului (E5 mobil / W4 web): vizualizări, coduri folosite, plăți cu puncte. */
defineProps<{ stats: BusinessStats; compact?: boolean }>()
const { t } = useI18n()
const items = [
  { key: 'views', icon: 'visibility' },
  { key: 'codesUsed', icon: 'qr_code_2' },
  { key: 'pointsPayments', icon: 'toll' },
] as const
const nf = new Intl.NumberFormat('ro-RO')
</script>

<template>
  <div class="grid grid-cols-3" :class="compact ? 'gap-2' : 'gap-3.5'">
    <div v-for="i in items" :key="i.key" class="bg-white rounded-[16px]" :class="compact ? 'p-3 text-center' : 'p-4 border border-line'">
      <div v-if="!compact" class="flex items-center gap-1.5 text-[13px] text-muted mb-1"><AppIcon :name="i.icon" :size="18" />{{ t(`business.stats.${i.key}`) }}</div>
      <b class="block font-semibold tracking-[-0.02em]" :class="compact ? 'text-[20px]' : 'text-[28px]'">{{ nf.format(stats[i.key]) }}</b>
      <span v-if="compact" class="block text-[12px] text-muted leading-tight">{{ t(`business.stats.${i.key}`) }}</span>
    </div>
  </div>
</template>
