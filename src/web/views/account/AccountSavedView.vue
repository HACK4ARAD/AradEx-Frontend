<script setup lang="ts">
// T06 · Contul meu › Salvate nu se mai face (decizia din 7 nov, docs/PLAN.md): evenimentele, salvatele și biletele există doar în aplicația mobilă;
// pe web rămân site-ul de prezentare și panourile. Ruta se scoate din router în T20 (P1); până atunci duce la site.
import { useRouter } from 'vue-router'
useRouter().replace('/w')
</script>

<template>
  <span />
</template>
