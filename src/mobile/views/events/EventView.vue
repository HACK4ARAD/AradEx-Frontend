<script setup lang="ts">
// T06 · S3 Detaliu eveniment — design/final `/event/:id`: hero cu poză + credit, categorie + Popular, tipul de bilete, dată, loc, organizator,
// descriere, „Trimite / Raportează”, bara de jos cu preț și acțiunea principală.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import EventImage from '@/shared/components/events/EventImage.vue'
import NearestStop from '@/shared/components/transit/NearestStop.vue'
import { googleCalendarUrl, useEventFormat, useSaveEvent } from '@/shared/composables/useEvents'
import { useEventPage } from '@/shared/composables/useEventPage'
import { useBack } from '@/shared/composables/useBack'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const ui = useUiStore()
const back = useBack('/')
const fmt = useEventFormat()
const saver = useSaveEvent()
const id = computed(() => Number(route.params.id))
/** Detaliul + obiectivul cu ghid (T05) + firma (T09) + biletul meu și înscrierea gratuită (T07): logica e comună cu web-ul (W6). */
const { event: e, loading, notFound, reload, place, biz, myTicket, ended, joining, joinFree, share } = useEventPage(id)
const extSheet = ref(false)

const dur = computed(() => (e.value ? fmt.durationMin(e.value) : null))
const info = computed(() => {
  const v = e.value
  if (!v) return null
  if (v.ticketType === 'IN_APP') return { icon: 'confirmation_number', title: t('events.detail.inAppTitle'), text: t('events.detail.inAppText') }
  if (v.ticketType === 'FREE') return v.capacity
    ? { icon: 'event_available', title: t('events.detail.freeRegTitle'), text: t('events.detail.freeRegText', { n: v.spotsLeft ?? 0 }) }
    : { icon: 'event_available', title: t('events.detail.freeTitle'), text: t('events.detail.freeText') }
  return { icon: 'open_in_new', title: t('events.detail.extTitle'), text: t('events.detail.extText') }
})
const showPrice = computed(() => !!e.value && (e.value.ticketType === 'IN_APP' || (e.value.ticketType === 'EXTERNAL' && !!e.value.priceFrom)))

function openExternal() {
  if (e.value?.externalUrl) window.open(e.value.externalUrl, '_blank', 'noopener')
  extSheet.value = false
}
</script>

