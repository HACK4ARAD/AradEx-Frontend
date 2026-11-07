<script setup lang="ts">
// T07 · S6 Confirmare — design/final `/confirm/:code`: bifă mare, titlul, câte bilete pentru ce zi, copia pe e-mail, butoanele de jos.
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import { googleCalendarUrl, isoDay } from '@/shared/composables/useEvents'
import { useTicket } from '@/shared/composables/useTickets'
import { useFormat } from '@/shared/composables/useFormat'

const route = useRoute()
const { t } = useI18n()
const f = useFormat()
const code = computed(() => String(route.params.code))
const { ticket, loading, load } = useTicket()
onMounted(() => load(code.value))

const n = computed(() => (ticket.value ? ticket.value.qtyAdult + ticket.value.qtyChild : 0))
const paid = computed(() => !!ticket.value && ticket.value.total > 0)
const day = computed(() => {
  if (!ticket.value) return ''
  return isoDay(new Date(ticket.value.startAt)) === isoDay(new Date()) ? t('events.today') : f.dateTime(ticket.value.startAt, false)
})
</script>

<template>
  <Skeleton v-if="loading && !ticket" :rows="2" :height="120" class="pt-10" />
  <div v-else-if="ticket" class="min-h-[calc(100dvh-60px)] flex flex-col">
    <div class="relative w-[92px] h-[92px] rounded-full border-2 border-ink flex items-center justify-center mx-auto mt-[60px] mb-[26px] after:content-[''] after:absolute after:top-1 after:right-1 after:w-3 after:h-3 after:rounded-full after:bg-accent">
      <AppIcon name="check" />
    </div>
    <h1 class="text-center text-[30px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ paid ? t('tickets.confirm.paid') : t('tickets.confirm.free') }}</h1>
    <p class="text-center font-semibold mt-4 mb-0 text-[16px]">{{ ticket.eventTitle }}</p>
    <p class="text-center text-muted mt-2.5 mb-0 text-[15px] leading-[1.45]">
      {{ t(paid ? 'tickets.confirm.text' : 'tickets.confirm.textOne', { tickets: t('tickets.count', n), day, time: f.timeRange(ticket.startAt) }) }}
    </p>
    <p v-if="ticket.email" class="text-center text-muted mt-2 mb-0 text-[13.5px]">{{ t('tickets.confirm.copy', { email: ticket.email }) }}</p>
    <div class="mt-auto pt-10 pb-2 flex flex-col">
      <router-link :to="`/m/tickets/${ticket.code}`" class="min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold flex items-center justify-center no-underline">{{ paid ? t('tickets.confirm.seeTicket') : t('tickets.confirm.seeCode') }}</router-link>
      <a :href="googleCalendarUrl({ title: ticket.eventTitle, startAt: ticket.startAt, endAt: ticket.endAt, locationName: ticket.locationName, address: ticket.address })" target="_blank" rel="noopener"
        class="min-h-[52px] mt-2.5 rounded-[16px] bg-white border border-line text-ink text-[16px] font-semibold flex items-center justify-center no-underline">{{ t('tickets.confirm.addCalendar') }}</a>
      <router-link to="/m" class="text-center mt-4 font-semibold underline underline-offset-[3px] text-ink">{{ t('tickets.confirm.backToEvents') }}</router-link>
    </div>
  </div>
</template>
