<script setup lang="ts">
// T19 · harta traseului (design/final mobil `#/transport/trip/gara`): tot drumul pe hartă — mersul pe jos punctat (OSRM, linie
// dreaptă dacă nu răspunde), linia întreagă estompată și bucata ta groasă în culoarea liniei, stațiile, steagul destinației —
// cu cardul de jos (destinația, „N min · ajungi HH:MM”, cei trei pași) și „Pornește călătoria”. Călătoria (`?live=1`) e
// simularea din design: bannerul „Mai ai N stații · Următoarea: X” cu „Următoarea”, portocaliu la ultima stație; în plus,
// cu GPS-ul pornit avansează singură când ajungi lângă stația următoare, iar vehiculele live ale liniei apar pe hartă.
// Variantele pe jos / cu bicicleta / cu mașina (în plus față de prototip) au aceeași hartă, cu Google Maps în loc de călătorie.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState } from '@/shared/components'
import MapView from '@/shared/components/map/MapView.vue'
import LineBadge from '@/shared/components/transit/LineBadge.vue'
import type { MapLine, MapMarker } from '@/shared/components/map/types'
import { useBack } from '@/shared/composables/useBack'
import { distanceKm, fetchDirections, googleMapsUrl, type TravelMode } from '@/shared/composables/useDirections'
import { useFormat } from '@/shared/composables/useFormat'
import { useTransitVehicles } from '@/shared/composables/useTransit'
import { useTransitNetwork, useTransportGeo, useTripPlan } from '@/shared/composables/useTransport'
import { lineColors, stopLabel, terminalName, type TripOption } from '@/shared/composables/useTripPlanner'
import { ZONE_COLORS } from '@/shared/data/parking/parking'
import { parseTo } from '@/shared/data/transport/destinations'
import { useUiStore } from '@/shared/stores/ui'
import type { GeoPoint } from '@/shared/types/common'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()
const ui = useUiStore()
const back = useBack('/transport')
const net = useTransitNetwork()
const geo = useTransportGeo()
const tp = useTripPlan()
const vehicles = useTransitVehicles()

const to = computed(() => parseTo(route.params.to))
const all = computed<TripOption[]>(() => (tp.plan.value ? [...tp.plan.value.options, ...tp.plan.value.others] : []))
const opt = computed<TripOption | null>(() => all.value[Number(route.query.opt) || 0] ?? all.value[0] ?? null)
const tr = computed(() => (opt.value?.kind === 'transit' ? opt.value : null))
const dest = computed(() => tp.plan.value?.dest ?? null)
const origin = computed<GeoPoint>(() => geo.origin.value)
const color = computed(() => lineColors(tr.value?.route).bg)
const arrive = computed(() => (opt.value ? f.timeRange(new Date(Date.now() + opt.value.total * 60_000).toISOString()) : ''))

/* ---------- călătoria simulată ---------- */
const live = ref(route.query.live === '1')
const step = ref(0)
const last = computed(() => (tr.value ? tr.value.stops.length - 1 : 0))
const remaining = computed(() => Math.max(0, last.value - step.value))
const nextStop = computed(() => (tr.value ? stopLabel(tr.value.stops[Math.min(step.value + 1, last.value)].name) : ''))
const minsLeft = computed(() => (tr.value && last.value ? Math.max(0, Math.round((tr.value.rideMin * remaining.value) / last.value)) : 0))

function start() {
  live.value = true
  step.value = 0
  router.replace({ query: { ...route.query, live: '1' } })
}
function nextStep() { step.value = Math.min(last.value, step.value + 1) }
function end() {
  live.value = false
  ui.toast(t('transport.trip.ended'), 'success')
  router.push('/transport')
}

