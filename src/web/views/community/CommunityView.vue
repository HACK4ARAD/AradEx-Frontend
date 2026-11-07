<script setup lang="ts">
// W12 · Comunitate pe web (T11, T23). Fără cont: pagina de citit (acțiunile care urmează, clasamentul lunii, „Descarcă aplicația”).
// Localnic conectat (T23, ca în aplicație): pe fiecare card „Mă înscriu” / „QR-ul meu” / „Confirmat +N”, în dreapta punctele lui și
// clasamentul; vizitatorul vede că acțiunile sunt pentru localnici. Fiecare card are „Detalii” → /community/actions/:id.
// Datele: GET /community/actions?upcoming=true, GET /community/leaderboard?period=month, GET /me/points (publice / cont).
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import DownloadButtons from '@/web/components/site/DownloadButtons.vue'
import LeaderboardRows from '@/shared/components/community/LeaderboardRows.vue'
import PointsCard from '@/shared/components/community/PointsCard.vue'
import RegistrationSheet from '@/shared/components/community/RegistrationSheet.vue'
import { useFormat } from '@/shared/composables/useFormat'
import {
  ACTION_CATEGORIES, currentMonthLabel, isActiveRegistration, isEnded, spotsLeft, useActions, useLeaderboard, usePoints,
} from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { ActionCategory, ActionSummary, LeaderboardPeriod, RegistrationDto } from '@/shared/types/community'

const { t } = useI18n()
const f = useFormat()
const auth = useAuthStore()
const ui = useUiStore()
const steps = ['1', '2', '3'] as const
const list = useActions()
const lb = useLeaderboard(ref<LeaderboardPeriod>('month'))
const pts = usePoints()
const month = currentMonthLabel()

const isLocal = computed(() => auth.role === 'LOCAL')
const isVisitor = computed(() => auth.role === 'VISITOR')
/** cont personal conectat: web-ul e aplicația lui, deci fără „Descarcă aplicația” */
const personal = computed(() => isLocal.value || isVisitor.value)

const cat = ref<'ALL' | ActionCategory>('ALL')
const cats = computed(() => ACTION_CATEGORIES.filter((c) => list.actions.value.some((a) => a.category === c)))
const shown = computed(() => (cat.value === 'ALL' ? list.actions.value : list.actions.value.filter((a) => a.category === cat.value)))

const regOf = (a: ActionSummary) => (isActiveRegistration(a.myRegistration) ? a.myRegistration : undefined)
const qr = ref<RegistrationDto | null>(null)
const qrOpen = computed({ get: () => !!qr.value, set: (v: boolean) => { if (!v) qr.value = null } })

async function register(a: ActionSummary) {
  const r = await list.register(a.id)
  if (r) { ui.toast(t('community.action.registeredToast'), 'success'); qr.value = r }
}
async function cancel() {
  if (!qr.value || !window.confirm(t('community.action.cancelConfirm'))) return
  if (await list.cancel(qr.value.actionId)) { qr.value = null; ui.toast(t('community.action.cancelledToast'), 'success') }
}

onMounted(() => {
  list.load()
  lb.load()
  if (isLocal.value) pts.load()
})
</script>

