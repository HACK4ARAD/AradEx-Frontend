<script setup lang="ts">
/**
 * Clasamentul (design/final mobile „Clasament + recompense”, web W12): Noiembrie / Anul 2026, locul meu (sau „Conectează-te”),
 * rândurile (top 10 + rândul meu) și nota „doar punctele câștigate”. Slotul `middle` stă între locul meu și rânduri (premiile pe mobil),
 * `after` sub notă; amândouă apar doar după ce clasamentul s-a încărcat. Mobil (T11) și web (T23).
 */
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import LeaderboardRows from './LeaderboardRows.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { currentMonthLabel, earnsPoints, useLeaderboard } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import type { LeaderboardPeriod } from '@/shared/types/community'

const period = defineModel<LeaderboardPeriod>('period', { default: 'month' })
const { t } = useI18n()
const router = useRouter()
const f = useFormat()
const auth = useAuthStore()
const { board, loading, load } = useLeaderboard(period)
onMounted(load)

const now = new Date()
const periodLabel = computed(() => ({ month: currentMonthLabel(now), year: t('community.leaderboard.year', { y: now.getFullYear() }) }))
/** „Locul tău” doar pentru cine strânge puncte (nu pentru firmă / Primărie / Admin). */
const showMe = computed(() => earnsPoints(auth.role))
</script>

<template>
  <div>
    <div class="flex bg-soft rounded-[14px] p-1 mb-4">
      <button v-for="p in (['month', 'year'] as const)" :key="p" class="flex-1 h-10 rounded-[11px] text-[14px] font-semibold" :class="period === p ? 'bg-white shadow-sm' : 'text-muted'" @click="period = p">
        {{ periodLabel[p] }}
      </button>
    </div>

    <Skeleton v-if="loading" :rows="4" />
    <EmptyState v-else-if="!board" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="load" />
    <template v-else>
      <div v-if="board.me && showMe" class="rounded-[16px] bg-green-soft p-4 flex items-center gap-3.5">
        <div><div class="text-[12.5px] text-green-deep">{{ t('community.leaderboard.yourPlace') }}</div><b class="text-[30px] tracking-[-0.03em] text-green-deep">#{{ board.me.rank }}</b></div>
        <div class="flex-1 min-w-0"><b class="block truncate">{{ auth.user?.displayName }}</b><span class="text-muted text-[13.5px]">{{ f.points(board.me.points) }} · {{ period === 'month' ? t('community.leaderboard.thisMonth') : t('community.leaderboard.thisYear') }}</span></div>
        <AppIcon name="military_tech" class="text-green-deep" :size="30" />
      </div>
      <div v-else-if="!auth.isLoggedIn" class="rounded-[16px] bg-green-soft p-4 text-[14px] text-green-deep">
        {{ t('community.leaderboard.loginToSee') }}
        <AppButton size="sm" class="mt-2 block" @click="router.push({ path: '/login', query: { next: '/community/leaderboard' } })">{{ t('community.how.login') }}</AppButton>
      </div>

      <slot name="middle" />

      <div class="bg-white rounded-[16px] border border-line px-4 py-1 mt-3">
        <LeaderboardRows v-if="board.entries.length" :board="board" :me-id="showMe ? auth.user?.id : undefined" :me-name="auth.user?.displayName" />
        <EmptyState v-else icon="leaderboard" :title="t('community.leaderboard.empty')" />
      </div>
      <p class="text-muted text-[12.5px] mt-2 mb-0">{{ t('community.leaderboard.onlyEarned') }}</p>

      <slot name="after" />
    </template>
  </div>
</template>
