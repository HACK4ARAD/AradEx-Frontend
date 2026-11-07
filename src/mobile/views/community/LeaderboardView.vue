<script setup lang="ts">
// T11 · Clasament + recompense (design/final mobile „Clasament + recompense”): Noiembrie / Anul 2026, locul meu,
// premiile anului, top 10 (+ rândul meu), „Folosește punctele” (ofertele cu puncte sunt în T10).
// Clasamentul (LeaderboardPanel) e comun cu web-ul (T23).
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon } from '@/shared/components'
import LeaderboardPanel from '@/shared/components/community/LeaderboardPanel.vue'
import PrizesCard from '@/shared/components/community/PrizesCard.vue'
import { useBack } from '@/shared/composables/useBack'
import type { LeaderboardPeriod } from '@/shared/types/community'

const { t } = useI18n()
const router = useRouter()
const back = useBack('/community')
const period = ref<LeaderboardPeriod>('month')
</script>

<template>
  <div class="flex items-center gap-2 pt-1">
    <button class="w-10 h-10 -ml-2 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="text-[28px] font-semibold tracking-[-0.025em] m-0">{{ t('community.leaderboard.title') }}</h1>
  </div>

  <LeaderboardPanel v-model:period="period" class="mt-3">
    <template #middle><PrizesCard class="mt-3" /></template>
    <template #after>
      <h2 class="text-[20px] font-semibold tracking-[-0.02em] m-0 mt-6">{{ t('community.home.usePoints') }}</h2>
      <p class="text-muted text-[14px] m-0 mt-1 mb-3">{{ t('community.leaderboard.useText') }}</p>
      <AppButton block variant="ghost" icon="sell" @click="router.push('/offers')">{{ t('community.leaderboard.seeOffers') }}</AppButton>
    </template>
  </LeaderboardPanel>
</template>
