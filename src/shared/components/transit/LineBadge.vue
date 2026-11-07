<script setup lang="ts">
// T19 · insigna unei linii CTP (design/final `.lineb`): numărul pe culoarea liniei, cu iconul tramvaiului / autobuzului.
// Culoarea vine din date (`/transit/routes`); textul e negru pe culorile deschise (galbenul liniei 3), alb în rest.
import { computed } from 'vue'
import { AppIcon } from '@/shared/components'
import { lineColors } from '@/shared/composables/useTripPlanner'
import type { TransitMode } from '@/shared/types/transit'

const props = withDefaults(defineProps<{
  name: string; color?: string; textColor?: string; mode?: TransitMode
  /** `sm` = în rânduri (design 14px), `xs` = în harta traseului (12px), `lg` = titlul paginii liniei (18px) */
  size?: 'xs' | 'sm' | 'lg'; icon?: boolean; wide?: boolean
}>(), { size: 'sm', icon: true, wide: false })

const c = computed(() => lineColors({ color: props.color, textColor: props.textColor, mode: props.mode ?? 'TRAM' }))
const box = computed(() => ({ xs: 'px-1.5 py-0.5 text-[12px] gap-0.5', sm: 'px-2 py-[3px] text-[14px] gap-1', lg: 'px-2.5 py-1 text-[18px] gap-1' })[props.size])
const iconSize = computed(() => ({ xs: 14, sm: 16, lg: 18 })[props.size])
</script>

<template>
  <span class="inline-flex items-center rounded-[8px] font-bold leading-[1.25] shrink-0 whitespace-nowrap" :class="[box, wide && 'min-w-[40px] justify-center']"
    :style="{ background: c.bg, color: c.fg }" data-test="line-badge">
    <AppIcon v-if="icon" :name="mode === 'BUS' ? 'directions_bus' : 'tram'" :size="iconSize" />{{ name }}
  </span>
</template>
