<script setup lang="ts">
// T05 · Panou Primărie (și Admin) · Obiective & ghiduri (design/final/web, „/city/places”, W25):
// lista obiectivelor + editorul obiectivului selectat (`/city/places/:id`, `/city/places/new`) cu punctele de ghid.
// „Generează cu AI” din design rămâne pentru după T12.
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppButton, AppIcon, AppInput, EmptyState, Skeleton } from '@/shared/components'
import PlaceForm from '@/shared/components/places/PlaceForm.vue'
import GuidePointSheet from '@/shared/components/places/GuidePointSheet.vue'
import { useCityPlaces } from '@/shared/composables/useCityPlaces'
import { clock, pointSeconds } from '@/shared/composables/useAudioGuide'
import type { FormErrors, GuidePointForm } from '@/shared/composables/usePlaceForm'
import type { GuidePointDto } from '@/shared/types/places'
import { useUiStore } from '@/shared/stores/ui'
import { ApiError } from '@/shared/api/client'
import { isExternalImage, mediaApi } from '@/shared/api/media'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const ui = useUiStore()

const sub = computed(() => (typeof route.params.sub === 'string' ? route.params.sub : ''))
const isNew = computed(() => sub.value === 'new')
const selectedId = computed<number | null>(() => (isNew.value || !sub.value ? null : Number(sub.value)))
const c = useCityPlaces(selectedId)

// fără selecție → primul obiectiv din listă
watch(() => [sub.value, c.items.value.length] as const, ([s, n]) => {
  if (!s && n) router.replace(`/city/places/${c.items.value[0].id}`)
}, { immediate: true })

const busy = ref(false)
/** Rulează o acțiune din panou; erorile apar în toast (`detail`), iar 409-urile cunoscute în română (`conflictKey`). */
async function run<T>(fn: () => Promise<T>, conflictKey?: string): Promise<T | undefined> {
  busy.value = true
  try { return await fn() } catch (e) {
    if (conflictKey && e instanceof ApiError && e.status === 409) ui.toast(t(conflictKey), 'error')
    else ui.error(e)
  } finally { busy.value = false }
}

async function save() {
  const id = await run(() => c.save(), 'places.panel.slugConflict')
  if (id === undefined) return
  if (id === null) { ui.toast(t('places.form.errors.fix'), 'error'); return }
  ui.toast(t(isNew.value ? 'places.panel.created' : 'places.panel.saved'), 'success')
  if (isNew.value) router.replace(`/city/places/${id}`)
}

async function removePlace() {
  if (!c.place.value || !window.confirm(t('places.panel.confirmDelete', { name: c.place.value.name }))) return
  const ok = await run(async () => { await c.remove(); return true }, 'places.panel.deleteConflict')
  if (ok) { ui.toast(t('places.panel.deleted'), 'success'); router.replace('/city/places') }
}

const sheetOpen = ref(false)
const editing = ref<GuidePointDto | null>(null)
const pointErrors = ref<FormErrors>({})
function openPoint(g: GuidePointDto | null) { editing.value = g; pointErrors.value = {}; sheetOpen.value = true }
async function savePoint(f: GuidePointForm) {
  const errs = await run(() => c.savePoint(f, editing.value ?? undefined), 'places.panel.positionConflict')
  if (!errs) return
  pointErrors.value = errs
  if (!Object.keys(errs).length) { sheetOpen.value = false; ui.toast(t('places.panel.pointSaved'), 'success') }
}
async function removePoint(g: GuidePointDto) {
  if (!window.confirm(t('places.panel.confirmDeletePoint', { title: g.title }))) return
  const ok = await run(async () => { await c.removePoint(g); return true })
  if (ok) ui.toast(t('places.panel.pointDeleted'), 'success')
}
const move = (g: GuidePointDto, dir: -1 | 1) => run(() => c.movePoint(g, dir))

