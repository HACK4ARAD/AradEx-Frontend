<script setup lang="ts">
// T23 · W6 Detaliu eveniment — design/final web `/events/:id`: fir „Evenimente › Categorie”, hero cu titlu, loc și dată,
// chips (Salvează · Trimite · Calendar · Indicații), despre, organizatorul; în dreapta caseta de bilete după tipul biletelor
// (în aplicație: Adult / Copil + total → plată; gratuit cu înscriere; intrare liberă; pe site-ul organizatorului) și harta mică.
// Logica e comună cu aplicația (`useEventPage`, `useTicketPick`).
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePaymentMode } from '@/shared/composables/usePaymentMode'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import EventImage from '@/shared/components/events/EventImage.vue'
import TicketQtyRows from '@/shared/components/tickets/TicketQtyRows.vue'
import MapView from '@/shared/components/map/MapView.vue'
import NearestStop from '@/shared/components/transit/NearestStop.vue'
import type { MapMarker } from '@/shared/components/map/types'
import { useEventFormat } from '@/shared/composables/useEvents'
import AddToCalendar from '@/shared/components/events/AddToCalendar.vue'
import { useEventPage } from '@/shared/composables/useEventPage'
import { useTicketPick } from '@/shared/composables/useTicketOrder'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { cardOn } = usePaymentMode()
const fmt = useEventFormat()
const id = computed(() => Number(route.params.id))
const { event: e, loading, notFound, reload, biz, myTicket, ended, joining, joinFree, toggleSave, share } = useEventPage(id)
const pick = useTicketPick(e)

const dur = computed(() => (e.value ? fmt.durationMin(e.value) : null))
const when = computed(() => (e.value ? fmt.when(e.value) : ''))
const markers = computed<MapMarker[]>(() => (e.value ? [{ id: `event:${e.value.id}`, lat: e.value.lat, lng: e.value.lng, kind: 'event' }] : []))
const mapTo = computed(() => ({ path: '/map', query: { to: `event:${id.value}` } }))
function buy() {
  if (pick.commit()) void router.push('/checkout')
}

const chip = 'h-9 px-3.5 rounded-full inline-flex items-center gap-1.5 border border-line bg-white text-ink text-[13.5px] font-medium whitespace-nowrap no-underline'
const kv = 'flex items-center gap-2.5 py-[9px] border-b border-line text-[13.5px]'
const btnLg = 'w-full min-h-12 px-5 rounded-[14px] inline-flex items-center justify-center gap-2 text-[15px] font-semibold no-underline disabled:opacity-45'
</script>

