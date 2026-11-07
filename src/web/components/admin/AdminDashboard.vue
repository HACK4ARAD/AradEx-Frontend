<script setup lang="ts">
// T14 · W3 Administrare › Dashboard — design/final web `#/admin` (`cityDash(true)`): titlul „Dashboard”, butoanele Eveniment /
// Acțiune comunitară, 5 KPI din `GET /admin/stats`, cardul „De verificat / moderat” (firme neverificate cu Verifică / Respinge +
// evenimente în ciornă cu Publică) și „Activitate” (feed-ul Primăriei, `/city/dashboard`).
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import PanelKpi from '@/web/components/community/PanelKpi.vue'
import * as P from '@/web/components/community/panel'
import { intlLocale, useFormat } from '@/shared/composables/useFormat'
import { useCityDashboard } from '@/shared/composables/useCommunity'
import { partnerFilter, totalUsers, useAdminContent, useAdminStats, usePartners } from '@/shared/composables/useAdmin'
import { useUiStore } from '@/shared/stores/ui'

const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const { stats, loading, load } = useAdminStats()
const partners = usePartners()
const drafts = useAdminContent()
const city = useCityDashboard()
const doneIds = ref(new Set<number>())

onMounted(() => {
  load()
  partners.load(false)
  drafts.load('events', { status: 'DRAFT', size: 5 })
  city.load()
})

const nf = (n: number) => new Intl.NumberFormat(intlLocale()).format(n)
const toVerify = computed(() => partnerFilter(partners.list.value, 'verify'))
const draftEvents = computed(() => drafts.items.value.filter((e) => e.status === 'DRAFT' && !doneIds.value.has(e.id)))
const reviewLoading = computed(() => partners.loading.value || drafts.loading.value)
const icon: Record<string, string> = { CONFIRMED: 'qr_code_scanner', NO_SHOW: 'block', REGISTERED: 'how_to_reg', CANCELLED: 'close' }

async function verify(id: number) {
  if (await partners.verify(id)) { ui.toast(t('admin.partners.verified'), 'success'); load() }
}
async function reject(id: number) {
  if (await partners.reject(id)) ui.toast(t('admin.partners.rejected'), 'info')
}
async function publish(id: number) {
  if (await drafts.setStatus('events', id, 'PUBLISHED')) { doneIds.value.add(id); ui.toast(t('admin.content.toast.PUBLISHED'), 'success'); load() }
}
</script>

