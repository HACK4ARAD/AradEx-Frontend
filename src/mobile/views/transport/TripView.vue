<script setup lang="ts">
// T19 · Călătoria pe hartă. Fișierul e al story-ului T19: înlocuiește placeholder-ul cu ecranul din design/final.
import { useRoute } from 'vue-router'
import PlaceholderScreen from '@/shared/components/ui/PlaceholderScreen.vue'
const route = useRoute()
</script>

<template>
  <PlaceholderScreen :title="String(route.meta.title ?? '')" :screen="route.meta.screen" :task="route.meta.task" />
</template>
