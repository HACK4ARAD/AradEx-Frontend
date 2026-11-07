<script setup lang="ts">
// T08 · S7 — harta (design/final mobile „Hartă”): pe tot ecranul, căutare, Azi / Weekend / 7 zile, tipuri, pinii aplicației;
// pin → card jos cu „Arată traseul” (OSRM, pe jos / mașină) și „Deschide”. `?to=event:5` (din „Indicații”) deschide direct traseul.
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import MapView, { type MapMarker } from '@/shared/components/map/MapView.vue'
import { filterItems, parseTarget, useMapData, type MapKind, type MapPeriod } from '@/shared/composables/useMapData'
import { fetchDirections, googleMapsUrl, type Directions, type TravelMode } from '@/shared/composables/useDirections'
import { useGeo } from '@/shared/composables/useGeo'
import { useFormat } from '@/shared/composables/useFormat'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const f = useFormat()
const geo = useGeo()

const period = ref<MapPeriod>('today')
const kind = ref<'all' | MapKind>('all')
const target = ref<string | null>(parseTarget(route.query.to))
const selected = ref<string | null>(target.value)
const mode = ref<TravelMode>('foot')
const directions = ref<Directions | null>(null)
const mapRef = ref<InstanceType<typeof MapView> | null>(null)

const { items, loading, load, ensure } = useMapData(period)

