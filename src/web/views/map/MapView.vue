<script setup lang="ts">
// T23 · W9 — harta pe web (design/final web `/map`): pe ≥lg în stânga cardul cu căutare, perioadă, tipuri și lista sortată după
// distanță (rândul selectat se deschide cu „Arată traseul” pe jos / mașină și „Deschide”), în dreapta harta cu pinul selectat și traseul.
// Pe telefon harta e sus (~55vh) și lista dedesubt. Starea e comună cu harta din aplicație (shared/composables/useMapScreen),
// inclusiv `?to=kind:id` care deschide direct traseul.
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import MapView from '@/shared/components/map/MapView.vue'
import { MAP_KINDS, MAP_PERIODS, byDistance, searchItems, toMarkers, useMapScreen } from '@/shared/composables/useMapScreen'
import { googleMapsUrl } from '@/shared/composables/useDirections'
import { useFormat } from '@/shared/composables/useFormat'
import type { MapItem } from '@/shared/composables/useMapData'

const { t } = useI18n()
const route = useRoute()
const f = useFormat()

const { geo, period, kind, target, selected, mode, directions, items, loading, visible, sel, routing, showRoute, select, init } = useMapScreen(route.query.to)
const q = ref('')
const listed = computed(() => byDistance(searchItems(visible.value, q.value, target.value), geo.position.value))
const markers = computed(() => toMarkers(listed.value.map((r) => r.item)))
const selKm = computed(() => listed.value.find((r) => r.item.key === selected.value)?.km ?? null)

const mapRef = ref<InstanceType<typeof MapView> | null>(null)
const listEl = ref<HTMLElement | null>(null)

/** Rândul din listă: a doua apăsare îl închide; altfel harta zboară la pin. */
function pick(it: MapItem) {
  if (selected.value === it.key) { select(null); return }
  select(it.key)
  mapRef.value?.flyTo(it, 16)
}

