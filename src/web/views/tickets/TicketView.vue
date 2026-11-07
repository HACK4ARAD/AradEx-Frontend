<script setup lang="ts">
// T23 · biletul pe web (`/tickets/:code`, ca S10 din aplicație / drawer-ul „Bilet” din design/final W6): titlul, data și locul,
// cardul cu QR și cod, rândurile (cantitate × tip · sumă), „Arată codul la intrare”, Indicații, Calendar, Trimite pe telefon, Contul meu.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import CodeCard from '@/shared/components/tickets/CodeCard.vue'
import StatusPill from '@/shared/components/tickets/StatusPill.vue'
import { googleCalendarUrl, useEventFormat } from '@/shared/composables/useEvents'
import { isPast, ticketLines, useTicket } from '@/shared/composables/useTickets'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const ui = useUiStore()
const fmt = useEventFormat()
const code = computed(() => String(route.params.code))
const { ticket: tk, loading, notFound, load } = useTicket()
onMounted(() => load(code.value))

const free = computed(() => tk.value?.ticketType === 'FREE')
const ended = computed(() => !!tk.value && isPast(tk.value))
const lines = computed(() => !tk.value ? [] : ticketLines(tk.value, { adult: t('tickets.adult'), child: t('tickets.childShort'), registration: t('tickets.registration') }))
const pill = computed(() => {
  const s = tk.value?.status
  if (!s) return null
  return { tone: s === 'CONFIRMED' && !ended.value ? 'ok' as const : 'no' as const, label: t(`tickets.status.${s}`) }
})
const calendar = computed(() => !tk.value ? '' : googleCalendarUrl({
  title: tk.value.eventTitle, startAt: tk.value.startAt, endAt: tk.value.endAt, locationName: tk.value.locationName, address: tk.value.address,
}))
const sec = 'min-h-10 px-4 rounded-[12px] border border-line bg-white text-ink text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 no-underline'
</script>

<template>
  <div class="max-w-[560px] mx-auto">
    <router-link to="/account/tickets" class="inline-flex items-center gap-1 text-muted text-[14px] mb-3 no-underline"><AppIcon name="arrow_back" :size="18" />{{ t('tickets.mine.title') }}</router-link>

    <Skeleton v-if="loading && !tk" :rows="1" :height="420" />
    <EmptyState v-else-if="notFound || !tk" icon="confirmation_number" :title="t('tickets.ticket.notFound')" :action="t('tickets.mine.title')" @action="router.push('/account/tickets')" />
    <div v-else class="bg-white border border-line rounded-[20px] p-5 md:p-6">
      <div class="flex items-start justify-between gap-3">
        <h1 class="text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] m-0">{{ free ? t('tickets.ticket.registration') : t('tickets.ticket.title') }}</h1>
        <StatusPill v-if="pill" :tone="pill.tone" :label="pill.label" />
      </div>
      <router-link :to="`/events/${tk.eventId}`" class="block text-[17px] font-semibold text-ink no-underline mt-2.5">{{ tk.eventTitle }}</router-link>
      <div class="text-muted text-[14.5px] leading-[1.45] mt-1">{{ fmt.dateTime(tk.startAt) }} · {{ tk.locationName }}</div>

      <CodeCard :code="tk.code" :qr-size="200" class="mt-4" />
      <div class="flex gap-2 items-start text-muted text-[13px] leading-[1.45] mt-3"><AppIcon name="offline_pin" :size="18" />{{ t('tickets.ticket.showWeb') }}</div>

      <div class="mt-3.5 border-t border-line pt-2.5">
        <div v-for="l in lines" :key="l.label" class="flex justify-between text-[14px] py-1"><span>{{ l.qty }} × {{ l.label }}</span><span>{{ l.amount ? fmt.money(l.amount) : t('tickets.ticket.free') }}</span></div>
        <div v-if="tk.total" class="flex justify-between text-[15px] font-bold pt-1"><span>{{ t('tickets.total') }}</span><span>{{ fmt.money(tk.total) }}</span></div>
      </div>

      <router-link :to="{ path: '/map', query: { to: `event:${tk.eventId}` } }"
        class="w-full min-h-12 mt-[18px] rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 no-underline">
        <AppIcon name="directions" :size="20" />{{ t('tickets.ticket.directions') }}
      </router-link>
      <div class="flex flex-wrap gap-2 mt-2.5">
        <a :href="calendar" target="_blank" rel="noopener" :class="sec"><AppIcon name="event_available" :size="18" />{{ t('tickets.mine.calendar') }}</a>
        <button type="button" :class="sec" @click="ui.toast(t('tickets.ticket.sendPhoneSoon'))"><AppIcon name="smartphone" :size="18" />{{ t('tickets.ticket.sendPhone') }}</button>
        <router-link to="/account/tickets" :class="sec">{{ t('tickets.ticket.account') }}</router-link>
      </div>
    </div>
  </div>
</template>
