<script setup lang="ts">
// T18 · Panou Primărie · Voluntari — design/final web `#/city/volunteers` (3 KPI, Toți / Activi / Suspendați, tabelul: voluntar,
// cod de acces, participă la, coordonator, scanări, stare + Acțiuni / suspendă; mesajele sunt doar între voluntari, în aplicație) și `#/city/volunteers/new` (formular +
// previzualizare pe telefon cu SMS-ul). Conturile le creează doar Primăria; codul de 6 cifre „pleacă prin SMS” (simulat).
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet, Skeleton } from '@/shared/components'
import PanelKpi from '@/web/components/community/PanelKpi.vue'
import ActionChecks from '@/web/components/volunteer/ActionChecks.vue'
import VolunteerForm from '@/web/components/volunteer/VolunteerForm.vue'
import * as P from '@/web/components/community/panel'
import { initials, useCityCommunity } from '@/shared/composables/useCommunity'
import { formatPhone, toCreate, useCityVolunteers, useCoordinators, type VolunteerForm as Form } from '@/shared/composables/useVolunteer'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { VolunteerDto } from '@/shared/types/volunteer'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const ui = useUiStore()
const auth = useAuthStore()
const vols = useCityVolunteers()
const city = useCityCommunity()
const coords = useCoordinators()
const filter = ref<'all' | 'active' | 'suspended'>('all')

const isNew = computed(() => route.params.sub === 'new')
const now = Date.now()
const titleOf = (id: number) => city.actions.value.find((a) => a.id === id)?.title ?? `#${id}`
/** Acțiunile la care se poate aloca: publicate și neîncheiate (cele mai apropiate întâi). */
const allocatable = computed(() => city.actions.value
  .filter((a) => a.status === 'PUBLISHED' && new Date(a.endAt).getTime() >= now)
  .sort((a, b) => a.startAt.localeCompare(b.startAt)))
const statusOf = (v: VolunteerDto) => (v.status === 'SUSPENDED' ? 'SUSPENDED' : v.expired ? 'EXPIRED' : 'ACTIVE')
const rows = computed(() => vols.items.value.filter((v) => filter.value === 'all' || (filter.value === 'active' ? statusOf(v) === 'ACTIVE' : v.status === 'SUSPENDED')))

const kpi = computed(() => {
  const active = vols.items.value.filter((v) => statusOf(v) === 'ACTIVE')
  const covered = allocatable.value.filter((a) => active.some((v) => v.actionIds.includes(a.id))).length
  return { active: active.length, scans: vols.items.value.reduce((s, v) => s + v.scans, 0), covered: `${covered}/${allocatable.value.length}` }
})
const PILL: Record<string, string> = { ACTIVE: 'bg-ok-soft text-ok', SUSPENDED: 'bg-bad-soft text-bad', EXPIRED: 'bg-soft text-muted' }

onMounted(() => { void vols.load(); void city.loadActions(); void coords.load() })
watch(isNew, () => window.scrollTo(0, 0))

async function create(form: Form) {
  const v = await vols.create(toCreate(form))
  if (!v) return
  ui.toast(t('volunteer.form.created', { code: v.loginCode }), 'success', undefined, 8000)
  router.push('/city/volunteers')
}

// alocarea pe acțiuni (design: drawer „{nume} · acțiuni alocate”)
const editing = ref<VolunteerDto | null>(null)
const picked = ref<number[]>([])
const sheet = computed({ get: () => !!editing.value, set: (v: boolean) => { if (!v) editing.value = null } })
/** În sheet: acțiunile alocabile + cele deja alocate care s-au încheiat între timp (ca să nu dispară la salvare). */
const sheetActions = computed(() => {
  const ids = new Set(allocatable.value.map((a) => a.id))
  const extra = city.actions.value.filter((a) => !ids.has(a.id) && editing.value?.actionIds.includes(a.id))
  return [...allocatable.value, ...extra]
})
function editActions(v: VolunteerDto) { editing.value = v; picked.value = [...v.actionIds] }
async function saveActions() {
  if (!editing.value) return
  if (await vols.update(editing.value.id, { actionIds: picked.value })) { ui.toast(t('volunteer.panel.saved'), 'success'); editing.value = null }
}
async function toggle(v: VolunteerDto) {
  const suspend = v.status === 'ACTIVE'
  if (suspend && !window.confirm(t('volunteer.panel.suspendAsk', { name: v.name }))) return
  if (await vols.update(v.id, { status: suspend ? 'SUSPENDED' : 'ACTIVE' })) ui.toast(t(suspend ? 'volunteer.panel.suspended' : 'volunteer.panel.reactivated'))
}
</script>