const visible = computed(() => filterItems(items.value, kind.value, target.value))
const markers = computed<MapMarker[]>(() => visible.value.map((i) => ({ id: i.key, lat: i.lat, lng: i.lng, kind: i.kind })))
const sel = computed(() => items.value.find((i) => i.key === selected.value) ?? null)
const routing = computed(() => !!sel.value && target.value === sel.value.key)
const initials = computed(() => (auth.user?.displayName ?? '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase())

const periods: MapPeriod[] = ['today', 'weekend', 'week']
const kinds: ('all' | MapKind)[] = ['all', 'event', 'place', 'offer', 'action']

// fiecare cerere de traseu are un număr; un răspuns întârziat (alt pin, alt mod, card închis) se ignoră
let routeSeq = 0

async function showRoute() {
  const to = sel.value
  if (!to) return
  const seq = ++routeSeq
  const m = mode.value
  target.value = to.key
  directions.value = null
  const stale = () => seq !== routeSeq || target.value !== to.key
  const from = await geo.locate()
  if (stale()) return
  const d = await fetchDirections(from, to, m)
  if (!stale()) directions.value = d
}

function select(id: string | null) {
  selected.value = id
  if (id !== target.value) { routeSeq++; target.value = null; directions.value = null }
}

async function myLocation() {
  const p = await geo.locate()
  mapRef.value?.flyTo(p, 16)
}

watch(mode, () => { if (routing.value) void showRoute() })
// pinul selectat a dispărut (altă perioadă): închidem cardul și traseul, să nu rămână o linie fără destinație
watch(sel, (s) => { if (!s && selected.value) select(null) })

onMounted(async () => {
  await load()
  if (!target.value) return
  // ținta poate fi în afara perioadei afișate (un bilet de săptămâna viitoare): ensure o aduce și o ține pe hartă
  if (await ensure(target.value)) { selected.value = target.value; await showRoute() }
  else { ui.toast(t('map.notFound'), 'info'); target.value = null; selected.value = null }
})
</script>

<template>
  <!-- harta e sub tot (inclusiv sub tab bar), restul plutește peste ea -->
  <div class="fixed inset-0 mx-auto w-full max-w-[480px] z-0">
    <MapView ref="mapRef" :markers="markers" :selected-id="selected" :route="directions?.line ?? null"
      :route-approximate="directions?.approximate" :me="geo.isFallback.value ? null : geo.position.value"
      :insets="{ top: 170, bottom: routing ? 480 : 330 }" @select="select" />

    <div class="absolute left-0 right-0 top-0 z-[500] px-4 pt-[max(12px,env(safe-area-inset-top))] flex flex-col gap-2.5 pointer-events-none">
      <div class="flex gap-2.5 pointer-events-auto">
        <button type="button" class="flex-1 min-w-0 h-12 px-4 rounded-[16px] bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.12)] flex items-center gap-2 text-muted text-[15px] text-left"
          @click="router.push('/search')">
          <AppIcon name="search" :size="20" /><span class="flex-1 truncate">{{ t('map.search') }}</span>
        </button>
        <router-link to="/profile" class="w-12 h-12 shrink-0 rounded-full shadow-[0_2px_10px_rgba(0,0,0,.12)] flex items-center justify-center no-underline font-bold"
          :class="auth.user ? 'bg-ink text-white' : 'bg-white/95 text-ink'" :aria-label="t('nav.profile')">
          <template v-if="auth.user">{{ initials }}</template><AppIcon v-else name="person" />
        </router-link>
      </div>
      <div class="self-start inline-flex p-1 rounded-[14px] bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.12)] pointer-events-auto" role="tablist">
        <button v-for="p in periods" :key="p" type="button" role="tab" :aria-selected="period === p"
          class="h-9 px-3.5 rounded-[10px] text-[14px]" :class="period === p ? 'bg-ink text-white font-semibold' : 'text-ink'"
          @click="period = p">{{ t(`map.period.${p}`) }}</button>
      </div>
      <div class="flex gap-2 overflow-x-auto pointer-events-auto -mx-4 px-4 pb-1 [scrollbar-width:none]">
        <button v-for="k in kinds" :key="k" type="button" :aria-pressed="kind === k"
          class="h-9 px-3.5 rounded-full text-[13.5px] whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,.1)]"
          :class="kind === k ? 'bg-ink text-white font-semibold' : 'bg-white/95 text-ink'" @click="kind = k">{{ t(`map.kind.${k}`) }}</button>
      </div>
    </div>

    <div class="absolute right-4 z-[500] flex flex-col gap-2" :class="!sel ? 'bottom-[130px]' : routing ? 'bottom-[456px]' : 'bottom-[300px]'">
      <button type="button" class="w-11 h-11 rounded-[14px] bg-white shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('map.zoomIn')" @click="mapRef?.zoomBy(1)"><AppIcon name="add" /></button>
      <button type="button" class="w-11 h-11 rounded-[14px] bg-white shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center" :aria-label="t('map.zoomOut')" @click="mapRef?.zoomBy(-1)"><AppIcon name="remove" /></button>
      <button type="button" class="w-11 h-11 rounded-[14px] bg-white shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center text-[#1D5FD1]" :aria-label="t('map.myLocation')" @click="myLocation"><AppIcon name="my_location" fill /></button>
    </div>

    <div v-if="loading && !items.length" class="absolute left-1/2 -translate-x-1/2 top-[180px] z-[500] px-3.5 py-2 rounded-full bg-white/95 text-[13px] text-muted shadow">{{ t('map.loading') }}</div>

    <!-- cardul pinului selectat, deasupra tab bar-ului -->
    <div v-if="sel" class="absolute left-4 right-4 bottom-[110px] z-[600] bg-white rounded-[20px] p-4 shadow-[0_10px_30px_rgba(17,17,17,.18)]">
      <div class="flex gap-3 items-start">
        <div class="w-16 h-16 rounded-[14px] shrink-0 bg-soft bg-cover bg-center" :style="sel.imageUrl ? { backgroundImage: `url('${sel.imageUrl}')` } : undefined" />
        <div class="flex-1 min-w-0">
          <div class="text-[12px] uppercase tracking-[.05em] font-semibold text-muted">{{ t(`map.kindLabel.${sel.kind}`) }}</div>
          <b class="block text-[16px] leading-tight">{{ sel.title }}</b>
          <span class="block text-[13px] text-muted truncate">{{ sel.sub }}</span>
          <div v-if="routing && directions" class="mt-1.5 text-[13px] font-semibold">
            <AppIcon :name="mode === 'foot' ? 'directions_walk' : 'directions_car'" :size="16" class="align-[-3px]" />
            {{ t('map.routeInfo', { min: directions.durationMin, km: f.km(directions.distanceKm) }) }}
          </div>
        </div>
        <button type="button" class="w-9 h-9 -mt-1 -mr-1 rounded-full flex items-center justify-center" :aria-label="t('map.close')" @click="select(null)"><AppIcon name="close" /></button>
      </div>
      <template v-if="routing">
        <div class="flex gap-1 mt-3 p-1 rounded-[12px] bg-soft" role="tablist">
          <button v-for="m in (['foot', 'car'] as const)" :key="m" type="button" role="tab" :aria-selected="mode === m"
            class="flex-1 h-9 rounded-[9px] text-[13.5px]" :class="mode === m ? 'bg-white font-semibold shadow-sm' : 'text-muted'" @click="mode = m">{{ t(`map.${m}`) }}</button>
        </div>
        <p v-if="directions?.approximate" class="text-[12.5px] text-muted mt-2 mb-0">{{ t('map.approximate') }}</p>
        <p v-else-if="geo.isFallback.value" class="text-[12.5px] text-muted mt-2 mb-0">{{ t('map.fromCenter') }}</p>
      </template>
      <div class="flex gap-2 mt-3">
        <a v-if="routing" :href="googleMapsUrl(sel, mode)" target="_blank" rel="noopener"
          class="flex-1 h-11 rounded-[14px] bg-ink text-white text-[14.5px] font-semibold flex items-center justify-center gap-1.5 no-underline">
          <AppIcon name="open_in_new" :size="18" />{{ t('map.googleMaps') }}</a>
        <button v-else type="button" class="flex-1 h-11 rounded-[14px] bg-ink text-white text-[14.5px] font-semibold flex items-center justify-center gap-1.5" @click="showRoute">
          <AppIcon name="directions_walk" :size="18" />{{ t('map.showRoute') }}</button>
        <router-link :to="sel.href" class="flex-1 h-11 rounded-[14px] bg-white border border-line text-ink text-[14.5px] font-semibold flex items-center justify-center no-underline">{{ t('map.open') }}</router-link>
      </div>
    </div>
  </div>
</template>
