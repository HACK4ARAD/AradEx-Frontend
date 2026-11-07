<script setup lang="ts">
// T11 · W12 Comunitate (design/final web „Comunitate”): filtre pe categorii, acțiunile (Mă înscriu / QR-ul meu / Detalii),
// în dreapta punctele mele (sau „Cum funcționează”), clasamentul lunii și „Folosește punctele”.
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppIcon, AppSheet, EmptyState, Skeleton } from '@/shared/components'
import LeaderboardRows from '@/shared/components/community/LeaderboardRows.vue'
import PointsCard from '@/shared/components/community/PointsCard.vue'
import RegistrationTicket from '@/shared/components/community/RegistrationTicket.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { ACTION_CATEGORIES, isActiveRegistration, isEnded, spotsLeft, useActions, useLeaderboard, usePoints } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { ActionCategory, ActionSummary, LeaderboardPeriod } from '@/shared/types/community'

const { t } = useI18n()
const f = useFormat()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()
const list = useActions()
const pts = usePoints()
const period = ref<LeaderboardPeriod>('month')
const lb = useLeaderboard(period)
const filter = ref<'all' | ActionCategory>('all')
const detail = ref<ActionSummary | null>(null)
const qrFor = ref<number | null>(null)

const canEarn = computed(() => auth.isLoggedIn && (auth.role === 'LOCAL' || auth.role === 'VISITOR'))
const shown = computed(() => list.actions.value.filter((a) => filter.value === 'all' || a.category === filter.value))
const qrAction = computed(() => list.actions.value.find((a) => a.id === qrFor.value))

onMounted(() => {
  list.load()
  lb.load()
  if (canEarn.value) pts.load()
})

const going = (a: ActionSummary) => {
  const more = Math.max(0, a.registeredCount - a.goingPreview.length)
  if (!a.goingPreview.length) return ''
  return more ? t('community.card.goingMore', { names: a.goingPreview.join(', '), n: more }) : t('community.card.going', { names: a.goingPreview.join(', ') })
}

async function onRegister(a: ActionSummary) {
  if (!auth.isLoggedIn) { router.push({ path: '/w/login', query: { next: route.fullPath } }); return }
  if (!canEarn.value) { ui.toast(t('community.action.notForRole')); return }
  if (await list.register(a.id)) { detail.value = null; qrFor.value = a.id; ui.toast(t('community.action.registeredToast'), 'success') }
}

async function onCancel(a: ActionSummary) {
  if (!window.confirm(t('community.action.cancelConfirm'))) return
  if (await list.cancel(a.id)) { qrFor.value = null; ui.toast(t('community.action.cancelledToast'), 'success') }
}
</script>

