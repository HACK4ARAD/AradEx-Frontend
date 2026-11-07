<script setup lang="ts">
// T07 · Contul meu › Bilete — design/final `accountPage('tickets')`: Viitoare / Trecute, fiecare bilet cu QR, cod, rânduri, stare,
// „Arată pe tot ecranul” și „Calendar”.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import QrCode from '@/shared/components/qr/QrCode.vue'
import TicketDrawers from '@/web/components/events/TicketDrawers.vue'
import { ticketsApi } from '@/shared/api/tickets'
import { useEventFormat } from '@/shared/composables/useEvents'
import { ticketLines, useMyTickets } from '@/shared/composables/useTickets'
import { useUiStore } from '@/shared/stores/ui'
import type { TicketDto } from '@/shared/types/tickets'

const { t } = useI18n()
const ui = useUiStore()
const fmt = useEventFormat()
const tab = ref<'up' | 'past'>('up')
const shown = ref<TicketDto | null>(null)
const { upcoming, past, loading, error, load } = useMyTickets()
const list = computed(() => (tab.value === 'up' ? upcoming.value : past.value))
const summary = (tk: TicketDto) => ticketLines(tk, { adult: t('tickets.adult').toLowerCase(), child: t('tickets.childShort').toLowerCase(), registration: t('tickets.registration').toLowerCase() })
  .map((l) => `${l.qty} ${l.label}`).join(' + ') + ' · ' + (tk.total ? fmt.money(tk.total) : t('tickets.ticket.free'))
onMounted(async () => { await load(); if (error.value) ui.toast(error.value, 'error') })
</script>

<template>
  <h2 class="text-[20px] font-semibold tracking-[-0.02em] m-0">{{ t('tickets.mine.title') }}</h2>
  <div class="text-muted text-[14.5px] mt-1.5">{{ t('tickets.mine.webSub') }}</div>
  <div class="flex gap-0.5 border-b border-line mt-3.5 mb-4" role="tablist">
    <button v-for="k in (['up', 'past'] as const)" :key="k" type="button" role="tab" :aria-selected="tab === k" class="px-3.5 py-2.5 font-semibold border-b-2 -mb-px"
      :class="tab === k ? 'text-ink border-ink' : 'text-muted border-transparent'" @click="tab = k">{{ k === 'up' ? t('tickets.mine.upcoming') : t('tickets.mine.past') }} ({{ k === 'up' ? upcoming.length : past.length }})</button>
  </div>
  <Skeleton v-if="loading" :rows="3" :height="96" />
  <template v-else-if="list.length">
    <div v-for="tk in list" :key="tk.code" class="bg-white border border-line rounded-[16px] p-[18px] flex flex-wrap items-center gap-4 mb-2.5">
      <QrCode :value="tk.code" :size="64" class="shrink-0 [&>div]:p-0! [&>div]:rounded-none!" />
      <div class="flex-1 min-w-[200px]">
        <b>{{ tk.eventTitle }}</b>
        <div class="text-muted text-[13px]">{{ fmt.dateTime(tk.startAt) }} · {{ tk.locationName }}</div>
        <div class="flex flex-wrap items-center gap-2 mt-1.5">
          <code class="font-mono text-[12px] font-semibold px-1.5 py-0.5 rounded-md bg-soft">{{ tk.code }}</code>
          <span class="text-muted text-[12.5px]">{{ summary(tk) }}</span>
        </div>
      </div>
      <div class="flex flex-col gap-1.5 items-end">
        <span class="inline-flex items-center gap-[5px] text-[12px] font-semibold px-[9px] py-[3px] rounded-full" :class="tk.status === 'CONFIRMED' ? 'bg-ok-soft text-ok' : 'bg-soft text-muted'"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`tickets.status.${tk.status}`) }}</span>
        <div class="flex gap-1.5">
          <button type="button" class="h-8 px-[11px] rounded-[9px] border border-line bg-white text-[13px] font-semibold" @click="shown = tk">{{ t('tickets.mine.fullscreen') }}</button>
          <a :href="ticketsApi.icsUrl(tk.eventId)" class="h-8 px-[11px] rounded-[9px] border border-line bg-white text-[13px] font-semibold inline-flex items-center no-underline text-ink"><AppIcon name="event_available" :size="14" class="mr-1" />{{ t('tickets.mine.calendar') }}</a>
        </div>
      </div>
    </div>
  </template>
  <EmptyState v-else icon="confirmation_number" :title="tab === 'up' ? t('tickets.mine.emptyWeb') : t('tickets.mine.emptyPast')" :text="tab === 'up' ? t('tickets.mine.emptyWebText') : t('tickets.mine.emptyText')" />
  <TicketDrawers v-model:ticket="shown" />
</template>
