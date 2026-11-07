<script setup lang="ts">
// T07 · S10 Bilet — designul din „AradExperience information architecture” (S10): titlu, dată și loc; la evenimentele trecute „Cum a fost?”;
// cardul alb cu QR, cod, rânduri și „Cod demonstrativ”; „Arată acest cod la intrare”; „Indicații spre locație”; Calendar / Gestionează.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import CodeCard from '@/shared/components/tickets/CodeCard.vue'
import { googleCalendarUrl, useEventFormat } from '@/shared/composables/useEvents'
import { isPast, ticketLines, useTicket } from '@/shared/composables/useTickets'
import { useBack } from '@/shared/composables/useBack'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const ui = useUiStore()
const fmt = useEventFormat()
const back = useBack('/tickets')
const code = computed(() => String(route.params.code))
const { ticket: tk, loading, notFound, load } = useTicket()
onMounted(() => load(code.value))
const free = computed(() => tk.value?.ticketType === 'FREE')
const ended = computed(() => !!tk.value && isPast(tk.value))
const lines = computed(() => !tk.value ? '' : ticketLines(tk.value, { adult: t('tickets.adult'), child: t('tickets.childShort'), registration: t('tickets.registration') })
  .map((l) => `${l.qty} × ${l.label}`).join(' · '))
const stars = ref(0)
function rate(n: number) {
  stars.value = n
  ui.toast(t('tickets.ticket.rateSoon'))
}
function openDirections() {
  // T08: harta aplicației, cu traseul spre eveniment
  if (tk.value) router.push({ path: '/map', query: { to: `event:${tk.value.eventId}` } })
}
function addToCalendar() {
  if (tk.value) window.open(googleCalendarUrl({ title: tk.value.eventTitle, startAt: tk.value.startAt, endAt: tk.value.endAt, locationName: tk.value.locationName, address: tk.value.address }), '_blank', 'noopener')
}
</script>

<template>
  <div class="flex flex-col gap-[18px]">
    <div class="flex items-center gap-1.5 -ml-2.5 pt-1">
      <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" :size="24" /></button>
      <h1 class="text-[24px] font-semibold tracking-[-0.03em] m-0">{{ free ? t('tickets.ticket.registration') : t('tickets.ticket.title') }}</h1>
    </div>

    <Skeleton v-if="loading && !tk" :rows="2" :height="200" />
    <EmptyState v-else-if="notFound || !tk" icon="confirmation_number" :title="t('tickets.ticket.notFound')" />
    <template v-else>
      <div>
        <div class="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em]">{{ tk.eventTitle }}</div>
        <div class="text-[15px] text-muted leading-[1.45] mt-1.5">{{ fmt.dateTime(tk.startAt) }}<br>{{ tk.locationName }}</div>
      </div>

      <div v-if="ended" class="flex flex-col gap-2.5 p-4 rounded-[20px] bg-white border border-line">
        <div class="text-[17px] font-semibold">{{ t('tickets.ticket.howWas') }}</div>
        <div class="text-[14px] text-muted leading-[1.4]">{{ t('tickets.ticket.rateSub') }}</div>
        <div role="group" :aria-label="t('tickets.ticket.howWas')" class="flex gap-0.5 -ml-1.5">
          <button v-for="n in 5" :key="n" type="button" class="w-12 h-12 flex items-center justify-center active:scale-[.88] transition-transform" :aria-label="t('tickets.ticket.star', { n })" @click="rate(n)">
            <AppIcon name="star" :size="32" :fill="n <= stars" :class="n <= stars ? 'text-accent' : 'text-muted'" />
          </button>
        </div>
        <button type="button" class="self-start min-h-10 text-[14px] font-semibold underline underline-offset-[3px]" @click="router.push(`/events/${tk.eventId}`)">{{ t('tickets.ticket.seeEvent') }}</button>
      </div>

      <CodeCard :code="tk.code" :lines="lines" shadow />

      <div class="flex gap-2.5 text-[14px] leading-[1.45] text-muted"><AppIcon name="offline_pin" :size="20" />{{ t('tickets.ticket.showAtEntry') }}</div>

      <button type="button" class="w-full min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold flex items-center justify-center gap-2 active:scale-[.98] transition-transform" @click="openDirections">
        <AppIcon name="directions" :size="20" />{{ t('tickets.ticket.directions') }}
      </button>
      <div class="flex justify-center gap-2 flex-wrap">
        <button type="button" class="min-h-11 px-2.5 text-[15px] font-semibold underline underline-offset-[3px]" @click="addToCalendar">{{ t('tickets.ticket.addCalendar') }}</button>
        <button type="button" class="min-h-11 px-2.5 text-[15px] font-semibold underline underline-offset-[3px]" @click="ui.toast(t('tickets.ticket.manageSoon'))">{{ t('tickets.ticket.manage') }}</button>
      </div>
    </template>
  </div>
</template>
