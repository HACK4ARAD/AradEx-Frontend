<script setup lang="ts">
// Ce arată harta în modul de deplasare ales (S7 / W9): Pe jos — doar o explicație; Transport — comutatoarele Tramvaie /
// Autobuze / Biciclete; Mașină — legenda zonelor de parcare. Cu `attributions`, și sursele straturilor pornite.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { Travel } from '@/shared/composables/useMapScreen'
import { BIKE_OFFICIAL_COUNT, BIKE_STATIONS } from '@/shared/data/bikes/bikes'
import { ZONE_COLORS, type ParkingZone } from '@/shared/data/parking/parking'
import type { TransitMode } from '@/shared/types/transit'

// `modes` vine din stratul de transport și se schimbă doar prin `toggle-mode` (stratul o face sincron, deci două apăsări
// rapide nu se suprascriu); `zones` = zonele de parcare care au străzi pe hartă (din datele încărcate).
const props = withDefaults(defineProps<{ travel: Travel; modes: readonly TransitMode[]; zones?: readonly ParkingZone[]; attributions?: boolean }>(),
  { zones: () => [], attributions: false })
const emit = defineEmits<{ 'toggle-mode': [mode: TransitMode] }>()
const bikes = defineModel<boolean>('bikes', { required: true })
const { t } = useI18n()

const docks = BIKE_STATIONS.filter((s) => s.kind === 'dock').length

const chips = computed(() => [
  { id: 'TRAM' as const, icon: 'tram', label: t('map.layers.tram'), on: props.modes.includes('TRAM') },
  { id: 'BUS' as const, icon: 'directions_bus', label: t('map.layers.bus'), on: props.modes.includes('BUS') },
])
const sources = computed(() => {
  if (props.travel === 'transit') return [t('transit.attribution'), ...(bikes.value ? [t('bikes.attribution')] : [])]
  if (props.travel === 'car') return [t('parking.attribution')]
  return []
})
</script>

<template>
  <div class="flex flex-col gap-2 text-[13px]" data-test="map-layer-panel">
    <p v-if="travel === 'foot'" class="m-0 text-muted flex items-start gap-1.5"><AppIcon name="directions_walk" :size="17" class="shrink-0" />{{ t('map.layers.footHint') }}</p>

    <template v-else-if="travel === 'transit'">
      <div class="flex flex-wrap gap-1.5">
        <button v-for="c in chips" :key="c.id" type="button" :aria-pressed="c.on"
          class="h-8 px-3 rounded-full border inline-flex items-center gap-1 text-[12.5px]"
          :class="c.on ? 'bg-[#1D5FD1] border-[#1D5FD1] text-white font-semibold' : 'bg-white border-line text-ink'" @click="emit('toggle-mode', c.id)">
          <AppIcon :name="c.icon" :size="16" />{{ c.label }}</button>
        <button type="button" :aria-pressed="bikes"
          class="h-8 px-3 rounded-full border inline-flex items-center gap-1 text-[12.5px]"
          :class="bikes ? 'bg-[#0F8A5F] border-[#0F8A5F] text-white font-semibold' : 'bg-white border-line text-ink'" @click="bikes = !bikes">
          <AppIcon name="pedal_bike" :size="16" />{{ t('map.layers.bikes') }}</button>
      </div>
      <p v-if="bikes" class="m-0 text-[11.5px] text-muted">{{ t('map.layers.bikesMissing', { n: docks, total: BIKE_OFFICIAL_COUNT }) }}</p>
    </template>

    <template v-else>
      <div class="flex flex-wrap gap-x-3 gap-y-1">
        <span v-for="z in zones" :key="z" class="inline-flex items-center gap-1.5 font-semibold">
          <span class="w-3.5 h-3.5 rounded-[4px] border-[3px] bg-white" :style="{ borderColor: ZONE_COLORS[z] }" />{{ t('parking.card.zoneName', { n: z, color: t(`parking.color.${z}`) }) }}
        </span>
      </div>
      <p class="m-0 text-[12px] text-muted">{{ t('parking.card.weekdays') }}</p>
    </template>

    <p v-if="attributions && sources.length" class="m-0 text-[11px] text-muted">{{ sources.join(' · ') }}</p>
  </div>
</template>
