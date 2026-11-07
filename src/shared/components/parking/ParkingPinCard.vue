<script setup lang="ts">
// Cardul unui pin „P” din stratul „Parcări” (S7 / W9): zona, locurile, tariful pe oră, durata maximă și programul,
// cu nota că locația e strada de referință din OSM, nu locul exact. Datele: Recons Arad (prin arad-parking-data).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { intlLocale, useFormat } from '@/shared/composables/useFormat'
import { ZONE_COLORS, hourlyTariff, type ParkingData, type ParkingSpot } from '@/shared/data/parking/parking'

const props = defineProps<{ spot: ParkingSpot; data: Pick<ParkingData, 'tariffs'> }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const f = useFormat()

const color = computed(() => ZONE_COLORS[props.spot.zone])
const tariff = computed(() => {
  const h = hourlyTariff(props.data, props.spot.zone)
  if (!h) return t('parking.card.noTariff')
  if (h.via === 'meter' && h.currency === 'RON') return t('parking.card.perHourMeter', { amount: f.money(h.amount) })
  return t('parking.card.perHourSms', { amount: new Intl.NumberFormat(intlLocale(), { minimumFractionDigits: 2 }).format(h.amount), code: h.smsCode ?? '—' })
})
const rows = computed(() => [
  { label: t('parking.card.zone'), value: t('parking.card.zoneName', { n: props.spot.zone, color: t(`parking.color.${props.spot.zone}`) }) },
  { label: t('parking.card.spaces'), value: props.spot.capacity != null ? String(props.spot.capacity) : '—' },
  { label: t('parking.card.tariff'), value: tariff.value },
  { label: t('parking.card.maxStay'), value: props.spot.maxStayMin ? f.minutes(props.spot.maxStayMin) : t('parking.card.noMaxStay') },
])
</script>

<template>
  <div class="bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(17,17,17,.18)]" data-test="parking-card">
    <div class="flex gap-3 items-start">
      <span class="w-11 h-11 rounded-[12px] border-[3px] bg-white text-ink font-bold text-[18px] flex items-center justify-center shrink-0" :style="{ borderColor: color }">P</span>
      <div class="flex-1 min-w-0">
        <div class="text-[12px] uppercase tracking-[.05em] font-semibold text-muted">{{ t('parking.card.kicker') }}</div>
        <b class="block text-[16px] leading-tight">{{ spot.name }}</b>
        <span v-if="spot.detail" class="block text-[13px] text-muted line-clamp-2">{{ spot.detail }}</span>
      </div>
      <button type="button" class="w-9 h-9 -mt-1 -mr-1 rounded-full flex items-center justify-center" :aria-label="t('map.close')" @click="emit('close')"><AppIcon name="close" /></button>
    </div>
    <dl class="m-0 mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13.5px]">
      <template v-for="r in rows" :key="r.label">
        <dt class="text-muted">{{ r.label }}</dt>
        <dd class="m-0 font-semibold">{{ r.value }}</dd>
      </template>
      <dt class="text-muted">{{ t('parking.card.schedule') }}</dt>
      <dd class="m-0">
        <span class="block">{{ t('parking.card.weekdays') }}</span>
        <span v-if="spot.sundayObor" class="block">{{ t('parking.card.sundayObor') }}</span>
      </dd>
    </dl>
    <p class="text-[12px] text-muted mt-2.5 mb-0 flex items-center gap-1"><AppIcon name="info" :size="14" />{{ t('parking.card.approximate') }}</p>
    <p class="text-[11px] text-muted mt-1 mb-0">{{ t('parking.attribution') }}</p>
  </div>
</template>
