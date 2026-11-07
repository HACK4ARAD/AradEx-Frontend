<script setup lang="ts">
// T06 · tab-ul Evenimente din Acasă (S1): chips Azi / Weekend / 7 zile + lista de EventCard din GET /events.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppChip, EmptyState } from '@/shared/components'

const { t } = useI18n()
const period = ref<'today' | 'weekend' | 'week'>('today')
</script>

<template>
  <div class="flex gap-2 flex-wrap my-3">
    <AppChip :active="period === 'today'" @click="period = 'today'">{{ t('home.today') }}</AppChip>
    <AppChip :active="period === 'weekend'" @click="period = 'weekend'">{{ t('home.weekend') }}</AppChip>
    <AppChip :active="period === 'week'" @click="period = 'week'">{{ t('home.week') }}</AppChip>
  </div>
  <EmptyState icon="event" :title="t('common.empty')" text="Lista de evenimente vine în T06 (docs/PLAN.md)." />
</template>
