<script setup lang="ts">
/** Antetul unei pagini din panoul web al firmei: titlu, subtitlu, butoane în dreapta (slot). */
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div class="min-w-0">
      <h1 class="text-[32px] font-semibold tracking-[-0.025em] m-0">{{ title }}</h1>
      <p v-if="subtitle" class="text-muted text-[14px] m-0 mt-1">{{ subtitle }}</p>
    </div>
    <div class="flex flex-wrap gap-2"><slot /></div>
  </div>
</template>
