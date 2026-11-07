<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import QrCode from '@/shared/components/qr/QrCode.vue'
import type { RedemptionDto } from '@/shared/types/offers'

/** Un cod revendicat (Bilete › Oferte revendicate în aplicație, Contul meu › Ofertele mele pe web): QR mic, oferta, firma, codul, Activ/Folosit. */
defineProps<{ redemption: RedemptionDto }>()
defineEmits<{ open: [] }>()
const { t } = useI18n()
</script>

<template>
  <button type="button" class="w-full bg-white rounded-[16px] p-3.5 flex items-center gap-3.5 text-left" @click="$emit('open')">
    <QrCode :value="redemption.code" :size="56" class="shrink-0" />
    <span class="min-w-0 flex-1">
      <b class="block text-[15.5px] leading-tight">{{ redemption.offerTitle }}</b>
      <span class="block text-[13px] text-muted">{{ redemption.businessName }}<template v-if="redemption.pointsSpent > 0"> · {{ t('offers.claimed.paid', { n: redemption.pointsSpent }) }}</template></span>
      <span class="flex flex-wrap items-center gap-2 mt-1.5">
        <span class="font-mono text-[12px] break-all">{{ redemption.code }}</span>
        <span class="h-[22px] px-2 rounded-full text-[11.5px] font-semibold flex items-center" :class="redemption.status === 'ISSUED' ? 'bg-green text-white' : 'bg-soft text-muted'">
          {{ t(`offers.status.${redemption.status}`) }}
        </span>
      </span>
    </span>
    <AppIcon name="chevron_right" class="text-muted shrink-0" />
  </button>
</template>
