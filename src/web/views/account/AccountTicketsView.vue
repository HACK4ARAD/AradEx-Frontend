<script setup lang="ts">
// T23 · W14 Contul meu › Biletele mele (design/final web `accountPage` tab „tickets”): Viitoare / Trecute; fiecare bilet e un card
// cu QR-ul mic, evenimentul, data · locul, codul și rândurile, starea și „Arată pe tot ecranul” (→ `/tickets/:code`) + Calendar.
// Înscrierile la acțiuni și ofertele revendicate au tab-urile lor (Puncte, Ofertele mele). Datele: `useMyTickets` (ca S9).
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import QrCode from '@/shared/components/qr/QrCode.vue'
import StatusPill from '@/shared/components/tickets/StatusPill.vue'
import { googleCalendarUrl, useEventFormat } from '@/shared/composables/useEvents'
import { ticketLines, useMyTickets } from '@/shared/composables/useTickets'
import type { TicketDto } from '@/shared/types/tickets'

const { t } = useI18n()
const router = useRouter()
const fmt = useEventFormat()
const tab = ref<'up' | 'past'>('up')
const { upcoming, past, loading, offline, error, load } = useMyTickets()
const list = computed(() => (tab.value === 'up' ? upcoming.value : past.value))
onMounted(load)

const summary = (tk: TicketDto) => {
  const ls = ticketLines(tk, { adult: t('tickets.adult'), child: t('tickets.childShort'), registration: t('tickets.registration') })
  return `${ls.map((l) => `${l.qty} ${l.label.toLowerCase()}`).join(' + ')} · ${tk.total ? fmt.money(tk.total) : t('tickets.ticket.free')}`
}
const pill = (tk: TicketDto) => ({ tone: tk.status === 'CONFIRMED' && tab.value === 'up' ? 'ok' as const : 'no' as const, label: t(`tickets.status.${tk.status}`) })
const calendar = (tk: TicketDto) => googleCalendarUrl({ title: tk.eventTitle, startAt: tk.startAt, endAt: tk.endAt, locationName: tk.locationName, address: tk.address })
const btn = 'h-8 px-[11px] rounded-[9px] border border-line bg-white text-ink text-[13px] font-semibold inline-flex items-center gap-1.5 no-underline whitespace-nowrap'
</script>

<template>
  <h2 class="text-[22px] font-semibold tracking-[-0.02em] m-0">{{ t('tickets.mine.title') }}</h2>
  <p class="text-muted text-[14.5px] mt-1.5 mb-0">{{ t('tickets.mine.webSub') }}</p>

  <div class="flex gap-0.5 border-b border-line mt-3.5 mb-4" role="tablist">
    <button v-for="k in (['up', 'past'] as const)" :key="k" type="button" role="tab" :aria-selected="tab === k"
      class="px-3.5 py-2.5 font-semibold border-b-2 -mb-px" :class="tab === k ? 'text-ink border-ink' : 'text-muted border-transparent'" @click="tab = k">
      {{ k === 'up' ? t('tickets.mine.upcoming') : t('tickets.mine.past') }} ({{ (k === 'up' ? upcoming : past).length }})
    </button>
  </div>

  <div v-if="offline" role="status" class="flex gap-2.5 items-center px-3.5 py-3 mb-3 rounded-[14px] bg-white border border-line text-[14px]"><AppIcon name="wifi_off" :size="20" />{{ t('tickets.mine.offlineWeb') }}</div>

  <Skeleton v-if="loading && !list.length" :rows="2" :height="104" />
  <EmptyState v-else-if="error && !list.length" icon="cloud_off" :title="error" :action="t('common.retry')" @action="load" />
  <div v-else-if="list.length" class="flex flex-col gap-2.5">
    <div v-for="tk in list" :key="tk.code" class="bg-white border border-line rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div class="flex items-center gap-4 min-w-0 flex-1">
        <router-link :to="`/tickets/${tk.code}`" class="shrink-0" :aria-label="t('tickets.mine.fullscreen')">
          <QrCode :value="tk.code" :size="72" class="[&>div]:p-1! [&>div]:rounded-[8px]! [&>div]:border [&>div]:border-line" />
        </router-link>
        <div class="min-w-0 flex-1">
          <router-link :to="`/events/${tk.eventId}`" class="block font-semibold text-ink no-underline leading-[1.3]">{{ tk.eventTitle }}</router-link>
          <div class="text-muted text-[13px] mt-0.5">{{ fmt.dateTime(tk.startAt) }} · {{ tk.locationName }}</div>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
            <code class="font-mono text-[12.5px] px-1.5 py-0.5 rounded-md bg-soft">{{ tk.code }}</code>
            <span class="text-muted text-[12.5px]">{{ summary(tk) }}</span>
          </div>
        </div>
      </div>
      <div class="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap shrink-0">
        <StatusPill :tone="pill(tk).tone" :label="pill(tk).label" />
        <div class="flex flex-wrap gap-1.5">
          <router-link :to="`/tickets/${tk.code}`" :class="btn"><AppIcon name="qr_code_2" :size="16" />{{ t('tickets.mine.fullscreen') }}</router-link>
          <a v-if="tab === 'up'" :href="calendar(tk)" target="_blank" rel="noopener" :class="btn">{{ t('tickets.mine.calendar') }}</a>
        </div>
      </div>
    </div>
  </div>
  <EmptyState v-else-if="tab === 'up'" icon="confirmation_number" :title="t('tickets.mine.emptyWeb')" :text="t('tickets.mine.emptyWebText')" :action="t('tickets.mine.find')" @action="router.push('/events')" />
  <EmptyState v-else icon="history" :title="t('tickets.mine.emptyPast')" />
</template>
