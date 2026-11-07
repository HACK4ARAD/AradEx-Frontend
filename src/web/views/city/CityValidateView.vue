<script setup lang="ts">
// T11 · Validare participanți — design/final web `#/city/validate`: acțiunea aleasă (segmente), 4 KPI, tabelul înscrișilor cu
// Confirmă / Respinge / Confirmă toți, „Voluntarii care scanează” cu confirmarea manuală după cod, „Clasament · luna”.
// Scanarea QR NU se face din web (doar din aplicație: Primăria pe /m/panel, voluntarii în T18).
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import ScanResultCard from '@/shared/components/community/ScanResultCard.vue'
import PanelKpi from '@/web/components/community/PanelKpi.vue'
import * as P from '@/web/components/community/panel'
import { useFormat } from '@/shared/composables/useFormat'
import { initials, useActionRegistrations, useCityCommunity, useLeaderboard, type ScanResult } from '@/shared/composables/useCommunity'
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
const code = ref('')
const manualBusy = ref(false)
const manualResult = ref<ScanResult | null>(null)

/** Acțiunile publicate, întâi cele de azi / care urmează, apoi ultimele încheiate. */
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

/** Ține contorul „Înscriși” la zi fără reîncărcare: o respingere eliberează locul, confirmarea unui NO_SHOW îl ia înapoi. */
function adjustRegistered(actionId: number, delta: number) {
  city.actions.value = city.actions.value.map((a) => (a.id === actionId ? { ...a, registeredCount: Math.max(0, a.registeredCount + delta) } : a))
}

async function confirm(r: RegistrationDto) {
  busyId.value = r.id
  const res = await city.confirm(r.id)
  busyId.value = null
  if (res) {
    if (r.status === 'NO_SHOW' && !res.alreadyConfirmed) adjustRegistered(r.actionId, 1)
    regs.replace(res)
    ui.toast(t('community.scan.okTitle', { name: res.user?.displayName ?? '', n: res.pointsAwarded }), 'success')
    lb.load()
  }
}