// cu GPS-ul pornit, călătoria avansează singură când ajungi la ~120 m de o stație de mai încolo
let watchId: number | null = null
function stopWatch() { if (watchId != null) navigator.geolocation?.clearWatch(watchId); watchId = null }
watch([live, tr], ([on, o]) => {
  stopWatch()
  if (!on || !o || !geo.here.value || typeof navigator === 'undefined' || !navigator.geolocation) return
  watchId = navigator.geolocation.watchPosition((p) => {
    const me = { lat: p.coords.latitude, lng: p.coords.longitude }
    for (let i = last.value; i > step.value; i--) if (distanceKm(me, o.stops[i]) < 0.12) { step.value = i; break }
  }, () => { /* fără GPS: rămâne butonul „Următoarea” */ }, { enableHighAccuracy: true, maximumAge: 10_000 })
}, { immediate: true })
onBeforeUnmount(stopWatch)

/* ---------- geometria pașilor (OSRM; linie dreaptă până răspunde sau dacă nu răspunde) ---------- */
type Path = [number, number][]
const legs = shallowRef<{ walk1?: Path; main?: Path; walk2?: Path; approx?: boolean }>({})
let legSeq = 0
const P = (p: GeoPoint): [number, number] => [p.lat, p.lng]

watch([opt, dest], async ([o, d]) => {
  if (!o || !d) return
  const seq = ++legSeq
  const O = origin.value
  const plan: { key: 'walk1' | 'main' | 'walk2'; a: GeoPoint; b: GeoPoint; mode: TravelMode }[] = []
  if (o.kind === 'transit') plan.push({ key: 'walk1', a: O, b: o.board, mode: 'foot' }, { key: 'walk2', a: o.alight, b: d, mode: 'foot' })
  else if (o.kind === 'walk') plan.push({ key: 'main', a: O, b: d, mode: 'foot' })
  else if (o.kind === 'bike') plan.push({ key: 'walk1', a: O, b: o.from, mode: 'foot' }, { key: 'main', a: o.from, b: o.to, mode: 'bike' }, { key: 'walk2', a: o.to, b: d, mode: 'foot' })
  else plan.push({ key: 'main', a: O, b: o.parking ?? d, mode: 'car' }, ...(o.parking ? [{ key: 'walk2' as const, a: o.parking, b: d, mode: 'foot' as const }] : []))
  legs.value = Object.fromEntries(plan.map((l) => [l.key, [P(l.a), P(l.b)]]))
  const res = await Promise.all(plan.map((l) => fetchDirections(l.a, l.b, l.mode)))
  if (seq !== legSeq) return
  legs.value = { ...Object.fromEntries(plan.map((l, i) => [l.key, res[i].line])), approx: res.some((r) => r.approximate) }
}, { immediate: true })

