<script setup lang="ts">
// T11 · tab-ul Comunitate din Acasă (S1d, design/final mobile „Comunitate”): card verde cu puncte, nivel, serie, loc în clasament,
// acțiunile care urmează, „Folosește punctele”. Folosit și de /community.
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import ActionCard from '@/shared/components/community/ActionCard.vue'
import PointsCard from '@/shared/components/community/PointsCard.vue'
import { useActions, usePoints } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const list = useActions()
const pts = usePoints()
const isStaff = computed(() => auth.hasRole('CITY_HALL'))
const canEarn = computed(() => auth.isLoggedIn && (auth.role === 'LOCAL' || auth.role === 'VISITOR'))

onMounted(() => {
  list.load()
  if (canEarn.value) pts.load()
})
</script>

<template>
  <div class="mt-4">
    <template v-if="canEarn">
      <Skeleton v-if="pts.loading.value" :rows="1" :height="170" />
      <PointsCard v-else-if="pts.points.value" :points="pts.points.value" to="/community/leaderboard" />
    </template>
    <router-link v-else-if="isStaff" to="/panel" class="flex items-center gap-3 rounded-[20px] bg-green-deep text-white p-4 no-underline">
      <AppIcon name="qr_code_scanner" :size="28" />
      <span class="flex-1"><b class="block text-[15px]">{{ t('community.home.staffTitle') }}</b><small class="text-white/80 text-[12.5px]">{{ t('community.home.staffText') }}</small></span>
      <AppIcon name="chevron_right" />
    </router-link>
    <div v-else-if="!auth.isLoggedIn" class="rounded-[20px] bg-green-soft p-4">
      <b class="block text-[15px] text-green-deep">{{ t('community.how.title') }}</b>
      <ol class="m-0 mt-2 pl-5 text-[13.5px] text-green-deep leading-relaxed">
        <li>{{ t('community.how.s1') }}</li><li>{{ t('community.how.s2') }}</li><li>{{ t('community.how.s3') }}</li>
      </ol>
      <AppButton size="sm" class="mt-3" @click="router.push({ path: '/login', query: { next: '/community' } })">{{ t('community.how.login') }}</AppButton>
    </div>

    <h2 class="text-[20px] font-semibold tracking-[-0.02em] m-0 mt-5">{{ t('community.home.upcoming') }}</h2>
    <p class="text-muted text-[14.5px] m-0 mt-1 mb-3.5">{{ t('community.home.upcomingText') }}</p>

    <Skeleton v-if="list.loading.value" :rows="2" :height="240" />
    <EmptyState v-else-if="list.error.value" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="list.load" />
    <EmptyState v-else-if="!list.actions.value.length" icon="volunteer_activism" :title="t('community.home.empty')" :text="t('community.home.emptyText')" />
    <div v-else class="flex flex-col gap-3.5">
      <ActionCard v-for="a in list.actions.value" :key="a.id" :action="a" :to="`/community/actions/${a.id}`" />
    </div>

    <div class="bg-white rounded-[16px] border border-line p-4 mt-4 flex items-center justify-between gap-3">
      <div><h3 class="text-[16px] font-semibold m-0">{{ t('community.home.usePoints') }}</h3><p class="text-muted text-[13.5px] m-0 mt-0.5">{{ t('community.home.usePointsText') }}</p></div>
      <AppButton size="sm" @click="router.push('/community/leaderboard')">{{ t('community.home.rewards') }}</AppButton>
    </div>
  </div>
</template>
