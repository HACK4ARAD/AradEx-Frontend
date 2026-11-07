<script setup lang="ts">
// T22 · rândul „Stația cea mai apropiată · tramvaiul 1 în 4 min” de pe detaliul evenimentului (S3) și al obiectivului (E3).
// Se reîncarcă la 30 s doar cât ecranul e vizibil; nu apare dacă stația e mai departe de 1,5 km sau dacă cererea pică
// (e un rând ajutător, fără toast). Fără date live arată liniile din stație („Fără date live acum”).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import { arrivalWhen, lineName, nextPerLine, useNearestStop } from '@/shared/composables/useTransit'

const props = defineProps<{ lat: number; lng: number; bordered?: boolean }>()
const { t } = useI18n()
const { km } = useFormat()

const point = computed(() => (Number.isFinite(props.lat) && Number.isFinite(props.lng) ? { lat: props.lat, lng: props.lng } : null))
const { nearby: d } = useNearestStop(point)

const next = computed(() => nextPerLine(d.value?.arrivals ?? []))
const isTram = computed(() => (next.value[0]?.mode ?? 'TRAM') === 'TRAM')
const summary = computed(() => {
  const s = d.value
  if (!s) return ''
  if (next.value.length) return next.value.map((a) => `${lineName(t, a)} ${arrivalWhen(t, a)}`).join(' · ')
  const lines = s.stop.lines.length ? t('transit.nearest.lines', { lines: s.stop.lines.join(', ') }) : ''
  return [lines, t(s.live ? 'transit.nearest.noArrivals' : 'transit.nearest.noLive')].filter(Boolean).join(' · ')
})
</script>

<template>
  <div v-if="d" class="flex items-center gap-3 py-3.5" :class="bordered ? 'border-b border-line' : ''" data-test="nearest-stop">
    <AppIcon :name="isTram ? 'tram' : 'directions_bus'" class="text-muted" />
    <div class="flex-1 min-w-0">
      <div class="text-[15.5px]">{{ t('transit.nearest.title', { name: d.stop.name }) }}</div>
      <div class="text-[13px] text-muted mt-0.5">{{ summary }}</div>
      <div class="text-[11px] text-muted mt-0.5">
        <template v-if="d.distanceKm != null">{{ t('transit.nearest.distance', { distance: km(d.distanceKm) }) }} · </template>{{ t('transit.attribution') }}
      </div>
    </div>
    <span v-if="d.live && next.length" class="w-2 h-2 rounded-full bg-green shrink-0" :title="t('transit.attribution')" aria-hidden="true" />
  </div>
</template>
