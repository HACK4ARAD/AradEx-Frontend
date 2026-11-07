<script setup lang="ts">
// T14 · Administrare › Utilizatori — design/final web `#/admin/users`: rezumatul pe roluri, filtre pe rol, căutare, tabel paginat
// (Utilizator, Rol, Puncte, Bilete, Înregistrat) și „Detalii” = sheet cu rol, ajustare de puncte cu notă, dezactivare
// (`GET/PATCH /admin/users`). Coloana „Ultima activitate” din design nu există în API.
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet, Skeleton } from '@/shared/components'
import * as P from '@/web/components/community/panel'
import { intlLocale, useFormat } from '@/shared/composables/useFormat'
import { ASSIGNABLE_ROLES, canChangeRole, parsePointsAdjust, totalUsers, useAdminStats, useAdminUsers } from '@/shared/composables/useAdmin'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { Role } from '@/shared/types/common'
import type { AdminUserDto, AdminUserUpdate } from '@/shared/types/admin'

const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const auth = useAuthStore()
const users = useAdminUsers()
const { stats, load: loadStats } = useAdminStats()
const SIZE = 20
const role = ref<Role | ''>('')
const q = ref('')
const page = ref(0)
const ROLES: (Role | '')[] = ['', 'VISITOR', 'LOCAL', 'BUSINESS', 'VOLUNTEER', 'CITY_HALL', 'ADMIN']

function load() { users.load({ role: role.value || undefined, q: q.value.trim() || undefined, page: page.value, size: SIZE }) }
let timer: number | undefined
watch(q, () => { window.clearTimeout(timer); timer = window.setTimeout(() => { page.value = 0; load() }, 300) })
watch(role, () => { page.value = 0; load() })
watch(page, load)
onMounted(() => { load(); loadStats() })

const pages = computed(() => Math.max(1, Math.ceil(users.total.value / SIZE)))
const nf = (n: number) => new Intl.NumberFormat(intlLocale()).format(n)
const summary = computed(() => {
  const s = stats.value
  if (!s) return ''
  const r = s.usersByRole
  return t('admin.users.sub', { n: nf(totalUsers(s)), visitors: nf(r.VISITOR ?? 0), locals: nf(r.LOCAL ?? 0), firms: nf(r.BUSINESS ?? 0), city: nf(r.CITY_HALL ?? 0), volunteers: nf(r.VOLUNTEER ?? 0), admins: nf(r.ADMIN ?? 0) })
})
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')
const contact = (u: AdminUserDto) => u.email ?? u.phone ?? '—'

/* ---- detalii ---- */
const editing = ref<AdminUserDto | null>(null)
const open = computed({ get: () => !!editing.value, set: (v) => { if (!v) editing.value = null } })
const form = reactive({ role: 'LOCAL' as Role, points: '', note: '', disabled: false })
const pointsErr = ref(false)
const isMe = computed(() => editing.value?.id === auth.user?.id)

function details(u: AdminUserDto) {
  editing.value = u
  Object.assign(form, { role: u.role, points: '', note: '', disabled: u.disabled })
  pointsErr.value = false
}
async function save() {
  const u = editing.value
  if (!u) return
  const req: AdminUserUpdate = {}
  if (form.role !== u.role) req.role = form.role
  if (form.disabled !== u.disabled) req.disabled = form.disabled
  if (form.points.trim()) {
    const n = parsePointsAdjust(form.points)
    pointsErr.value = n === null
    if (n === null) return
    req.pointsAdjust = n
    if (form.note.trim()) req.note = form.note.trim()
  }
  if (!Object.keys(req).length) { ui.toast(t('admin.users.sheet.noChange')); return }
  const saved = await users.update(u.id, req)
  if (!saved) return
  ui.toast(t('admin.users.sheet.saved'), 'success')
  editing.value = null
  if (req.role) loadStats()
}
</script>

