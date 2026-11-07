<script setup lang="ts">
// T19 · un card din „Stații lângă tine” (design/final Transport): numele stației și distanța, apoi câte un rând pe linie și
// direcție — insigna, „Spre …”, peste câte minute (verde) și plecarea de după. Live din `/transit/nearest` pe coordonatele
// stației (aduce și peronul de vizavi), la 30 s cât ecranul e vizibil. Rândul duce la pagina liniei.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import LineBadge from '@/shared/components/transit/LineBadge.vue'
import { useNearestStop } from '@/shared/composables/useTransit'
import { departureRows, stopLabel } from '@/shared/composables/useTripPlanner'
import { useFormat } from '@/shared/composables/useFormat'
import type { TransitArrivalDto, TransitRouteDto, TransitStopDto } from '@/shared/types/transit'

const props = defineProps<{ stop: TransitStopDto; km: number; routes: TransitRouteDto[]; stopsById: Map<number, TransitStopDto> }>()
const router = useRouter()
const { t } = useI18n()
const f = useFormat()

const point = computed(() => ({ lat: props.stop.lat, lng: props.stop.lng }))
const { data, loading } = useNearestStop(point)
const rows = computed(() => departureRows(data.value?.arrivals ?? [], props.routes, props.stopsById))
const meters = computed(() => (props.km < 1 ? `${Math.round(props.km * 1000)} m` : f.km(props.km)))

const when = (a: TransitArrivalDto) => (a.minutes <= 0 ? t('transport.now') : a.minutes < 60 ? t('transport.min', { n: a.minutes }) : t('transport.at', { time: f.timeRange(a.at) }))

function open(r: (typeof rows.value)[number]) {
  router.push(`/transport/lines/${r.routeId}/${r.pattern?.index ?? r.route?.patterns[0]?.index ?? 0}`)
}
</script>

<template>
  <div class="bg-white border border-line rounded-[20px] px-4 py-1 mb-3 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)]" data-test="stop-departures">
    <div class="flex items-center justify-between gap-2.5 py-2.5 border-b border-line">
      <b class="flex items-center gap-2 text-[17px] min-w-0"><AppIcon name="signpost" /><span class="truncate">{{ stopLabel(stop.name) }}</span></b>
      <span class="text-muted shrink-0">{{ meters }}</span>
    </div>
    <div v-if="loading && !data" class="py-2"><Skeleton :rows="2" :height="30" /></div>
    <template v-else-if="rows.length">
      <button v-for="r in rows" :key="`${r.routeId}-${r.to}`" type="button" class="w-full flex items-center gap-2.5 py-[11px] border-b border-line last:border-b-0 text-left" @click="open(r)">
        <LineBadge :name="r.shortName" :color="r.route?.color ?? r.first.color" :text-color="r.route?.textColor" :mode="r.route?.mode ?? r.first.mode" />
        <span class="flex-1 min-w-0 truncate text-[15px]">{{ r.to ? t('transport.towards', { name: r.to }) : '' }}</span>
        <b class="shrink-0" :class="r.first.realtime ? 'text-green' : 'text-muted font-semibold'">{{ when(r.first) }}</b>
        <span v-if="r.then" class="shrink-0 text-muted text-[13px]">{{ t('transport.then', { time: f.timeRange(r.then.at) }) }}</span>
        <AppIcon name="chevron_right" :size="18" class="shrink-0" />
      </button>
    </template>
    <p v-else class="m-0 py-3 text-[13.5px] text-muted">
      {{ data && !data.live ? t('transport.noLive', { lines: stop.lines.join(', ') }) : t('transport.noDepartures') }}
    </p>
  </div>
</template>
