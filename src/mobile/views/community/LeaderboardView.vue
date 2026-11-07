<script setup lang="ts">
// T11 · Clasament + recompense (design/final mobile „Clasament + recompense”): Noiembrie / Anul 2026, locul meu,
// premiile anului, top 10 (+ rândul meu), „Folosește punctele” (ofertele cu puncte sunt în T10).
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import LeaderboardRows from '@/shared/components/community/LeaderboardRows.vue'
import PrizesCard from '@/shared/components/community/PrizesCard.vue'
import { useBack } from '@/shared/composables/useBack'
import { useFormat } from '@/shared/composables/useFormat'
import { useLeaderboard } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import type { LeaderboardPeriod } from '@/shared/types/community'

const { t } = useI18n()
const router = useRouter()
const f = useFormat()
const auth = useAuthStore()
const back = useBack('/m/community')
const period = ref<LeaderboardPeriod>('month')
const { board, loading, load } = useLeaderboard(period)
onMounted(load)

const now = new Date()
const monthLabel = new Intl.DateTimeFormat('ro-RO', { month: 'long', timeZone: 'Europe/Bucharest' }).format(now)
const periodLabel = computed(() => ({ month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), year: t('community.leaderboard.year', { y: now.getFullYear() }) }))
</script>

<template>
  <div class="flex items-center gap-2 pt-1">
    <button class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="text-[28px] font-semibold tracking-[-0.025em] m-0">{{ t('community.leaderboard.title') }}</h1>
  </div>

  <div class="flex bg-soft rounded-[14px] p-1 mt-3 mb-4">
    <button v-for="p in (['month', 'year'] as const)" :key="p" class="flex-1 h-10 rounded-[11px] text-[14px] font-semibold" :class="period === p ? 'bg-white shadow-sm' : 'text-muted'" @click="period = p">
      {{ periodLabel[p] }}
    </button>
  </div>

  <Skeleton v-if="loading" :rows="4" />
  <EmptyState v-else-if="!board" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="load" />
  <template v-else>
    <div v-if="board.me" class="rounded-[16px] bg-green-soft p-4 flex items-center gap-3.5">
      <div><div class="text-[12.5px] text-green-deep">{{ t('community.leaderboard.yourPlace') }}</div><b class="text-[30px] tracking-[-0.03em] text-green-deep">#{{ board.me.rank }}</b></div>
      <div class="flex-1 min-w-0"><b class="block truncate">{{ auth.user?.displayName }}</b><span class="text-muted text-[13.5px]">{{ f.points(board.me.points) }} · {{ period === 'month' ? t('community.leaderboard.thisMonth') : t('community.leaderboard.thisYear') }}</span></div>
      <AppIcon name="military_tech" class="text-green-deep" :size="30" />
    </div>
    <div v-else class="rounded-[16px] bg-green-soft p-4 text-[14px] text-green-deep">
      {{ t('community.leaderboard.loginToSee') }}
      <AppButton size="sm" class="mt-2 block" @click="router.push({ path: '/m/login', query: { next: '/m/community/leaderboard' } })">{{ t('community.how.login') }}</AppButton>
    </div>

    <PrizesCard class="mt-3" />

    <div class="bg-white rounded-[16px] border border-line px-4 py-1 mt-3">
      <LeaderboardRows v-if="board.entries.length" :board="board" :me-id="auth.user?.id" :me-name="auth.user?.displayName" />
      <EmptyState v-else icon="leaderboard" :title="t('community.leaderboard.empty')" />
    </div>
    <p class="text-muted text-[12.5px] mt-2 mb-0">{{ t('community.leaderboard.onlyEarned') }}</p>

    <h2 class="text-[20px] font-semibold tracking-[-0.02em] m-0 mt-6">{{ t('community.home.usePoints') }}</h2>
    <p class="text-muted text-[14px] m-0 mt-1 mb-3">{{ t('community.leaderboard.useText') }}</p>
    <AppButton block variant="ghost" icon="sell" @click="router.push('/m/offers')">{{ t('community.leaderboard.seeOffers') }}</AppButton>
  </template>
</template>
