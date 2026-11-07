<script setup lang="ts">
// W12 · Comunitate pe web, doar de citit (T20, decizia din 7 nov) — T11: acțiunile care urmează (fără „Mă înscriu”: înscrierea e
// doar în aplicație) și clasamentul lunii, apoi „Descarcă aplicația”. Datele: GET /community/actions?upcoming=true și
// GET /community/leaderboard?period=month (publice).
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import DownloadButtons from '@/web/components/site/DownloadButtons.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { currentMonthLabel, initials, spotsLeft, useActions, useLeaderboard } from '@/shared/composables/useCommunity'
import type { LeaderboardPeriod } from '@/shared/types/community'

const { t } = useI18n()
const f = useFormat()
const steps = ['1', '2', '3'] as const
const list = useActions()
const lb = useLeaderboard(ref<LeaderboardPeriod>('month'))
const month = currentMonthLabel()
onMounted(() => { list.load(); lb.load() })
</script>

<template>
  <div class="max-w-[1080px] mx-auto flex flex-col gap-8">
    <header>
      <h1 class="text-[36px] md:text-[44px] font-semibold tracking-[-0.025em] m-0 mb-3">{{ t('site.community.pageTitle') }}</h1>
      <p class="text-[17px] text-muted leading-relaxed m-0 max-w-[680px]">{{ t('site.community.pageText') }}</p>
    </header>
    <ol class="grid grid-cols-1 md:grid-cols-3 gap-3 list-none p-0 m-0">
      <li v-for="s in steps" :key="s" class="bg-white border border-line rounded-[16px] p-4 flex gap-3">
        <span class="w-8 h-8 shrink-0 rounded-full bg-green-deep text-white font-bold flex items-center justify-center">{{ s }}</span>
        <span class="text-[15px] leading-relaxed">{{ t(`site.community.steps.${s}`) }}</span>
      </li>
    </ol>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <section class="min-w-0">
        <h2 class="text-[22px] font-semibold tracking-[-0.02em] m-0 mb-3">{{ t('community.home.upcoming') }}</h2>
        <Skeleton v-if="list.loading.value" :rows="3" :height="104" />
        <div v-else-if="list.error.value" class="bg-white border border-line rounded-[16px] p-6 text-center text-muted">
          {{ t('community.loadError') }}
          <div class="mt-3"><button type="button" class="h-9 px-4 rounded-[12px] border border-line bg-white font-semibold text-ink" @click="list.load">{{ t('common.retry') }}</button></div>
        </div>
        <div v-else-if="!list.actions.value.length" class="bg-white border border-line rounded-[16px] p-6 text-center text-muted">{{ t('community.home.emptyText') }}</div>
        <div v-else class="flex flex-col gap-3">
          <article v-for="a in list.actions.value" :key="a.id" class="bg-white border border-line rounded-[16px] p-4 flex flex-col sm:flex-row gap-4">
            <div class="w-full sm:w-[120px] h-[150px] sm:h-[84px] rounded-[12px] bg-green-deep bg-cover bg-center shrink-0 flex items-center justify-center text-white/80"
              :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined"><AppIcon v-if="!a.imageUrl" name="volunteer_activism" :size="30" /></div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-[16px] font-semibold m-0">{{ a.title }}</h3>
                <span class="rounded-full bg-green-soft text-green-deep text-[12px] font-bold px-2 py-0.5">{{ t('community.card.points', { n: a.pointsReward }) }}</span>
              </div>
              <div class="text-muted text-[13.5px] mt-1">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }} · {{ a.locationName }}</div>
              <div class="text-muted text-[13px] mt-1">{{ t('community.action.spots', { taken: a.registeredCount, total: a.capacity, free: spotsLeft(a) }) }}</div>
              <div class="text-[12.5px] text-green-deep font-semibold mt-2 flex items-center gap-1"><AppIcon name="smartphone" :size="16" />{{ t('community.web.inApp') }}</div>
            </div>
          </article>
        </div>
      </section>

      <aside class="bg-white border border-line rounded-[16px] p-4">
        <h2 class="text-[17px] font-semibold m-0">{{ t('community.web.boardTitle', { month }) }}</h2>
        <Skeleton v-if="lb.loading.value" :rows="4" :height="32" class="mt-3" />
        <p v-else-if="!lb.board.value" class="text-muted text-[14px] mt-3 mb-0">{{ t('community.leaderboard.loadError') }}</p>
        <p v-else-if="!lb.board.value.entries.length" class="text-muted text-[14px] mt-3 mb-0">{{ t('community.leaderboard.empty') }}</p>
        <ol v-else class="list-none p-0 m-0 mt-2">
          <li v-for="e in lb.board.value.entries.slice(0, 10)" :key="e.userId" class="flex items-center gap-3 py-2 border-b border-line last:border-b-0 text-[14px]">
            <span class="w-6 text-muted font-semibold">{{ e.rank }}</span>
            <span class="w-8 h-8 rounded-full bg-soft flex items-center justify-center font-bold text-[12px] shrink-0">{{ initials(e.displayName) }}</span>
            <span class="flex-1 min-w-0 truncate">{{ e.displayName }}</span>
            <b>{{ e.points }}</b>
          </li>
        </ol>
        <p class="text-muted text-[12.5px] mt-3 mb-0">{{ t('community.prizes.note') }}</p>
      </aside>
    </div>

    <section class="bg-green-deep text-white rounded-[24px] p-6 md:p-8 flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <AppIcon name="volunteer_activism" :size="28" />
        <div>
          <h2 class="text-[20px] font-semibold m-0 mb-1">{{ t('community.web.ctaTitle') }}</h2>
          <p class="text-[15px] text-white/80 m-0">{{ t('community.web.ctaText') }}</p>
        </div>
      </div>
      <DownloadButtons dark />
    </section>
  </div>
</template>
