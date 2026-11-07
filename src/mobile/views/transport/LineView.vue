<script setup lang="ts">
// T19 · pagina unei linii (design/final mobil `#/transport/line/1/0`): insigna + „spre …”, direcțiile ca segmente, cardul cu
// stațiile și durata cap la cap, apoi stațiile pe linia verticală în culoarea liniei, cu „lângă tine” și minutele de la plecare.
// Pe datele reale CTP (`/transit/routes`, tramvaie și autobuze): `:id` = routeId, `:dir` = indexul variantei. În plus față de
// prototip: vehiculele live ale liniei apar la stația spre care merg („vine”). Atingi o stație → planul de drum până acolo.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import LineBadge from '@/shared/components/transit/LineBadge.vue'
import { useBack } from '@/shared/composables/useBack'
import { useTransitVehicles } from '@/shared/composables/useTransit'
import { useTransitNetwork, useTransportGeo } from '@/shared/composables/useTransport'
import { lineColors, lineDirections, patternGeo, rideMinutes, stopLabel } from '@/shared/composables/useTripPlanner'
import { distanceKm } from '@/shared/composables/useDirections'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const back = useBack('/transport')
const net = useTransitNetwork()
const geo = useTransportGeo()
const vehicles = useTransitVehicles()

const line = computed(() => net.routes.value.find((r) => String(r.id) === String(route.params.id)) ?? null)
const dirs = computed(() => (line.value ? lineDirections(line.value, net.stopsById.value) : []))
const dir = computed(() => dirs.value.find((d) => String(d.pattern.index) === String(route.params.dir)) ?? dirs.value[0] ?? null)
const geom = computed(() => (dir.value ? patternGeo(dir.value.pattern, net.stopsById.value) : null))
const color = computed(() => lineColors(line.value).bg)
const total = computed(() => (geom.value && geom.value.stops.length > 1 ? rideMinutes(geom.value, 0, geom.value.stops.length - 1) : 0))
const live = computed(() => vehicles.vehicles.value.filter((v) => !v.stale && v.routeId === line.value?.id))
/** stațiile spre care merge acum un vehicul al liniei (în direcția asta: peronul e în variantă) */
const coming = computed(() => new Set(live.value.map((v) => v.nextStopId).filter((id): id is number => id != null)))
const rows = computed(() => (geom.value?.stops ?? []).map((s, i) => ({
  stop: s, i,
  near: geo.here.value && distanceKm(geo.position.value, s) <= 0.6,
  min: i === 0 || !geom.value ? 0 : rideMinutes(geom.value, 0, i),
})))

function setDir(index: number) {
  router.replace(`/transport/lines/${route.params.id}/${index}`)
}

onMounted(net.load)
</script>

<template>
  <Skeleton v-if="net.loading.value" :rows="6" :height="52" class="mt-4" />
  <EmptyState v-else-if="net.error.value" icon="cloud_off" :title="t('transport.loadError')" :action="t('transport.retry')" class="mt-10" @action="net.load()" />
  <EmptyState v-else-if="!line || !dir" icon="search_off" :title="t('transport.line.notFound')" :action="t('transport.title')" class="mt-10" @action="router.push('/transport')" />
  <template v-else>
    <!-- design `.hd.back` -->
    <div class="flex items-center gap-1 pt-2 mb-3.5 -ml-2.5">
      <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center shrink-0" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
      <h1 class="flex items-center gap-2 min-w-0 m-0 text-[24px] font-semibold tracking-[-0.03em] leading-tight">
        <LineBadge :name="line.shortName" :color="line.color" :text-color="line.textColor" :mode="line.mode" size="lg" />
        <span class="text-[20px] truncate">{{ t('transport.line.towards', { name: dir.to }) }}</span>
      </h1>
    </div>

    <div v-if="dirs.length > 1" class="flex gap-1 p-1 rounded-[16px] bg-soft mb-4 overflow-x-auto [scrollbar-width:none]" role="tablist">
      <button v-for="d in dirs" :key="d.pattern.index" type="button" role="tab" :aria-selected="d.pattern.index === dir.pattern.index"
        class="flex-1 min-w-fit min-h-11 px-3 rounded-[12px] text-[15px] whitespace-nowrap" :class="d.pattern.index === dir.pattern.index ? 'bg-white text-ink font-semibold shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'text-muted font-medium'"
        @click="setDir(d.pattern.index)">{{ t('transport.towards', { name: d.to }) }}</button>
    </div>

    <div class="bg-white border border-line rounded-[20px] p-4 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)]">
      <span class="text-muted">{{ t('transport.line.info', { n: geom?.stops.length ?? 0, min: total }) }}</span>
      <div v-if="live.length" class="mt-1 text-[13.5px] font-semibold text-green flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-green" />{{ t('transport.liveCount', live.length) }}
      </div>
    </div>

    <!-- stațiile pe linia verticală (design: bara de 6px în culoarea liniei, cercurile albe cu margine) -->
    <div class="relative mt-4 ml-2.5 pl-7">
      <div class="absolute left-[5px] top-2.5 bottom-2.5 w-1.5 rounded-[3px]" :style="{ background: color }" />
      <button v-for="r in rows" :key="`${r.stop.id}-${r.i}`" type="button" class="relative w-full flex items-center gap-3 py-2.5 text-left"
        @click="router.push({ path: '/transport', query: { to: `stop:${r.stop.id}` } })">
        <span v-if="coming.has(r.stop.id)" class="absolute -left-[31px] top-[9px] w-[22px] h-[22px] rounded-full flex items-center justify-center text-white shadow-[0_2px_6px_rgba(0,0,0,.25)]" :style="{ background: color }">
          <AppIcon :name="line.mode === 'BUS' ? 'directions_bus' : 'tram'" :size="14" fill />
        </span>
        <span v-else class="absolute -left-7 top-3.5 w-4 h-4 rounded-full bg-white border-[3px]" :style="{ borderColor: color }" />
        <span class="flex-1 min-w-0 text-[15px]" :class="r.near ? 'font-bold' : 'font-medium'">
          {{ stopLabel(r.stop.name) }}
          <span v-if="r.near" class="inline-flex ml-1 px-2.5 py-1 rounded-full bg-soft text-[11px] font-medium align-middle">{{ t('transport.line.nearYou') }}</span>
          <span v-if="coming.has(r.stop.id)" class="inline-flex ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold align-middle bg-green-soft text-green-deep">{{ t('transport.line.arriving') }}</span>
        </span>
        <span class="text-muted text-[13px] shrink-0">{{ r.i === 0 ? t('transport.line.departure') : t('transport.line.plus', { n: r.min }) }}</span>
      </button>
    </div>
    <p class="text-muted text-[12px] mt-3.5 mb-0">{{ t('transport.line.tapStop') }} {{ t('transit.attribution') }}</p>
  </template>
</template>