<template>
  <div class="max-w-[1080px] mx-auto flex flex-col gap-8">
    <header>
      <h1 class="text-[36px] md:text-[44px] font-semibold tracking-[-0.025em] m-0 mb-3">{{ t('site.community.pageTitle') }}</h1>
      <p class="text-[17px] text-muted leading-relaxed m-0 max-w-[680px]">{{ t('site.community.pageText') }}</p>
    </header>
    <ol v-if="!personal" class="grid grid-cols-1 md:grid-cols-3 gap-3 list-none p-0 m-0">
      <li v-for="s in steps" :key="s" class="bg-white border border-line rounded-[16px] p-4 flex gap-3">
        <span class="w-8 h-8 shrink-0 rounded-full bg-green-deep text-white font-bold flex items-center justify-center">{{ s }}</span>
        <span class="text-[15px] leading-relaxed">{{ t(`site.community.steps.${s}`) }}</span>
      </li>
    </ol>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <section class="min-w-0">
        <h2 class="text-[22px] font-semibold tracking-[-0.02em] m-0 mb-3">{{ t('community.home.upcoming') }}</h2>
        <div v-if="cats.length > 1" class="flex flex-wrap gap-2 mb-3.5">
          <AppChip :active="cat === 'ALL'" @click="cat = 'ALL'">{{ t('community.web.filterAll') }}</AppChip>
          <AppChip v-for="c in cats" :key="c" :active="cat === c" @click="cat = c">{{ t(`community.categoryIcon.${c}`) }} {{ t(`community.category.${c}`) }}</AppChip>
        </div>

        <Skeleton v-if="list.loading.value" :rows="3" :height="104" />
        <EmptyState v-else-if="list.error.value" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="list.load" />
        <EmptyState v-else-if="!shown.length" icon="volunteer_activism" :title="t('community.home.empty')" :text="t('community.home.emptyText')" />
        <div v-else class="flex flex-col gap-3">
          <article v-for="a in shown" :key="a.id" class="bg-white border border-line rounded-[16px] p-4 flex flex-col sm:flex-row gap-4">
            <router-link :to="`/community/actions/${a.id}`" :aria-label="a.title"
              class="w-full sm:w-[120px] h-[150px] sm:h-[84px] rounded-[12px] bg-green-deep bg-cover bg-center shrink-0 flex items-center justify-center text-white/80"
              :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined"><AppIcon v-if="!a.imageUrl" name="volunteer_activism" :size="30" /></router-link>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <router-link :to="`/community/actions/${a.id}`" class="text-[16px] font-semibold m-0 no-underline text-ink hover:underline">{{ a.title }}</router-link>
                <span class="rounded-full bg-green-soft text-green-deep text-[12px] font-bold px-2 py-0.5">{{ t('community.card.points', { n: a.pointsReward }) }}</span>
              </div>
              <div class="text-muted text-[13.5px] mt-1">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }} · {{ a.locationName }}</div>
              <div class="text-muted text-[13px] mt-1">{{ t('community.action.spots', { taken: a.registeredCount, total: a.capacity, free: spotsLeft(a) }) }}</div>
              <div v-if="!personal" class="text-[12.5px] text-green-deep font-semibold mt-2 flex items-center gap-1"><AppIcon name="smartphone" :size="16" />{{ t('community.web.inApp') }}</div>
            </div>
            <div class="flex sm:flex-col gap-2 sm:items-end shrink-0 flex-wrap">
              <template v-if="regOf(a)">
                <AppButton size="sm" icon="qr_code_2" :class="regOf(a)?.status === 'CONFIRMED' ? '!bg-green' : ''" @click="qr = regOf(a) ?? null">
                  {{ regOf(a)?.status === 'CONFIRMED' ? t('community.web.confirmed', { n: a.pointsReward }) : t('community.web.myQr') }}
                </AppButton>
              </template>
              <template v-else-if="isLocal">
                <AppButton v-if="isEnded(a)" size="sm" disabled>{{ t('community.web.ended') }}</AppButton>
                <AppButton v-else-if="spotsLeft(a) <= 0" size="sm" disabled>{{ t('community.web.full') }}</AppButton>
                <AppButton v-else size="sm" icon="how_to_reg" class="!bg-green" :loading="list.busyId.value === a.id" @click="register(a)">{{ t('community.web.register') }}</AppButton>
              </template>
              <router-link :to="`/community/actions/${a.id}`" class="h-10 px-4 rounded-[12px] border border-line bg-white text-[14px] font-semibold text-ink no-underline inline-flex items-center justify-center">{{ t('community.web.details') }}</router-link>
            </div>
          </article>
        </div>
      </section>

      <aside class="flex flex-col gap-3.5 min-w-0">
        <template v-if="isLocal">
          <Skeleton v-if="pts.loading.value" :rows="1" :height="170" />
          <PointsCard v-else-if="pts.points.value" :points="pts.points.value" to="/account/points" />
        </template>
        <div v-else-if="isVisitor" class="rounded-[16px] bg-green-soft text-green-deep p-4">
          <b class="block text-[15px]">{{ t('community.web.visitorTitle') }}</b>
          <p class="text-[13.5px] leading-relaxed m-0 mt-1.5">{{ t('community.web.visitorText') }}</p>
        </div>

        <div class="bg-white border border-line rounded-[16px] p-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-[17px] font-semibold m-0">{{ t('community.web.boardTitle', { month }) }}</h2>
          </div>
          <Skeleton v-if="lb.loading.value" :rows="4" :height="32" class="mt-3" />
          <div v-else-if="!lb.board.value" class="text-muted text-[14px] mt-3">
            {{ t('community.leaderboard.loadError') }}
            <button type="button" class="block mt-2 h-9 px-4 rounded-[12px] border border-line bg-white font-semibold text-ink" @click="lb.load">{{ t('common.retry') }}</button>
          </div>
          <p v-else-if="!lb.board.value.entries.length" class="text-muted text-[14px] mt-3 mb-0">{{ t('community.leaderboard.empty') }}</p>
          <LeaderboardRows v-else :board="lb.board.value" :limit="personal ? 5 : 10" :me-id="isLocal ? auth.user?.id : undefined" :me-name="auth.user?.displayName" class="mt-1" />
          <p class="text-muted text-[12.5px] mt-3 mb-0">{{ t('community.prizes.note') }}</p>
          <router-link to="/community/leaderboard" class="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-ink no-underline hover:underline">
            {{ t('community.web.allBoard') }}<AppIcon name="arrow_forward" :size="16" />
          </router-link>
        </div>
      </aside>
    </div>

    <section v-if="!personal" class="bg-green-deep text-white rounded-[24px] p-6 md:p-8 flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <AppIcon name="volunteer_activism" :size="28" />
        <div>
          <h2 class="text-[20px] font-semibold m-0 mb-1">{{ t('community.web.ctaTitle') }}</h2>
          <p class="text-[15px] text-white/80 m-0">{{ t('community.web.ctaText') }}</p>
        </div>
      </div>
      <DownloadButtons dark />
    </section>

    <RegistrationSheet v-model:open="qrOpen" :registration="qr" :saving="list.busyId.value != null" @cancel="cancel" />
  </div>
</template>
