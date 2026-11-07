<script setup lang="ts">
// Cardul unui pin cu bicicletă (modul „Transport” al hărții, S7 / W9): stația de bike sharing a Primăriei (amplasamentul
// din regulament, cum iei și cum returnezi bicicleta) sau un punct de închiriere din OpenStreetMap.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { BikeStation } from '@/shared/data/bikes/bikes'

defineProps<{ station: BikeStation }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(17,17,17,.18)]" data-test="bike-card">
    <div class="flex gap-3 items-start">
      <span class="w-11 h-11 rounded-[12px] bg-[#E3F4EC] text-[#0F8A5F] flex items-center justify-center shrink-0"><AppIcon name="pedal_bike" /></span>
      <div class="flex-1 min-w-0">
        <div class="text-[12px] uppercase tracking-[.05em] font-semibold text-muted">{{ t(station.kind === 'dock' ? 'bikes.card.dock' : 'bikes.card.rental') }}</div>
        <b class="block text-[16px] leading-tight">{{ station.name }}</b>
        <span v-if="station.address" class="block text-[13px] text-muted">{{ station.address }}</span>
      </div>
      <button type="button" class="w-9 h-9 -mt-1 -mr-1 rounded-full flex items-center justify-center" :aria-label="t('map.close')" @click="emit('close')"><AppIcon name="close" /></button>
    </div>
    <ul v-if="station.kind === 'dock'" class="m-0 mt-3 p-0 list-none flex flex-col gap-1.5 text-[13.5px]">
      <li class="flex gap-2"><AppIcon name="smartphone" :size="18" class="text-muted shrink-0" />{{ t('bikes.card.unlock') }}</li>
      <li class="flex gap-2"><AppIcon name="sync_alt" :size="18" class="text-muted shrink-0" />{{ t('bikes.card.return') }}</li>
      <li class="flex gap-2"><AppIcon name="info" :size="18" class="text-muted shrink-0" />{{ t('bikes.card.live') }}</li>
    </ul>
    <p v-else class="text-[13.5px] mt-3 mb-0">{{ t('bikes.card.rentalText') }}</p>
    <p class="text-[11px] text-muted mt-2.5 mb-0">{{ t(station.kind === 'dock' ? 'bikes.attribution' : 'bikes.attributionOsm') }}</p>
  </div>
</template>
