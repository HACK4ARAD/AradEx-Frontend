<script setup lang="ts">
// T23 · cardul unui pin de transport pe hartă (S7 / W9): stația cu sosirile următoare (la 30 s, cât e vizibil) sau
// vehiculul live cu linia, direcția, întârzierea și stația următoare. Datele: CTP Arad / Telelink, prin BE (T22).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { arrivalWhen, lineName, nextPerLine, useStopArrivals, vehicleTitle } from '@/shared/composables/useTransit'
import type { TransitPick } from '@/shared/composables/useTransitLayer'
import type { TransitStopDto } from '@/shared/types/transit'

const props = defineProps<{ pick: TransitPick; stops: TransitStopDto[] }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const stopId = computed(() => (props.pick.kind === 'stop' ? props.pick.stop.id : null))
const { data, loading } = useStopArrivals(stopId)
const next = computed(() => nextPerLine(data.value?.arrivals ?? [], 3))

const title = computed(() => (props.pick.kind === 'stop' ? props.pick.stop.name : vehicleTitle(t, props.pick.vehicle)))
const icon = computed(() => {
  if (props.pick.kind === 'stop') return 'signpost'
  return props.pick.vehicle.mode === 'BUS' ? 'directions_bus' : 'tram'
})
const vehicleInfo = computed(() => {
  if (props.pick.kind !== 'vehicle') return []
  const v = props.pick.vehicle
  const out: string[] = []
  if (v.delaySeconds != null) {
    const m = Math.round(v.delaySeconds / 60)
    out.push(m > 0 ? t('transit.card.delay', { n: m }) : t('transit.card.onTime'))
  }
  const ns = v.nextStopId != null ? props.stops.find((s) => s.id === v.nextStopId) : null
  if (ns) out.push(t('transit.card.nextStop', { name: ns.name }))
  return out
})
</script>

<template>
  <div class="bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(17,17,17,.18)]" data-test="transit-card">
    <div class="flex gap-3 items-start">
      <span class="w-11 h-11 rounded-[12px] bg-[#E8EFFB] text-[#1D5FD1] flex items-center justify-center shrink-0"><AppIcon :name="icon" /></span>
      <div class="flex-1 min-w-0">
        <div class="text-[12px] uppercase tracking-[.05em] font-semibold text-muted">{{ t(pick.kind === 'stop' ? 'transit.card.stop' : 'transit.card.vehicle') }}</div>
        <b class="block text-[16px] leading-tight">{{ title }}</b>
        <span v-if="pick.kind === 'stop' && pick.stop.lines.length" class="block text-[13px] text-muted">{{ t('transit.nearest.lines', { lines: pick.stop.lines.join(', ') }) }}</span>
        <span v-for="l in vehicleInfo" :key="l" class="block text-[13px] text-muted">{{ l }}</span>
      </div>
      <button type="button" class="w-9 h-9 -mt-1 -mr-1 rounded-full flex items-center justify-center" :aria-label="t('map.close')" @click="emit('close')"><AppIcon name="close" /></button>
    </div>
    <template v-if="pick.kind === 'stop'">
      <div v-if="loading" class="text-[13px] text-muted mt-3">{{ t('map.loading') }}</div>
      <ul v-else-if="next.length" class="m-0 mt-3 p-0 list-none flex flex-col gap-1.5">
        <li v-for="a in next" :key="`${a.routeId}-${a.at}`" class="flex items-center gap-2 text-[14px]">
          <b class="shrink-0">{{ lineName(t, a) }}</b>
          <span class="flex-1 min-w-0 truncate text-muted">{{ a.headsign ? `→ ${a.headsign}` : '' }}</span>
          <span class="shrink-0 font-semibold">{{ arrivalWhen(t, a) }}</span>
        </li>
      </ul>
      <p v-else class="text-[13px] text-muted mt-3 mb-0">{{ t(data?.live ? 'transit.nearest.noArrivals' : 'transit.nearest.noLive') }}</p>
    </template>
    <p class="text-[11px] text-muted mt-2.5 mb-0">{{ t('transit.attribution') }}</p>
  </div>
</template>