/** Pin apăsat pe hartă: rândul lui se aduce în listă (doar lista se derulează, nu pagina). */
function onPin(id: string | null) {
  select(id)
  if (!id) return
  void nextTick(() => {
    const box = listEl.value
    const row = box?.querySelector<HTMLElement>(`[data-key="${id}"]`)
    if (!box || !row || box.scrollHeight <= box.clientHeight) return
    if (row.offsetTop < box.scrollTop || row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = row.offsetTop - 8
  })
}

async function myLocation() {
  const p = await geo.locate()
  mapRef.value?.flyTo(p, 16)
}

function resetFilters() { q.value = ''; kind.value = 'all'; period.value = 'week' }

onMounted(init)
</script>

<template>
  <h1 class="sr-only">{{ t('map.web.title') }}</h1>
  <div class="flex flex-col gap-4 lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-5">
    <!-- lista -->
    <aside class="bg-white border border-line rounded-[16px] flex flex-col min-w-0 lg:h-[calc(100dvh-150px)] lg:overflow-hidden">
      <div class="p-3.5 pb-2.5 flex flex-col gap-2.5 border-b border-line">
        <label class="h-11 px-3.5 rounded-[12px] bg-soft flex items-center gap-2 text-muted">
          <AppIcon name="search" :size="20" />
          <input v-model="q" type="search" class="flex-1 min-w-0 bg-transparent outline-none text-ink text-[14.5px] placeholder:text-muted" :placeholder="t('map.search')" :aria-label="t('map.search')">
        </label>
        <div class="flex flex-wrap gap-1.5" role="tablist">
          <button v-for="p in MAP_PERIODS" :key="p" type="button" role="tab" :aria-selected="period === p"
            class="h-9 px-3.5 rounded-full text-[13.5px] border" :class="period === p ? 'bg-ink text-white border-ink font-semibold' : 'bg-white text-ink border-line'"
            @click="period = p">{{ t(`map.period.${p}`) }}</button>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="k in MAP_KINDS" :key="k" type="button" :aria-pressed="kind === k"
            class="h-8 px-3 rounded-full text-[12.5px] border" :class="kind === k ? 'bg-ink text-white border-ink font-semibold' : 'bg-white text-ink border-line'"
            @click="kind = k">{{ t(`map.kind.${k}`) }}</button>
        </div>
        <div v-if="!loading" class="text-muted text-[12.5px]">
          {{ t('map.web.results', listed.length) }} · {{ geo.isFallback.value ? t('map.web.sortedCenter') : t('map.web.sortedYou') }}
        </div>
      </div>

      <div ref="listEl" class="relative flex-1 min-h-0 lg:overflow-y-auto" :aria-label="t('map.web.list')">
        <div v-if="loading && !items.length" class="p-3.5"><Skeleton :rows="5" :height="64" /></div>
        <div v-else-if="!listed.length" class="p-3.5">
          <EmptyState icon="travel_explore" :title="t('map.web.empty')" :text="t('map.web.emptyText')" :action="t('map.web.reset')" @action="resetFilters" />
        </div>
        <div v-for="r in listed" v-else :key="r.item.key" :data-key="r.item.key" class="border-b border-line last:border-b-0" :class="selected === r.item.key && 'bg-soft'">
          <button type="button" class="w-full flex items-center gap-3 px-3.5 py-2.5 text-left" :aria-expanded="selected === r.item.key" @click="pick(r.item)">
            <span class="w-12 h-12 rounded-[12px] shrink-0 bg-soft bg-cover bg-center flex items-center justify-center text-muted"
              :style="r.item.imageUrl ? { backgroundImage: `url('${r.item.imageUrl}')` } : undefined">
              <AppIcon v-if="!r.item.imageUrl" :name="r.item.kind === 'place' ? 'account_balance' : r.item.kind === 'offer' ? 'storefront' : r.item.kind === 'action' ? 'volunteer_activism' : 'event'" :size="22" />
            </span>
            <span class="flex-1 min-w-0">
              <b class="block text-[14px] leading-snug truncate">{{ r.item.title }}</b>
              <span class="block text-[12.5px] text-muted truncate">{{ r.item.sub }} · {{ f.km(r.km) }}</span>
            </span>
            <span class="shrink-0 h-6 px-2 rounded-full bg-soft text-[11px] font-semibold text-muted hidden sm:flex items-center" :class="selected === r.item.key && '!bg-white'">{{ t(`map.kindLabel.${r.item.kind}`) }}</span>
          </button>
          <div v-if="selected === r.item.key" class="px-3.5 pb-3 sm:pl-[74px] flex flex-col gap-2">
            <div class="flex gap-1 p-1 rounded-[12px] bg-white" role="tablist">
              <button v-for="m in (['foot', 'car'] as const)" :key="m" type="button" role="tab" :aria-selected="mode === m"
                class="flex-1 h-8 rounded-[9px] text-[13px] flex items-center justify-center gap-1" :class="mode === m ? 'bg-ink text-white font-semibold' : 'text-muted'" @click="mode = m">
                <AppIcon :name="m === 'foot' ? 'directions_walk' : 'directions_car'" :size="16" />{{ t(`map.${m}`) }}</button>
            </div>
            <div v-if="routing" class="text-[13px] font-semibold">
              <template v-if="directions">{{ t('map.routeInfo', { min: directions.durationMin, km: f.km(directions.distanceKm) }) }}</template>
              <span v-else class="text-muted font-normal">{{ t('map.web.routing') }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <a v-if="routing" :href="googleMapsUrl(r.item, mode)" target="_blank" rel="noopener"
                class="h-9 px-3.5 rounded-[12px] bg-ink text-white text-[13.5px] font-semibold flex items-center gap-1.5 no-underline">
                <AppIcon name="open_in_new" :size="16" />{{ t('map.googleMaps') }}</a>
              <button v-else type="button" class="h-9 px-3.5 rounded-[12px] bg-ink text-white text-[13.5px] font-semibold flex items-center gap-1.5" @click="showRoute">
                <AppIcon name="directions" :size="16" />{{ t('map.showRoute') }}</button>
              <router-link :to="r.item.href" class="h-9 px-3.5 rounded-[12px] bg-white border border-line text-ink text-[13.5px] font-semibold flex items-center no-underline">{{ t('map.open') }}</router-link>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- harta: pe telefon deasupra listei -->
    <section class="relative isolate order-first lg:order-none h-[55vh] min-h-[320px] lg:h-[calc(100dvh-150px)] rounded-[16px] overflow-hidden border border-line bg-soft">
      <MapView ref="mapRef" :markers="markers" :selected-id="selected" :route="directions?.line ?? null"
        :route-approximate="directions?.approximate" :me="geo.isFallback.value ? null : geo.position.value"
        :zoom="14" :insets="{ top: 60, bottom: sel ? 150 : 60 }" @select="onPin" />

      <div class="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        <button type="button" class="w-10 h-10 rounded-[12px] bg-white shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('map.zoomIn')" @click="mapRef?.zoomBy(1)"><AppIcon name="add" /></button>
        <button type="button" class="w-10 h-10 rounded-[12px] bg-white shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('map.zoomOut')" @click="mapRef?.zoomBy(-1)"><AppIcon name="remove" /></button>
        <button type="button" class="w-10 h-10 rounded-[12px] bg-white shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center text-blue" :aria-label="t('map.myLocation')" @click="myLocation"><AppIcon name="my_location" fill /></button>
      </div>

      <div v-if="loading && !items.length" class="absolute left-1/2 -translate-x-1/2 top-3 z-[500] px-3.5 py-2 rounded-full bg-white/95 text-[13px] text-muted shadow">{{ t('map.loading') }}</div>

      <!-- pinul selectat: pe ≥lg doar informațiile traseului (lista are restul); pe telefon și acțiunile, ca să nu derulezi până la listă -->
      <div v-if="sel" class="absolute left-3 right-16 bottom-3 z-[500] max-w-[460px] bg-white rounded-[16px] p-3.5 shadow-[0_10px_30px_rgba(17,17,17,.18)] flex-col gap-2"
        :class="routing ? 'flex' : 'flex lg:hidden'">
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <b class="block text-[14.5px] leading-tight truncate">{{ sel.title }}</b>
            <span v-if="routing && directions" class="block text-[13px] font-semibold mt-0.5">
              <AppIcon :name="mode === 'foot' ? 'directions_walk' : 'directions_car'" :size="16" class="align-[-3px]" />
              {{ t('map.routeInfo', { min: directions.durationMin, km: f.km(directions.distanceKm) }) }}
            </span>
            <span v-else-if="selKm != null" class="block text-[12.5px] text-muted">{{ t(`map.kindLabel.${sel.kind}`) }} · {{ f.km(selKm) }}</span>
          </div>
          <button type="button" class="w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center shrink-0" :aria-label="t('map.close')" @click="select(null)"><AppIcon name="close" :size="20" /></button>
        </div>
        <p v-if="routing && directions?.approximate" class="text-[12px] text-muted m-0">{{ t('map.approximate') }}</p>
        <p v-else-if="routing && geo.isFallback.value" class="text-[12px] text-muted m-0">{{ t('map.fromCenter') }}</p>
        <div class="flex flex-wrap gap-2">
          <a v-if="routing" :href="googleMapsUrl(sel, mode)" target="_blank" rel="noopener"
            class="h-9 px-3.5 rounded-[12px] bg-ink text-white text-[13.5px] font-semibold flex items-center gap-1.5 no-underline">
            <AppIcon name="open_in_new" :size="16" />{{ t('map.googleMaps') }}</a>
          <button v-else type="button" class="h-9 px-3.5 rounded-[12px] bg-ink text-white text-[13.5px] font-semibold flex items-center gap-1.5" @click="showRoute">
            <AppIcon name="directions" :size="16" />{{ t('map.showRoute') }}</button>
          <router-link :to="sel.href" class="h-9 px-3.5 rounded-[12px] bg-white border border-line text-ink text-[13.5px] font-semibold flex items-center no-underline">{{ t('map.open') }}</router-link>
        </div>
      </div>
    </section>
  </div>
</template>
