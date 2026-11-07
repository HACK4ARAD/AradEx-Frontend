<script setup lang="ts">
// E5/E7 · /m/panel: cochilie (T02). Firma vede BusinessPanel (T09/T10), Primăria și Adminul CityPanel (T11).
// Fiecare story lucrează doar în componenta lui din mobile/components/panel/.
import { computed } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'
import BusinessPanel from '@/mobile/components/panel/BusinessPanel.vue'
import CityPanel from '@/mobile/components/panel/CityPanel.vue'

const auth = useAuthStore()
const isBusiness = computed(() => auth.user?.role === 'BUSINESS')
</script>

<template>
  <BusinessPanel v-if="isBusiness" />
  <CityPanel v-else />
</template>