// pozele obiectivelor încă legate de pe alte site-uri (visitarad.ro…) → copiate în S3, câte 15 pe cerere
const externalPhotos = computed(() => c.items.value.filter((p) => isExternalImage(p.imageUrl)).length)
const importing = ref<{ done: number; left: number } | null>(null)
/** Pozele care n-au putut fi descărcate (link stricat la sursă) rămân externe: după un import nu mai arătăm butonul pentru ele. */
const unreachable = ref(0)
const showImport = computed(() => !!importing.value || externalPhotos.value > unreachable.value)
async function importPhotos() {
  importing.value = { done: 0, left: externalPhotos.value }
  let failed = 0
  try {
    for (;;) {
      const r = await mediaApi.importPlaces(15)
      importing.value = { done: importing.value.done + r.imported, left: r.remaining }
      failed += r.failed
      if (!r.remaining || !r.imported) break
    }
    ui.toast(t('places.panel.importDone', { done: importing.value.done }), 'success')
    if (failed) ui.toast(t('places.panel.importFailed', { n: failed }), 'error')
  } catch (e) {
    ui.error(e)
  } finally {
    importing.value = null
    await c.reloadList()
    await c.loadPlace()
    unreachable.value = externalPhotos.value
  }
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] m-0">{{ t('places.panel.title') }}</h1>
        <p class="text-muted text-[14px] mt-1 mb-0 max-w-[720px]">{{ t('places.panel.subtitle', { n: c.items.value.length }) }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <AppButton v-if="showImport" variant="secondary" size="sm" icon="cloud_upload" :loading="!!importing" data-test="import-photos" @click="importPhotos">
          {{ importing ? t('places.panel.importing', importing) : t('places.panel.importPhotos', { n: externalPhotos - unreachable }) }}
        </AppButton>
        <AppButton icon="add" size="sm" @click="router.push('/city/places/new')">{{ t('places.panel.new') }}</AppButton>
      </div>
    </div>

    <div class="bg-white rounded-[16px] border border-line grid lg:grid-cols-[320px_minmax(0,1fr)] overflow-hidden">
      <!-- lista -->
      <div class="border-b lg:border-b-0 lg:border-r border-line flex flex-col lg:max-h-[calc(100dvh-210px)]">
        <div class="p-3 border-b border-line"><AppInput v-model="c.q.value" icon="search" :placeholder="t('places.panel.search')" /></div>
        <div class="overflow-y-auto max-h-[300px] lg:max-h-none">
          <div v-if="c.loading.value && !c.items.value.length" class="p-3"><Skeleton :rows="6" :height="52" /></div>
          <EmptyState v-else-if="c.error.value" icon="cloud_off" :title="t('places.list.error')" :text="c.error.value" :action="t('common.retry')" @action="c.reloadList()" />
          <router-link v-for="p in c.filtered.value" :key="p.id" :to="`/city/places/${p.id}`"
            class="flex items-center gap-3 px-3 py-2.5 no-underline text-ink border-b border-line last:border-b-0"
            :class="selectedId === p.id ? 'bg-soft' : 'hover:bg-bg'" data-test="panel-place">
            <span class="w-11 h-11 rounded-[10px] bg-[#7a7a72] bg-cover bg-center shrink-0" :style="p.imageUrl ? { backgroundImage: `url('${p.imageUrl}')` } : undefined" />
            <span class="min-w-0 flex-1">
              <b class="block text-[13.5px] truncate">{{ p.name }}</b>
              <span class="block text-[12px] text-muted">{{ t('places.panel.pointsShort', { n: p.guidePointsCount }, p.guidePointsCount) }} · RO<template v-if="p.exteriorOnly"> · {{ t('places.panel.exterior') }}</template></span>
            </span>
          </router-link>
        </div>
      </div>

      <!-- editor -->
      <div class="p-5 min-w-0">
        <Skeleton v-if="c.loadingPlace.value" :rows="4" :height="56" />
        <EmptyState v-else-if="c.placeError.value" icon="error" :title="t('places.detail.notFound')" :text="c.placeError.value" />
        <EmptyState v-else-if="!isNew && !c.place.value" icon="headphones" :title="t('places.panel.selectPrompt')" />
        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 class="text-[20px] font-semibold m-0">{{ isNew ? t('places.panel.new') : c.place.value?.name }}</h2>
            <div class="flex flex-wrap gap-2">
              <AppButton size="sm" :loading="c.saving.value" @click="save">{{ isNew ? t('places.panel.create') : t('places.panel.save') }}</AppButton>
            </div>
          </div>
          <p v-if="isNew" class="text-muted text-[13.5px] -mt-2 mb-4">{{ t('places.panel.newHint') }}</p>
          <PlaceForm v-model="c.form" :errors="c.errors.value" />

          <template v-if="c.place.value">
            <div class="flex flex-wrap items-center justify-between gap-2 mt-7 mb-2">
              <b class="text-[15px]">{{ t('places.panel.guidePoints', { n: c.place.value.guidePoints.length }) }}</b>
              <AppButton size="sm" variant="ghost" icon="add" @click="openPoint(null)">{{ t('places.panel.newPoint') }}</AppButton>
            </div>
            <p v-if="!c.place.value.guidePoints.length" class="text-muted text-[14px]">{{ t('places.panel.noPoints') }}</p>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-[13.5px] border-collapse">
                <thead>
                  <tr class="text-left text-muted text-[12px] uppercase tracking-wide">
                    <th class="py-2 pr-2 w-8">{{ t('places.panel.col.n') }}</th><th class="py-2 pr-3">{{ t('places.panel.col.title') }}</th>
                    <th class="py-2 pr-3">{{ t('places.panel.col.text') }}</th><th class="py-2 pr-3">{{ t('places.panel.col.audio') }}</th><th class="py-2" />
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(g, i) in c.place.value.guidePoints" :key="g.id" class="border-t border-line align-top" data-test="panel-point">
                    <td class="py-2.5 pr-2 font-semibold">{{ i + 1 }}</td>
                    <td class="py-2.5 pr-3 font-semibold min-w-[140px]">{{ g.title }}</td>
                    <td class="py-2.5 pr-3 text-muted max-w-[420px]"><span class="line-clamp-2">{{ g.text }}</span></td>
                    <td class="py-2.5 pr-3 whitespace-nowrap"><span class="inline-flex h-6 px-2 items-center rounded-full bg-ok-soft text-ok text-[12px] font-semibold">{{ t('places.panel.tts', { d: clock(pointSeconds(g)) }) }}</span></td>
                    <td class="py-2 whitespace-nowrap text-right">
                      <button class="w-8 h-8 rounded-lg hover:bg-soft disabled:opacity-30" :disabled="i === 0 || busy" :title="t('places.panel.moveUp')" @click="move(g, -1)"><AppIcon name="arrow_upward" :size="18" /></button>
                      <button class="w-8 h-8 rounded-lg hover:bg-soft disabled:opacity-30" :disabled="i === c.place.value.guidePoints.length - 1 || busy" :title="t('places.panel.moveDown')" @click="move(g, 1)"><AppIcon name="arrow_downward" :size="18" /></button>
                      <button class="w-8 h-8 rounded-lg hover:bg-soft" :title="t('places.panel.edit')" @click="openPoint(g)"><AppIcon name="edit" :size="18" /></button>
                      <button class="w-8 h-8 rounded-lg hover:bg-soft text-bad" :title="t('places.panel.remove')" @click="removePoint(g)"><AppIcon name="delete" :size="18" /></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-8 pt-4 border-t border-line">
              <AppButton size="sm" variant="ghost" icon="delete" class="!text-bad" @click="removePlace">{{ t('places.panel.delete') }}</AppButton>
            </div>
          </template>
        </template>
      </div>
    </div>

    <GuidePointSheet v-model:open="sheetOpen" :point="editing" :errors="pointErrors" :saving="busy" @save="savePoint" />
  </div>
</template>