<template>
  <Skeleton v-if="loading && !e" :rows="3" :height="160" />
  <EmptyState v-else-if="notFound || !e" icon="event_busy" :title="t('events.detail.notFound')"
    :action="notFound ? t('events.detail.breadcrumb') : t('common.retry')" @action="notFound ? router.push('/events') : reload()" />
  <template v-else>
    <nav class="text-muted text-[14px] mb-2.5" :aria-label="t('events.detail.breadcrumb')">
      <router-link to="/events" class="text-muted">{{ t('events.detail.breadcrumb') }}</router-link> › {{ t(`events.category.${e.category}`) }}
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
      <div class="min-w-0">
        <!-- hero (design `.hero`): poza cu degrade, titlul și „loc · când” jos -->
        <EventImage :src="e.imageUrl" :category="e.category" :emoji-size="96"
          class="min-h-[260px] md:min-h-[320px] rounded-[20px] overflow-hidden text-white before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/70 before:via-black/20 before:to-black/5">
          <div class="absolute inset-x-0 bottom-0 p-5 md:p-[26px]">
            <div v-if="e.isHot || e.isDemo" class="flex flex-wrap gap-2 mb-2.5">
              <span v-if="e.isHot" class="inline-flex items-center gap-1 text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-[#FFC43D] text-ink">🔥 {{ t('events.popular') }} · {{ fmt.hotLabel(e) }}</span>
              <span v-if="e.isDemo" class="inline-flex items-center text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-white text-ink">{{ t('events.demo') }}</span>
            </div>
            <h1 class="text-[26px] md:text-[34px] leading-[1.1] tracking-[-0.03em] font-semibold m-0 text-white">{{ e.title }}</h1>
            <div class="mt-1.5 text-[15px] opacity-[.92]">{{ e.locationName }} · {{ when }}<template v-if="dur"> · {{ t('events.detail.minutes', { n: dur }) }}</template></div>
          </div>
          <span v-if="e.imageUrl && e.imageCredit" class="absolute right-3 bottom-2.5 text-[11px] opacity-[.85]">{{ e.imageCredit }}</span>
        </EventImage>

        <div class="flex flex-wrap gap-2 mt-3.5 mb-[22px]">
          <button type="button" :class="chip" :aria-pressed="!!e.saved" @click="toggleSave">
            <AppIcon :name="e.saved ? 'bookmark' : 'bookmark_border'" :fill="!!e.saved" :size="18" />{{ e.saved ? t('events.saved') : t('events.save') }}
          </button>
          <button type="button" :class="chip" @click="share"><AppIcon name="ios_share" :size="18" />{{ t('events.detail.share') }}</button>
          <AddToCalendar :event="e" :class="chip" />
          <router-link :to="mapTo" :class="chip"><AppIcon name="directions" :size="18" />{{ t('events.detail.directions') }}</router-link>
        </div>

        <h2 class="text-[20px] tracking-[-0.02em] font-semibold m-0">{{ t('events.detail.about') }}</h2>
        <p class="text-[15px] text-muted leading-[1.55] mt-2 mb-0 max-w-[680px] whitespace-pre-line">{{ e.description }}</p>

        <!-- organizatorul: firma (cu pagina ei) sau instituția / Primăria -->
        <div class="bg-white border border-line rounded-[16px] p-[18px] flex flex-wrap items-center gap-3.5 mt-[18px]">
          <template v-if="e.organizerBusinessId">
            <span class="w-12 h-12 rounded-[12px] bg-soft bg-cover bg-center shrink-0 flex items-center justify-center" :style="biz?.imageUrl ? { backgroundImage: `url('${biz.imageUrl}')` } : undefined">
              <AppIcon v-if="!biz?.imageUrl" name="storefront" class="text-muted" />
            </span>
            <div class="flex-1 min-w-[160px]">
              <b>{{ t('events.detail.organizedBy', { name: biz?.name ?? e.organizerName }) }}</b>
              <div v-if="biz" class="text-muted text-[14px] mt-0.5">{{ t(`auth.category.${biz.category}`) }}<template v-if="biz.verified"> · {{ t('events.detail.verifiedAccount') }}</template></div>
            </div>
            <router-link :to="`/businesses/${e.organizerBusinessId}`" class="h-8 px-[11px] rounded-[9px] border border-line bg-white text-ink text-[13px] font-semibold inline-flex items-center no-underline">{{ t('events.detail.businessPage') }}</router-link>
          </template>
          <template v-else>
            <span class="w-10 h-10 rounded-full bg-ink text-white shrink-0 flex items-center justify-center"><AppIcon :name="e.organizerType === 'CITY' ? 'account_balance' : 'domain'" :size="20" /></span>
            <div class="flex-1 min-w-0">
              <b>{{ t('events.detail.organizedBy', { name: e.organizerName }) }}</b>
              <div v-if="e.externalUrl" class="text-muted text-[14px] mt-0.5 truncate">{{ e.externalUrl.replace(/^https?:\/\//, '') }}</div>
            </div>
          </template>
        </div>
        <p class="text-muted text-[12px] mt-3.5 mb-0">{{ e.isDemo ? t('events.detail.demoNote') : t('events.detail.realNote') }}</p>
      </div>

      <aside class="min-w-0 lg:sticky lg:top-[84px]">
        <!-- caseta de bilete (design `.ticketbox`) -->
        <div class="bg-white border border-line rounded-[16px] p-[18px]">
          <template v-if="e.ticketType === 'IN_APP'">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <b>{{ t('events.badge.inApp') }}</b>
              <span class="inline-flex text-[11px] font-semibold px-[9px] py-[3px] rounded-full bg-ink text-white">{{ t('tickets.onlyHere') }}</span>
            </div>
            <div :class="kv" class="mt-2"><AppIcon name="schedule" :size="18" class="text-muted" /><span>{{ when }}</span></div>
            <div :class="kv"><AppIcon name="location_on" :size="18" class="text-muted" /><span class="flex-1 min-w-0">{{ e.locationName }}</span>
              <span v-if="e.distanceKm != null" class="text-muted text-[12px]">{{ fmt.km(e.distanceKm) }}</span></div>
            <router-link v-if="myTicket" :to="`/tickets/${myTicket.code}`" :class="btnLg" class="bg-ink text-white mt-3">
              <AppIcon name="qr_code_2" :size="20" />{{ t('tickets.ticket.myTicket', { code: myTicket.code }) }}
            </router-link>
            <button v-else-if="ended" type="button" disabled :class="btnLg" class="bg-soft text-ink mt-3">{{ t('events.detail.ended') }}</button>
            <button v-else-if="e.spotsLeft === 0" type="button" disabled :class="btnLg" class="bg-ink text-white mt-3">{{ t('events.detail.soldOut') }}</button>
            <template v-else>
              <div class="mt-1.5"><TicketQtyRows :kinds="pick.kinds.value" :qty="pick.qty" @step="pick.step" /></div>
              <div class="flex justify-between text-[16px] mt-3 mb-2.5"><b>{{ t('tickets.total') }}</b><b>{{ fmt.money(pick.total.value) }}</b></div>
              <p v-if="pick.tooMany.value" class="flex gap-2 items-start px-3 py-2.5 rounded-[12px] bg-bad-soft text-bad text-[13px] m-0 mb-2.5" role="alert">
                <AppIcon name="error" :size="18" />{{ t('tickets.pick.onlyLeft', { n: pick.left.value }) }}
              </p>
              <button type="button" :class="btnLg" class="bg-ink text-white" :disabled="pick.blocked.value" @click="buy">
                <AppIcon name="lock" :size="20" />{{ t('tickets.continueToPay') }}
              </button>
            </template>
            <p class="text-muted text-[12px] text-center mt-2 mb-0">{{ cardOn ? t('tickets.webPayNoteCard') : t('tickets.webPayNote') }}</p>
          </template>

          <template v-else-if="e.ticketType === 'FREE'">
            <b>{{ e.capacity ? t('events.detail.freeRegTitle') : t('tickets.freeEntry') }}</b>
            <div :class="kv" class="mt-2"><AppIcon name="schedule" :size="18" class="text-muted" /><span>{{ when }}</span></div>
            <div :class="kv"><AppIcon name="location_on" :size="18" class="text-muted" /><span>{{ e.locationName }}</span></div>
            <div v-if="e.capacity" :class="kv"><AppIcon name="group" :size="18" class="text-muted" /><span>{{ t('events.detail.spotsLeft', { n: e.spotsLeft ?? 0 }) }}</span></div>
            <router-link v-if="e.capacity && myTicket" :to="`/tickets/${myTicket.code}`" :class="btnLg" class="bg-ink text-white mt-2.5">
              <AppIcon name="qr_code_2" :size="20" />{{ t('tickets.ticket.myRegistration') }}
            </router-link>
            <button v-else-if="ended" type="button" disabled :class="btnLg" class="bg-soft text-ink mt-2.5">{{ t('events.detail.ended') }}</button>
            <button v-else-if="e.capacity" type="button" :class="btnLg" class="bg-ink text-white mt-2.5" :disabled="joining || e.spotsLeft === 0" @click="joinFree">
              {{ e.spotsLeft === 0 ? t('events.detail.soldOut') : t('events.detail.register') }}
            </button>
            <AddToCalendar v-else :event="e" :icon-size="20" :class="btnLg" class="bg-white border border-line text-ink mt-2.5" />
          </template>

          <template v-else>
            <b>{{ t('events.detail.extTitle') }}</b>
            <div class="text-muted text-[14px] mt-1">{{ e.organizerName }} · {{ fmt.price(e) }}</div>
            <div :class="kv" class="mt-2"><AppIcon name="schedule" :size="18" class="text-muted" /><span>{{ when }}</span></div>
            <div :class="kv"><AppIcon name="location_on" :size="18" class="text-muted" /><span>{{ e.locationName }}</span></div>
            <button v-if="ended" type="button" disabled :class="btnLg" class="bg-soft text-ink mt-2.5">{{ t('events.detail.ended') }}</button>
            <a v-else-if="e.externalUrl" :href="e.externalUrl" target="_blank" rel="noopener" :class="btnLg" class="bg-ink text-white mt-2.5">
              <AppIcon name="open_in_new" :size="20" /><span class="truncate">{{ e.externalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') }}</span>
            </a>
            <p class="text-muted text-[12px] text-center mt-2 mb-0">{{ t('tickets.externalNote') }}</p>
          </template>
        </div>

        <!-- harta mică cu pinul evenimentului -->
        <div class="bg-white border border-line rounded-[16px] overflow-hidden mt-3.5">
          <div class="h-[220px] relative">
            <MapView :markers="markers" :selected-id="markers[0]?.id" :center="{ lat: e.lat, lng: e.lng }" :zoom="15" :insets="{ top: 0, bottom: 0 }" />
          </div>
          <div class="flex items-center gap-2.5 px-3 py-2.5">
            <span class="flex-1 min-w-0 text-muted text-[12.5px]">{{ e.address ?? e.locationName }}</span>
            <router-link :to="mapTo" class="h-8 px-[11px] rounded-[9px] border border-line bg-white text-ink text-[13px] font-semibold inline-flex items-center no-underline shrink-0">{{ t('events.detail.openMap') }}</router-link>
          </div>
          <!-- T22: stația CTP cea mai apropiată + următoarele sosiri (nu apare peste 1,5 km) -->
          <div class="px-3 border-t border-line empty:hidden"><NearestStop :lat="e.lat" :lng="e.lng" /></div>
        </div>
      </aside>
    </div>
  </template>
</template>
