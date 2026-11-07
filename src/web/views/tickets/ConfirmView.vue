<script setup lang="ts">
// T23 · confirmarea pe web (`/confirm/:code`, ca S6 din aplicație): bifa, titlul, câte bilete pentru ce zi, copia pe e-mail,
// „Vezi biletul”, „Adaugă în calendar”, „Înapoi la evenimente”. Card centrat.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import { googleCalendarUrl, isoDay } from '@/shared/composables/useEvents'
import { useTicket } from '@/shared/composables/useTickets'
import { useFormat } from '@/shared/composables/useFormat'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const code = computed(() => String(route.params.code))
const { ticket, loading, notFound, load } = useTicket()
onMounted(() => load(code.value))

const n = computed(() => (ticket.value ? ticket.value.qtyAdult + ticket.value.qtyChild : 0))
const paid = computed(() => !!ticket.value && ticket.value.total > 0)
const day = computed(() => {
  if (!ticket.value) return ''
  return isoDay(new Date(ticket.value.startAt)) === isoDay(new Date()) ? t('events.today') : f.dateTime(ticket.value.startAt, false)
})
const calendar = computed(() => !ticket.value ? '' : googleCalendarUrl({
  title: ticket.value.eventTitle, startAt: ticket.value.startAt, endAt: ticket.value.endAt, locationName: ticket.value.locationName, address: ticket.value.address,
}))
</script>

<template>
  <div class="max-w-[560px] mx-auto">
    <Skeleton v-if="loading && !ticket" :rows="1" :height="320" />
    <EmptyState v-else-if="notFound || !ticket" icon="confirmation_number" :title="t('tickets.ticket.notFound')" :action="t('tickets.mine.title')" @action="router.push('/account/tickets')" />
    <div v-else class="bg-white border border-line rounded-[20px] px-5 py-8 md:px-8 text-center">
      <div class="relative w-[84px] h-[84px] rounded-full border-2 border-ink flex items-center justify-center mx-auto mb-[22px] after:content-[''] after:absolute after:top-1 after:right-1 after:w-3 after:h-3 after:rounded-full after:bg-accent">
        <AppIcon name="check" :size="32" />
      </div>
      <h1 class="text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] m-0">{{ paid ? t('tickets.confirm.paid') : t('tickets.confirm.free') }}</h1>
      <p class="font-semibold mt-3.5 mb-0 text-[16px]">{{ ticket.eventTitle }}</p>
      <p class="text-muted mt-2 mb-0 text-[15px] leading-[1.45]">
        {{ t(paid ? 'tickets.confirm.text' : 'tickets.confirm.textOne', { tickets: t('tickets.count', n), day, time: f.timeRange(ticket.startAt) }) }}
      </p>
      <p v-if="ticket.email" class="text-muted mt-2 mb-0 text-[13.5px]">{{ t('tickets.confirm.copy', { email: ticket.email }) }}</p>
      <div class="flex flex-col gap-2.5 mt-7">
        <router-link :to="`/tickets/${ticket.code}`" class="min-h-12 rounded-[14px] bg-ink text-white text-[15px] font-semibold flex items-center justify-center gap-2 no-underline">
          <AppIcon name="qr_code_2" :size="20" />{{ paid ? t('tickets.confirm.seeTicket') : t('tickets.confirm.seeCode') }}
        </router-link>
        <a :href="calendar" target="_blank" rel="noopener" class="min-h-12 rounded-[14px] bg-white border border-line text-ink text-[15px] font-semibold flex items-center justify-center gap-2 no-underline">
          <AppIcon name="event_available" :size="20" />{{ t('tickets.confirm.addCalendar') }}
        </a>
        <router-link to="/events" class="mt-2 font-semibold underline underline-offset-[3px] text-ink">{{ t('tickets.confirm.backToEvents') }}</router-link>
      </div>
    </div>
  </div>
</template>
