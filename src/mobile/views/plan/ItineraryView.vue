<script setup lang="ts">
// T13 · E2 — Programul tău (design/final mobile `/itinerary/:id`): hero cu prima oprire, „Făcut de AradBot”, cererea ta +
// „Modifică în chat”, rezumatul, inelul de progres, ziua (la 2 zile), timeline-ul cu bife, „Cum ajung” / „Ghidul” / „Detalii”
// și drumul dintre opriri; jos „Vezi pe hartă”, salvare și plan nou. Logica: shared/composables/useItinerary.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import { MODE_ICON, mapTarget, stopHref, useItinerary, useItineraryFormat } from '@/shared/composables/useItinerary'
import { useBack } from '@/shared/composables/useBack'
import { useShare } from '@/shared/composables/useShare'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const auth = useAuthStore()
const ui = useUiStore()
const back = useBack('/itineraries')
const share = useShare()
const fmt = useItineraryFormat()
const id = computed(() => String(route.params.id))
const initialDay = route.query.day === '2' ? 2 : 1
const { it, loading, notFound, load, day, days, stops, legAfter, done, doneCount, total, allDone, next, pct, cover, toggle } = useItinerary(id, initialDay)

const sub = computed(() => {
  const v = it.value
  if (!v) return ''
  const parts = [fmt.when(v), t('plan.stops', { n: total.value })]
  if (v.totalKm) parts.push(t(`plan.detail.km.${v.transport}`, { km: fmt.km(v.totalKm) }))
  return parts.join(' · ')
})
const mapLink = computed(() => ({ path: `/itinerary/${id.value}/map`, query: days.value.length > 1 ? { day: String(day.value) } : {} }))

function pickDay(d: 1 | 2) {
  day.value = d
  void router.replace({ query: { ...route.query, day: String(d) } })
}
function doShare() {
  const v = it.value
  if (!v) return
  void share(v.title, `${window.location.origin}/itinerary/${v.shareCode ?? v.id ?? id.value}`)
}
function bookmark() {
  if (auth.user) ui.toast(t('plan.detail.saved'), 'success')
  else ui.toast(t('plan.detail.signIn'), 'info', { label: t('plan.detail.signInAction'), onClick: () => void router.push({ path: '/login', query: { next: route.fullPath } }) }, 6000)
}
</script>

