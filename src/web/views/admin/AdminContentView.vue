<script setup lang="ts">
// T14 · Administrare › Conținut & moderare — design/final web `#/admin/content`: tab-uri Evenimente / Oferte / Acțiuni, căutare,
// tabel (Element, Organizator, Când, Participă sau Folosite / afișări, Stare) cu Publică / Ascunde
// (`GET /admin/{kind}`, `PATCH /admin/{kind}/{id}/status`). Implicit doar ce nu s-a încheiat; „Și cele încheiate” arată tot.
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import * as P from '@/web/components/community/panel'
import { STATUS_TONE } from '@/web/components/admin/tones'
import { useFormat } from '@/shared/composables/useFormat'
import { nextStatus, useAdminContent } from '@/shared/composables/useAdmin'
import { useUiStore } from '@/shared/stores/ui'
import type { AdminContentDto, ContentKind } from '@/shared/types/admin'

const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const c = useAdminContent()
const kind = ref<ContentKind>('events')
const status = ref('')
const q = ref('')
const all = ref(false)

const STATUSES: Record<ContentKind, string[]> = {
  events: ['PUBLISHED', 'DRAFT', 'HIDDEN'], offers: ['PUBLISHED', 'DRAFT', 'HIDDEN'], actions: ['PUBLISHED', 'DRAFT', 'CANCELLED', 'DONE'],
}
const ICON: Record<ContentKind, string> = { events: 'event', offers: 'sell', actions: 'volunteer_activism' }

function load() {
  c.load(kind.value, { status: status.value || undefined, q: q.value.trim() || undefined, all: kind.value === 'offers' ? undefined : all.value, size: 100 })
}
let timer: number | undefined
watch(q, () => { window.clearTimeout(timer); timer = window.setTimeout(load, 300) })
watch([kind, all], () => { if (!STATUSES[kind.value].includes(status.value)) status.value = ''; load() })
watch(status, load)
onMounted(load)

const category = (x: AdminContentDto) =>
  kind.value === 'events' ? t(`events.category.${x.category}`) : kind.value === 'offers' ? t(`offers.cats.${x.category}`) : t(`community.category.${x.category}`)

function when(x: AdminContentDto) {
  if (kind.value === 'offers') {
    if (x.validUntil) return t('admin.content.until', { date: f.dateTime(`${x.validUntil}T12:00:00Z`, false) })
    return x.validFrom ? t('admin.content.from', { date: f.dateTime(`${x.validFrom}T12:00:00Z`, false) }) : '—'
  }
  return x.startAt ? `${f.dateTime(x.startAt, false)} · ${f.timeRange(x.startAt, x.endAt)}` : '—'
}
const metric = (x: AdminContentDto) =>
  kind.value === 'offers' ? `${x.used ?? 0} / ${x.views ?? 0}` : x.capacity ? `${x.participants ?? 0}/${x.capacity}` : String(x.participants ?? 0)

const actionLabel = (next: string) => (next === 'PUBLISHED' ? t('admin.content.publish') : next === 'HIDDEN' ? t('admin.content.hide') : t('admin.content.unpublish'))
async function toggle(x: AdminContentDto) {
  const next = nextStatus(kind.value, x.status)
  if (!next) return
  if (await c.setStatus(kind.value, x.id, next)) ui.toast(t(`admin.content.toast.${next}`), next === 'PUBLISHED' ? 'success' : 'info')
}
const metricCol = computed(() => (kind.value === 'offers' ? 'usedViews' : 'participants'))
</script>

