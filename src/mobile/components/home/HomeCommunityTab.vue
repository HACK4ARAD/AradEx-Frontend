<script setup lang="ts">
// T11 · tab-ul Comunitate din Acasă (S1d): card verde cu puncte, nivel, clasament, acțiunile. Folosit și de /m/community.
import { useI18n } from 'vue-i18n'
import { EmptyState } from '@/shared/components'
const { t } = useI18n()
</script>

<template>
  <EmptyState icon="volunteer_activism" :title="t('common.empty')" text="Comunitatea vine în T11 (docs/PLAN.md)." class="mt-3" />
</template>
