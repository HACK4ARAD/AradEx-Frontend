<script setup lang="ts">
// T07 · cardul alb cu codul QR — designul din „AradExperience information architecture” (S10 și sheet-ul „Codul tău”):
// QR, codul în font monospace, rândurile biletului (opțional) și „Cod demonstrativ”.
import { useI18n } from 'vue-i18n'
import QrCode from '@/shared/components/qr/QrCode.vue'

withDefaults(defineProps<{ code: string; lines?: string; qrSize?: number; shadow?: boolean }>(), { qrSize: 196 })
const { t } = useI18n()
</script>

<template>
  <div class="bg-white text-[#111] rounded-[24px] border border-line flex flex-col items-center gap-2.5" :class="shadow ? 'p-[22px] gap-3 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)]' : 'p-5'">
    <QrCode :value="code" :size="qrSize" :label="code" class="[&>div]:p-0! [&>div]:rounded-none!" />
    <div class="font-mono font-medium tracking-[.06em]" :class="shadow ? 'text-[16px]' : 'text-[15px]'">{{ code }}</div>
    <div v-if="lines" class="text-[14px] text-[#5C5C5C] text-center">{{ lines }}</div>
    <div class="text-[11px] text-[#5C5C5C] font-mono">{{ t('tickets.code.demo') }}</div>
  </div>
</template>
