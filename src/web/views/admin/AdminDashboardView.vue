<script setup lang="ts">
// T14 · W3 Administrare · dashboard (`/admin`): în design/final Adminul are panoul Primăriei (`route('/admin', () => cityDash(true))`),
// cu aceleași KPI, participare și activitate. Cardul „De verificat / moderat” (firme de verificat, conținut în ciornă) se adaugă
// în T14, când există `GET /admin/stats` și `/city/businesses`.
import CityDashboard from '@/web/components/community/CityDashboard.vue'
</script>

<template>
  <CityDashboard />
</template>