async function reject(r: RegistrationDto) {
  busyId.value = r.id
  const res = await city.reject(r.id)
  busyId.value = null
  if (res) {
    if (r.status === 'REGISTERED') adjustRegistered(r.actionId, -1)
    regs.replace(res)
    ui.toast(t('community.validate.rejected', { name: r.user?.displayName ?? '' }))
  }
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

async function manual() {
  if (!code.value.trim()) return
  manualBusy.value = true
  manualResult.value = await city.confirmCode(code.value)
  manualBusy.value = false
  const r = manualResult.value
  if (r.kind !== 'error') {
    code.value = ''
    if (r.result.actionId === selected.value) regs.replace(r.result)
    lb.load()
  }
}
</script>

<template>
  <div :class="P.HEAD">
    <div class="min-w-0">
      <h1 :class="P.H1">{{ t('community.validate.title') }}</h1>
      <div v-if="current" :class="P.SUB">{{ current.title }} · {{ f.dateTime(current.startAt, false) }} · {{ f.timeRange(current.startAt, current.endAt) }} · {{ current.locationName }}</div>
    </div>
    <div v-if="actions.length" :class="P.SEG">
      <button v-for="a in actions" :key="a.id" type="button" :class="P.segBtn(a.id === selected)" @click="selected = a.id">
        {{ t(`community.categoryIcon.${a.category}`) }} {{ a.title.split(' ').slice(0, 2).join(' ') }}
      </button>
    </div>
  </div>

  <Skeleton v-if="city.loading.value" :rows="3" :height="96" />
  <div v-else-if="!actions.length" :class="[P.CARD, P.EMPTY]">
    <AppIcon name="event_busy" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.home.empty') }}</b>
    <div class="mt-3"><router-link to="/city/actions/new" :class="P.BTN_SM">{{ t('community.dashboard.newAction') }}</router-link></div>
  </div>
  <template v-else>
    <div v-if="current" class="grid gap-3.5 mb-4 grid-cols-2 xl:grid-cols-4">
      <PanelKpi icon="group" :label="t('community.validate.kpiRegistered')" :value="`${current.registeredCount} / ${current.capacity}`" />
      <PanelKpi icon="check_circle" tone="#2F7D32" :label="t('community.validate.kpiConfirmed')" :value="regs.counts.value.confirmed" :delta="regs.counts.value.confirmed ? t('community.validate.kpiAwarded', { n: regs.counts.value.confirmed * current.pointsReward }) : undefined" />
      <PanelKpi icon="hourglass_top" tone="#8A5A00" :label="t('community.validate.kpiPending')" :value="regs.counts.value.registered" />
      <PanelKpi icon="block" tone="#B3261E" :label="t('community.validate.kpiNoShow')" :value="regs.counts.value.noShow" />
    </div>

    <div class="grid gap-3.5 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div :class="P.CARD_FLUSH">
        <div :class="P.TOOLBAR">
          <b class="text-[13.5px]">{{ t('community.validate.listTitle') }}</b>
          <span :class="P.COUNT">{{ t('community.validate.once') }}</span>
          <button type="button" :class="P.BTN_SM_OK" :disabled="bulk || !regs.counts.value.registered" @click="confirmAll"><AppIcon name="done_all" :size="16" />{{ t('community.validate.confirmAll') }}</button>
        </div>
        <Skeleton v-if="regs.loading.value" :rows="4" :height="52" class="p-3.5" />
        <div v-else-if="!visible.length" :class="P.EMPTY">
          <AppIcon name="group" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.validate.empty') }}</b>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse min-w-[560px]">
            <thead><tr>
              <th v-for="c in ['who', 'code', 'at', 'status']" :key="c" :class="[P.TH, c === 'at' && 'hidden 2xl:table-cell']">{{ t(`community.validate.cols.${c}`) }}</th>
              <th :class="P.TH" />
            </tr></thead>
            <tbody>
              <tr v-for="r in visible" :key="r.id" :class="P.TR">
                <td :class="P.TD"><div class="flex items-center gap-3"><span :class="P.AVATAR">{{ initials(r.user?.displayName) }}</span><span :class="[P.TT, 'whitespace-nowrap']">{{ r.user?.displayName }}</span></div></td>
                <td :class="P.TD"><code :class="P.CODE">{{ r.code }}</code></td>
                <!-- „Înscris” doar pe ecrane late; la 1280–1440 px tabelul ar ieși din card -->
                <td :class="[P.TD, 'whitespace-nowrap hidden 2xl:table-cell']">{{ f.dateTime(r.registeredAt, false) }}</td>
                <td :class="P.TD">
                  <span :class="[P.PILL, P.PILL_TONE[r.status]]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ r.status === 'CONFIRMED' ? t('community.validate.confirmedPts', { n: r.pointsReward }) : t(`community.status.${r.status}`) }}</span>
                  <div v-if="r.confirmedBy && r.confirmedAt" :class="P.TS">{{ t('community.validate.by', { name: r.confirmedBy, at: f.timeRange(r.confirmedAt) }) }}</div>
                </td>
                <td :class="P.TD"><div class="flex gap-1.5 justify-end">
                  <template v-if="r.status === 'REGISTERED'">
                    <button type="button" :class="P.BTN_SM_SEC" :disabled="busyId === r.id || bulk" @click="reject(r)">{{ t('community.validate.reject') }}</button>
                    <button type="button" :class="P.BTN_SM_OK" :disabled="busyId === r.id || bulk" @click="confirm(r)"><AppIcon name="check" :size="16" />{{ t('community.scan.confirm') }}</button>
                  </template>
                  <button v-else-if="r.status === 'NO_SHOW'" type="button" :class="P.BTN_SM_SEC" :disabled="busyId === r.id" @click="confirm(r)">{{ t('community.validate.confirmAnyway') }}</button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-col gap-3.5">
        <div :class="P.CARD">
          <div :class="P.CH"><div><h2 :class="P.CH_TITLE">{{ t('community.validate.scannersTitle') }}</h2><div :class="P.HINT">{{ t('community.validate.scannersHint') }}</div></div></div>
          <div class="flex items-start gap-2.5 text-[13px] text-muted rounded-[10px] bg-soft p-3"><AppIcon name="smartphone" :size="18" class="shrink-0" />{{ t('community.validate.fieldApp') }}</div>
          <form class="flex gap-2 mt-2.5" @submit.prevent="manual">
            <input v-model="code" :class="P.INPUT" :placeholder="t('community.validate.manualPh')" autocomplete="off" :aria-label="t('community.validate.manualLabel')">
            <button type="submit" :class="P.BTN" :disabled="manualBusy || !code.trim()">{{ t('community.scan.confirm') }}</button>
          </form>
          <ScanResultCard v-if="manualResult" :result="manualResult" class="mt-2.5" />
        </div>
        <div :class="P.CARD">
          <div :class="[P.CH, 'items-center']"><h2 :class="P.CH_TITLE">{{ t('community.web.boardMonth') }}</h2><router-link to="/city/leaderboard" :class="P.BTN_SM_SEC">{{ t('community.validate.all') }}</router-link></div>
          <Skeleton v-if="lb.loading.value" :rows="3" :height="32" />
          <div v-else-if="!lb.board.value" :class="P.EMPTY">
            <b class="text-ink">{{ t('community.leaderboard.loadError') }}</b>
            <div class="mt-3"><button type="button" :class="P.BTN_SM_SEC" @click="lb.load">{{ t('common.retry') }}</button></div>
          </div>
          <template v-else>
            <div v-for="e in lb.board.value.entries.slice(0, 5)" :key="e.userId" :class="P.LROW">
              <span class="w-[22px] text-muted font-semibold">{{ e.rank }}</span><span class="flex-1 min-w-0 truncate">{{ e.displayName }}</span><b>{{ e.points }}</b>
            </div>
          </template>
        </div>
      </div>
    </div>
  </template>
</template>
