<script setup lang="ts">
// T05 · W7/W8 nu se mai fac (decizia din 7 nov, docs/PLAN.md): ghidul virtual există doar în aplicația mobilă,
// pe web rămâne panoul „Obiective & ghiduri” (/city/places). Ruta nu mai e în routerul web (T20): fișierul rămâne, nelegat.
import { useRouter } from 'vue-router'
useRouter().replace('/')
</script>

<template>
  <span />
</template>
