<script setup lang="ts">
// T07 · biletul (S10 / sertarul din web) — design/final `.ticket`: rândurile comenzii, linia perforată, QR mare cu codul.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import QrCode from '@/shared/components/qr/QrCode.vue'
import { useEventFormat } from '@/shared/composables/useEvents'
import { ticketLines } from '@/shared/composables/useTickets'
import type { TicketDto } from '@/shared/types/tickets'

const props = withDefaults(defineProps<{ ticket: TicketDto; qrSize?: number; web?: boolean }>(), { qrSize: 220 })
const { t } = useI18n()
const fmt = useEventFormat()
const lines = computed(() => ticketLines(props.ticket, { adult: t('tickets.adult'), child: t('tickets.childShort'), registration: t('tickets.registration') }))
</script>

<template>
  <div class="rounded-[24px] bg-white border border-line shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] overflow-hidden">
    <div class="px-[18px] pt-[18px] pb-3.5 flex flex-col gap-1">
      <div v-for="l in lines" :key="l.label" class="flex justify-between text-[15px]"><span>{{ l.qty }} × {{ l.label }}</span><span>{{ l.amount ? fmt.money(l.amount) : t('tickets.ticket.free') }}</span></div>
    </div>
    <!-- linia perforată cu cele două semicercuri -->
    <div class="relative h-0 border-t-2 border-dashed border-line mx-[18px] before:content-[''] before:absolute before:-top-3 before:-left-[30px] before:w-[22px] before:h-[22px] before:rounded-full before:bg-bg before:border before:border-line after:content-[''] after:absolute after:-top-3 after:-right-[30px] after:w-[22px] after:h-[22px] after:rounded-full after:bg-bg after:border after:border-line" />
    <div class="px-[18px] pt-[22px] pb-[18px] flex flex-col items-center">
      <QrCode :value="ticket.code" :size="qrSize" :label="ticket.code" />
      <div class="font-mono text-center mt-3 text-[15px] tracking-[.04em] font-semibold">{{ ticket.code }}</div>
      <p class="text-muted text-center text-[13px] mt-1.5 mb-0">{{ web ? t('tickets.ticket.showWeb') : t('tickets.ticket.show') }}</p>
    </div>
  </div>
</template>
