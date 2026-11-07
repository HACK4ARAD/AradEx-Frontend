<script setup lang="ts">
// T11 · Clasamentul voluntarilor (design/final web „Primărie · Clasament”): lună / an, căutare, tabel (#, voluntar, acțiuni,
// puncte, ultima participare), export CSV, premiile anului și câteva statistici din clasament.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import PrizesCard from '@/shared/components/community/PrizesCard.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { currentMonthLabel, useLeaderboard } from '@/shared/composables/useCommunity'
import type { LeaderboardPeriod } from '@/shared/types/community'

const { t } = useI18n()
const f = useFormat()
const period = ref<LeaderboardPeriod>('month')
const { board, loading, load } = useLeaderboard(period)
const q = ref('')
onMounted(load)

const now = new Date()
const monthLabel = currentMonthLabel(now)
const monthName = monthLabel.toLowerCase()
const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return (board.value?.entries ?? []).filter((r) => !s || r.displayName.toLowerCase().includes(s))
})
const stats = computed(() => {
  const e = board.value?.entries ?? []
  return { people: e.length, points: e.reduce((s, r) => s + r.points, 0), actions: e.reduce((s, r) => s + r.actionsCount, 0) }
})
const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : String(rank))
const nf = (n: number) => new Intl.NumberFormat('ro-RO').format(n)

/** CSV generat local din clasamentul afișat (fără server). */
function exportCsv() {
  const head = ['Loc', 'Nume', 'Acțiuni', 'Puncte', 'Ultima participare']
  const lines = (board.value?.entries ?? []).map((r) => [r.rank, r.displayName, r.actionsCount, r.points, r.lastAt ? `${r.lastActionTitle ?? ''} · ${f.dateTime(r.lastAt, false)}` : ''])
  const csv = [head, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = period.value === 'month' ? `clasament-${monthName}-${now.getFullYear()}.csv` : `clasament-${now.getFullYear()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <PanelHeader :title="t('community.cityBoard.title')" :subtitle="t('community.cityBoard.sub')">
    <AppButton variant="ghost" size="sm" icon="download" :disabled="!board?.entries.length" @click="exportCsv">{{ t('community.cityBoard.export') }}</AppButton>
  </PanelHeader>

  <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
    <div class="bg-white rounded-[16px] border border-line min-w-0">
      <div class="flex flex-wrap items-center gap-2 p-3 border-b border-line">
        <AppChip :active="period === 'month'" @click="period = 'month'">{{ monthLabel }}</AppChip>
        <AppChip :active="period === 'year'" @click="period = 'year'">{{ t('community.leaderboard.year', { y: now.getFullYear() }) }}</AppChip>
        <label class="ml-auto flex items-center gap-2 h-9 px-3 rounded-full border border-line w-full sm:w-[240px]">
          <AppIcon name="search" :size="18" class="text-muted" />
          <input v-model="q" class="flex-1 min-w-0 outline-none text-[14px] bg-transparent" :placeholder="t('community.cityBoard.search')">
        </label>
      </div>
      <Skeleton v-if="loading" :rows="5" :height="44" class="p-3" />
      <EmptyState v-else-if="!board" icon="cloud_off" :title="t('community.leaderboard.loadError')" :action="t('common.retry')" @action="load" />
      <EmptyState v-else-if="!rows.length" icon="leaderboard" :title="t('community.leaderboard.empty')" />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-[14px] border-collapse min-w-[560px]">
          <thead>
            <tr class="text-left text-muted text-[12.5px]">
              <th class="px-3 py-2.5 font-semibold w-12">#</th>
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityBoard.colName') }}</th>
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityBoard.colActions') }}</th>
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityBoard.colPoints') }}</th>
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityBoard.colLast') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.userId" class="border-t border-line">
              <td class="px-3 py-2.5">{{ medal(r.rank) }}</td>
              <td class="px-3 py-2.5 font-semibold">{{ r.displayName }}</td>
              <td class="px-3 py-2.5">{{ r.actionsCount }}</td>
              <td class="px-3 py-2.5 font-bold">{{ nf(r.points) }}</td>
              <td class="px-3 py-2.5 text-muted">{{ r.lastAt ? `${r.lastActionTitle ?? ''} · ${f.dateTime(r.lastAt, false)}` : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex flex-col gap-3.5">
      <PrizesCard />
      <div class="bg-white rounded-[16px] border border-line p-4">
        <b class="block text-[14.5px] mb-2">{{ t('community.cityBoard.stats') }}</b>
        <div class="flex items-center gap-2 py-1.5 text-[14px]"><AppIcon name="group" :size="18" />{{ t('community.cityBoard.statPeople', { n: stats.people }) }}</div>
        <div class="flex items-center gap-2 py-1.5 text-[14px]"><AppIcon name="stars" :size="18" />{{ t('community.cityBoard.statPoints', { n: nf(stats.points) }) }}</div>
        <div class="flex items-center gap-2 py-1.5 text-[14px]"><AppIcon name="event_available" :size="18" />{{ t('community.cityBoard.statActions', { n: stats.actions }) }}</div>
      </div>
    </div>
  </div>
</template>
