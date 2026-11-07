<script setup lang="ts">
/**
 * Cod QR ca SVG, generat local cu `qrcode` (funcționează offline). `value` = doar codul text (`AX-T12-K8D2QF`), niciodată URL sau date personale.
 * Folosit la bilete (T07), oferte revendicate (T10), înscrieri la acțiuni (T11).
 */
import { ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = withDefaults(defineProps<{ value: string; size?: number; label?: string }>(), { size: 220 })
const svg = ref('')

watch(() => props.value, async (value) => {
  svg.value = value ? await QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#FFFFFF' } }) : ''
}, { immediate: true })
</script>

<template>
  <div class="inline-flex flex-col items-center gap-2">
    <div class="bg-white rounded-[16px] p-3 [&>svg]:block [&>svg]:w-full [&>svg]:h-full" :style="{ width: size + 'px', height: size + 'px' }"
      role="img" :aria-label="label ?? value" v-html="svg" />
    <slot />
  </div>
</template>
