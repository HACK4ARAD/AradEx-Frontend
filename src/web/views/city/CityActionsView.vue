<script setup lang="ts">
// T11 · Acțiuni comunitare — design/final web `#/city/actions` (tabel: Acțiune, Când, Puncte, Locuri, Stare + Urmează / Toate / Ciorne)
// și `#/city/actions/new` (formular + previzualizare). `/city/actions/new` = nouă, `/city/actions/:id` = editare.
// Coloana „Voluntari” din design vine cu T18.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import ActionForm from '@/web/components/community/ActionForm.vue'
import * as P from '@/web/components/community/panel'
import { useFormat } from '@/shared/composables/useFormat'
import { fromAction, useCityCommunity } from '@/shared/composables/useCommunity'
import { useUiStore } from '@/shared/stores/ui'
import type { ActionCreate } from '@/shared/types/community'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const city = useCityCommunity()
const filter = ref<'up' | 'all' | 'draft'>('up')

const sub = computed(() => (route.params.sub ? String(route.params.sub) : ''))
const isNew = computed(() => sub.value === 'new')
const editId = computed(() => (/^\d+$/.test(sub.value) ? Number(sub.value) : null))
const editing = computed(() => (editId.value ? city.actions.value.find((a) => a.id === editId.value) : undefined))

const rows = computed(() => {
  const now = Date.now()
  return city.actions.value
    .filter((a) => filter.value === 'all' ? true : filter.value === 'draft' ? a.status === 'DRAFT' : a.status === 'PUBLISHED' && new Date(a.endAt).getTime() >= now - 864e5)
    .sort((a, b) => (filter.value === 'up' ? a.startAt.localeCompare(b.startAt) : b.startAt.localeCompare(a.startAt)))
})
const pct = (a: { registeredCount: number; capacity: number }) => Math.min(100, Math.round((a.registeredCount / Math.max(1, a.capacity)) * 100))

onMounted(city.loadActions)
watch(sub, () => window.scrollTo(0, 0))

async function save(req: ActionCreate) {
  const a = await city.save(req, editId.value ?? undefined)
  if (!a) return
  ui.toast(a.status === 'PUBLISHED' ? t('community.cityActions.published') : a.status === 'DRAFT' ? t('community.cityActions.draftSaved') : t('community.cityActions.saved'), 'success')
  router.push('/city/actions')
}
</script>

