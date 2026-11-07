<script setup lang="ts">
// T07 · rândul din „Biletele mele” (S9) — design/final: QR mic, titlu, dată · oră · loc, codul și starea.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import QrCode from '@/shared/components/qr/QrCode.vue'
import { useEventFormat } from '@/shared/composables/useEvents'
import type { TicketDto } from '@/shared/types/tickets'

defineProps<{ ticket: TicketDto; to: string }>()
const { t } = useI18n()
const fmt = useEventFormat()
</script>

<template>
  <router-link :to="to" class="w-full flex items-center gap-3.5 mb-2.5 p-4 bg-white rounded-[20px] border border-line shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] no-underline text-ink">
    <QrCode :value="ticket.code" :size="56" class="shrink-0 [&>div]:p-0! [&>div]:rounded-none!" />
    <div class="flex-1 min-w-0">
      <b class="block text-[15.5px] leading-[1.25]">{{ ticket.eventTitle }}</b>
      <span class="text-muted text-[13px]">{{ fmt.dateTime(ticket.startAt) }} · {{ ticket.locationName }}</span>
      <div class="flex items-center gap-2.5 mt-1.5 flex-wrap">
        <span class="font-mono text-[12px] font-semibold">{{ ticket.code }}</span>
        <span class="text-[11.5px] font-semibold px-2.5 py-1 rounded-full" :class="ticket.status === 'CONFIRMED' ? 'bg-green-soft text-green-deep' : 'bg-soft'">{{ t(`tickets.status.${ticket.status}`) }}</span>
      </div>
    </div>
    <AppIcon name="chevron_right" />
  </router-link>
</template>