<template>
  <h1 class="text-[32px] font-semibold tracking-[-0.025em] leading-tight m-0">{{ t('community.title') }}</h1>
  <p class="text-muted text-[15px] m-0 mt-1">{{ t('community.web.sub') }}</p>

  <div class="grid gap-6 mt-5 lg:grid-cols-[minmax(0,1fr)_340px]">
    <div class="min-w-0">
      <div class="flex flex-wrap gap-2 mb-3.5">
        <AppChip :active="filter === 'all'" @click="filter = 'all'">{{ t('community.web.upcoming') }}</AppChip>
        <AppChip v-for="c in ACTION_CATEGORIES" :key="c" :active="filter === c" @click="filter = c">{{ t(`community.categoryIcon.${c}`) }} {{ t(`community.category.${c}`) }}</AppChip>
      </div>

      <Skeleton v-if="list.loading.value" :rows="3" :height="110" />
      <EmptyState v-else-if="list.error.value" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="list.load" />
      <EmptyState v-else-if="!shown.length" icon="volunteer_activism" :title="t('community.home.empty')" :text="t('community.home.emptyText')" />
      <div v-else class="flex flex-col gap-3">
        <div v-for="a in shown" :key="a.id" class="bg-white rounded-[16px] border border-line p-4 flex flex-col sm:flex-row gap-4 sm:items-start">
          <div class="w-full sm:w-[110px] h-[140px] sm:h-[78px] rounded-[12px] bg-green-deep bg-cover bg-center shrink-0" :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined" />
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <b class="text-[15px]">{{ a.title }}</b>
              <span class="rounded-full bg-green-soft text-green-deep text-[12px] font-bold px-2 py-0.5">{{ t('community.card.points', { n: a.pointsReward }) }}</span>
            </div>
            <div class="text-muted text-[13px] mt-1">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }} · {{ a.locationName }}</div>
            <div class="text-muted text-[13px] mt-1">{{ t('community.web.spots', { taken: a.registeredCount, total: a.capacity }) }}<template v-if="going(a)"> · {{ going(a) }}</template></div>
          </div>
          <div class="flex sm:flex-col gap-1.5 sm:items-end shrink-0">
            <AppButton v-if="isActiveRegistration(a.myRegistration)" size="sm" :icon="a.myRegistration?.status === 'CONFIRMED' ? 'check_circle' : 'qr_code_2'"
              :class="a.myRegistration?.status === 'CONFIRMED' ? '!bg-green' : ''" @click="qrFor = a.id">
              {{ a.myRegistration?.status === 'CONFIRMED' ? t('community.web.confirmed', { n: a.pointsReward }) : t('community.web.myQr') }}
            </AppButton>
            <AppButton v-else-if="isEnded(a)" size="sm" disabled>{{ t('community.card.ended') }}</AppButton>
            <AppButton v-else-if="spotsLeft(a) <= 0" size="sm" disabled>{{ t('community.action.fullCta') }}</AppButton>
            <AppButton v-else size="sm" :loading="list.savingId.value === a.id" @click="onRegister(a)">{{ t('community.web.register') }}</AppButton>
            <AppButton size="sm" variant="ghost" @click="detail = a">{{ t('community.web.details') }}</AppButton>
          </div>
        </div>
      </div>
    </div>

    <aside class="flex flex-col gap-3.5">
      <template v-if="canEarn">
        <Skeleton v-if="pts.loading.value" :rows="1" :height="150" />
        <PointsCard v-else-if="pts.points.value" :points="pts.points.value" compact to="/w/account/points" />
      </template>
      <div v-else class="bg-white rounded-[16px] border border-line p-4">
        <b>{{ t('community.how.title') }}</b>
        <ol class="m-0 mt-2 pl-5 text-muted text-[13.5px] leading-relaxed">
          <li>{{ t('community.how.s1') }}</li><li>{{ t('community.how.s2') }}</li><li>{{ t('community.how.s3') }}</li>
        </ol>
        <AppButton v-if="!auth.isLoggedIn" size="sm" class="mt-3" @click="router.push({ path: '/w/login', query: { next: '/w/community' } })">{{ t('community.web.loginLocal') }}</AppButton>
      </div>

      <div class="bg-white rounded-[16px] border border-line p-4">
        <div class="flex items-center justify-between">
          <b>{{ period === 'month' ? t('community.web.boardMonth') : t('community.web.boardYear') }}</b>
          <AppChip :active="period === 'year'" @click="period = period === 'month' ? 'year' : 'month'">{{ period === 'month' ? t('community.web.toYear') : t('community.web.toMonth') }}</AppChip>
        </div>
        <Skeleton v-if="lb.loading.value" :rows="3" :height="32" />
        <LeaderboardRows v-else-if="lb.board.value" :board="lb.board.value" :me-id="auth.user?.id" :me-name="auth.user?.displayName" :limit="5" />
        <p class="text-muted text-[12px] m-0 mt-2.5">{{ t('community.prizes.note') }}</p>
      </div>

      <div class="bg-white rounded-[16px] border border-line p-4">
        <b>{{ t('community.home.usePoints') }}</b>
        <p class="text-muted text-[13.5px] m-0 mt-1">{{ t('community.leaderboard.useText') }}</p>
        <AppButton size="sm" variant="ghost" icon="sell" class="mt-3" @click="router.push('/w/offers')">{{ t('community.leaderboard.seeOffers') }}</AppButton>
      </div>
    </aside>
  </div>

  <AppSheet :open="!!detail" :title="detail?.title" wide @update:open="(v: boolean) => { if (!v) detail = null }">
    <template v-if="detail">
      <div class="h-[180px] rounded-[14px] bg-green-deep bg-cover bg-center" :style="detail.imageUrl ? { backgroundImage: `url('${detail.imageUrl}')` } : undefined" />
      <div class="flex flex-wrap gap-2 mt-3">
        <span class="rounded-full bg-green-soft text-green-deep text-[12.5px] font-semibold px-2.5 py-1">{{ t('community.action.badge', { cat: t(`community.category.${detail.category}`) }) }}</span>
        <span class="rounded-full bg-green-soft text-green-deep text-[12.5px] font-bold px-2.5 py-1">{{ t('community.card.points', { n: detail.pointsReward }) }}</span>
      </div>
      <p class="text-[14.5px] m-0 mt-3"><AppIcon name="schedule" :size="18" class="align-[-4px] mr-1 text-muted" />{{ f.dateTime(detail.startAt, false) }} · {{ f.timeRange(detail.startAt, detail.endAt) }}</p>
      <p class="text-[14.5px] m-0 mt-1.5"><AppIcon name="location_on" :size="18" class="align-[-4px] mr-1 text-muted" />{{ detail.locationName }}</p>
      <p v-if="detail.organizer" class="text-muted text-[13.5px] m-0 mt-1.5">{{ t('community.action.partner', { name: detail.organizer }) }}</p>
      <p class="text-muted text-[13.5px] m-0 mt-3">{{ t('community.action.pointsNote') }}</p>
    </template>
    <template v-if="detail" #footer>
      <div class="flex gap-2 w-full">
        <a :href="`https://www.google.com/maps/dir/?api=1&destination=${detail.lat},${detail.lng}`" target="_blank" rel="noopener"
          class="flex-1 h-12 rounded-[14px] border border-line flex items-center justify-center gap-2 font-semibold no-underline text-ink"><AppIcon name="directions" :size="20" />{{ t('community.action.directions') }}</a>
        <AppButton v-if="!isActiveRegistration(detail.myRegistration) && !isEnded(detail) && spotsLeft(detail) > 0" class="flex-1" :loading="list.savingId.value === detail.id" @click="onRegister(detail)">{{ t('community.web.register') }}</AppButton>
      </div>
    </template>
  </AppSheet>

  <AppSheet :open="!!qrAction?.myRegistration" :title="t('community.ticket.title')" @update:open="(v: boolean) => { if (!v) qrFor = null }">
    <RegistrationTicket v-if="qrAction?.myRegistration" :registration="qrAction.myRegistration" />
    <template v-if="qrAction?.myRegistration?.status === 'REGISTERED'" #footer>
      <AppButton block variant="ghost" :loading="list.savingId.value === qrAction.id" @click="onCancel(qrAction)">{{ t('community.action.cancel') }}</AppButton>
    </template>
  </AppSheet>
</template>
