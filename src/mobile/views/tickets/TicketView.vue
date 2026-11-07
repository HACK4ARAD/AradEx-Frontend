<script setup lang="ts">
// T07 · S10 Bilet — design/final `/ticket/:code`: titlu, dată și loc, biletul cu QR (merge offline), Calendar / Indicații.
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import TicketStub from '@/shared/components/tickets/TicketStub.vue'
import { directionsUrl, googleCalendarUrl, useEventFormat } from '@/shared/composables/useEvents'
import { useTicket } from '@/shared/composables/useTickets'
import { useBack } from '@/shared/composables/useBack'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const { t } = useI18n()
const ui = useUiStore()
const fmt = useEventFormat()
const back = useBack('/m/tickets')
const code = computed(() => String(route.params.code))
const { ticket: tk, loading, notFound, load } = useTicket()
onMounted(() => load(code.value))
const free = computed(() => tk.value?.ticketType === 'FREE')
</script>

<template>
  <div class="flex items-center gap-1 -ml-2.5 pt-2 mb-3.5">
    <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="flex-1 text-[24px] font-semibold tracking-[-0.03em] m-0">{{ free ? t('tickets.ticket.registration') : t('tickets.ticket.title') }}</h1>
  </div>
  <Skeleton v-if="loading && !tk" :rows="2" :height="200" />
  <EmptyState v-else-if="notFound || !tk" icon="confirmation_number" :title="t('tickets.ticket.notFound')" />
  <template v-else>
    <h2 class="text-[22px] font-semibold tracking-[-0.02em] m-0">{{ tk.eventTitle }}</h2>
    <p class="text-muted mt-1.5 mb-0">{{ fmt.when(tk) }}<br>{{ [tk.locationName, tk.address].filter(Boolean).join(' · ') }}</p>
    <TicketStub :ticket="tk" class="mt-[18px]" />
    <div class="flex gap-2.5 mt-4">
      <a :href="googleCalendarUrl({ title: tk.eventTitle, startAt: tk.startAt, endAt: tk.endAt, locationName: tk.locationName, address: tk.address })" target="_blank" rel="noopener"
        class="flex-1 min-h-[52px] rounded-[16px] bg-white border border-line text-ink font-semibold flex items-center justify-center gap-2 no-underline"><AppIcon name="event_available" :size="18" />{{ t('events.detail.calendar') }}</a>
      <a :href="directionsUrl(tk.lat, tk.lng)" target="_blank" rel="noopener"
        class="flex-1 min-h-[52px] rounded-[16px] bg-white border border-line text-ink font-semibold flex items-center justify-center gap-2 no-underline"><AppIcon name="directions" :size="18" />{{ t('events.detail.directions') }}</a>
    </div>
    <button type="button" class="block mx-auto mt-[18px] text-[14px] text-muted font-semibold underline underline-offset-[3px]" @click="ui.toast(t('tickets.ticket.manageSoon'))">{{ t('tickets.ticket.manage') }}</button>
  </template>
</template>
