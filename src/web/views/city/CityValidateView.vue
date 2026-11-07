<script setup lang="ts">
// T11 · Validare participanți (design/final web „Primărie · Validare”): alegi acțiunea, KPI (înscriși / confirmați / în așteptare /
// neprezentați), lista cu Confirmă / Respinge / Confirmă toți, confirmare manuală după cod, clasamentul lunii.
// Scanarea QR NU se face din web (doar din aplicație: Primăria pe /m/panel, voluntarii în T18).
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, AppIcon, EmptyState, Skeleton } from '@/shared/components'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import KpiCard from '@/shared/components/community/KpiCard.vue'
import LeaderboardRows from '@/shared/components/community/LeaderboardRows.vue'
import ManualCodeForm from '@/shared/components/community/ManualCodeForm.vue'
import ScanResultCard from '@/shared/components/community/ScanResultCard.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { useActionRegistrations, useCityCommunity, useLeaderboard, type ScanResult } from '@/shared/composables/useCommunity'
import { useUiStore } from '@/shared/stores/ui'
import type { LeaderboardPeriod, RegistrationDto } from '@/shared/types/community'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const city = useCityCommunity()
const selected = ref<number | null>(null)
const regs = useActionRegistrations(selected)
const lb = useLeaderboard(ref<LeaderboardPeriod>('month'))
const busyId = ref<number | null>(null)
const bulk = ref(false)
const manualBusy = ref(false)
const manualResult = ref<ScanResult | null>(null)

/** Acțiunile publicate, întâi cele de azi / care urmează, apoi cele recente încheiate. */
const actions = computed(() => {
  const now = Date.now()
  const pub = city.actions.value.filter((a) => a.status === 'PUBLISHED' || a.status === 'DONE')
  const upcoming = pub.filter((a) => new Date(a.endAt).getTime() >= now - 864e5).sort((a, b) => a.startAt.localeCompare(b.startAt))
  const past = pub.filter((a) => !upcoming.includes(a)).sort((a, b) => b.startAt.localeCompare(a.startAt)).slice(0, 4)
  return [...upcoming, ...past]
})
const current = computed(() => city.actions.value.find((a) => a.id === selected.value))
const visible = computed(() => regs.items.value.filter((r) => r.status !== 'CANCELLED'))

onMounted(async () => {
  await city.loadActions()
  lb.load()
  const q = Number(route.query.a)
  selected.value = actions.value.some((a) => a.id === q) ? q : actions.value[0]?.id ?? null
})
watch(selected, (id) => { if (id && Number(route.query.a) !== id) router.replace({ query: { ...route.query, a: id } }) })

async function confirm(r: RegistrationDto) {
  busyId.value = r.id
  const res = await city.confirm(r.id)
  busyId.value = null
  if (res) { regs.replace(res); ui.toast(t('community.scan.okTitle', { name: res.user?.displayName ?? '', n: res.pointsAwarded }), 'success'); lb.load() }
}

async function reject(r: RegistrationDto) {
  busyId.value = r.id
  const res = await city.reject(r.id)
  busyId.value = null
  if (res) { regs.replace(res); ui.toast(t('community.validate.rejected', { name: r.user?.displayName ?? '' })) }
}

async function confirmAll() {
  const pending = regs.items.value.filter((r) => r.status === 'REGISTERED')
  if (!pending.length || !window.confirm(t('community.validate.confirmAllAsk', { n: pending.length }))) return
  bulk.value = true
  let ok = 0
  for (const r of pending) {
    const res = await city.confirm(r.id)
    if (res) { regs.replace(res); ok++ }
  }
  bulk.value = false
  ui.toast(t('community.validate.confirmedMany', { n: ok }), 'success')
  lb.load()
}

async function manual(code: string) {
  manualBusy.value = true
  manualResult.value = await city.confirmCode(code)
  manualBusy.value = false
  const r = manualResult.value
  if (r.kind !== 'error') {
    if (r.result.actionId === selected.value) regs.replace(r.result)
    lb.load()
  }
}

const tone: Record<string, string> = { REGISTERED: 'bg-warn-soft text-warn', CONFIRMED: 'bg-ok-soft text-ok', NO_SHOW: 'bg-bad-soft text-bad' }
const initials = (name?: string) => (name ?? '?').split(' ').map((s) => s.charAt(0)).join('').slice(0, 2).toUpperCase()
</script>

