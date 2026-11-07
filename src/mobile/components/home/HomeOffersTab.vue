<script setup lang="ts">
// T10 · tab-ul Oferte din Acasă (S1b): banner „Doar în AradExperience”, categorii, OfferCard. Folosit și de /offers.
import { useI18n } from 'vue-i18n'
import { EmptyState } from '@/shared/components'
const { t } = useI18n()
</script>

<template>
  <EmptyState icon="sell" :title="t('common.empty')" text="Ofertele vin în T10 (docs/PLAN.md)." class="mt-3" />
</template>
