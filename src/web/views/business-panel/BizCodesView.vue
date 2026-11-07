<script setup lang="ts">
// T10 · Panou firmă · validează coduri. Fișierul e al story-ului T10: înlocuiește placeholder-ul cu ecranul din design/final.
import { useRoute } from 'vue-router'
import PlaceholderScreen from '@/shared/components/ui/PlaceholderScreen.vue'
const route = useRoute()
</script>

<template>
  <PlaceholderScreen :title="String(route.meta.title ?? '')" :screen="route.meta.screen" :task="route.meta.task" />
</template>