<template>
  <PanelHeader :title="t('community.validate.title')" :subtitle="current ? `${current.title} · ${f.dateTime(current.startAt, false)} · ${f.timeRange(current.startAt, current.endAt)} · ${current.locationName}` : undefined" />

  <Skeleton v-if="city.loading.value" :rows="3" :height="96" />
  <EmptyState v-else-if="!actions.length" icon="event_busy" :title="t('community.home.empty')" :action="t('community.dashboard.newAction')" @action="router.push('/w/city/actions/new')" />
  <template v-else>
    <div class="flex flex-wrap gap-2 mb-4">
      <AppChip v-for="a in actions" :key="a.id" :active="a.id === selected" @click="selected = a.id">{{ t(`community.categoryIcon.${a.category}`) }} {{ a.title.split(' ').slice(0, 3).join(' ') }}</AppChip>
    </div>

    <div v-if="current" class="grid gap-3 grid-cols-2 xl:grid-cols-4">
      <KpiCard icon="group" :label="t('community.validate.kpiRegistered')" :value="`${current.registeredCount} / ${current.capacity}`" />
      <KpiCard icon="check_circle" tone="#2F7D32" :label="t('community.validate.kpiConfirmed')" :value="regs.counts.value.confirmed" :hint="t('community.validate.kpiAwarded', { n: regs.counts.value.confirmed * current.pointsReward })" />
      <KpiCard icon="hourglass_top" tone="#8A5A00" :label="t('community.validate.kpiPending')" :value="regs.counts.value.registered" />
      <KpiCard icon="block" tone="#B3261E" :label="t('community.validate.kpiNoShow')" :value="regs.counts.value.noShow" />
    </div>

    <div class="grid gap-5 mt-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div class="bg-white rounded-[16px] border border-line min-w-0">
        <div class="flex flex-wrap items-center gap-2 p-3 border-b border-line">
          <b class="text-[13.5px]">{{ t('community.validate.listTitle') }}</b>
          <span class="text-muted text-[12.5px]">{{ t('community.validate.once') }}</span>
          <AppButton size="sm" icon="done_all" class="ml-auto !bg-green" :loading="bulk" :disabled="!regs.counts.value.registered" @click="confirmAll">{{ t('community.validate.confirmAll') }}</AppButton>
        </div>
        <Skeleton v-if="regs.loading.value" :rows="4" :height="52" class="p-3" />
        <EmptyState v-else-if="!visible.length" icon="group" :title="t('community.validate.empty')" />
        <div v-else class="overflow-x-auto">
          <table class="w-full text-[14px] border-collapse min-w-[640px]">
            <thead>
              <tr class="text-left text-muted text-[12.5px]">
                <th class="px-3 py-2.5 font-semibold">{{ t('community.validate.colWho') }}</th>
                <th class="px-3 py-2.5 font-semibold">{{ t('community.validate.colCode') }}</th>
                <th class="px-3 py-2.5 font-semibold">{{ t('community.validate.colAt') }}</th>
                <th class="px-3 py-2.5 font-semibold">{{ t('community.validate.colStatus') }}</th>
                <th class="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in visible" :key="r.id" class="border-t border-line">
                <td class="px-3 py-2.5"><div class="flex items-center gap-2.5"><span class="w-8 h-8 rounded-full bg-soft text-[12px] font-bold flex items-center justify-center shrink-0">{{ initials(r.user?.displayName) }}</span><b>{{ r.user?.displayName }}</b></div></td>
                <td class="px-3 py-2.5 whitespace-nowrap"><code class="text-[12.5px]">{{ r.code }}</code></td>
                <td class="px-3 py-2.5 whitespace-nowrap text-muted">{{ f.dateTime(r.registeredAt, false) }}</td>
                <td class="px-3 py-2.5">
                  <span class="rounded-full text-[12px] font-semibold px-2.5 py-0.5 whitespace-nowrap" :class="tone[r.status]">
                    {{ r.status === 'CONFIRMED' ? t('community.validate.confirmedPts', { n: r.pointsReward }) : t(`community.status.${r.status}`) }}
                  </span>
                  <div v-if="r.confirmedBy && r.confirmedAt" class="text-muted text-[12px] mt-0.5">{{ t('community.validate.by', { name: r.confirmedBy, at: f.timeRange(r.confirmedAt) }) }}</div>
                </td>
                <td class="px-3 py-2.5">
                  <div v-if="r.status === 'REGISTERED'" class="flex justify-end gap-1.5">
                    <AppButton size="sm" variant="ghost" :disabled="busyId === r.id || bulk" @click="reject(r)">{{ t('community.validate.reject') }}</AppButton>
                    <AppButton size="sm" icon="check" class="!bg-green" :loading="busyId === r.id" :disabled="bulk" @click="confirm(r)">{{ t('community.scan.confirm') }}</AppButton>
                  </div>
                  <div v-else-if="r.status === 'NO_SHOW'" class="flex justify-end">
                    <AppButton size="sm" variant="ghost" :loading="busyId === r.id" @click="confirm(r)">{{ t('community.validate.confirmAnyway') }}</AppButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-col gap-3.5">
        <div class="bg-white rounded-[16px] border border-line p-4">
          <b class="text-[15px]">{{ t('community.validate.scannersTitle') }}</b>
          <p class="text-muted text-[12.5px] m-0 mt-1">{{ t('community.validate.scannersHint') }}</p>
          <div class="flex items-center gap-2 mt-3 text-[13px] rounded-[12px] bg-soft p-3"><AppIcon name="smartphone" :size="20" />{{ t('community.validate.fieldApp') }}</div>
          <ManualCodeForm class="mt-3" :loading="manualBusy" :label="t('community.validate.manualLabel')" @submit="manual" />
          <ScanResultCard v-if="manualResult" :result="manualResult" class="mt-3" />
        </div>
        <div class="bg-white rounded-[16px] border border-line p-4">
          <div class="flex items-center justify-between"><b class="text-[15px]">{{ t('community.web.boardMonth') }}</b><router-link to="/w/city/leaderboard" class="text-[13px] text-muted no-underline">{{ t('community.dashboard.all') }}</router-link></div>
          <Skeleton v-if="lb.loading.value" :rows="3" :height="32" />
          <LeaderboardRows v-else-if="lb.board.value" :board="lb.board.value" :limit="5" />
        </div>
      </div>
    </div>
  </template>
</template>
