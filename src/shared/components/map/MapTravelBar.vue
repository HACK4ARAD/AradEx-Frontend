<script setup lang="ts">
// Modul de deplasare al hărții (aplicație S7 și web W9): Pe jos / Transport / Mașină — alege straturile și modul traseului.
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { MAP_TRAVEL, type Travel } from '@/shared/composables/useMapScreen'

withDefaults(defineProps<{ floating?: boolean }>(), { floating: false })
const travel = defineModel<Travel>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="flex p-1 gap-1 rounded-[16px]" :class="floating ? 'bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.12)]' : 'bg-soft'"
    role="radiogroup" :aria-label="t('map.travel.label')">
    <button v-for="m in MAP_TRAVEL" :key="m.id" type="button" role="radio" :aria-checked="travel === m.id"
      class="flex-1 min-w-0 h-10 rounded-[12px] text-[14px] inline-flex items-center justify-center gap-1.5 transition-colors"
      :class="travel === m.id ? 'bg-ink text-white font-semibold shadow-sm' : 'text-ink'" @click="travel = m.id">
      <AppIcon :name="m.icon" :size="19" :fill="travel === m.id" /><span class="truncate">{{ t(`map.travel.${m.id}`) }}</span>
    </button>
  </div>
</template>
