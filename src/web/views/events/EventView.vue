<script setup lang="ts">
// T06 · W6 Detaliu eveniment — design/final `#/events/:id`: hero cu titlu, acțiuni (Salvează, Trimite, Calendar, Indicații), despre,
// organizator; în dreapta cutia de bilete (T07 adaugă plata) și locul.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventImage from '@/shared/components/events/EventImage.vue'
import EventTicketBox from '@/web/components/events/EventTicketBox.vue'
import TicketDrawers from '@/web/components/events/TicketDrawers.vue'
import { ticketsApi } from '@/shared/api/tickets'
import { cacheTicket, useMyTickets, useTicketErrors } from '@/shared/composables/useTickets'
import { useAuthStore } from '@/shared/stores/auth'
import type { TicketDto } from '@/shared/types/tickets'
import { directionsUrl, useEventFormat, useSaveEvent } from '@/shared/composables/useEvents'
import { shareLink, useEventDetail } from '@/shared/composables/useEventDetail'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const { t } = useI18n()
const ui = useUiStore()
const fmt = useEventFormat()
const saver = useSaveEvent()
const id = computed(() => Number(route.params.id))
const { event: e, loading, notFound, reload } = useEventDetail(id)
const dur = computed(() => (e.value ? fmt.durationMin(e.value) : null))
const busy = ref(false)
const router = useRouter()
const auth = useAuthStore()
const mine = useMyTickets()
const errorText = useTicketErrors()
onMounted(() => { if (auth.isLoggedIn) void mine.load() })
/** T07: biletul / înscrierea mea la acest eveniment. */
const myTicket = computed(() => mine.upcoming.value.find((x) => x.eventId === id.value) ?? null)
const payOpen = ref(false)
const shown = ref<TicketDto | null>(null)
const order = ref({ adult: 1, child: 0 })
function requireLogin(): boolean {
  if (auth.isLoggedIn) return true
  ui.toast(t('tickets.loginToBuy'))
  void router.push({ path: '/w/login', query: { next: route.fullPath } })
  return false
}
function startPay(o: { adult: number; child: number }) {
  if (!requireLogin()) return
  order.value = { ...o }
  payOpen.value = true
}
async function joinFree() {
  if (!e.value || !requireLogin() || !auth.user) return
  try {
    const tk = await ticketsApi.buy(e.value.id, { qtyAdult: 1, qtyChild: 0, email: auth.user.email })
    cacheTicket(auth.user.id, tk)
    shown.value = tk
    await Promise.all([mine.load(), reload()])
  } catch (err) { ui.toast(errorText(err), 'error') }
}
async function afterBuy() { await Promise.all([mine.load(), reload()]) }

async function share() {
  if (!e.value) return
  if ((await shareLink(e.value.title, window.location.href)) === 'copied') ui.toast(t('events.detail.shareCopied'))
}
async function toggleSave() {
  if (!e.value || busy.value) return
  busy.value = true
  await saver.toggle(e.value, '/w/login')
  busy.value = false
}
const chip = 'h-9 px-3.5 rounded-full inline-flex items-center gap-1.5 border border-line bg-white text-[13.5px] font-medium no-underline text-ink'
</script>

