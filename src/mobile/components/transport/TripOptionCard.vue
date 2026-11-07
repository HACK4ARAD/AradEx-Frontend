<script setup lang="ts">
// T19 · o variantă din „Trasee până acolo” (design/final `.opt`): cu transport — pe jos › linia, N stații › pe jos, unde urci,
// în cât timp pleacă (live) și unde cobori; pe jos — distanța și ora la care ajungi. În plus față de prototip: bicicleta
// (stațiile bike sharing) și mașina (parcarea cu plată de lângă destinație, cu zona și dacă e cu plată acum).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LineBadge from '@/shared/components/transit/LineBadge.vue'
import { parkingPaidNow, stopLabel, terminalName, type TripOption } from '@/shared/composables/useTripPlanner'
import { useFormat, intlLocale } from '@/shared/composables/useFormat'
import { ZONE_COLORS, hourlyTariff, tariffText, type ParkingData } from '@/shared/data/parking/parking'
import type { TransitStopDto } from '@/shared/types/transit'

const props = defineProps<{
  option: TripOption; selected: boolean; badge?: 'fastest' | 'simplest' | null
  stopsById: Map<number, TransitStopDto>; parking?: Pick<ParkingData, 'tariffs'> | null
}>()
defineEmits<{ select: [] }>()
const { t } = useI18n()
const f = useFormat()

const arrive = computed(() => f.timeRange(new Date(Date.now() + props.option.total * 60_000).toISOString()))
const km = (v: number) => (v < 1 ? `${Math.round(v * 100) * 10} m` : f.km(v))
const tariff = computed(() => {
  const o = props.option
  if (o.kind !== 'car' || !o.parking || !props.parking) return ''
  const h = hourlyTariff(props.parking, o.parking.zone)
  return h ? tariffText(h, t, f.money, (n) => new Intl.NumberFormat(intlLocale(), { minimumFractionDigits: 2 }).format(n)) : ''
})
</script>

<template>
  <button type="button" class="w-full flex items-start justify-between gap-3 rounded-[16px] bg-white text-left"
    :class="selected ? 'border-2 border-ink px-[15px] py-[13px]' : 'border border-line px-4 py-3.5'" :aria-pressed="selected" data-test="trip-option" @click="$emit('select')">
    <div class="flex-1 min-w-0">
      <!-- tramvai / autobuz -->
      <template v-if="option.kind === 'transit'">
        <div class="flex flex-wrap items-center gap-1.5 text-[15px]">
          <AppIcon name="directions_walk" :size="18" />{{ t('transport.min', { n: option.walk1Min }) }}
          <span class="text-muted">›</span>
          <LineBadge :name="option.route.shortName" :color="option.route.color" :text-color="option.route.textColor" :mode="option.route.mode" />
          {{ t('transport.stops', option.alightIdx - option.boardIdx) }}
          <span class="text-muted">›</span>
          <AppIcon name="directions_walk" :size="18" />{{ t('transport.min', { n: option.walk2Min }) }}
        </div>
        <div class="text-muted text-[13.5px] mt-1.5 leading-snug">
          {{ t('transport.boardAt') }} <b class="text-ink/70">{{ stopLabel(option.board.name) }}</b>
          {{ option.departMin == null ? `(${t('transport.noLiveDep')})` : option.departMin <= 0 ? t('transport.now') : t('transport.inMin', { n: option.departMin }) }}
          · {{ t('transport.alightAt') }} <b class="text-ink/70">{{ stopLabel(option.alight.name) }}</b>
          · {{ t('transport.towardsShort', { name: terminalName(option.pattern, stopsById) }) }}
        </div>
      </template>
      <!-- pe jos -->
      <template v-else-if="option.kind === 'walk'">
        <div class="flex items-center gap-1.5 text-[15px]"><AppIcon name="directions_walk" :size="18" />{{ t('transport.walkTitle', { km: f.km(option.km) }) }}</div>
        <div class="text-muted text-[13.5px] mt-1.5 leading-snug">{{ t('transport.walkSub', { time: arrive }) }}</div>
      </template>
      <!-- bicicleta -->
      <template v-else-if="option.kind === 'bike'">
        <div class="flex items-center gap-1.5 text-[15px]"><AppIcon name="pedal_bike" :size="18" class="text-[#0F8A5F]" />{{ t('transport.bikeTitle', { km: f.km(option.km) }) }}</div>
        <div class="text-muted text-[13.5px] mt-1.5 leading-snug">{{ t('transport.bikeSub', { from: option.from.name, to: option.to.name }) }}</div>
      </template>
      <!-- mașina + parcarea -->
      <template v-else>
        <div class="flex items-center gap-1.5 text-[15px]"><AppIcon name="directions_car" :size="18" />{{ t('transport.carTitle', { km: f.km(option.km) }) }}</div>
        <div v-if="option.parking" class="text-muted text-[13.5px] mt-1.5 leading-snug flex items-start gap-1.5">
          <span class="mt-[3px] w-3 h-3 rounded-[3px] border-[3px] bg-white shrink-0" :style="{ borderColor: ZONE_COLORS[option.parking.zone] }" />
          <span>{{ t('transport.carPark', { name: option.parking.name, zone: option.parking.zone }) }} · {{ parkingPaidNow(option.parking) ? t('transport.carPaid', { tariff }) : t('transport.carFree') }} · {{ km(option.walkKm) }}</span>
        </div>
        <div v-else class="text-muted text-[13.5px] mt-1.5 leading-snug">{{ t('transport.carNoPark') }}</div>
      </template>
    </div>
    <div class="text-right shrink-0">
      <b class="text-[18px]">{{ f.minutes(option.total) }}</b><br>
      <span v-if="badge" class="inline-flex px-2.5 py-1 mt-1 rounded-full bg-green-soft text-green-deep font-semibold text-[11px]">{{ t(`transport.${badge}`) }}</span>
      <span v-else-if="option.kind !== 'walk'" class="text-muted text-[12px]">{{ t('transport.arrive', { time: arrive }) }}</span>
    </div>
  </button>
</template>
