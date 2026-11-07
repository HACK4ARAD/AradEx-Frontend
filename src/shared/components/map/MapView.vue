<script setup lang="ts">
// T08 · harta comună (mobil S7, web, itinerar T13, transport T22). Google Maps când există cheia de browser
// (VITE_GOOGLE_MAPS_KEY); altfel, sau dacă Google nu se încarcă, rezerva Leaflet, ca harta să nu rămână goală.
// Ecranele importă doar MapView; doar map/LeafletMapCanvas importă Leaflet și doar map/GoogleMapCanvas folosește Google.
import { defineAsyncComponent, ref } from 'vue'
import type { GeoPoint } from '@/shared/types/common'
import { GOOGLE_MAPS_KEY } from '@/shared/composables/useGoogleMaps'
import type { MapApi, MapProps } from './types'

export type { MapMarker } from './types'

const props = withDefaults(defineProps<MapProps>(),
  { selectedId: null, route: null, routeApproximate: false, me: null, zoom: 15, insets: () => ({ top: 70, bottom: 70 }) })
const emit = defineEmits<{ select: [id: string | null] }>()

const GoogleMapCanvas = defineAsyncComponent(() => import('./GoogleMapCanvas.vue'))
const LeafletMapCanvas = defineAsyncComponent(() => import('./LeafletMapCanvas.vue'))

const useGoogle = ref(!!GOOGLE_MAPS_KEY)
const canvas = ref<MapApi | null>(null)

defineExpose({
  zoomBy: (d: number) => canvas.value?.zoomBy(d),
  flyTo: (p: GeoPoint, zoom?: number) => canvas.value?.flyTo(p, zoom),
  invalidate: () => canvas.value?.invalidate(),
})
</script>

<template>
  <GoogleMapCanvas v-if="useGoogle" ref="canvas" v-bind="props" @select="emit('select', $event)" @failed="useGoogle = false" />
  <LeafletMapCanvas v-else ref="canvas" v-bind="props" @select="emit('select', $event)" />
</template>
