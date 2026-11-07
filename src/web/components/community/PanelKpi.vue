<script setup lang="ts">
/** Un KPI din panourile web (design/final/web.html `.kpi`): etichetă cu icon, valoare de 26px, notă / delta verde. */
import { AppIcon } from '@/shared/components'

defineProps<{ icon: string; label: string; value: string | number; delta?: string; hint?: string; tone?: string }>()
</script>

<template>
  <div class="bg-white border border-line rounded-[14px] pt-4 px-4 pb-3 flex flex-col gap-1 min-w-0">
    <div class="text-muted text-[12.5px] font-medium flex items-center gap-1.5"><AppIcon :name="icon" :size="17" :style="tone ? { color: tone } : undefined" /><span class="truncate">{{ label }}</span></div>
    <div class="flex items-baseline gap-2 text-[26px] font-bold tracking-[-0.03em]">
      {{ value }}<span v-if="delta" class="text-[11.5px] font-bold px-1.5 py-0.5 rounded-md bg-ok-soft text-ok tracking-normal">{{ delta }}</span>
    </div>
    <div v-if="hint" class="text-muted text-[12px]">{{ hint }}</div>
  </div>
</template>
