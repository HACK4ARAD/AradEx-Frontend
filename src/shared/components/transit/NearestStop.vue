<script setup lang="ts">
// T22 · rândul „Stația cea mai apropiată · tramvaiul 1 în 4 min” de pe detaliul evenimentului (S3) și al obiectivului (E3).
// Se reîncarcă la 30 s doar cât ecranul e vizibil; nu apare dacă stația e mai departe de 1,5 km sau dacă cererea pică
// (e un rând ajutător, fără toast). Fără date live arată liniile din stație („Fără date live acum”).
// Cu `to` (doar în aplicație, T19) rândul duce la planul de drum din tab-ul Transport („Cum ajung”).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import { arrivalWhen, lineName, nextPerLine, useNearestStop } from '@/shared/composables/useTransit'

const props = defineProps<{ lat: number; lng: number; bordered?: boolean; to?: string }>()
const { t } = useI18n()
const { km } = useFormat()

const point = computed(() => (Number.isFinite(props.lat) && Number.isFinite(props.lng) ? { lat: props.lat, lng: props.lng } : null))
const { nearby: d } = useNearestStop(point)

const next = computed(() => nextPerLine(d.value?.arrivals ?? []))
/** Iconul după prima sosire; fără sosiri nu știm dacă e tramvai sau autobuz → iconul neutru. */
const icon = computed(() => {
  const mode = next.value[0]?.mode
  return mode === 'TRAM' ? 'tram' : mode === 'BUS' ? 'directions_bus' : 'directions_transit'
})
const summary = computed(() => {
  const s = d.value
  if (!s) return ''
  if (next.value.length) return next.value.map((a) => `${lineName(t, a)} ${arrivalWhen(t, a)}`).join(' · ')
  const lines = s.stop.lines.length ? t('transit.nearest.lines', { lines: s.stop.lines.join(', ') }) : ''
  return [lines, t(s.live ? 'transit.nearest.noArrivals' : 'transit.nearest.noLive')].filter(Boolean).join(' · ')
})
</script>

<template>
  <component :is="to ? 'router-link' : 'div'" v-if="d" :to="to ? { path: '/transport', query: { to } } : undefined" class="flex items-center gap-3 py-3.5 no-underline text-ink" :class="bordered ? 'border-b border-line' : ''" data-test="nearest-stop">
    <AppIcon :name="icon" class="text-muted" />
    <div class="flex-1 min-w-0">
      <div class="text-[15.5px]">{{ t('transit.nearest.title', { name: d.stop.name }) }}</div>
      <div class="text-[13px] text-muted mt-0.5">{{ summary }}</div>
      <div class="text-[11px] text-muted mt-0.5">
        <template v-if="d.distanceKm != null">{{ t('transit.nearest.distance', { distance: km(d.distanceKm) }) }} · </template>{{ t('transit.attribution') }}
      </div>
    </div>
    <span v-if="d.live && next.length" class="w-2 h-2 rounded-full bg-green shrink-0" :title="t('transit.attribution')" aria-hidden="true" />
    <span v-if="to" class="shrink-0 flex items-center gap-0.5 text-[13px] font-semibold">{{ t('transit.nearest.howTo') }}<AppIcon name="chevron_right" :size="18" /></span>
  </component>
</template>
