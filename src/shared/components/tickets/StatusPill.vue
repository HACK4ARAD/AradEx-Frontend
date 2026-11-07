<script setup lang="ts">
// T07 · eticheta de stare din „Biletele mele” (prototipul IA, `pill()`): ofertă revendicată, confirmat, în așteptare, folosit.
defineProps<{ tone: 'off' | 'ok' | 'pending' | 'no' | 'new'; label: string }>()
const TONES = {
  off: 'bg-[#FBE4DA] text-[#7A2E14]', ok: 'bg-[#E4EFDA] text-[#2C5418]', pending: 'bg-[#FAEEDA] text-[#633806]',
  no: 'bg-soft text-muted', new: 'bg-ink text-white',
} as const
</script>

<template>
  <span class="self-start inline-flex items-center text-[12px] font-bold px-[9px] py-[3px] rounded-full whitespace-nowrap" :class="TONES[tone]">{{ label }}</span>
</template>
