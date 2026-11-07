<script setup lang="ts">
/** Un KPI din panoul web (design/final web `kpi`): icon, etichetă, valoare mare, notă mică. */
import { AppIcon } from '@/shared/components'

defineProps<{ icon: string; label: string; value: string | number; hint?: string; tone?: string }>()
</script>

<template>
  <div class="bg-white rounded-[16px] border border-line p-4 min-w-0">
    <div class="flex items-center gap-2 text-muted text-[13px]">
      <span class="w-8 h-8 rounded-[10px] bg-soft flex items-center justify-center" :style="tone ? { color: tone } : undefined"><AppIcon :name="icon" :size="18" /></span>
      <span class="truncate">{{ label }}</span>
    </div>
    <b class="block text-[28px] tracking-[-0.03em] mt-2 leading-none">{{ value }}</b>
    <span v-if="hint" class="block text-muted text-[12.5px] mt-1.5">{{ hint }}</span>
  </div>
</template>