<template>
  <div v-if="loading && !it" class="pt-4"><Skeleton :rows="4" :height="110" /></div>
  <div v-else-if="!it" class="pt-6">
    <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center -ml-2.5 mb-2" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <EmptyState icon="route" :title="notFound ? t('plan.detail.notFound') : t('plan.detail.loadError')" :action="notFound ? t('plan.detail.newPlan') : t('common.retry')"
      @action="notFound ? router.push('/plan') : load()" />
  </div>
  <template v-else>
    <!-- design `.hero` 260px: poza primei opriri, butoanele sus, titlul jos pe gradient -->
    <div class="relative h-[260px] -mx-5 -mt-[max(12px,env(safe-area-inset-top))] bg-ink bg-cover bg-center flex items-end before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[150px] before:bg-gradient-to-b before:from-black/40 before:to-transparent before:pointer-events-none"
      :style="cover ? { backgroundImage: `url('${cover}')` } : undefined">
      <AppIcon v-if="!cover" name="route" :size="96" class="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-white/20" />
      <div class="absolute top-[max(16px,calc(env(safe-area-inset-top)+8px))] inset-x-4 flex justify-between z-10">
        <button type="button" class="w-11 h-11 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
        <button type="button" class="w-11 h-11 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('plan.detail.share')" @click="doShare"><AppIcon name="ios_share" /></button>
      </div>
      <div class="relative w-full px-5 pt-5 pb-[22px] bg-gradient-to-t from-black/70 to-transparent text-white">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex items-center gap-[5px] text-[13px] font-semibold px-2.5 py-1 rounded-full bg-white/95 text-ink shadow-[0_2px_8px_rgba(0,0,0,.12)]"><AppIcon name="auto_awesome" :size="15" />{{ t('plan.madeBy') }}</span>
          <span v-if="it.offline" class="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-[3px] rounded-full bg-black/45 text-white" :title="t('plan.detail.offlineAria')"><AppIcon name="cloud_off" :size="14" />{{ t('plan.detail.offline') }}</span>
        </div>
        <h1 class="m-0 text-[30px] leading-[1.08] font-semibold tracking-[-0.03em] text-white">{{ it.title }}</h1>
        <div class="text-[14px] opacity-90 mt-1">{{ sub }}</div>
      </div>
    </div>

    <div class="pt-5">
      <!-- cererea ta, ca în chat -->
      <div v-if="it.ask" class="flex gap-2.5 items-start">
        <span class="w-9 h-9 rounded-full bg-soft flex items-center justify-center shrink-0" :aria-label="t('plan.detail.you')"><AppIcon name="person" :size="20" /></span>
        <div class="flex-1 px-4 py-3 rounded-[20px] rounded-bl-[6px] bg-white border border-line text-[15px] leading-[1.4]">{{ it.ask }}</div>
      </div>
      <router-link to="/chat" class="inline-flex items-center gap-1 mt-2 ml-[46px] text-[14px] font-semibold underline underline-offset-[3px] text-ink">
        <AppIcon name="edit" :size="16" />{{ t('plan.detail.editInChat') }}
      </router-link>

      <div v-if="it.summary" class="flex gap-2.5 mt-3.5 px-3.5 py-3 rounded-[14px] bg-soft text-muted text-[13.5px] leading-[1.45]">
        <AppIcon name="auto_awesome" :size="18" class="shrink-0" /><span>{{ it.summary }}</span>
      </div>

      <!-- progresul: inelul conic -->
      <div class="flex items-center gap-4 mt-3.5 p-4 rounded-[20px] bg-white border border-line">
        <div class="w-[72px] h-[72px] rounded-full flex items-center justify-center shrink-0" :style="{ background: `conic-gradient(var(--color-green, #3B6D11) ${pct}%, var(--color-line, #E8E8E3) 0)` }"
          role="img" :aria-label="t('plan.detail.progress', { done: doneCount, total })">
          <b class="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[16px]">{{ doneCount }}/{{ total }}</b>
        </div>
        <div class="flex-1 min-w-0">
          <b class="block text-[18px] leading-tight">{{ allDone ? t('plan.detail.allDone') : t('plan.detail.progress', { done: doneCount, total }) }}</b>
          <p class="text-muted text-[14px] mt-0.5 mb-0">{{ allDone ? t('plan.detail.allDoneSub') : next ? t('plan.detail.next', { name: next.name }) : '' }}</p>
        </div>
      </div>

      <div v-if="days.length > 1" class="flex gap-1 p-1 mt-3.5 rounded-[16px] bg-soft" role="tablist">
        <button v-for="d in days" :key="d" type="button" role="tab" :aria-selected="day === d"
          class="flex-1 min-h-11 rounded-[12px] text-[15px]" :class="day === d ? 'bg-white text-ink font-semibold shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'text-muted font-medium'"
          @click="pickDay(d)">{{ t('plan.detail.day', { n: d, wd: fmt.weekday(it, d) }) }}</button>
      </div>

      <!-- design `.tl`: linia verticală, bifa în stânga fiecărei opriri -->
      <div class="relative pl-11 mt-[18px] before:content-[''] before:absolute before:left-[15px] before:top-5 before:bottom-5 before:w-[3px] before:bg-line before:rounded-sm">
        <div v-for="s in stops" :key="s.order" class="relative mb-3.5">
          <button type="button" class="absolute -left-11 top-3.5 w-8 h-8 rounded-full border-2 flex items-center justify-center"
            :class="done.includes(s.order) ? 'bg-green border-green text-white' : 'bg-white border-line'"
            :aria-pressed="done.includes(s.order)" :aria-label="t('plan.detail.check', { name: s.name })" @click="toggle(s)">
            <AppIcon v-if="done.includes(s.order)" name="check" :size="18" />
          </button>
          <div class="p-4 rounded-[20px] bg-white border border-line">
            <div class="flex gap-3 items-start">
              <div class="w-16 h-16 rounded-[14px] shrink-0 bg-soft bg-cover bg-center flex items-center justify-center text-muted" :style="s.imageUrl ? { backgroundImage: `url('${s.imageUrl}')` } : undefined">
                <AppIcon v-if="!s.imageUrl" :name="s.kind === 'EVENT' ? 'event' : s.kind === 'OFFER' ? 'sell' : 'location_on'" :size="26" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-muted text-[13px] font-semibold">{{ fmt.time(s) }} · {{ fmt.duration(s.durationMin) }}</div>
                <b class="block text-[16px] leading-[1.25] my-0.5" :class="done.includes(s.order) ? 'line-through text-muted' : ''">{{ s.name }}</b>
                <span class="text-muted text-[13px]">{{ s.subtitle }}</span>
              </div>
            </div>
            <div v-if="s.note" class="flex gap-2.5 mt-2.5 px-3.5 py-3 rounded-[14px] bg-soft text-muted text-[13.5px] leading-[1.45]">
              <AppIcon name="auto_awesome" :size="18" class="shrink-0" /><span>{{ s.note }}</span>
            </div>
            <div v-if="s.parkingHint" class="flex gap-2.5 mt-2.5 px-3.5 py-3 rounded-[14px] bg-soft text-muted text-[13.5px] leading-[1.45]">
              <AppIcon name="local_parking" :size="18" class="shrink-0" /><span>{{ s.parkingHint }}</span>
            </div>
            <div class="flex gap-2 mt-2.5">
              <router-link :to="mapTarget(s)" class="flex-1 min-h-9 px-3 rounded-[12px] bg-white border border-line text-ink text-[13px] font-semibold flex items-center justify-center gap-1.5 no-underline">
                <AppIcon name="directions" :size="16" />{{ t('plan.detail.howToGet') }}</router-link>
              <router-link :to="stopHref(s)" class="flex-1 min-h-9 px-3 rounded-[12px] bg-white border border-line text-ink text-[13px] font-semibold flex items-center justify-center gap-1.5 no-underline">
                <AppIcon :name="s.hasGuide && s.kind === 'PLACE' ? 'headphones' : 'info'" :size="16" />{{ s.hasGuide && s.kind === 'PLACE' ? t('plan.detail.guide') : t('plan.detail.details') }}</router-link>
            </div>
          </div>
          <div v-if="legAfter.get(s.order)" class="flex items-center gap-1.5 pt-0.5 pb-2.5 text-[13px] text-muted">
            <AppIcon :name="MODE_ICON[legAfter.get(s.order)!.mode]" :size="16" />{{ fmt.legText(legAfter.get(s.order)!.minutes, legAfter.get(s.order)!.km) }}
          </div>
        </div>
      </div>
      <div class="h-[120px]" />
    </div>

    <!-- design `.bottombar`: acoperă tab bar-ul pe acest ecran -->
    <div class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-40 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-line flex items-center gap-3">
      <router-link :to="mapLink" class="flex-1 min-h-[52px] px-5 rounded-[16px] bg-ink text-white text-[16px] font-semibold flex items-center justify-center gap-2 no-underline">
        <AppIcon name="map" :size="18" />{{ t('plan.detail.onMap') }}</router-link>
      <button type="button" class="min-h-[52px] px-3.5 rounded-[16px] bg-white border border-line flex items-center justify-center" :aria-label="t('plan.detail.save')" @click="bookmark">
        <AppIcon name="bookmark" :size="18" /></button>
      <router-link to="/plan" class="min-h-[52px] px-3.5 rounded-[16px] bg-white border border-line text-ink flex items-center justify-center no-underline" :aria-label="t('plan.detail.newPlan')">
        <AppIcon name="refresh" :size="18" /></router-link>
    </div>
  </template>
</template>