<template>
  <!-- ======== formular ======== -->
  <template v-if="isNew || editId">
    <div :class="P.HEAD">
      <div><h1 :class="P.H1">{{ isNew ? t('community.cityActions.newTitle') : t('community.cityActions.editTitle') }}</h1><div :class="P.SUB">{{ t('community.cityActions.formSub') }}</div></div>
    </div>
    <Skeleton v-if="editId && city.loading.value" :rows="3" :height="96" />
    <div v-else-if="editId && !editing" :class="[P.CARD, P.EMPTY]">
      <AppIcon name="search_off" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.action.notFound') }}</b>
      <div class="mt-3"><router-link to="/city/actions" :class="P.BTN_SM_SEC">{{ t('community.cityActions.backToList') }}</router-link></div>
    </div>
    <ActionForm v-else :key="sub" :initial="editing ? fromAction(editing) : undefined" :status="editing?.status" :registered="editing?.registeredCount"
      :saving="city.saving.value" @submit="save" @cancel="router.push('/city/actions')" />
  </template>

  <!-- ======== listă ======== -->
  <template v-else>
    <div :class="P.HEAD">
      <div><h1 :class="P.H1">{{ t('community.cityActions.title') }}</h1><div :class="P.SUB">{{ t('community.cityActions.sub') }}</div></div>
      <router-link to="/city/actions/new" :class="P.BTN"><AppIcon name="add" :size="16" />{{ t('community.cityActions.new') }}</router-link>
    </div>

    <div :class="P.CARD_FLUSH">
      <div :class="P.TOOLBAR">
        <div :class="P.SEG">
          <button v-for="k in (['up', 'all', 'draft'] as const)" :key="k" type="button" :class="P.segBtn(filter === k)" @click="filter = k">{{ t(`community.cityActions.filter.${k}`) }}</button>
        </div>
        <span :class="P.COUNT">{{ t('community.cityActions.count', { n: rows.length }) }}</span>
      </div>
      <Skeleton v-if="city.loading.value" :rows="4" :height="56" class="p-3.5" />
      <div v-else-if="!rows.length" :class="P.EMPTY">
        <AppIcon name="volunteer_activism" :size="34" class="text-[#C9C8C2] block mx-auto mb-2" /><b class="text-ink">{{ t('community.cityActions.empty') }}</b>
      </div>
      <!-- telefon: câte un card pe acțiune (tabelul de 860px nu încape) -->
      <template v-else>
      <div class="md:hidden flex flex-col">
        <div v-for="a in rows" :key="a.id" :class="P.MROW">
          <div class="flex items-start gap-3 min-w-0">
            <span :class="P.THUMB" :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined"><AppIcon v-if="!a.imageUrl" name="volunteer_activism" :size="18" /></span>
            <div class="min-w-0 flex-1">
              <div :class="P.TT">{{ a.title }}</div>
              <div :class="P.TS">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }}</div>
              <div :class="P.TS">{{ t(`community.category.${a.category}`) }} · {{ a.locationName }}</div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 mt-2.5">
            <span :class="[P.PILL, P.PILL_TONE[a.status]]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`community.actionStatus.${a.status}`) }}</span>
            <span :class="[P.PILL, 'bg-ok-soft text-ok']">+{{ a.pointsReward }}</span>
            <span :class="P.TS">{{ a.registeredCount }}/{{ a.capacity }}</span>
          </div>
          <div class="flex gap-1.5 mt-2.5">
            <router-link v-if="a.status === 'PUBLISHED'" :to="{ path: '/city/validate', query: { a: a.id } }" :class="[P.BTN_SM_SEC, 'flex-1']">{{ t('community.cityActions.validate') }}</router-link>
            <router-link :to="`/city/actions/${a.id}`" :class="[P.BTN_SM_SEC, 'flex-1']">{{ t('community.cityActions.edit') }}</router-link>
          </div>
        </div>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full border-collapse min-w-[860px]">
          <thead><tr>
            <th v-for="c in ['action', 'when', 'points', 'spots', 'status']" :key="c" :class="P.TH">{{ t(`community.cityActions.cols.${c}`) }}</th>
            <th :class="P.TH" />
          </tr></thead>
          <tbody>
            <tr v-for="a in rows" :key="a.id" :class="P.TR">
              <td :class="P.TD"><div class="flex items-center gap-3 min-w-0">
                <span :class="P.THUMB" :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined"><AppIcon v-if="!a.imageUrl" name="volunteer_activism" :size="18" /></span>
                <div class="min-w-0"><div :class="P.TT">{{ a.title }}</div><div :class="P.TS">{{ t(`community.category.${a.category}`) }} · {{ a.locationName }}</div></div>
              </div></td>
              <td :class="[P.TD, 'whitespace-nowrap']">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }}</td>
              <td :class="P.TD"><span :class="[P.PILL, 'bg-ok-soft text-ok']">+{{ a.pointsReward }}</span></td>
              <td :class="P.TD"><div class="flex items-center gap-2">
                <div :class="[P.BAR, 'w-20']"><i class="block h-full bg-ok rounded-[3px]" :style="{ width: `${pct(a)}%` }" /></div>
                <span :class="P.TS">{{ a.registeredCount }}/{{ a.capacity }}</span>
              </div></td>
              <td :class="P.TD"><span :class="[P.PILL, P.PILL_TONE[a.status]]"><i class="w-1.5 h-1.5 rounded-full bg-current" />{{ t(`community.actionStatus.${a.status}`) }}</span></td>
              <td :class="P.TD"><div class="flex gap-1.5 justify-end">
                <router-link v-if="a.status === 'PUBLISHED'" :to="{ path: '/city/validate', query: { a: a.id } }" :class="P.BTN_SM_SEC">{{ t('community.cityActions.validate') }}</router-link>
                <router-link :to="`/city/actions/${a.id}`" :class="P.BTN_SM_SEC">{{ t('community.cityActions.edit') }}</router-link>
              </div></td>
            </tr>
          </tbody>
        </table>
      </div>
      </template>
    </div>
  </template>
</template>
