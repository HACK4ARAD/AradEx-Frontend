<script setup lang="ts">
// T11 · Acțiuni comunitare în panoul Primăriei (design/final web): lista (Urmează / Toate / Ciorne) și, pe `/new` sau `/:id`,
// formularul cu previzualizarea cardului. Voluntarii alocați vin cu T18.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppChip, EmptyState, Skeleton } from '@/shared/components'
import PanelHeader from '@/shared/components/business/PanelHeader.vue'
import ActionForm from '@/shared/components/community/ActionForm.vue'
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

const now = () => Date.now()
const rows = computed(() => city.actions.value.filter((a) =>
  filter.value === 'all' ? true : filter.value === 'draft' ? a.status === 'DRAFT' : a.status === 'PUBLISHED' && new Date(a.endAt).getTime() >= now() - 864e5,
).sort((a, b) => (filter.value === 'up' ? a.startAt.localeCompare(b.startAt) : b.startAt.localeCompare(a.startAt))))

const tone: Record<string, string> = { PUBLISHED: 'bg-ok-soft text-ok', DRAFT: 'bg-warn-soft text-warn', CANCELLED: 'bg-bad-soft text-bad', DONE: 'bg-soft text-muted' }

onMounted(city.loadActions)
watch(sub, () => window.scrollTo(0, 0))

async function save(req: ActionCreate) {
  const a = await city.save(req, editId.value ?? undefined)
  if (!a) return
  ui.toast(a.status === 'PUBLISHED' ? t('community.cityActions.published') : a.status === 'DRAFT' ? t('community.cityActions.draftSaved') : t('community.cityActions.saved'), 'success')
  router.push('/w/city/actions')
}
</script>

<template>
  <!-- formular: acțiune nouă / editare -->
  <template v-if="isNew || editId">
    <PanelHeader :title="isNew ? t('community.cityActions.newTitle') : t('community.cityActions.editTitle')" :subtitle="t('community.cityActions.formSub')" />
    <Skeleton v-if="editId && city.loading.value" :rows="3" :height="96" />
    <EmptyState v-else-if="editId && !editing" icon="search_off" :title="t('community.action.notFound')" :action="t('community.cityActions.backToList')" @action="router.push('/w/city/actions')" />
    <ActionForm v-else :key="sub" :initial="editing ? fromAction(editing) : undefined" :status="editing?.status" :registered="editing?.registeredCount"
      :saving="city.saving.value" @submit="save" @cancel="router.push('/w/city/actions')" />
  </template>

  <!-- lista -->
  <template v-else>
    <PanelHeader :title="t('community.cityActions.title')" :subtitle="t('community.cityActions.sub')">
      <AppButton size="sm" icon="add" @click="router.push('/w/city/actions/new')">{{ t('community.cityActions.new') }}</AppButton>
    </PanelHeader>

    <div class="bg-white rounded-[16px] border border-line min-w-0">
      <div class="flex flex-wrap items-center gap-2 p-3 border-b border-line">
        <AppChip :active="filter === 'up'" @click="filter = 'up'">{{ t('community.cityActions.upcoming') }}</AppChip>
        <AppChip :active="filter === 'all'" @click="filter = 'all'">{{ t('community.cityActions.all') }}</AppChip>
        <AppChip :active="filter === 'draft'" @click="filter = 'draft'">{{ t('community.cityActions.drafts') }}</AppChip>
        <span class="ml-auto text-muted text-[13px]">{{ t('community.cityActions.count', { n: rows.length }) }}</span>
      </div>
      <Skeleton v-if="city.loading.value" :rows="4" :height="56" class="p-3" />
      <EmptyState v-else-if="!rows.length" icon="volunteer_activism" :title="t('community.cityActions.empty')" :action="t('community.cityActions.new')" @action="router.push('/w/city/actions/new')" />
      <div v-else class="overflow-x-auto">
        <table class="w-full text-[14px] border-collapse min-w-[760px]">
          <thead>
            <tr class="text-left text-muted text-[12.5px]">
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityActions.colAction') }}</th>
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityActions.colWhen') }}</th>
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityActions.colPoints') }}</th>
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityActions.colSpots') }}</th>
              <th class="px-3 py-2.5 font-semibold">{{ t('community.cityActions.colStatus') }}</th>
              <th class="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in rows" :key="a.id" class="border-t border-line align-middle">
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-2.5">
                  <span class="w-10 h-10 rounded-[10px] bg-green-deep bg-cover bg-center shrink-0" :style="a.imageUrl ? { backgroundImage: `url('${a.imageUrl}')` } : undefined" />
                  <div class="min-w-0"><b class="block">{{ a.title }}</b><span class="text-muted text-[12.5px]">{{ t(`community.category.${a.category}`) }} · {{ a.locationName }}</span></div>
                </div>
              </td>
              <td class="px-3 py-2.5 whitespace-nowrap">{{ f.dateTime(a.startAt, false) }} · {{ f.timeRange(a.startAt, a.endAt) }}</td>
              <td class="px-3 py-2.5"><span class="rounded-full bg-ok-soft text-ok text-[12px] font-bold px-2 py-0.5">+{{ a.pointsReward }}</span></td>
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-2"><div class="w-20 h-2 rounded bg-soft overflow-hidden"><i class="block h-full bg-green" :style="{ width: `${Math.min(100, Math.round(a.registeredCount / a.capacity * 100))}%` }" /></div><span class="text-muted text-[12.5px]">{{ a.registeredCount }}/{{ a.capacity }}</span></div>
              </td>
              <td class="px-3 py-2.5"><span class="rounded-full text-[12px] font-semibold px-2.5 py-0.5" :class="tone[a.status]">{{ t(`community.actionStatus.${a.status}`) }}</span></td>
              <td class="px-3 py-2.5">
                <div class="flex justify-end gap-1.5">
                  <AppButton v-if="a.status === 'PUBLISHED'" size="sm" variant="ghost" @click="router.push({ path: '/w/city/validate', query: { a: a.id } })">{{ t('community.cityActions.validate') }}</AppButton>
                  <AppButton size="sm" variant="ghost" @click="router.push(`/w/city/actions/${a.id}`)">{{ t('community.cityActions.edit') }}</AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
</template>
