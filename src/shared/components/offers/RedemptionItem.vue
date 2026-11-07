<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import type { RedemptionDto } from '@/shared/types/offers'

/** Un cod în liste (Ofertele mele, codurile recente ale firmei): cod, ofertă, firmă, stare, când. */
defineProps<{ redemption: RedemptionDto; showBusiness?: boolean; clickable?: boolean }>()
defineEmits<{ open: [] }>()
const { t } = useI18n()
const f = useFormat()
const tone: Record<string, string> = { ISSUED: 'bg-ok-soft text-ok', USED: 'bg-soft text-muted', CANCELLED: 'bg-bad-soft text-bad' }
</script>

<template>
  <component :is="clickable ? 'button' : 'div'" type="button" class="w-full text-left bg-white rounded-[16px] p-3.5 flex items-center gap-3" @click="clickable && $emit('open')">
    <span class="w-11 h-11 rounded-[12px] bg-soft flex items-center justify-center shrink-0"><AppIcon :name="redemption.status === 'ISSUED' ? 'qr_code_2' : 'check_circle'" /></span>
    <span class="min-w-0 flex-1">
      <b class="block text-[14.5px] truncate">{{ redemption.offerTitle }}</b>
      <span class="block text-[12.5px] text-muted truncate"><span class="font-mono">{{ redemption.code }}</span><template v-if="showBusiness"> · {{ redemption.businessName }}</template> · {{ f.dateTime(redemption.usedAt ?? redemption.issuedAt) }}</span>
    </span>
    <span class="h-6 px-2.5 rounded-full text-[12px] font-semibold flex items-center shrink-0" :class="tone[redemption.status]">{{ t(`offers.status.${redemption.status}`) }}</span>
  </component>
</template>