/* ---------- harta ---------- */
const WALK = '#1D5FD1'
const lineVehicles = computed(() => (tr.value ? vehicles.vehicles.value.filter((v) => !v.stale && v.routeId === tr.value!.route.id) : []))
const lines = computed<MapLine[]>(() => {
  const o = opt.value
  const out: MapLine[] = []
  if (tr.value) {
    const full = tr.value.pattern.path.length > 1 ? tr.value.pattern.path : tr.value.stops.map(P)
    out.push({ id: 'trip:line', path: full, color: color.value, weight: 2, opacity: 0.35 })
    out.push({ id: 'trip:ride', path: tr.value.path, color: color.value, weight: 6, opacity: 0.95 })
  }
  if (o?.kind === 'bike' && legs.value.main) out.push({ id: 'trip:bike', path: legs.value.main, color: '#0F8A5F', weight: 5, opacity: 0.95 })
  if (o?.kind === 'car' && legs.value.main) out.push({ id: 'trip:car', path: legs.value.main, color: '#111111', weight: 5, opacity: 0.85 })
  if (o?.kind === 'walk' && legs.value.main) out.push({ id: 'trip:walk', path: legs.value.main, color: WALK, weight: 5, opacity: 1, dash: true })
  for (const k of ['walk1', 'walk2'] as const) if (legs.value[k]) out.push({ id: `trip:${k}`, path: legs.value[k]!, color: WALK, weight: 4, opacity: 1, dash: true })
  return out
})
const markers = computed<MapMarker[]>(() => {
  const o = opt.value, d = dest.value
  const out: MapMarker[] = []
  if (tr.value) {
    tr.value.stops.forEach((s, i) => out.push({ id: `trip:stop:${i}`, lat: s.lat, lng: s.lng, kind: 'stop', color: color.value }))
    for (const v of lineVehicles.value) out.push({ id: `vehicle:${v.id}`, lat: v.lat, lng: v.lng, kind: 'vehicle', label: v.routeShortName ?? '', color: color.value })
    if (live.value) { const s = tr.value.stops[Math.min(step.value, last.value)]; out.push({ id: 'trip:me', lat: s.lat, lng: s.lng, kind: 'vehicle', label: tr.value.route.shortName, color: color.value }) }
  }
  if (o?.kind === 'bike') for (const b of [o.from, o.to]) out.push({ id: `bike:${b.id}`, lat: b.lat, lng: b.lng, kind: 'bike', label: 'pedal_bike' })
  if (o?.kind === 'car' && o.parking) out.push({ id: 'trip:parking', lat: o.parking.lat, lng: o.parking.lng, kind: 'parking', label: 'P', color: ZONE_COLORS[o.parking.zone] })
  if (d) out.push({ id: 'trip:dest', lat: d.lat, lng: d.lng, kind: 'dest', label: 'flag' })
  return out
})
const fit = computed<Path | null>(() => {
  if (!dest.value) return null
  return [P(origin.value), P(dest.value), ...(tr.value?.path ?? []), ...(legs.value.main ?? [])]
})
const travelMode = computed<TravelMode>(() => (opt.value?.kind === 'car' ? 'car' : opt.value?.kind === 'bike' ? 'bike' : 'foot'))

onMounted(async () => {
  await net.load()
  if (to.value && !net.error.value) await tp.compute(to.value, geo.origin.value, { stops: net.stops.value, routes: net.routes.value, stopsById: net.stopsById.value })
})
</script>

