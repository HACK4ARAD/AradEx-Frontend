<script setup lang="ts">
// T06 · evenimentele de pe landing (W1): chips + grid de EventCard din GET /events.
import { useI18n } from 'vue-i18n'
import { AppChip, EmptyState } from '@/shared/components'
const { t } = useI18n()
</script>

<template>
  <div class="flex gap-2 flex-wrap my-4">
    <AppChip active>{{ t('home.today') }}</AppChip><AppChip>{{ t('home.weekend') }}</AppChip><AppChip>{{ t('home.week') }}</AppChip><AppChip>🔥 {{ t('home.popular') }}</AppChip>
  </div>
  <EmptyState icon="event" :title="t('common.empty')" text="Grid-ul de evenimente vine în T06." />
</template>
