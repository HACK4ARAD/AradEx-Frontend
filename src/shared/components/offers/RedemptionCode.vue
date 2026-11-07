<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import QrCode from '@/shared/components/qr/QrCode.vue'
import { useFormat } from '@/shared/composables/useFormat'
import type { RedemptionDto } from '@/shared/types/offers'

/** Codul revendicat: QR (doar codul text) + codul mare + „Arată codul la casă”; dacă e folosit, spune când. */
defineProps<{ redemption: RedemptionDto; pointsLater?: boolean; size?: number }>()
const { t } = useI18n()
const f = useFormat()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="bg-white rounded-[18px] p-4 flex flex-col items-center" :class="redemption.status !== 'ISSUED' && 'opacity-60'">
      <QrCode :value="redemption.code" :size="size ?? 210" :label="redemption.code" />
      <div class="font-mono text-[17px] font-semibold tracking-wide mt-2.5">{{ redemption.code }}</div>
      <span v-if="redemption.status === 'USED' && redemption.usedAt" class="mt-2 h-7 px-3 rounded-full bg-soft text-muted text-[12.5px] font-semibold flex items-center">
        {{ t('offers.redeem.used', { date: f.dateTime(redemption.usedAt) }) }}
      </span>
    </div>
    <div class="rounded-[14px] bg-white p-3 flex items-start gap-2 text-[13.5px] text-muted">
      <AppIcon name="info" :size="20" /><span>{{ t('offers.redeem.hint') }}</span>
    </div>
    <div v-if="pointsLater" class="rounded-[14px] bg-green-soft text-green p-3 flex items-start gap-2 text-[13.5px]">
      <AppIcon name="stars" :size="20" /><span>{{ t('offers.redeem.pointsLater') }}</span>
    </div>
  </div>
</template>