<template>
  <div class="fixed inset-0 mx-auto w-full max-w-[480px] z-0">
    <EmptyState v-if="net.error.value || tp.notFound.value" icon="wrong_location" :title="t(net.error.value ? 'transport.loadError' : 'transport.notFound')"
      :action="t('transport.title')" class="pt-28 px-5" @action="router.push('/transport')" />
    <template v-else>
      <MapView :markers="markers" :lines="lines" :fit="fit" :me="origin" :selected-id="live ? 'trip:me' : null" :insets="{ top: 130, bottom: 360 }" />

      <!-- sus: înapoi + rezumatul (previzualizare) sau bannerul călătoriei -->
      <div class="absolute left-4 right-4 top-[max(12px,env(safe-area-inset-top))] z-[500]">
        <div v-if="!live" class="flex items-center gap-2.5">
          <button type="button" class="w-12 h-12 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center shrink-0" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
          <div v-if="opt" class="flex-1 min-w-0 h-12 px-4 rounded-[16px] bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.12)] flex items-center gap-2.5 font-semibold text-[16px]">
            <template v-if="tr"><LineBadge :name="tr.route.shortName" :color="tr.route.color" :text-color="tr.route.textColor" :mode="tr.route.mode" :icon="false" />
              <span class="truncate">{{ t('transport.trip.summary', { min: tr.total, stops: t('transport.stops', tr.alightIdx - tr.boardIdx) }) }}</span></template>
            <template v-else><AppIcon :name="opt.kind === 'car' ? 'directions_car' : opt.kind === 'bike' ? 'pedal_bike' : 'directions_walk'" :size="20" /><span class="truncate">{{ f.minutes(opt.total) }}</span></template>
          </div>
        </div>
        <div v-else-if="tr && remaining <= 1" class="rounded-[18px] px-3.5 py-3 flex items-center gap-3 bg-[#F08A00] text-[#111] shadow-[0_10px_30px_rgba(0,0,0,.25)]" role="status">
          <AppIcon name="notifications_active" />
          <div class="flex-1 min-w-0"><b>{{ t('transport.trip.getOff') }}</b><br><span class="text-[13px]">{{ t('transport.trip.thenWalk', { stop: stopLabel(tr.alight.name), min: tr.walk2Min }) }}</span></div>
          <button type="button" class="min-h-9 px-3 rounded-full bg-white border border-line text-[13px] font-medium" @click="end">{{ t('transport.trip.done') }}</button>
        </div>
        <div v-else-if="tr" class="rounded-[18px] px-3.5 py-3 flex items-center gap-3 bg-[#111] text-white shadow-[0_10px_30px_rgba(0,0,0,.25)]" role="status">
          <AppIcon :name="tr.route.mode === 'BUS' ? 'directions_bus' : 'tram'" />
          <div class="flex-1 min-w-0"><b>{{ t('transport.trip.left', { stops: t('transport.stops', remaining), min: minsLeft }) }}</b><br>
            <span class="text-[13px] opacity-85">{{ t('transport.trip.next', { name: nextStop }) }}</span></div>
          <button type="button" class="min-h-9 px-3 rounded-full bg-white text-[#111] text-[13px] font-medium" @click="nextStep">{{ t('transport.trip.nextBtn') }}</button>
        </div>
      </div>

      <!-- cardul de jos (design `.mapcard`), deasupra tab bar-ului -->
      <div v-if="opt && dest" class="absolute left-4 right-4 bottom-[110px] z-[600] bg-white rounded-[22px] p-3.5 shadow-[0_14px_40px_rgba(0,0,0,.22)]" data-test="trip-card">
        <div class="flex items-center justify-between gap-2">
          <b class="text-[16px] min-w-0 truncate">{{ dest.name }}</b>
          <span class="shrink-0 px-2.5 py-1 rounded-full bg-green-soft text-green-deep font-semibold text-[13px]">{{ t('transport.trip.badge', { min: opt.total, time: arrive }) }}</span>
        </div>
        <div class="flex flex-col mt-2.5 text-[14px]">
          <template v-if="tr">
            <div class="flex items-center gap-2.5 py-[7px] border-b border-line"><span class="w-2.5 h-2.5 rounded-full bg-[#1D5FD1] shrink-0 mx-[7px]" /><span class="flex-1">{{ t('transport.trip.walkToStop', { min: tr.walk1Min }) }} <b>{{ stopLabel(tr.board.name) }}</b></span></div>
            <div class="flex items-center gap-2.5 py-[7px] border-b border-line"><LineBadge :name="tr.route.shortName" :color="tr.route.color" :text-color="tr.route.textColor" :mode="tr.route.mode" size="xs" />
              <span class="flex-1">{{ t('transport.trip.ride', { stops: t('transport.stops', tr.alightIdx - tr.boardIdx), min: tr.rideMin, to: terminalName(tr.pattern, net.stopsById.value) }) }} <b>{{ stopLabel(tr.alight.name) }}</b></span></div>
            <div class="flex items-center gap-2.5 py-[7px]"><span class="w-2.5 h-2.5 rounded-full bg-[#1D5FD1] shrink-0 mx-[7px]" /><span class="flex-1">{{ t('transport.trip.walkToDest', { min: tr.walk2Min }) }}</span></div>
          </template>
          <template v-else-if="opt.kind === 'walk'">
            <div class="flex items-center gap-2.5 py-[7px]"><span class="w-2.5 h-2.5 rounded-full bg-[#1D5FD1] shrink-0 mx-[7px]" /><span class="flex-1">{{ t('transport.trip.walkAll', { min: opt.total, km: f.km(opt.km) }) }}</span></div>
          </template>
          <template v-else-if="opt.kind === 'bike'">
            <div class="flex items-center gap-2.5 py-[7px] border-b border-line"><span class="w-2.5 h-2.5 rounded-full bg-[#1D5FD1] shrink-0 mx-[7px]" /><span class="flex-1">{{ t('transport.trip.walkToDock', { min: opt.walk1Min }) }} <b>{{ opt.from.name }}</b></span></div>
            <div class="flex items-center gap-2.5 py-[7px] border-b border-line"><span class="w-6 h-6 rounded-full bg-[#0F8A5F] text-white flex items-center justify-center shrink-0"><AppIcon name="pedal_bike" :size="15" /></span>
              <span class="flex-1">{{ t('transport.trip.rideBike', { min: opt.rideMin }) }} <b>{{ opt.to.name }}</b></span></div>
            <div class="flex items-center gap-2.5 py-[7px]"><span class="w-2.5 h-2.5 rounded-full bg-[#1D5FD1] shrink-0 mx-[7px]" /><span class="flex-1">{{ t('transport.trip.walkToDest', { min: opt.walk2Min }) }}</span></div>
          </template>
          <template v-else-if="opt.kind === 'car'">
            <div class="flex items-center gap-2.5 py-[7px]" :class="opt.parking && 'border-b border-line'"><AppIcon name="directions_car" :size="20" class="shrink-0 mx-0.5" /><span class="flex-1">{{ t('transport.trip.drive', { min: opt.driveMin, km: f.km(opt.km) }) }}</span></div>
            <template v-if="opt.parking">
              <div class="flex items-center gap-2.5 py-[7px] border-b border-line"><span class="w-6 h-6 rounded-[7px] border-[3px] bg-white text-[11px] font-bold flex items-center justify-center shrink-0" :style="{ borderColor: ZONE_COLORS[opt.parking.zone] }">P</span>
                <span class="flex-1">{{ t('transport.trip.parkAt') }} <b>{{ opt.parking.name }}</b> · {{ t('parking.card.zoneName', { n: opt.parking.zone, color: t(`parking.color.${opt.parking.zone}`) }) }}</span></div>
              <div class="flex items-center gap-2.5 py-[7px]"><span class="w-2.5 h-2.5 rounded-full bg-[#1D5FD1] shrink-0 mx-[7px]" /><span class="flex-1">{{ t('transport.trip.walkToDest', { min: opt.walkMin }) }}</span></div>
            </template>
          </template>
        </div>
        <p v-if="legs.approx" class="text-[12px] text-muted mt-1 mb-0">{{ t('transport.trip.approximate') }}</p>
        <div class="flex gap-2 mt-2.5">
          <button v-if="tr && live" type="button" class="flex-1 min-h-11 px-4 rounded-[14px] bg-white border border-line text-ink text-[15px] font-semibold" @click="end">{{ t('transport.trip.stop') }}</button>
          <template v-else>
            <button v-if="tr" type="button" class="flex-1 min-h-11 px-4 rounded-[14px] bg-ink text-white text-[15px] font-semibold flex items-center justify-center gap-2" @click="start">
              <AppIcon name="play_arrow" :size="18" />{{ t('transport.trip.start') }}</button>
            <a v-else :href="googleMapsUrl(dest, travelMode)" target="_blank" rel="noopener" class="flex-1 min-h-11 px-4 rounded-[14px] bg-ink text-white text-[15px] font-semibold flex items-center justify-center gap-2 no-underline">
              <AppIcon name="open_in_new" :size="18" />{{ t('transport.trip.googleMaps') }}</a>
            <button type="button" class="min-h-11 px-4 rounded-[14px] bg-white border border-line text-ink text-[15px] font-semibold" @click="back">{{ t('transport.trip.back') }}</button>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
