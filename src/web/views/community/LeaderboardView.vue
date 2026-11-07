<script setup lang="ts">
// T23 · /community/leaderboard pe web (public): Noiembrie / Anul 2026, locul meu, top 10 (LeaderboardPanel, comun cu aplicația);
// în dreapta premiile anului și „Folosește punctele” (→ /offers).
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import LeaderboardPanel from '@/shared/components/community/LeaderboardPanel.vue'
import PrizesCard from '@/shared/components/community/PrizesCard.vue'
import { earnsPoints } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import type { LeaderboardPeriod } from '@/shared/types/community'

const { t } = useI18n()
const auth = useAuthStore()
const period = ref<LeaderboardPeriod>('month')
</script>

<template>
  <div class="max-w-[1080px] mx-auto">
    <router-link to="/community" class="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted no-underline hover:text-ink mb-4">
      <AppIcon name="arrow_back" :size="18" />{{ t('community.web.backToCommunity') }}
    </router-link>
    <h1 class="text-[32px] md:text-[40px] font-semibold tracking-[-0.025em] m-0 mb-5">{{ t('community.leaderboard.title') }}</h1>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <LeaderboardPanel v-model:period="period" class="min-w-0" />
      <aside class="flex flex-col gap-3.5 min-w-0">
        <PrizesCard />
        <div class="bg-white rounded-[16px] border border-line p-4">
          <h2 class="text-[16px] font-semibold m-0">{{ t('community.home.usePoints') }}</h2>
          <p class="text-muted text-[13.5px] m-0 mt-1">{{ t('community.leaderboard.useText') }}</p>
          <router-link v-if="earnsPoints(auth.role)" to="/offers" class="mt-3 h-10 px-4 rounded-[12px] border border-line bg-white text-[14px] font-semibold text-ink no-underline inline-flex items-center gap-1.5">
            <AppIcon name="sell" :size="18" />{{ t('community.leaderboard.seeOffers') }}
          </router-link>
        </div>
      </aside>
    </div>
  </div>
</template>