<template>
  <div v-if="loading && !e" class="pt-4"><Skeleton :rows="3" :height="120" /></div>
  <div v-else-if="notFound || !e" class="pt-6">
    <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center -ml-2.5 mb-2" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <EmptyState icon="event_busy" :title="t('events.detail.notFound')" :action="notFound ? undefined : t('common.retry')" @action="reload" />
  </div>
  <template v-else>
    <!-- hero pe toată lățimea, sub bara de stare -->
    <EventImage :src="e.imageUrl" :category="e.category" :emoji-size="96" class="h-[300px] -mx-5 -mt-[max(12px,env(safe-area-inset-top))] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[150px] before:bg-gradient-to-b before:from-black/40 before:to-transparent before:pointer-events-none">
      <div class="absolute top-[max(16px,calc(env(safe-area-inset-top)+8px))] inset-x-4 flex justify-between z-10">
        <button type="button" class="w-11 h-11 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
        <div class="flex gap-2">
          <button type="button" class="w-11 h-11 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('events.detail.share')" @click="share"><AppIcon name="ios_share" /></button>
          <button type="button" class="w-11 h-11 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="e.saved ? t('events.saved') : t('events.save')" :aria-pressed="!!e.saved" @click="saver.toggle(e, '/login')">
            <AppIcon :name="e.saved ? 'bookmark' : 'bookmark_border'" :fill="!!e.saved" />
          </button>
        </div>
      </div>
      <span v-if="e.imageUrl && e.imageCredit" class="absolute right-3 bottom-3 text-[11px] text-white bg-black/45 px-2 py-[3px] rounded-lg">{{ e.imageCredit }}</span>
    </EventImage>

    <div class="pt-[18px]">
      <div class="flex gap-2 flex-wrap items-center mb-2">
        <span class="uppercase tracking-[.06em] text-[12.5px] font-semibold text-muted">{{ t(`events.category.${e.category}`) }}</span>
        <span v-if="e.isHot" class="inline-flex items-center gap-[5px] text-[13px] font-bold px-2.5 py-1 rounded-full bg-[#FFC43D] text-[#111]">🔥 {{ t('events.popular') }} · {{ fmt.hotLabel(e) }}</span>
        <span v-if="e.isDemo" class="inline-flex text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-soft">{{ t('events.demo') }}</span>
      </div>
      <h1 class="text-[28px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ e.title }}</h1>

      <div v-if="info" class="flex gap-2.5 mt-4 px-3.5 py-3 rounded-[14px] bg-white border border-line text-[13.5px] leading-[1.45]">
        <AppIcon :name="info.icon" />
        <span><b>{{ info.title }}</b><br><span class="text-muted">{{ info.text }}</span></span>
      </div>

      <div class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="schedule" class="text-muted" />
        <div class="flex-1 min-w-0"><div class="text-[15.5px]">{{ fmt.when(e, !!dur) }}<template v-if="dur"> · {{ t('events.detail.minutes', { n: dur }) }}</template></div></div>
        <a :href="googleCalendarUrl(e)" target="_blank" rel="noopener" class="min-h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-[13px] font-medium border border-line bg-white no-underline text-ink shrink-0">
          <AppIcon name="event_available" :size="18" />{{ t('events.detail.calendar') }}
        </a>
      </div>
      <div class="flex items-center gap-3 py-3.5 border-b border-line">
        <AppIcon name="location_on" class="text-muted" />
        <div class="flex-1 min-w-0">
          <div class="text-[15.5px]">{{ e.locationName }}</div>
          <div class="text-[13px] text-muted mt-0.5">{{ [e.address, e.distanceKm != null ? fmt.km(e.distanceKm) : ''].filter(Boolean).join(' · ') }}</div>
        </div>
        <router-link :to="{ path: '/map', query: { to: `event:${e.id}` } }" class="min-h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-[13px] font-medium border border-line bg-white no-underline text-ink shrink-0">
          <AppIcon name="directions" :size="18" />{{ t('events.detail.directions') }}
        </router-link>
      </div>
      <!-- T22: stația CTP cea mai apropiată de locul evenimentului + următoarele sosiri -->
      <NearestStop :lat="e.lat" :lng="e.lng" bordered :to="`event:${e.id}`" />
      <router-link v-if="e.organizerBusinessId" :to="`/businesses/${e.organizerBusinessId}`" class="flex items-center gap-3 py-3.5 border-b border-line no-underline text-ink">
        <AppIcon name="storefront" class="text-muted" />
        <div class="flex-1 min-w-0">
          <div class="text-[15.5px]">{{ t('events.detail.organizedBy', { name: e.organizerName }) }}</div>
          <div v-if="biz" class="text-[13px] text-muted mt-0.5">{{ t(`auth.category.${biz.category}`) }}<template v-if="biz.verified"> · {{ t('events.detail.verifiedAccount') }}</template></div>
        </div>
        <AppIcon name="chevron_right" />
      </router-link>
      <div v-else class="flex items-center gap-3 py-3.5" :class="place ? 'border-b border-line' : ''">
        <AppIcon :name="e.organizerType === 'CITY' ? 'account_balance' : 'domain'" class="text-muted" />
        <div class="flex-1 min-w-0">
          <div class="text-[15.5px]">{{ t('events.detail.organizedBy', { name: e.organizerName }) }}</div>
          <div v-if="e.externalUrl" class="text-[13px] text-muted mt-0.5 truncate">{{ e.externalUrl.replace(/^https?:\/\//, '') }}</div>
        </div>
      </div>

      <router-link v-if="place" :to="`/places/${place.id}`" class="flex items-center gap-3 py-3.5 border-b border-line no-underline text-ink">
        <AppIcon name="headphones" class="text-muted" />
        <div class="flex-1 min-w-0">
          <div class="text-[15.5px]">{{ t('events.detail.guide', { name: place.name }) }}</div>
          <div class="text-[13px] text-muted mt-0.5">{{ t('events.detail.guideSub', { n: place.guidePoints.length, m: place.guideMinutes }) }}</div>
        </div>
        <AppIcon name="chevron_right" />
      </router-link>

      <h3 class="text-[16px] font-semibold mt-[18px] mb-1.5">{{ t('events.detail.about') }}</h3>
      <p class="text-[15px] text-muted leading-[1.45] m-0 whitespace-pre-line">{{ e.description }}</p>

      <div class="flex gap-2 mt-[18px]">
        <button type="button" class="min-h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-[13px] font-medium border border-line bg-white" @click="share"><AppIcon name="ios_share" :size="18" />{{ t('events.detail.share') }}</button>
        <button type="button" class="min-h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-[13px] font-medium border border-line bg-white" @click="ui.toast(t('events.detail.reportThanks'))"><AppIcon name="flag" :size="18" />{{ t('events.detail.report') }}</button>
      </div>
      <p class="text-muted text-[12px] mt-3.5">{{ e.isDemo ? t('events.detail.demoNote') : t('events.detail.realNote') }}</p>
      <div class="h-[120px]" />
    </div>

    <!-- bara de jos (design `.bottombar`): acoperă tab bar-ul pe acest ecran -->
    <div class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-40 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-line flex items-center gap-3">
      <div v-if="showPrice" class="shrink-0"><small class="block text-[12px] text-muted">{{ t('events.detail.price') }}</small><b class="text-[18px]">{{ fmt.price(e) }}</b></div>
      <button v-if="ended" type="button" disabled class="flex-1 min-h-[52px] rounded-[16px] bg-soft text-ink text-[16px] font-semibold opacity-60">{{ t('events.detail.ended') }}</button>
      <template v-else-if="e.ticketType === 'IN_APP'">
        <button v-if="e.spotsLeft === 0" type="button" disabled class="flex-1 min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold opacity-45">{{ t('events.detail.soldOut') }}</button>
        <button v-else type="button" class="flex-1 min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold" @click="router.push(`/events/${e.id}/tickets`)">{{ t('events.detail.buy') }}</button>
      </template>
      <template v-else-if="e.ticketType === 'FREE'">
        <router-link v-if="e.capacity && myTicket" :to="`/tickets/${myTicket.code}`" class="flex-1 min-h-[52px] rounded-[16px] bg-soft text-ink text-[16px] font-semibold flex items-center justify-center no-underline">{{ t('events.detail.registered') }}</router-link>
        <button v-else-if="e.capacity" type="button" class="flex-1 min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold disabled:opacity-60" :disabled="joining || e.spotsLeft === 0" @click="joinFree">{{ e.spotsLeft === 0 ? t('events.detail.soldOut') : t('events.detail.register') }}</button>
        <a v-else :href="googleCalendarUrl(e)" target="_blank" rel="noopener" class="flex-1 min-h-[52px] rounded-[16px] bg-white border border-line text-ink text-[16px] font-semibold flex items-center justify-center gap-2 no-underline">
          <AppIcon name="event_available" :size="18" />{{ t('events.detail.addToCalendar') }}
        </a>
      </template>
      <button v-else type="button" class="flex-1 min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold flex items-center justify-center gap-2" @click="extSheet = true">
        <AppIcon name="open_in_new" :size="18" />{{ t('events.detail.external') }}
      </button>
    </div>

    <AppSheet v-model:open="extSheet" :title="t('events.detail.extSheetTitle')" :closable="false">
      <p class="text-muted m-0">{{ t('events.detail.extSheetText') }}</p>
      <div class="flex flex-col gap-2.5 mt-[18px]">
        <button type="button" class="min-h-[52px] rounded-[16px] bg-ink text-white font-semibold flex items-center justify-center gap-2" @click="openExternal"><AppIcon name="open_in_new" :size="18" />{{ t('events.detail.openSite') }}</button>
        <button type="button" class="min-h-[52px] rounded-[16px] bg-white border border-line font-semibold" @click="extSheet = false">{{ t('events.detail.stay') }}</button>
      </div>
    </AppSheet>
  </template>
</template>