<template>
  <Skeleton v-if="loading && !e" :rows="3" :height="160" />
  <EmptyState v-else-if="notFound || !e" icon="event_busy" :title="t('events.detail.notFound')" :action="notFound ? undefined : t('common.retry')" @action="reload" />
  <template v-else>
    <div class="text-muted text-[14px] mb-2.5"><router-link to="/w/events" class="no-underline text-muted hover:text-ink">{{ t('events.detail.breadcrumb') }}</router-link> › {{ t(`events.category.${e.category}`) }}</div>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
      <div class="min-w-0">
        <EventImage :src="e.imageUrl" :category="e.category" :emoji-size="96" class="rounded-[20px] overflow-hidden min-h-[320px] items-end! justify-start! text-white after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/70 after:via-black/5 after:via-60% after:to-transparent">
          <div class="relative z-10 p-[26px]">
            <div class="flex gap-2 flex-wrap mb-2.5">
              <span v-if="e.isHot" class="inline-flex items-center gap-1 text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-[#FFC43D] text-ink">🔥 {{ t('events.popular') }} · {{ fmt.hotLabel(e) }}</span>
              <span v-if="e.isDemo" class="inline-flex text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-white text-ink">{{ t('events.demo') }}</span>
            </div>
            <h1 class="text-[34px] font-semibold tracking-[-0.03em] leading-[1.1] m-0 text-white">{{ e.title }}</h1>
            <div class="mt-1.5 text-[15px] opacity-[.92]">{{ e.locationName }} · {{ fmt.when(e, !!dur) }}<template v-if="dur"> · {{ t('events.detail.minutes', { n: dur }) }}</template></div>
          </div>
          <span v-if="e.imageUrl && e.imageCredit" class="absolute z-10 right-3 bottom-2.5 text-[11px] opacity-85">{{ e.imageCredit }}</span>
        </EventImage>

        <div class="flex gap-2 flex-wrap mt-3.5 mb-[22px]">
          <button type="button" :class="chip" :aria-pressed="!!e.saved" @click="toggleSave"><AppIcon :name="e.saved ? 'bookmark' : 'bookmark_border'" :fill="!!e.saved" :size="16" />{{ e.saved ? t('events.saved') : t('events.save') }}</button>
          <button type="button" :class="chip" @click="share"><AppIcon name="ios_share" :size="16" />{{ t('events.detail.share') }}</button>
          <a :href="ticketsApi.icsUrl(e.id)" :class="chip"><AppIcon name="event_available" :size="16" />{{ t('events.detail.addToCalendar') }}</a>
          <a :href="directionsUrl(e.lat, e.lng)" target="_blank" rel="noopener" :class="chip"><AppIcon name="directions" :size="16" />{{ t('events.detail.directions') }}</a>
        </div>

        <h2 class="text-[20px] font-semibold tracking-[-0.02em] m-0">{{ t('events.detail.about') }}</h2>
        <p class="text-[15px] text-muted leading-[1.55] mt-2 mb-0 max-w-[680px] whitespace-pre-line">{{ e.description }}</p>

        <div class="bg-white border border-line rounded-[16px] p-[18px] flex items-center gap-3.5 mt-[18px]">
          <span class="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center shrink-0"><AppIcon :name="e.organizerType === 'CITY' ? 'account_balance' : e.organizerType === 'BUSINESS' ? 'storefront' : 'domain'" :size="18" /></span>
          <div class="flex-1 min-w-0">
            <b>{{ t('events.detail.organizedBy', { name: e.organizerName }) }}</b>
            <div v-if="e.externalUrl" class="text-muted text-[14px] mt-0.5 truncate">{{ e.externalUrl.replace(/^https?:\/\//, '') }}</div>
          </div>
          <router-link v-if="e.organizerBusinessId" :to="`/w/businesses/${e.organizerBusinessId}`" class="h-8 px-[11px] rounded-[9px] border border-line bg-white text-[13px] font-semibold flex items-center no-underline text-ink shrink-0">{{ t('events.detail.businessPage') }}</router-link>
        </div>
        <p class="text-muted text-[12px] mt-3.5">{{ e.isDemo ? t('events.detail.demoNote') : t('events.detail.realNote') }}</p>
      </div>

      <aside class="lg:sticky lg:top-[84px] flex flex-col gap-3.5">
        <EventTicketBox :event="e" @changed="reload">
          <template #buy="{ order: o, ended }">
            <button v-if="myTicket" type="button" class="w-full h-12 rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2" @click="shown = myTicket">
              <AppIcon name="qr_code_2" :size="18" />{{ t('tickets.ticket.myTicket', { code: myTicket.code }) }}</button>
            <button v-else type="button" class="w-full h-12 rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-45"
              :disabled="ended || o.adult + o.child === 0 || e.spotsLeft === 0" @click="startPay(o)">
              <AppIcon name="lock" :size="18" />{{ ended ? t('events.detail.ended') : e.spotsLeft === 0 ? t('events.detail.soldOut') : t('tickets.continueToPay') }}</button>
          </template>
          <template #register="{ ended }">
            <button v-if="e.capacity && myTicket" type="button" class="w-full h-12 mt-2.5 rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2" @click="shown = myTicket">
              <AppIcon name="qr_code_2" :size="18" />{{ t('tickets.ticket.myRegistration') }}</button>
            <button v-else-if="e.capacity" type="button" class="w-full h-12 mt-2.5 rounded-[14px] bg-ink text-white text-[15px] font-semibold disabled:opacity-45" :disabled="ended || e.spotsLeft === 0" @click="joinFree">
              {{ ended ? t('events.detail.ended') : e.spotsLeft === 0 ? t('events.detail.soldOut') : t('events.detail.register') }}</button>
            <a v-else :href="ticketsApi.icsUrl(e.id)" class="w-full h-12 mt-2.5 rounded-[14px] bg-white border border-line text-ink text-[15px] font-semibold inline-flex items-center justify-center gap-2 no-underline">
              <AppIcon name="event_available" :size="18" />{{ t('events.detail.addToCalendar') }}</a>
          </template>
        </EventTicketBox>
        <div class="bg-white border border-line rounded-[16px] overflow-hidden">
          <div class="flex items-center gap-3 p-[18px]">
            <span class="w-8 h-8 rounded-full bg-soft flex items-center justify-center shrink-0"><AppIcon name="location_on" :size="18" /></span>
            <div class="flex-1 min-w-0"><b class="block text-[14px]">{{ e.locationName }}</b><span class="text-muted text-[12.5px]">{{ [e.address, e.distanceKm != null ? fmt.km(e.distanceKm) : ''].filter(Boolean).join(' · ') }}</span></div>
            <a :href="directionsUrl(e.lat, e.lng)" target="_blank" rel="noopener" class="h-8 px-[11px] rounded-[9px] border border-line bg-white text-[13px] font-semibold flex items-center no-underline text-ink shrink-0">{{ t('events.detail.openMap') }}</a>
          </div>
        </div>
      </aside>
    </div>
    <TicketDrawers v-model:pay="payOpen" v-model:ticket="shown" :event="e" :adult="order.adult" :child="order.child" @bought="afterBuy" />
  </template>
</template>
