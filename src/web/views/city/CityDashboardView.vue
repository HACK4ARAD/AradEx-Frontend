<script setup lang="ts">
// T11 · W2 Panoul Primăriei (design/final web „Primărie · Panou”): salut, KPI (agendă, înscriși, puncte, voluntari),
// participarea la acțiunile care urmează (cu câți sunt de validat) și activitatea recentă.
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import KpiCard from '@/shared/components/community/KpiCard.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { useCityDashboard } from '@/shared/composables/useCommunity'
import { useAuthStore } from '@/shared/stores/auth'

const { t } = useI18n()
const f = useFormat()
const router = useRouter()
const auth = useAuthStore()
const { data, loading, load } = useCityDashboard()
onMounted(load)

const greeting = computed(() => {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Bucharest' }).format(new Date()))
  return h < 11 ? t('community.dashboard.morning') : h < 18 ? t('community.dashboard.day') : t('community.dashboard.evening')
})
const nf = (n: number) => new Intl.NumberFormat('ro-RO').format(n)
const icon: Record<string, string> = { CONFIRMED: 'qr_code_scanner', NO_SHOW: 'block', REGISTERED: 'how_to_reg', CANCELLED: 'close' }
</script>

<template>
  <PanelHeader :title="`${greeting}, ${auth.user?.displayName ?? ''}`" :subtitle="f.longDate(new Date().toISOString())">
    <AppButton variant="ghost" size="sm" icon="add" @click="router.push('/w/city/events/new')">{{ t('community.dashboard.newEvent') }}</AppButton>
    <AppButton size="sm" icon="add" @click="router.push('/w/city/actions/new')">{{ t('community.dashboard.newAction') }}</AppButton>
  </PanelHeader>

  <Skeleton v-if="loading" :rows="3" :height="96" />
  <EmptyState v-else-if="!data" icon="cloud_off" :title="t('community.loadError')" :action="t('common.retry')" @action="load" />
  <template v-else>
    <div class="grid gap-3 grid-cols-2 xl:grid-cols-4">
      <KpiCard icon="calendar_month" :label="t('community.dashboard.kpiEvents')" :value="nf(data.upcomingEvents)" />
      <KpiCard icon="group" :label="t('community.dashboard.kpiRegistered')" :value="nf(data.registrations)" :hint="t('community.dashboard.kpiPending', { n: data.pendingValidations })" />
      <KpiCard icon="stars" tone="#FF5A36" :label="t('community.dashboard.kpiPoints')" :value="nf(data.pointsAwarded)" :hint="t('community.dashboard.thisMonth')" />
      <KpiCard icon="badge" tone="#1D5FD1" :label="t('community.dashboard.kpiVolunteers')" :value="nf(data.activeVolunteers)" :hint="data.activeVolunteers ? undefined : t('community.dashboard.volunteersSoon')" />
    </div>

    <div class="grid gap-5 mt-5 lg:grid-cols-2">
      <div class="bg-white rounded-[16px] border border-line p-4 min-w-0">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div><b class="text-[15px]">{{ t('community.dashboard.participation') }}</b><div class="text-muted text-[12.5px]">{{ t('community.dashboard.participationHint') }}</div></div>
          <router-link to="/w/city/validate" class="text-[13px] text-muted no-underline flex items-center shrink-0">{{ t('community.dashboard.all') }}<AppIcon name="chevron_right" :size="18" /></router-link>
        </div>
        <EmptyState v-if="!data.actions.length" icon="event_busy" :title="t('community.home.empty')" :action="t('community.dashboard.newAction')" @action="router.push('/w/city/actions/new')" />
        <router-link v-for="a in data.actions" :key="a.id" :to="{ path: '/w/city/validate', query: { a: a.id } }"
          class="grid grid-cols-[minmax(0,1fr)_90px_auto] sm:grid-cols-[minmax(0,1fr)_140px_auto] items-center gap-3 py-2.5 border-b border-line last:border-b-0 no-underline text-ink">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-10 h-10 rounded-[10px] bg-green-deep bg-cover bg-center shrink-0" :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined" />
            <div class="min-w-0"><b class="block text-[14px] truncate">{{ a.title }}</b><span class="text-muted text-[12.5px]">{{ f.dateTime(a.startAt, false) }} · {{ t('community.dashboard.toValidate', { n: a.pendingCount }) }}</span></div>
          </div>
          <div class="h-2 rounded bg-soft overflow-hidden"><i class="block h-full bg-green rounded" :style="{ width: `${Math.min(100, Math.round(a.registeredCount / a.capacity * 100))}%` }" /></div>
          <span class="text-muted text-[12.5px] whitespace-nowrap">{{ a.registeredCount }}/{{ a.capacity }}</span>
        </router-link>
      </div>

      <div class="bg-white rounded-[16px] border border-line p-4 min-w-0">
        <b class="text-[15px]">{{ t('community.dashboard.activity') }}</b>
        <div class="text-muted text-[12.5px] mb-2">{{ t('community.dashboard.activityHint') }}</div>
        <EmptyState v-if="!data.activity.length" icon="inbox" :title="t('community.dashboard.noActivity')" />
        <div v-for="(x, i) in data.activity" :key="i" class="flex gap-3 py-2.5 border-b border-line last:border-b-0">
          <span class="w-8 h-8 rounded-full bg-soft flex items-center justify-center shrink-0"><AppIcon :name="icon[x.type] ?? 'info'" :size="18" /></span>
          <div class="min-w-0 text-[14px]">
            <b>{{ x.userName }}</b> {{ t(`community.dashboard.act${x.type}`, { action: x.actionTitle, by: x.by ?? '', n: x.points }) }}
            <div class="text-muted text-[12px]">{{ f.dateTime(x.at) }}</div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>
