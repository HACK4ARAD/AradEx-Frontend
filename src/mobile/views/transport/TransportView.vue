<script setup lang="ts">
// T19 · Transport în comun (design/final mobil `#/transport` și `#/transport?to=gara`), pe rețeaua reală CTP Arad (T22):
// — fără destinație: „De la · Locația ta” + „Unde vrei să ajungi?” (căutare în obiective, stații și repere), sugestiile,
//   „Stații lângă tine” cu plecările live, liniile (tramvaie și autobuze) și, ca pe hartă, bicicletele și parcările;
// — cu `?to=`: „Trasee până acolo” — cel mult 2 variante cu tramvai / autobuz + pe jos (cea mai rapidă prima), apoi bicicleta
//   și mașina cu parcarea; bara de jos: „Arată traseul pe hartă” și „Pornește” (călătoria simulată, T19).
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import LineBadge from '@/shared/components/transit/LineBadge.vue'
import StopDepartures from '@/mobile/components/transport/StopDepartures.vue'
import TripOptionCard from '@/mobile/components/transport/TripOptionCard.vue'
import { useTransitVehicles } from '@/shared/composables/useTransit'
import { loadPlacesForSearch, useTransitNetwork, useTransportGeo, useTripPlan } from '@/shared/composables/useTransport'
import { lineDirections, nearbyStops, patternGeo, rideMinutes, stopLabel, type TripOption } from '@/shared/composables/useTripPlanner'
import { distanceKm } from '@/shared/composables/useDirections'
import { useFormat } from '@/shared/composables/useFormat'
import { POIS, parseTo } from '@/shared/data/transport/destinations'
import { BIKE_STATIONS } from '@/shared/data/bikes/bikes'
import { loadParking, type ParkingData } from '@/shared/data/parking/parking'
import { useAuthStore } from '@/shared/stores/auth'
import type { PlaceSummary } from '@/shared/types/places'
import type { TransitMode } from '@/shared/types/transit'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const auth = useAuthStore()
const initials = computed(() => (auth.user?.displayName ?? '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase())

const net = useTransitNetwork()
const geo = useTransportGeo()
const tp = useTripPlan()
const to = computed(() => parseTo(route.query.to))
const sel = ref(0)

/* ---------- căutarea destinației ---------- */
const q = ref('')
const places = shallowRef<PlaceSummary[]>([])
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
type Suggestion = { key: string; icon: string; name: string; sub: string }
const suggestions = computed<Suggestion[]>(() => {
  const n = fold(q.value.trim())
  if (n.length < 2) return []
  const out: Suggestion[] = []
  for (const p of POIS) { const name = t(`transport.poi.${p.id}.name`); if (fold(name).includes(n)) out.push({ key: `poi:${p.id}`, icon: p.icon, name, sub: t(`transport.poi.${p.id}.type`) }) }
  for (const p of places.value) if (fold(p.name).includes(n)) out.push({ key: `place:${p.id}`, icon: 'account_balance', name: p.name, sub: t(`places.type.${p.type}`) })
  const seen = new Set<string>()
  for (const s of net.stops.value) {
    const name = stopLabel(s.name)
    if (!fold(name).includes(n) || seen.has(fold(name))) continue
    seen.add(fold(name))
    out.push({ key: `stop:${s.id}`, icon: 'signpost', name, sub: t('transport.stopType', { lines: s.lines.join(', ') }) })
  }
  return out.slice(0, 7)
})
function goTo(key: string) {
  q.value = ''
  sel.value = 0
  router.push({ path: '/transport', query: { to: key } })
}
function searchEnter() {
  if (suggestions.value[0]) goTo(suggestions.value[0].key)
}
function clearDest() {
  sel.value = 0
  router.push('/transport')
}

/* ---------- planul ---------- */
const parking = shallowRef<ParkingData | null>(null)
const allOptions = computed<TripOption[]>(() => (tp.plan.value ? [...tp.plan.value.options, ...tp.plan.value.others] : []))
const current = computed(() => allOptions.value[Math.min(sel.value, allOptions.value.length - 1)] ?? null)

const netData = () => ({ stops: net.stops.value, routes: net.routes.value, stopsById: net.stopsById.value })
let locating = false
/** Planul pornește imediat din poziția știută; GPS-ul (până la 8 s) se cere în paralel și, dacă e în Arad, planul se refăce. */
async function plan(reuse = true) {
  if (!to.value || net.loading.value || net.error.value) return
  const first = tp.compute(to.value, geo.origin.value, netData(), reuse)
  if (geo.isFallback.value && !locating) {
    locating = true
    void geo.locate().then(() => {
      locating = false
      if (geo.here.value && to.value) void tp.compute(to.value, geo.origin.value, netData())
    })
  }
  await first
}
watch(to, (v) => { sel.value = 0; if (v) void plan(); else tp.clear() })

async function useLocation() {
  await geo.locate()
  if (to.value) await tp.compute(to.value, geo.origin.value, netData(), false)
}

function showMap(start = false) {
  if (!to.value) return
  router.push({ name: 'm-transport-trip', params: { to: to.value }, query: { opt: String(Math.min(sel.value, allOptions.value.length - 1)), ...(start ? { live: '1' } : {}) } })
}

/* ---------- fără destinație: stații, linii, biciclete ---------- */
const near = computed(() => nearbyStops(net.stops.value, geo.origin.value, 2))
const mode = ref<TransitMode>('TRAM')
const vehicles = useTransitVehicles()
const liveByRoute = computed(() => {
  const m = new Map<number, number>()
  for (const v of vehicles.vehicles.value) if (!v.stale) m.set(v.routeId, (m.get(v.routeId) ?? 0) + 1)
  return m
})
const lineRows = computed(() => net.routes.value.filter((r) => r.mode === mode.value).map((r) => {
  const d = lineDirections(r, net.stopsById.value)[0]
  const g = d ? patternGeo(d.pattern, net.stopsById.value) : null
  return { route: r, dir: d, stops: g?.stops.length ?? 0, min: g && g.stops.length > 1 ? rideMinutes(g, 0, g.stops.length - 1) : 0 }
}).filter((r) => r.dir))
const bikesNear = computed(() => BIKE_STATIONS.filter((s) => s.kind === 'dock')
  .map((s) => ({ s, km: distanceKm(geo.origin.value, s) })).sort((a, b) => a.km - b.km).filter((r) => r.km <= 1.5).slice(0, 2))
const docks = BIKE_STATIONS.filter((s) => s.kind === 'dock').length
const meters = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : f.km(km))

onMounted(async () => {
  await net.load()
  void plan()
  loadPlacesForSearch().then((p) => { places.value = p }).catch(() => { /* fără obiective în sugestii */ })
  loadParking().then((d) => { parking.value = d }).catch(() => { /* fără tarif pe card */ })
})
</script>

<template>
  <div class="flex items-center justify-between gap-3 pt-2 mb-3.5">
    <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ t('transport.title') }}</h1>
    <router-link v-if="auth.user" to="/profile" class="w-11 h-11 shrink-0 rounded-full bg-ink text-white text-[17px] font-bold flex items-center justify-center no-underline" :aria-label="t('nav.profile')">{{ initials }}</router-link>
    <router-link v-else to="/profile" class="w-11 h-11 shrink-0 rounded-full bg-white border border-line text-ink flex items-center justify-center no-underline" :aria-label="t('nav.profile')"><AppIcon name="person" /></router-link>
  </div>

  <!-- De la / Unde (design: card cu punctul albastru și pătratul negru) -->
  <div class="bg-white border border-line rounded-[20px] px-4 py-1 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)]">
    <button type="button" class="w-full flex items-center gap-3 py-3 border-b border-line text-left" :disabled="geo.loading.value" :aria-label="geo.here.value ? undefined : t('transport.useLocation')" @click="useLocation">
      <span class="w-4 h-4 rounded-full bg-[#1D5FD1] shadow-[0_0_0_4px_rgba(29,95,209,.2)] shrink-0" />
      <span class="text-muted">{{ t('transport.from') }}</span>
      <b class="flex-1 min-w-0 truncate text-[17px]">{{ geo.here.value ? t('transport.myLocation') : t('transport.center') }}</b>
      <span v-if="!geo.here.value" class="shrink-0 w-9 h-9 -my-1 rounded-full bg-[#E8EFFB] text-[#1D5FD1] flex items-center justify-center" :title="t('transport.useLocation')"><AppIcon name="my_location" :size="19" /></span>
    </button>
    <div v-if="to" class="flex items-center gap-3 py-3">
      <span class="w-3.5 h-3.5 rounded-[3px] bg-ink shrink-0" />
      <b class="flex-1 min-w-0 truncate text-[17px]">{{ tp.plan.value?.dest.name ?? '…' }}</b>
      <button type="button" class="w-9 h-9 rounded-full flex items-center justify-center" :aria-label="t('transport.clear')" @click="clearDest"><AppIcon name="close" /></button>
    </div>
    <label v-else class="flex items-center gap-3 py-3">
      <span class="w-3.5 h-3.5 rounded-[3px] bg-ink shrink-0" />
      <input v-model="q" type="text" inputmode="search" autocomplete="off" enterkeyhint="go" class="flex-1 min-w-0 bg-transparent outline-none text-[17px] font-semibold text-ink placeholder:font-semibold" :placeholder="t('transport.where')" :aria-label="t('transport.where')" @keydown.enter.prevent="searchEnter">
    </label>
  </div>

  <!-- sugestiile căutării -->
  <div v-if="!to && suggestions.length" class="mt-2 bg-white border border-line rounded-[16px] px-4 shadow-[0_8px_24px_rgba(0,0,0,.08)]" :aria-label="t('transport.suggestions')">
    <button v-for="s in suggestions" :key="s.key" type="button" class="w-full flex items-center gap-3 py-3 border-b border-line last:border-b-0 text-left" @click="goTo(s.key)">
      <AppIcon :name="s.icon" class="text-muted" />
      <span class="flex-1 min-w-0"><b class="block truncate text-[15px]">{{ s.name }}</b><span class="block truncate text-[12.5px] text-muted">{{ s.sub }}</span></span>
    </button>
  </div>
  <p v-else-if="!to && q.trim().length >= 2" class="text-[13px] text-muted mt-2 mb-0">{{ t('transport.noMatch') }}</p>

  <!-- ================= plan de drum ================= -->
  <template v-if="to">
    <EmptyState v-if="net.error.value" icon="cloud_off" :title="t('transport.loadError')" :action="t('transport.retry')" class="mt-6" @action="net.load().then(() => plan(false))" />
    <EmptyState v-else-if="tp.notFound.value" icon="wrong_location" :title="t('transport.notFound')" :action="t('transport.change')" class="mt-6" @action="clearDest" />
    <template v-else>
      <div class="flex items-start justify-between gap-3 mt-[18px] mb-2.5">
        <div class="min-w-0">
          <h2 class="text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] m-0">{{ t('transport.routes') }}</h2>
          <span v-if="tp.plan.value" class="text-muted text-[13.5px]">{{ t('transport.routesSub', { type: tp.plan.value.dest.type }) }}</span>
          <span v-else class="text-muted text-[13.5px]">{{ t('transport.planning') }}</span>
        </div>
        <button type="button" class="shrink-0 min-h-9 px-3 rounded-full border border-line bg-white text-[13px] font-medium" @click="clearDest">{{ t('transport.change') }}</button>
      </div>
      <Skeleton v-if="!tp.plan.value" :rows="3" :height="96" />
      <div v-else class="flex flex-col gap-2.5">
        <TripOptionCard v-for="(o, i) in tp.plan.value.options" :key="`o${i}`" :option="o" :selected="sel === i" :stops-by-id="net.stopsById.value" :parking="parking"
          :badge="i === 0 ? (o.kind === 'walk' ? 'simplest' : 'fastest') : null" @select="sel = i" />
        <div v-if="!tp.plan.value.options.some((o) => o.kind === 'transit')" class="flex gap-2.5 px-3.5 py-3 rounded-[14px] bg-soft text-muted text-[13.5px] leading-[1.45]">
          <AppIcon name="info" :size="18" class="shrink-0" />
          <span v-if="tp.plan.value.bestTransit">{{ t('transport.noFaster', { line: t(tp.plan.value.bestTransit.route.mode === 'BUS' ? 'transit.bus' : 'transit.tram', { n: tp.plan.value.bestTransit.route.shortName }), min: tp.plan.value.bestTransit.total }) }}</span>
          <span v-else>{{ t('transport.noTransit') }}</span>
        </div>
        <template v-if="tp.plan.value.others.length">
          <h2 class="text-[17px] font-semibold tracking-[-0.02em] mt-3 mb-0">{{ t('transport.other') }}</h2>
          <TripOptionCard v-for="(o, i) in tp.plan.value.others" :key="`x${i}`" :option="o" :selected="sel === tp.plan.value.options.length + i" :stops-by-id="net.stopsById.value" :parking="parking"
            @select="sel = tp.plan.value!.options.length + i" />
        </template>
      </div>
      <p class="text-muted text-[12px] mt-3.5 mb-0">{{ t('transport.footnote') }}</p>
      <div class="h-[60px]" />

      <!-- bara de jos (design `.bottombar`), peste tab bar -->
      <div v-if="current" class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-40 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-line flex items-center gap-2.5">
        <button type="button" class="flex-1 min-h-[52px] px-5 rounded-[16px] bg-ink text-white text-[16px] font-semibold flex items-center justify-center gap-2" @click="showMap()">
          <AppIcon name="map" :size="18" />{{ t('transport.showOnMap') }}</button>
        <button v-if="current.kind === 'transit'" type="button" class="min-h-[52px] px-4 rounded-[16px] bg-white border border-line text-ink text-[16px] font-semibold flex items-center justify-center gap-2" @click="showMap(true)">
          <AppIcon name="play_arrow" :size="18" />{{ t('transport.start') }}</button>
      </div>
    </template>
  </template>

  <!-- ================= fără destinație ================= -->
  <template v-else>
    <div class="flex gap-2 overflow-x-auto -mx-5 px-5 py-0.5 mt-3 [scrollbar-width:none]">
      <button v-for="p in POIS" :key="p.id" type="button" class="min-h-11 px-4 rounded-full inline-flex items-center gap-1.5 shrink-0 text-[14px] font-medium border border-line bg-white whitespace-nowrap" @click="goTo(`poi:${p.id}`)">
        <AppIcon :name="p.icon" :size="18" />{{ t(`transport.poi.${p.id}.name`) }}</button>
    </div>

    <!-- ca pe hartă (S7 / W9): liniile live, bicicletele și parcările -->
    <div class="grid grid-cols-3 gap-2 mt-4">
      <router-link :to="{ path: '/map', query: { travel: 'transit' } }" class="no-underline text-ink bg-white border border-line rounded-[16px] p-3 flex flex-col gap-1">
        <span class="w-8 h-8 rounded-[10px] bg-[#E8EFFB] text-[#1D5FD1] flex items-center justify-center"><AppIcon name="directions_bus" :size="19" /></span>
        <b class="text-[14px]">{{ t('transport.more.live') }}</b><span class="text-[11.5px] text-muted leading-tight">{{ t('transport.more.liveSub') }}</span>
      </router-link>
      <router-link :to="{ path: '/map', query: { travel: 'transit', ...(bikesNear[0] ? { focus: `bike:${bikesNear[0].s.id}` } : {}) } }" class="no-underline text-ink bg-white border border-line rounded-[16px] p-3 flex flex-col gap-1">
        <span class="w-8 h-8 rounded-[10px] bg-[#E3F4EC] text-[#0F8A5F] flex items-center justify-center"><AppIcon name="pedal_bike" :size="19" /></span>
        <b class="text-[14px]">{{ t('transport.more.bikes') }}</b><span class="text-[11.5px] text-muted leading-tight">{{ t('transport.more.bikesSub', { n: docks }) }}</span>
      </router-link>
      <router-link :to="{ path: '/map', query: { travel: 'car' } }" class="no-underline text-ink bg-white border border-line rounded-[16px] p-3 flex flex-col gap-1">
        <span class="w-8 h-8 rounded-[10px] border-[3px] border-[#E03B2F] bg-white font-bold flex items-center justify-center">P</span>
        <b class="text-[14px]">{{ t('transport.more.parking') }}</b><span class="text-[11.5px] text-muted leading-tight">{{ t('transport.more.parkingSub') }}</span>
      </router-link>
    </div>

    <h2 class="text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] mt-[22px] mb-2.5">{{ t('transport.nearby') }}</h2>
    <EmptyState v-if="net.error.value" icon="cloud_off" :title="t('transport.loadError')" :action="t('transport.retry')" @action="net.load()" />
    <Skeleton v-else-if="net.loading.value" :rows="2" :height="150" />
    <template v-else>
      <StopDepartures v-for="n in near" :key="n.stop.id" :stop="n.stop" :km="n.km" :routes="net.routes.value" :stops-by-id="net.stopsById.value" />
      <p v-if="!near.length" class="text-muted text-[14px] m-0">{{ t('transport.nearbyNone') }}</p>
    </template>

    <template v-if="bikesNear.length">
      <h2 class="text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] mt-5 mb-2.5">{{ t('transport.bikesNear') }}</h2>
      <div class="bg-white border border-line rounded-[20px] px-4 py-1">
        <router-link v-for="b in bikesNear" :key="b.s.id" :to="{ path: '/map', query: { travel: 'transit', focus: `bike:${b.s.id}` } }"
          class="no-underline text-ink flex items-center gap-3 py-3 border-b border-line last:border-b-0">
          <span class="w-9 h-9 rounded-full bg-[#0F8A5F] text-white flex items-center justify-center shrink-0"><AppIcon name="pedal_bike" :size="19" /></span>
          <span class="flex-1 min-w-0"><b class="block truncate text-[15px]">{{ b.s.name }}</b><span class="block truncate text-[13px] text-muted">{{ t('transport.bikeDock', { km: meters(b.km) }) }}</span></span>
          <AppIcon name="chevron_right" :size="18" />
        </router-link>
      </div>
    </template>

    <div class="flex items-center justify-between gap-3 mt-5 mb-2.5">
      <h2 class="text-[20px] leading-[1.2] font-semibold tracking-[-0.02em] m-0">{{ t('transport.lines') }}</h2>
      <div class="flex gap-1 p-1 rounded-[14px] bg-soft" role="tablist">
        <button v-for="m in (['TRAM', 'BUS'] as const)" :key="m" type="button" role="tab" :aria-selected="mode === m"
          class="h-8 px-3 rounded-[10px] text-[13.5px]" :class="mode === m ? 'bg-white text-ink font-semibold shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'text-muted font-medium'" @click="mode = m">{{ t(`transport.modes.${m}`) }}</button>
      </div>
    </div>
    <Skeleton v-if="net.loading.value" :rows="4" :height="56" />
    <div v-else-if="lineRows.length" class="bg-white border border-line rounded-[20px] px-4 py-1">
      <router-link v-for="r in lineRows" :key="r.route.id" :to="`/transport/lines/${r.route.id}/${r.dir!.pattern.index}`"
        class="no-underline text-ink flex items-center gap-3 py-3 border-b border-line last:border-b-0">
        <LineBadge :name="r.route.shortName" :color="r.route.color" :text-color="r.route.textColor" :mode="r.route.mode" :icon="false" wide />
        <div class="flex-1 min-w-0">
          <b class="block text-[15px] truncate">{{ r.dir!.from }} – {{ r.dir!.to }}</b>
          <span class="block text-[13px] text-muted truncate">
            {{ t('transport.lineRow', { n: r.stops, min: r.min }) }}<template v-if="liveByRoute.get(r.route.id)"> · <span class="text-green font-semibold">{{ t('transport.liveShort', { n: liveByRoute.get(r.route.id) }) }}</span></template>
          </span>
        </div>
        <AppIcon name="chevron_right" :size="18" />
      </router-link>
    </div>
    <p class="text-muted text-[12px] mt-3.5 mb-0">{{ t('transport.footnote') }}</p>
  </template>
</template>
