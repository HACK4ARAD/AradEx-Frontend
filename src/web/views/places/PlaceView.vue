<script setup lang="ts">
// T05 · W7/W8 nu se mai fac (decizia din 7 nov, docs/PLAN.md): ghidul virtual există doar în aplicația mobilă,
// pe web rămâne panoul „Obiective & ghiduri” (/w/city/places). Ruta se scoate din router în T20 (P1); până atunci duce la site.
import { useRouter } from 'vue-router'
useRouter().replace('/w')
</script>

<template>
  <span />
</template>