<template>
  <div :class="P.HEAD">
    <div><h1 :class="P.H1">{{ t('admin.users.title') }}</h1><div :class="P.SUB">{{ summary || ' ' }}</div></div>
  </div>

  <div :class="P.CARD_FLUSH">
    <div :class="P.TOOLBAR">
      <div :class="[P.SEG, 'max-w-full overflow-x-auto flex-nowrap']">
        <button v-for="r in ROLES" :key="r || 'all'" type="button" :class="P.segBtn(role === r)" @click="role = r">{{ t(`admin.users.filter.${r || 'all'}`) }}</button>
      </div>
      <div class="relative flex-1 min-w-[200px] max-w-[320px] ml-auto">
        <AppIcon name="search" :size="17" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input v-model="q" type="search" :class="[P.INPUT, '!h-[34px] pl-8 text-[13px]']" :placeholder="t('admin.users.search')" :aria-label="t('admin.users.search')">
      </div>
    </div>
    <Skeleton v-if="users.loading.value" :rows="6" :height="52" class="p-3.5" />
    <div v-else-if="!users.items.value.length" :class="P.EMPTY">
      <AppIcon name="person_search" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('admin.users.empty') }}</b>
    </div>
    <template v-else>
      <div class="md:hidden flex flex-col">
        <button v-for="u in users.items.value" :key="u.id" type="button" :class="[P.MROW, 'text-left flex items-center gap-3 w-full']" @click="details(u)">
          <span :class="P.AVATAR">{{ initials(u.displayName) }}</span>
          <div class="min-w-0 flex-1">
            <div :class="[P.TT, 'truncate']">{{ u.displayName }} <span v-if="u.disabled" :class="[P.PILL, 'bg-bad-soft text-bad !py-0']">{{ t('admin.users.disabled') }}</span></div>
            <div :class="[P.TS, 'truncate']">{{ t(`auth.role.${u.role}`) }} · {{ contact(u) }}</div>
            <div :class="P.TS">{{ f.points(u.pointsBalance) }} · {{ t('admin.users.sheet.tickets', { n: u.ticketsCount }) }}</div>
          </div>
          <AppIcon name="chevron_right" :size="18" class="text-muted" />
        </button>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full border-collapse min-w-[820px]">
          <thead><tr>
            <th v-for="c in ['user', 'role', 'points', 'tickets', 'registered']" :key="c" :class="P.TH">{{ t(`admin.users.cols.${c}`) }}</th>
            <th :class="P.TH" />
          </tr></thead>
          <tbody>
            <tr v-for="u in users.items.value" :key="u.id" :class="P.TR">
              <td :class="P.TD"><div class="flex items-center gap-3 min-w-0">
                <span :class="P.AVATAR">{{ initials(u.displayName) }}</span>
                <div class="min-w-0"><div :class="P.TT">{{ u.displayName }}</div><div :class="P.TS">{{ contact(u) }}</div></div>
              </div></td>
              <td :class="P.TD"><div class="flex flex-wrap gap-1">
                <span :class="[P.PILL, 'bg-soft text-muted']">{{ t(`auth.role.${u.role}`) }}</span>
                <span v-if="u.business" :class="[P.PILL, u.business.verified ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn']">{{ t(u.business.verified ? 'admin.users.verified' : 'admin.users.unverified') }}</span>
                <span v-if="u.disabled" :class="[P.PILL, 'bg-bad-soft text-bad']">{{ t('admin.users.disabled') }}</span>
              </div></td>
              <td :class="P.TD">{{ u.role === 'LOCAL' || u.role === 'VISITOR' || u.pointsBalance ? nf(u.pointsBalance) : '—' }}</td>
              <td :class="P.TD">{{ u.ticketsCount || '—' }}</td>
              <td :class="[P.TD, 'whitespace-nowrap']">{{ f.dateTime(u.createdAt, false) }}</td>
              <td :class="[P.TD, 'text-right']"><button type="button" :class="P.BTN_SM_SEC" @click="details(u)">{{ t('admin.users.details') }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-center gap-2 px-3.5 py-2.5 border-t border-line">
        <button type="button" :class="P.BTN_SM_SEC" :disabled="page === 0" :aria-label="t('admin.users.prev')" @click="page--"><AppIcon name="chevron_left" :size="16" /></button>
        <span :class="P.TS">{{ t('admin.users.page', { p: page + 1, n: pages }) }}</span>
        <button type="button" :class="P.BTN_SM_SEC" :disabled="page + 1 >= pages" :aria-label="t('admin.users.next')" @click="page++"><AppIcon name="chevron_right" :size="16" /></button>
      </div>
    </template>
  </div>
  <div :class="[P.TS, 'mt-2.5']">{{ t('admin.users.footnote') }}</div>

  <AppSheet v-model:open="open" :title="editing?.displayName">
    <div v-if="editing" class="flex flex-col gap-4">
      <div :class="P.TS">{{ contact(editing) }} · {{ t('admin.users.sheet.since', { date: f.dateTime(editing.createdAt, false) }) }} · {{ t('admin.users.sheet.tickets', { n: editing.ticketsCount }) }}</div>
      <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.users.sheet.role') }}</span>
        <select v-if="canChangeRole(editing, auth.user?.id)" v-model="form.role" :class="P.INPUT">
          <option v-for="r in ASSIGNABLE_ROLES" :key="r" :value="r">{{ t(`auth.role.${r}`) }}</option>
        </select>
        <template v-else><input :class="[P.INPUT, 'bg-soft']" :value="t(`auth.role.${editing.role}`)" disabled><span :class="P.TS">{{ t('admin.users.sheet.roleLocked') }}</span></template>
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] gap-3">
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.users.sheet.points') }}</span>
          <input v-model="form.points" inputmode="numeric" :class="[P.INPUT, pointsErr ? '!border-accent' : '']" :placeholder="t('admin.users.sheet.pointsPh')"></label>
        <label class="flex flex-col gap-1.5"><span :class="P.LABEL">{{ t('admin.users.sheet.note') }}</span>
          <input v-model="form.note" :class="P.INPUT" :placeholder="t('admin.users.sheet.notePh')" maxlength="200"></label>
      </div>
      <div :class="[P.TS, '-mt-2']">
        <span v-if="pointsErr" class="text-accent">{{ t('admin.users.sheet.errPoints') }}</span>
        <template v-else>{{ t('admin.users.sheet.balance', { n: nf(editing.pointsBalance) }) }}</template>
      </div>
      <div class="flex flex-col gap-1.5">
        <span :class="P.LABEL">{{ t('admin.users.sheet.account') }}</span>
        <label class="inline-flex items-center gap-2 text-[14px]" :class="isMe ? 'opacity-50' : ''">
          <input v-model="form.disabled" type="checkbox" class="accent-bad w-4 h-4" :disabled="isMe">{{ t('admin.users.sheet.disabledLabel') }}</label>
        <span v-if="isMe" :class="P.TS">{{ t('admin.users.sheet.selfLock') }}</span>
      </div>
    </div>
    <template #footer>
      <button type="button" :class="[P.BTN, 'w-full']" :disabled="users.saving.value" @click="save">{{ t('admin.users.sheet.save') }}</button>
    </template>
  </AppSheet>
</template>
