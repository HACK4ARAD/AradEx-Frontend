<script setup lang="ts">
// Termeni și condiții (GDPR): acceptați prin bifa de la crearea contului (`TermsConsent`); BE păstrează momentul și versiunea.
import LegalDoc from '@/shared/components/legal/LegalDoc.vue'
import { CONTACT_EMAIL } from '@/web/presentation'
</script>

<template>
  <LegalDoc doc="terms" :contact="CONTACT_EMAIL" />
</template>
