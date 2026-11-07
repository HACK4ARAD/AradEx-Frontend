<script setup lang="ts">
// T13 · E4 — Traseul tău (design/final mobile `/itinerary/:id/map`): harta pe tot ecranul cu pinii numerotați și traseul pe
// străzi al zilei (`?day=2`), bara de sus „Traseul tău · X km · N min”, cardul „Oprirea N din M” cu săgeți, „Navighează”
// (Google Maps) și „Pornește ghidul” / „Detalii”. Un tap pe pin alege oprirea. Logica: shared/composables/useItinerary.
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import MapView, { type MapMarker } from '@/shared/components/map/MapView.vue'
import { MODE_ICON, legTotals, navigateUrl, stopHref, useItinerary, useItineraryFormat, useItineraryRoute } from '@/shared/composables/useItinerary'
import { useBack } from '@/shared/composables/useBack'
import { useUiStore } from '@/shared/stores/ui'

const route = useRoute()
const { t } = useI18n()
const ui = useUiStore()
const fmt = useItineraryFormat()
const id = computed(() => String(route.params.id))
const back = useBack(`/itinerary/${id.value}`)
const { it, loading, notFound, load, stops } = useItinerary(id, route.query.day === '2' ? 2 : 1)
const line = useItineraryRoute(stops, computed(() => it.value?.transport))

const cur = ref(0)
watch(stops, () => { cur.value = 0 })
const s = computed(() => stops.value[Math.min(cur.value, stops.value.length - 1)] ?? null)
const markers = computed<MapMarker[]>(() => stops.value.map((x, i) => ({ id: String(x.order), lat: x.lat, lng: x.lng, kind: 'place', label: String(i + 1) })))
const totals = computed(() => legTotals(stops.value))
const transport = computed(() => it.value?.transport ?? 'WALK')
const isGuide = computed(() => !!s.value && s.value.kind === 'PLACE' && s.value.hasGuide)

function select(markerId: string | null) {
  if (markerId == null) return
  const i = stops.value.findIndex((x) => String(x.order) === markerId)
  if (i >= 0) cur.value = i
}
</script>

<template>
  <div v-if="loading && !it" class="pt-4"><Skeleton :rows="2" :height="160" /></div>
  <div v-else-if="!it" class="pt-6">
    <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center -ml-2.5 mb-2" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <EmptyState icon="route" :title="notFound ? t('plan.detail.notFound') : t('plan.detail.loadError')" :action="notFound ? undefined : t('common.retry')" @action="load" />
  </div>
  <div v-else class="fixed inset-0 mx-auto w-full max-w-[480px] z-0">
    <MapView :markers="markers" :selected-id="s ? String(s.order) : null" :route="line?.line ?? null" :route-approximate="line?.approximate"
      :insets="{ top: 90, bottom: 250 }" @select="select" />

    <!-- design `.mapui`: înapoi + „Traseul tău · km · min” + modul -->
    <div class="absolute left-4 right-4 top-[max(12px,env(safe-area-inset-top))] z-[500] flex items-center gap-2.5">
      <button type="button" class="w-11 h-11 shrink-0 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
      <div class="flex-1 min-w-0 h-12 px-4 rounded-[16px] bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.12)] flex items-center gap-2.5 text-ink text-[15px] font-semibold">
        <AppIcon name="route" :size="20" /><span class="truncate">{{ t('plan.map.title', { km: fmt.km(totals.km), min: fmt.duration(totals.minutes) }) }}</span>
      </div>
      <button type="button" class="w-11 h-11 shrink-0 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t(`plan.map.mode.${transport}`)"
        @click="ui.toast(t(`plan.map.mode.${transport}`))"><AppIcon :name="MODE_ICON[transport]" /></button>
    </div>

    <!-- design `.mapcard` -->
    <div v-if="s" class="absolute left-4 right-4 bottom-[max(24px,env(safe-area-inset-bottom))] z-[600] bg-white rounded-[22px] p-3.5 shadow-[0_14px_40px_rgba(0,0,0,.22)]">
      <div class="text-muted text-[12px] font-bold tracking-[.06em] uppercase">{{ t('plan.map.stopOf', { n: cur + 1, total: stops.length }) }}</div>
      <div class="flex items-center gap-3 mt-2">
        <div class="w-14 h-14 rounded-[14px] shrink-0 bg-soft bg-cover bg-center flex items-center justify-center text-muted" :style="s.imageUrl ? { backgroundImage: `url('${s.imageUrl}')` } : undefined">
          <AppIcon v-if="!s.imageUrl" :name="s.kind === 'EVENT' ? 'event' : s.kind === 'OFFER' ? 'sell' : 'location_on'" :size="24" />
        </div>
        <div class="flex-1 min-w-0">
          <b class="block text-[16px] leading-tight truncate">{{ s.name }}</b>
          <span class="text-muted text-[13px] inline-flex items-center gap-1">{{ fmt.time(s) }} ·
            <template v-if="cur > 0"><AppIcon :name="MODE_ICON[s.travelMode]" :size="15" />{{ t('plan.minutes', { n: s.travelMinutesFromPrev }) }}</template>
            <template v-else>{{ t('plan.map.start') }}</template>
          </span>
        </div>
        <div class="flex gap-1 shrink-0">
          <button type="button" class="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center disabled:opacity-40" :disabled="cur === 0" :aria-label="t('plan.map.prev')" @click="cur--"><AppIcon name="chevron_left" /></button>
          <button type="button" class="w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center disabled:opacity-40" :disabled="cur >= stops.length - 1" :aria-label="t('plan.map.next')" @click="cur++"><AppIcon name="chevron_right" /></button>
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <a :href="navigateUrl(s, transport)" target="_blank" rel="noopener" class="flex-1 min-h-11 px-4 rounded-[14px] bg-ink text-white text-[15px] font-semibold flex items-center justify-center gap-1.5 no-underline">
          <AppIcon name="navigation" :size="18" />{{ t('plan.map.navigate') }}</a>
        <router-link :to="stopHref(s)" class="flex-1 min-h-11 px-4 rounded-[14px] bg-white border border-line text-ink text-[15px] font-semibold flex items-center justify-center gap-1.5 no-underline">
          <AppIcon v-if="isGuide" name="headphones" :size="18" />{{ isGuide ? t('plan.map.startGuide') : t('plan.map.details') }}</router-link>
      </div>
    </div>
  </div>
</template>