<template>
  <div :class="P.HEAD">
    <div class="max-w-[720px]"><h1 :class="P.H1">{{ t('admin.content.title') }}</h1><div :class="P.SUB">{{ t('admin.content.sub') }}</div></div>
  </div>

  <div :class="P.CARD_FLUSH">
    <div :class="P.TOOLBAR">
      <div :class="P.SEG">
        <button v-for="k in (['events', 'offers', 'actions'] as const)" :key="k" type="button" :class="P.segBtn(kind === k)" @click="kind = k">{{ t(`admin.content.tabs.${k}`) }}</button>
      </div>
      <select v-model="status" :class="[P.INPUT, '!h-[34px] !w-auto text-[13px]']" :aria-label="t('admin.content.cols.status')">
        <option value="">{{ t('admin.content.statusAll') }}</option>
        <option v-for="s in STATUSES[kind]" :key="s" :value="s">{{ t(`admin.status.${s}`) }}</option>
      </select>
      <label v-if="kind !== 'offers'" class="inline-flex items-center gap-1.5 text-[13px] font-semibold"><input v-model="all" type="checkbox" class="accent-ink w-4 h-4">{{ t('admin.content.past') }}</label>
      <div class="relative flex-1 min-w-[180px] max-w-[280px] ml-auto">
        <AppIcon name="search" :size="17" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input v-model="q" type="search" :class="[P.INPUT, '!h-[34px] pl-8 text-[13px]']" :placeholder="t('admin.content.search')" :aria-label="t('admin.content.search')">
      </div>
    </div>
    <Skeleton v-if="c.loading.value" :rows="5" :height="56" class="p-3.5" />
    <div v-else-if="!c.items.value.length" :class="P.EMPTY">
      <AppIcon name="inventory_2" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" />
      <b class="text-ink">{{ t('admin.content.empty') }}</b><div class="text-[13px] mt-1">{{ t('admin.content.emptyHint') }}</div>
    </div>
    <template v-else>
      <!-- telefon: carduri -->
      <div class="md:hidden flex flex-col">
        <div v-for="x in c.items.value" :key="x.id" :class="P.MROW">
          <div class="flex items-start gap-3 min-w-0">
            <span :class="P.THUMB" :style="x.imageUrl ? { backgroundImage: `url('${x.imageUrl}')` } : undefined"><AppIcon v-if="!x.imageUrl" :name="ICON[kind]" :size="18" /></span>
            <div class="min-w-0 flex-1">
              <div :class="P.TT">{{ x.title }}</div>
              <div :class="P.TS">{{ category(x) }} · {{ x.organizer ?? '—' }}<span v-if="x.organizerVerified === false" :class="[P.PILL, 'bg-warn-soft text-warn ml-1 !py-0']">{{ t('admin.content.unverified') }}</span></div>
              <div :class="P.TS">{{ when(x) }} · {{ metric(x) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2.5">
            <span :class="[P.PILL, STATUS_TONE[x.status]]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`admin.status.${x.status}`) }}</span>
            <button v-if="nextStatus(kind, x.status)" type="button" class="ml-auto" :class="nextStatus(kind, x.status) === 'PUBLISHED' ? P.BTN_SM : P.BTN_SM_SEC"
              :disabled="c.busy.value === x.id" @click="toggle(x)">{{ actionLabel(nextStatus(kind, x.status)!) }}</button>
          </div>
        </div>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full border-collapse min-w-[820px]">
          <thead><tr>
            <th v-for="col in ['item', 'organizer', 'when', metricCol, 'status']" :key="col" :class="P.TH">{{ t(`admin.content.cols.${col}`) }}</th>
            <th :class="P.TH" />
          </tr></thead>
          <tbody>
            <tr v-for="x in c.items.value" :key="x.id" :class="P.TR">
              <td :class="P.TD"><div class="flex items-center gap-3 min-w-0">
                <span :class="P.THUMB" :style="x.imageUrl ? { backgroundImage: `url('${x.imageUrl}')` } : undefined"><AppIcon v-if="!x.imageUrl" :name="ICON[kind]" :size="18" /></span>
                <div class="min-w-0"><div :class="[P.TT, 'max-w-[220px] truncate']" :title="x.title">{{ x.title }}</div><div :class="P.TS">{{ category(x) }}</div></div>
              </div></td>
              <td :class="[P.TD, 'max-w-[170px]']">{{ x.organizer ?? '—' }}<span v-if="x.organizerVerified === false" :class="[P.PILL, 'bg-warn-soft text-warn ml-1.5']">{{ t('admin.content.unverified') }}</span></td>
              <td :class="[P.TD, 'whitespace-nowrap']">
                <template v-if="kind !== 'offers' && x.startAt">{{ f.dateTime(x.startAt, false) }}<div :class="P.TS">{{ f.timeRange(x.startAt, x.endAt) }}</div></template>
                <template v-else>{{ when(x) }}</template>
              </td>
              <td :class="P.TD">{{ metric(x) }}</td>
              <td :class="P.TD"><span :class="[P.PILL, STATUS_TONE[x.status]]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`admin.status.${x.status}`) }}</span></td>
              <td :class="P.TD"><div class="flex justify-end">
                <button v-if="nextStatus(kind, x.status)" type="button" :class="nextStatus(kind, x.status) === 'PUBLISHED' ? P.BTN_SM : P.BTN_SM_SEC"
                  :disabled="c.busy.value === x.id" @click="toggle(x)">{{ actionLabel(nextStatus(kind, x.status)!) }}</button>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div :class="[P.TS, 'px-3.5 py-2.5 border-t border-line']">{{ t('admin.content.count', { n: c.total.value }) }}</div>
    </template>
  </div>
</template>