<template>
  <!-- ======== Voluntar nou ======== -->
  <template v-if="isNew">
    <div :class="P.HEAD"><div><h1 :class="P.H1">{{ t('volunteer.form.title') }}</h1><div :class="P.SUB">{{ t('volunteer.form.subtitle') }}</div></div></div>
    <Skeleton v-if="city.loading.value && !city.actions.value.length" :rows="3" :height="96" />
    <VolunteerForm v-else :key="coords.items.value.length" :actions="allocatable" :coordinators="coords.items.value"
      :default-coordinator="auth.user?.role === 'CITY_HALL' ? auth.user.id : undefined" :saving="vols.saving.value"
      @submit="create" @cancel="router.push('/city/volunteers')" />
  </template>

  <!-- ======== listă ======== -->
  <template v-else>
    <div :class="P.HEAD">
      <div><h1 :class="P.H1">{{ t('volunteer.panel.title') }}</h1><div :class="P.SUB">{{ t('volunteer.panel.subtitle') }}</div></div>
      <router-link to="/city/volunteers/new" :class="P.BTN" data-test="add-volunteer"><AppIcon name="person_add" :size="16" />{{ t('volunteer.panel.add') }}</router-link>
    </div>

    <div class="grid gap-3.5 mb-4 grid-cols-1 sm:grid-cols-3">
      <PanelKpi icon="badge" :label="t('volunteer.panel.kpiActive')" :value="kpi.active" />
      <PanelKpi icon="qr_code_scanner" tone="#2F7D32" :label="t('volunteer.panel.kpiScans')" :value="kpi.scans" />
      <PanelKpi icon="task_alt" tone="#FF5A36" :label="t('volunteer.panel.kpiCovered')" :value="kpi.covered" :hint="t('volunteer.panel.kpiCoveredHint')" />
    </div>

    <div :class="P.CARD_FLUSH">
      <div :class="P.TOOLBAR">
        <div :class="P.SEG">
          <button v-for="k in (['all', 'active', 'suspended'] as const)" :key="k" type="button" :class="P.segBtn(filter === k)" @click="filter = k">{{ t(`volunteer.panel.filters.${k}`) }}</button>
        </div>
        <span :class="P.COUNT">{{ t('volunteer.panel.count', { n: rows.length }, rows.length) }}</span>
      </div>
      <Skeleton v-if="vols.loading.value && !vols.items.value.length" :rows="3" :height="56" class="p-3.5" />
      <div v-else-if="!rows.length" :class="P.EMPTY">
        <AppIcon name="badge" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" />
        <b class="text-ink">{{ vols.items.value.length ? t('volunteer.panel.emptyFilter') : t('volunteer.panel.empty') }}</b>
        <p v-if="!vols.items.value.length" class="text-[13px] mt-1.5 mb-3">{{ t('volunteer.panel.emptyText') }}</p>
        <router-link v-if="!vols.items.value.length" to="/city/volunteers/new" :class="P.BTN_SM"><AppIcon name="person_add" :size="16" />{{ t('volunteer.panel.add') }}</router-link>
      </div>
      <template v-else>
        <!-- telefon: câte un card pe voluntar -->
        <div class="md:hidden flex flex-col">
          <div v-for="v in rows" :key="v.id" :class="P.MROW">
            <div class="flex items-center gap-3">
              <span class="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bold text-[12.5px] shrink-0">{{ initials(v.name) }}</span>
              <div class="min-w-0 flex-1"><div :class="P.TT">{{ v.name }}</div><div :class="P.TS">{{ formatPhone(v.phone) }}<template v-if="v.oneTime"> · {{ t('volunteer.panel.oneTime') }}</template></div></div>
              <span :class="[P.PILL, PILL[statusOf(v)]]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`volunteer.panel.status.${statusOf(v)}`) }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5 mt-2 text-[12.5px] text-muted">
              <code :class="P.CODE">{{ v.loginCode }}</code> · {{ v.coordinatorName }} · {{ t('volunteer.panel.cols.scans') }}: {{ v.scans }}
            </div>
            <div class="flex flex-wrap gap-1 mt-2">
              <span v-for="id in v.actionIds" :key="id" class="h-6 px-2 rounded-full border border-line text-[11.5px] inline-flex items-center max-w-full truncate">{{ titleOf(id) }}</span>
            </div>
            <div class="flex gap-1.5 mt-2.5">
              <button type="button" :class="[P.BTN_SM_SEC, 'flex-1']" @click="editActions(v)"><AppIcon name="edit" :size="15" />{{ t('volunteer.panel.editActions') }}</button>
              <button type="button" :class="P.BTN_SM_SEC" :title="t(v.status === 'ACTIVE' ? 'volunteer.panel.suspend' : 'volunteer.panel.reactivate')" @click="toggle(v)">
                <AppIcon :name="v.status === 'ACTIVE' ? 'pause_circle' : 'play_circle'" :size="16" /></button>
            </div>
          </div>
        </div>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full border-collapse min-w-[900px]">
            <thead><tr>
              <th v-for="c in ['who', 'code', 'actions', 'coordinator', 'scans', 'status']" :key="c" :class="P.TH">{{ t(`volunteer.panel.cols.${c}`) }}</th>
              <th :class="P.TH" />
            </tr></thead>
            <tbody>
              <tr v-for="v in rows" :key="v.id" :class="P.TR" data-test="volunteer-row">
                <td :class="P.TD"><div class="flex items-center gap-3">
                  <span class="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center font-bold text-[12.5px] shrink-0">{{ initials(v.name) }}</span>
                  <div class="min-w-0"><div :class="[P.TT, 'whitespace-nowrap']">{{ v.name }}</div><div :class="P.TS">{{ formatPhone(v.phone) }}<template v-if="v.oneTime"> · {{ t('volunteer.panel.oneTime') }}</template></div></div>
                </div></td>
                <td :class="P.TD"><code :class="P.CODE">{{ v.loginCode }}</code></td>
                <td :class="[P.TD, 'max-w-[260px]']">
                  <div v-for="id in v.actionIds" :key="id" class="h-6 my-0.5 px-2 rounded-full border border-line text-[11.5px] flex items-center w-fit max-w-[240px]"><span class="truncate">{{ titleOf(id) }}</span></div>
                  <span v-if="!v.actionIds.length" class="text-muted text-[12.5px]">{{ t('volunteer.panel.noActions') }}</span>
                </td>
                <td :class="[P.TD, 'whitespace-nowrap']">{{ v.coordinatorName }}</td>
                <td :class="P.TD">{{ v.scans }}</td>
                <td :class="P.TD"><span :class="[P.PILL, PILL[statusOf(v)]]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`volunteer.panel.status.${statusOf(v)}`) }}</span></td>
                <td :class="P.TD"><div class="flex gap-1.5 justify-end">
                  <button type="button" :class="P.BTN_SM_SEC" data-test="edit-actions" @click="editActions(v)"><AppIcon name="edit" :size="15" />{{ t('volunteer.panel.editActions') }}</button>
                  <button type="button" :class="P.BTN_SM_SEC" :title="t(v.status === 'ACTIVE' ? 'volunteer.panel.suspend' : 'volunteer.panel.reactivate')"
                    :aria-label="t(v.status === 'ACTIVE' ? 'volunteer.panel.suspend' : 'volunteer.panel.reactivate')" data-test="toggle-status" @click="toggle(v)">
                    <AppIcon :name="v.status === 'ACTIVE' ? 'pause_circle' : 'play_circle'" :size="16" /></button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <AppSheet v-model:open="sheet" wide :title="editing ? t('volunteer.panel.drawerTitle', { name: editing.name }) : ''">
      <p class="text-muted text-[13.5px] mt-0 mb-3.5">{{ t('volunteer.panel.drawerSub') }}</p>
      <ActionChecks v-model="picked" :actions="sheetActions" />
      <button type="button" :class="[P.BTN, 'w-full mt-4']" :disabled="vols.saving.value" data-test="save-actions" @click="saveActions">{{ t('volunteer.panel.save') }}</button>
    </AppSheet>
  </template>
</template>
