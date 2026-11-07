<script setup lang="ts">
// T11 · W2 Panoul Primăriei — design/final web `#/city` (`cityDash()`): „Bună dimineața, Primăria Arad”, butoanele Eveniment /
// Acțiune comunitară, 4 KPI, „Participare la acțiuni” (bare) și „Activitate” (feed).
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import PanelKpi from '@/web/components/community/PanelKpi.vue'
import * as P from '@/web/components/community/panel'
import { useFormat } from '@/shared/composables/useFormat'
import { aradHour, useCityDashboard } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'

const { t } = useI18n()
const f = useFormat()
const auth = useAuthStore()
const { data, loading, load } = useCityDashboard()
onMounted(load)

const greeting = computed(() => {
  const h = aradHour()
  return h < 11 ? t('community.dashboard.morning') : h < 18 ? t('community.dashboard.day') : t('community.dashboard.evening')
})
const nf = (n: number) => new Intl.NumberFormat('ro-RO').format(n)
const icon: Record<string, string> = { CONFIRMED: 'qr_code_scanner', NO_SHOW: 'block', REGISTERED: 'how_to_reg', CANCELLED: 'close' }
const pct = (a: { registeredCount: number; capacity: number }) => Math.min(100, Math.round((a.registeredCount / Math.max(1, a.capacity)) * 100))
</script>

<template>
  <div :class="P.HEAD">
    <div>
      <h1 :class="P.H1">{{ greeting }}, {{ auth.user?.displayName }}</h1>
      <div :class="P.SUB">{{ f.longDate(new Date().toISOString()) }}</div>
    </div>
    <div class="flex flex-wrap gap-2">
      <router-link to="/city/events/new" :class="P.BTN_SEC"><AppIcon name="add" :size="16" />{{ t('community.dashboard.newEvent') }}</router-link>
      <router-link to="/city/actions/new" :class="P.BTN"><AppIcon name="add" :size="16" />{{ t('community.dashboard.newAction') }}</router-link>
    </div>
  </div>

  <Skeleton v-if="loading" :rows="3" :height="96" />
  <div v-else-if="!data" :class="[P.CARD, P.EMPTY]">
    <AppIcon name="cloud_off" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" />
    <b class="text-ink">{{ t('community.loadError') }}</b>
    <div class="mt-3"><button type="button" :class="P.BTN_SM_SEC" @click="load">{{ t('common.retry') }}</button></div>
  </div>
  <template v-else>
    <div class="grid gap-3.5 mb-4 grid-cols-2 xl:grid-cols-4">
      <PanelKpi icon="calendar_month" :label="t('community.dashboard.kpiEvents')" :value="nf(data.upcomingEvents)" />
      <PanelKpi icon="group" :label="t('community.dashboard.kpiRegistered')" :value="nf(data.registrations)" :hint="t('community.dashboard.kpiPending', { n: data.pendingValidations })" />
      <PanelKpi icon="stars" tone="#FF5A36" :label="t('community.dashboard.kpiPoints')" :value="nf(data.pointsAwarded)" :hint="t('community.dashboard.thisMonth')" />
      <PanelKpi icon="badge" tone="#1D5FD1" :label="t('community.dashboard.kpiVolunteers')" :value="nf(data.activeVolunteers)" :hint="data.activeVolunteers ? undefined : t('community.dashboard.volunteersSoon')" />
    </div>

    <div class="grid gap-3.5 grid-cols-1 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div :class="P.CARD">
        <div :class="P.CH">
          <div><h2 :class="P.CH_TITLE">{{ t('community.dashboard.participation') }}</h2><div :class="P.HINT">{{ t('community.dashboard.participationHint') }}</div></div>
          <router-link to="/city/validate" :class="P.BTN_SM_SEC">{{ t('community.dashboard.all') }}<AppIcon name="chevron_right" :size="16" /></router-link>
        </div>
        <div v-if="!data.actions.length" :class="P.EMPTY">
          <AppIcon name="event_busy" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.home.empty') }}</b>
        </div>
        <div v-else class="flex flex-col gap-3">
          <router-link v-for="a in data.actions" :key="a.id" :to="{ path: '/city/validate', query: { a: a.id } }"
            class="grid grid-cols-[minmax(0,1fr)_46px] sm:grid-cols-[minmax(0,1fr)_140px_46px] gap-x-3 gap-y-2 items-center text-[13px] no-underline text-ink">
            <div class="flex items-center gap-3 min-w-0">
              <span :class="P.THUMB" :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined"><AppIcon v-if="!a.imageUrl" name="volunteer_activism" :size="18" /></span>
              <div class="min-w-0"><div :class="[P.TT, 'truncate']">{{ a.title }}</div><div :class="P.TS">{{ f.dateTime(a.startAt, false) }} · {{ t('community.dashboard.toValidate', { n: a.pendingCount }) }}</div></div>
            </div>
            <div :class="[P.BAR, 'col-span-2 order-last sm:col-span-1 sm:order-none']"><i class="block h-full bg-ok rounded-[3px]" :style="{ width: `${pct(a)}%` }" /></div>
            <span :class="P.TS">{{ a.registeredCount }}/{{ a.capacity }}</span>
          </router-link>
        </div>
      </div>

      <div :class="P.CARD">
        <div :class="P.CH"><div><h2 :class="P.CH_TITLE">{{ t('community.dashboard.activity') }}</h2><div :class="P.HINT">{{ t('community.dashboard.activityHint') }}</div></div></div>
        <div v-if="!data.activity.length" :class="P.EMPTY">
          <AppIcon name="inbox" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.dashboard.noActivity') }}</b>
        </div>
        <div v-else class="flex flex-col">
          <div v-for="(x, i) in data.activity" :key="i" :class="P.FEED_ROW">
            <span :class="P.FEED_ICON"><AppIcon :name="icon[x.type] ?? 'info'" :size="16" /></span>
            <div class="min-w-0"><b>{{ x.userName }}</b> {{ t(`community.dashboard.act${x.type}`, { action: x.actionTitle, by: x.by ?? '', n: x.points }) }}
              <div :class="P.TS">{{ f.dateTime(x.at) }}</div></div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>
