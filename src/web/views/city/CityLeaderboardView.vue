<script setup lang="ts">
// T11 · Clasamentul voluntarilor — design/final web `#/city/leaderboard`: lună / an (segmente), căutare, tabel (#, Voluntar,
// Acțiuni, Puncte, Ultima participare), Export CSV; în dreapta „Premiile anului 2026” și statisticile clasamentului.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import * as P from '@/web/components/community/panel'
import { intlLocale, useFormat } from '@/shared/composables/useFormat'
import { currentMonthLabel, initials, useLeaderboard } from '@/shared/composables/useCommunity'
import type { LeaderboardPeriod } from '@/shared/types/community'

const { t } = useI18n()
const f = useFormat()
const period = ref<LeaderboardPeriod>('month')
const { board, loading, load } = useLeaderboard(period)
const q = ref('')
onMounted(load)

const now = new Date()
const monthLabel = currentMonthLabel(now)
const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return (board.value?.entries ?? []).filter((r) => !s || r.displayName.toLowerCase().includes(s))
})
const stats = computed(() => {
  const e = board.value?.entries ?? []
  return { people: e.length, points: e.reduce((s, r) => s + r.points, 0), actions: e.reduce((s, r) => s + r.actionsCount, 0) }
})
const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : String(rank))
const nf = (n: number) => new Intl.NumberFormat(intlLocale()).format(n)
const PRIZE_TONE = ['#FFE08A', '#E6E6E6', '#F0C9A8']

/** CSV generat local din clasamentul afișat (fără server). */
function exportCsv() {
  const head = [t('community.cityBoard.cols.rank'), t('community.cityBoard.cols.name'), t('community.cityBoard.cols.actions'), t('community.cityBoard.cols.points'), t('community.cityBoard.cols.last')]
  const lines = (board.value?.entries ?? []).map((r) => [r.rank, r.displayName, r.actionsCount, r.points, r.lastAt ? `${r.lastActionTitle ?? ''} · ${f.dateTime(r.lastAt, false)}` : ''])
  const csv = [head, ...lines].map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = period.value === 'month' ? `clasament-${monthLabel.toLowerCase()}-${now.getFullYear()}.csv` : `clasament-${now.getFullYear()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div :class="P.HEAD">
    <div><h1 :class="P.H1">{{ t('community.cityBoard.title') }}</h1><div :class="P.SUB">{{ t('community.cityBoard.sub') }}</div></div>
    <button type="button" :class="P.BTN_SEC" :disabled="!board?.entries.length" @click="exportCsv"><AppIcon name="download" :size="16" />{{ t('community.cityBoard.export') }}</button>
  </div>

  <div class="grid gap-3.5 grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
    <div :class="P.CARD_FLUSH">
      <div :class="P.TOOLBAR">
        <div :class="P.SEG">
          <button type="button" :class="P.segBtn(period === 'month')" @click="period = 'month'">{{ monthLabel }}</button>
          <button type="button" :class="P.segBtn(period === 'year')" @click="period = 'year'">{{ t('community.leaderboard.year', { y: now.getFullYear() }) }}</button>
        </div>
        <label class="ml-auto flex items-center gap-2 h-[38px] px-3 rounded-[10px] bg-white border border-line text-muted w-full sm:max-w-[260px]">
          <AppIcon name="search" :size="18" /><input v-model="q" class="flex-1 min-w-0 outline-none bg-transparent text-[14px] text-ink" :placeholder="t('community.cityBoard.search')">
        </label>
      </div>
      <Skeleton v-if="loading" :rows="5" :height="44" class="p-3.5" />
      <div v-else-if="!board" :class="P.EMPTY">
        <AppIcon name="cloud_off" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.leaderboard.loadError') }}</b>
        <div class="mt-3"><button type="button" :class="P.BTN_SM_SEC" @click="load">{{ t('common.retry') }}</button></div>
      </div>
      <div v-else-if="!rows.length" :class="P.EMPTY">
        <AppIcon name="leaderboard" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.leaderboard.empty') }}</b>
      </div>
      <template v-else>
      <!-- telefon: rânduri compacte (loc, nume, puncte; acțiuni și ultima participare dedesubt) -->
      <div class="md:hidden flex flex-col">
        <div v-for="r in rows" :key="r.userId" :class="[P.MROW, 'flex items-center gap-3']">
          <span class="w-7 text-center">{{ medal(r.rank) }}</span>
          <span :class="P.AVATAR">{{ initials(r.displayName) }}</span>
          <div class="min-w-0 flex-1">
            <div :class="P.TT">{{ r.displayName }}</div>
            <div :class="[P.TS, 'truncate']">{{ t('community.cityBoard.mobileLine', { n: r.actionsCount }) }}<template v-if="r.lastAt"> · {{ f.dateTime(r.lastAt, false) }}</template></div>
          </div>
          <b>{{ nf(r.points) }}</b>
        </div>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full border-collapse min-w-[560px]">
          <thead><tr><th v-for="c in ['rank', 'name', 'actions', 'points', 'last']" :key="c" :class="P.TH">{{ t(`community.cityBoard.cols.${c}`) }}</th></tr></thead>
          <tbody>
            <tr v-for="r in rows" :key="r.userId" :class="P.TR">
              <td :class="[P.TD, 'w-12']">{{ medal(r.rank) }}</td>
              <td :class="P.TD"><div class="flex items-center gap-3"><span :class="P.AVATAR">{{ initials(r.displayName) }}</span><b>{{ r.displayName }}</b></div></td>
              <td :class="P.TD">{{ r.actionsCount }}</td>
              <td :class="P.TD"><b>{{ nf(r.points) }}</b></td>
              <td :class="[P.TD, 'text-muted']">{{ r.lastAt ? `${r.lastActionTitle ?? ''} · ${f.dateTime(r.lastAt, false)}` : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </template>
    </div>

    <div class="flex flex-col gap-3.5">
      <div :class="P.CARD">
        <div :class="[P.CH, 'items-center']"><h2 :class="P.CH_TITLE">{{ t('community.prizes.title') }}</h2></div>
        <div v-for="n in 3" :key="n" :class="P.LROW">
          <span :class="P.AVATAR" :style="{ background: PRIZE_TONE[n - 1] }">{{ n }}</span>
          <div><div :class="P.TS">{{ t('community.prizes.place', { n }) }}</div><b class="text-[13.5px]">{{ t(`community.prizes.p${n}`) }}</b></div>
        </div>
        <div :class="[P.TS, 'mt-2.5']">{{ t('community.prizes.gala') }}</div>
      </div>
      <div :class="P.CARD">
        <h2 :class="[P.CH_TITLE, 'mb-2']">{{ t('community.cityBoard.stats') }}</h2>
        <div :class="P.LROW"><AppIcon name="group" :size="18" />{{ t('community.cityBoard.statPeople', { n: stats.people }) }}</div>
        <div :class="P.LROW"><AppIcon name="stars" :size="18" />{{ t('community.cityBoard.statPoints', { n: nf(stats.points) }) }}</div>
        <div :class="P.LROW"><AppIcon name="event_available" :size="18" />{{ t('community.cityBoard.statActions', { n: stats.actions }) }}</div>
      </div>
    </div>
  </div>
</template>
