<script setup lang="ts">
// T08 · harta comună (mobil S7, web, itinerar T13, transport T22). Google Maps când există cheia de browser
// (VITE_GOOGLE_MAPS_KEY); altfel, sau dacă Google nu se încarcă, rezerva Leaflet, ca harta să nu rămână goală.
// Ecranele importă doar MapView; doar map/LeafletMapCanvas importă Leaflet și doar map/GoogleMapCanvas folosește Google.
import { defineAsyncComponent, ref, watch } from 'vue'
import type { GeoPoint } from '@/shared/types/common'
import { GOOGLE_MAPS_KEY, googleUnavailable } from '@/shared/composables/useGoogleMaps'
import type { MapApi, MapEmits, MapProps } from './types'

export type { MapMarker } from './types'

const props = withDefaults(defineProps<MapProps>(),
  { selectedId: null, route: null, routeApproximate: false, me: null, center: null, zoom: 15, insets: () => ({ top: 70, bottom: 70 }) })
const emit = defineEmits<MapEmits>()

const GoogleMapCanvas = defineAsyncComponent(() => import('./GoogleMapCanvas.vue'))
const LeafletMapCanvas = defineAsyncComponent(() => import('./LeafletMapCanvas.vue'))

const useGoogle = ref(!!GOOGLE_MAPS_KEY && !googleUnavailable())
const canvas = ref<MapApi | null>(null)

// harta se încarcă asincron: un „zboară la” cerut înainte (locația găsită la deschidere) se aplică imediat ce e gata
let pendingFly: [GeoPoint, number | undefined] | null = null
watch(canvas, (c) => { if (c && pendingFly) { c.flyTo(...pendingFly); pendingFly = null } })

defineExpose({
  zoomBy: (d: number) => canvas.value?.zoomBy(d),
  flyTo: (p: GeoPoint, zoom?: number) => { if (canvas.value) canvas.value.flyTo(p, zoom); else pendingFly = [p, zoom] },
  panTo: (p: GeoPoint) => { if (canvas.value) canvas.value.panTo(p); else pendingFly = [p, undefined] },
  invalidate: () => canvas.value?.invalidate(),
})
</script>

<template>
  <GoogleMapCanvas v-if="useGoogle" ref="canvas" v-bind="props" @select="emit('select', $event)" @interact="emit('interact')"
    @press="(p, long) => emit('press', p, long)" @failed="useGoogle = false" />
  <LeafletMapCanvas v-else ref="canvas" v-bind="props" @select="emit('select', $event)" @interact="emit('interact')" @press="(p, long) => emit('press', p, long)" />
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
.ax-pin--stop { background: #fff; border-color: var(--pin, #1D5FD1); width: 18px; height: 18px; }
/* vehiculul: în culoarea liniei când o știm (harta traseului, T19), altfel albastrul transportului */
.ax-pin--vehicle { background: var(--pin, #1D5FD1); }
/* steagul destinației din harta traseului (T19): ligatura Material Symbols „flag” pe negru */
.ax-pin--dest { background: #111; font: 400 15px 'Material Symbols Outlined'; font-feature-settings: 'liga'; font-variation-settings: 'FILL' 1; }
/* stratul „Parcări”: „P” pe alb, marginea în culoarea zonei (`--pin`, din MapMarker.color) */
.ax-pin--parking { width: 22px; height: 22px; border-radius: 7px; background: #fff; color: #111; border-color: var(--pin, #111); font-size: 11.5px; }
/* stațiile de biciclete: eticheta e ligatura Material Symbols „pedal_bike” */
.ax-pin--bike { background: #0F8A5F; font: 400 15px 'Material Symbols Outlined'; font-feature-settings: 'liga'; }
.ax-pin--sel { transform: scale(1.3); }
/* Leaflet: cutia divIcon (26 × 26, ancorată la centru) centrează pinii mai mici */
.leaflet-marker-icon.ax-pin-box { display: flex; align-items: center; justify-content: center; }
.ax-me {
  width: 18px; height: 18px; border-radius: 50%; background: #1D5FD1; border: 3px solid #fff;
  box-shadow: 0 0 0 10px rgba(29, 95, 209, .18); position: relative;
}
/* săgeata direcției: un evantai albastru deasupra punctului, rotit din centrul lui (`setMeHeading`) */
.ax-me-wrap { position: relative; width: 18px; height: 18px; }
.ax-me-cone {
  position: absolute; left: -21px; top: -21px; width: 60px; height: 60px; pointer-events: none;
  background: conic-gradient(from -28deg at 50% 50%, rgba(29, 95, 209, .55) 0deg, rgba(29, 95, 209, 0) 56deg, transparent 56deg);
  -webkit-mask: radial-gradient(circle at 50% 50%, #000 0 30px, transparent 31px); mask: radial-gradient(circle at 50% 50%, #000 0 30px, transparent 31px);
  transition: transform .3s ease-out;
}
</style>
