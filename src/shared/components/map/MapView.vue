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

<style>
/* design/final/shared/ui.css: .pin, .me-dot — aici, în fațadă, ca să existe oricare hartă se încarcă (Google sau Leaflet) */
.ax-pin {
  width: 26px; height: 26px; border-radius: 50%; background: #FF5A36; border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .25); display: flex; align-items: center; justify-content: center;
  color: #fff; font: 700 11px Inter, system-ui, sans-serif; transition: transform .15s;
}
.ax-pin--place { background: #111; }
.ax-pin--offer { background: #E0A400; }
.ax-pin--action { background: #3B6D11; }
.ax-pin--stop { background: #fff; border-color: #1D5FD1; width: 18px; height: 18px; }
.ax-pin--vehicle { background: #1D5FD1; }
.ax-pin--sel { transform: scale(1.3); }
.ax-me {
  width: 18px; height: 18px; border-radius: 50%; background: #1D5FD1; border: 3px solid #fff;
  box-shadow: 0 0 0 10px rgba(29, 95, 209, .18);
}
</style>
