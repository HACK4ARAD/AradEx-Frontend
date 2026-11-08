<script setup lang="ts">
// T20 · Confidențialitate: linkul cerut de Google Play și App Store (aplicația folosește camera și locația).
import LegalDoc from '@/shared/components/legal/LegalDoc.vue'
import { CONTACT_EMAIL } from '@/web/presentation'
</script>

<template>
  <LegalDoc doc="privacy" :contact="CONTACT_EMAIL" />
</template>