<template>
  <div :class="P.HEAD">
    <div>
      <h1 :class="P.H1">{{ t('admin.dashboard.title') }}</h1>
      <div :class="P.SUB">{{ t('admin.dashboard.sub', { date: f.longDate(new Date().toISOString()) }) }}</div>
    </div>
    <div class="flex flex-wrap gap-2">
      <router-link to="/city/events/new" :class="P.BTN_SEC"><AppIcon name="add" :size="16" />{{ t('admin.dashboard.newEvent') }}</router-link>
      <router-link to="/city/actions/new" :class="P.BTN"><AppIcon name="add" :size="16" />{{ t('admin.dashboard.newAction') }}</router-link>
    </div>
  </div>

  <Skeleton v-if="loading && !stats" :rows="1" :height="96" class="mb-4" />
  <div v-else-if="!stats" :class="[P.CARD, P.EMPTY, 'mb-4']">
    <AppIcon name="cloud_off" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" />
    <b class="text-ink">{{ t('admin.dashboard.loadError') }}</b>
    <div class="mt-3"><button type="button" :class="P.BTN_SM_SEC" @click="load">{{ t('common.retry') }}</button></div>
  </div>
  <div v-else class="grid gap-3.5 mb-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
    <PanelKpi icon="group" tone="#1D5FD1" :label="t('admin.dashboard.kpiUsers')" :value="nf(totalUsers(stats))"
      :hint="t('admin.dashboard.kpiUsersHint', { locals: nf(stats.usersByRole.LOCAL ?? 0), firms: nf(stats.usersByRole.BUSINESS ?? 0) })" />
    <PanelKpi icon="calendar_month" :label="t('admin.dashboard.kpiEvents')" :value="nf(stats.events)" />
    <PanelKpi icon="confirmation_number" :label="t('admin.dashboard.kpiTickets')" :value="nf(stats.ticketsSold)" />
    <PanelKpi icon="stars" tone="#FF5A36" :label="t('admin.dashboard.kpiPoints')" :value="nf(stats.pointsAwarded)" :hint="t('admin.dashboard.kpiPointsHint', { n: stats.actions })" />
    <PanelKpi icon="sell" tone="#8A5A00" :label="t('admin.dashboard.kpiCodes')" :value="nf(stats.codesUsed)" :hint="t('admin.dashboard.kpiCodesHint', { n: nf(stats.offersRedeemed) })" />
  </div>

  <div class="grid gap-3.5 grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
    <div :class="P.CARD">
      <div :class="P.CH">
        <div><h2 :class="P.CH_TITLE">{{ t('admin.dashboard.review') }}</h2><div :class="P.HINT">{{ t('admin.dashboard.reviewHint') }}</div></div>
        <router-link to="/city/partners" :class="P.BTN_SM_SEC">{{ t('admin.dashboard.all') }}<AppIcon name="chevron_right" :size="16" /></router-link>
      </div>
      <Skeleton v-if="reviewLoading" :rows="3" :height="48" />
      <div v-else-if="!toVerify.length && !draftEvents.length" :class="P.EMPTY">
        <AppIcon name="task_alt" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" />
        <b class="text-ink">{{ t('admin.dashboard.reviewEmpty') }}</b><div class="text-[13px] mt-1">{{ t('admin.dashboard.reviewEmptyHint') }}</div>
      </div>
      <div v-else class="flex flex-col">
        <div v-for="b in toVerify" :key="`b${b.id}`" class="flex flex-wrap items-center gap-2.5 py-2 border-b border-line">
          <div class="flex items-center gap-3 min-w-0 flex-1 basis-[220px]">
            <span :class="P.THUMB" :style="b.imageUrl ? { backgroundImage: `url('${b.imageUrl}')` } : undefined"><AppIcon v-if="!b.imageUrl" name="storefront" :size="18" /></span>
            <div class="min-w-0"><div :class="[P.TT, 'truncate']">{{ b.name }}</div>
              <div :class="[P.TS, 'truncate']">{{ t('admin.dashboard.firmLine', { category: t(`business.category.${b.category}`), address: b.address ?? '—', date: f.dateTime(b.createdAt, false) }) }}</div></div>
          </div>
          <div class="flex gap-1.5 ml-auto">
            <button type="button" :class="P.BTN_SM_SEC" :disabled="partners.busy.value === b.id" @click="reject(b.id)">{{ t('admin.partners.reject') }}</button>
            <button type="button" :class="P.BTN_SM_OK" :disabled="partners.busy.value === b.id" @click="verify(b.id)"><AppIcon name="verified" :size="16" />{{ t('admin.partners.verify') }}</button>
          </div>
        </div>
        <div v-for="e in draftEvents" :key="`e${e.id}`" class="flex flex-wrap items-center gap-2.5 py-2 border-b border-line last:border-b-0">
          <div class="flex items-center gap-3 min-w-0 flex-1 basis-[220px]">
            <span :class="P.THUMB" :style="e.imageUrl ? { backgroundImage: `url('${e.imageUrl}')` } : undefined"><AppIcon v-if="!e.imageUrl" name="event" :size="18" /></span>
            <div class="min-w-0"><div :class="[P.TT, 'truncate']">{{ e.title }}</div><div :class="[P.TS, 'truncate']">{{ t('admin.dashboard.draftEvent', { org: e.organizer ?? '—' }) }}</div></div>
          </div>
          <div class="flex items-center gap-1.5 ml-auto">
            <span :class="[P.PILL, 'bg-soft text-muted']">{{ t('admin.status.DRAFT') }}</span>
            <button type="button" :class="P.BTN_SM" :disabled="drafts.busy.value === e.id" @click="publish(e.id)">{{ t('admin.content.publish') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div :class="P.CARD">
      <div :class="P.CH"><div><h2 :class="P.CH_TITLE">{{ t('community.dashboard.activity') }}</h2><div :class="P.HINT">{{ t('community.dashboard.activityHint') }}</div></div></div>
      <Skeleton v-if="city.loading.value" :rows="3" :height="40" />
      <div v-else-if="!city.data.value?.activity.length" :class="P.EMPTY">
        <AppIcon name="inbox" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.dashboard.noActivity') }}</b>
      </div>
      <div v-else class="flex flex-col">
        <div v-for="(x, i) in city.data.value.activity" :key="i" :class="P.FEED_ROW">
          <span :class="P.FEED_ICON"><AppIcon :name="icon[x.type] ?? 'info'" :size="16" /></span>
          <div class="min-w-0"><b>{{ x.userName }}</b> {{ t(`community.dashboard.act${x.type}`, { action: x.actionTitle, by: x.by ?? '', n: x.points }) }}
            <div :class="P.TS">{{ f.dateTime(x.at) }}</div></div>
        </div>
      </div>
    </div>
  </div>
</template>
