<script setup lang="ts">
// T08 · harta comună (mobil S7, web, itinerar T13, transport T22): singurul loc care importă Leaflet.
// Tile-uri gri Esri ca în design/final (doar pinii aplicației ies în evidență), pinii ca divIcon cu stilurile `.ax-pin`.
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoPoint } from '@/shared/types/common'
import { ARAD_CENTER } from '@/shared/composables/useGeo'

export interface MapMarker {
  id: string
  lat: number
  lng: number
  kind: 'event' | 'place' | 'offer' | 'action' | 'stop' | 'vehicle'
  /** text mic în pin (de ex. numărul opririi din itinerar sau linia tramvaiului) */
  label?: string
}

const props = withDefaults(defineProps<{
  markers: MapMarker[]
  selectedId?: string | null
  /** traseul de desenat, puncte [lat, lng] */
  route?: [number, number][] | null
  /** traseul e o estimare (linie dreaptă): se desenează punctat */
  routeApproximate?: boolean
  me?: GeoPoint | null
  zoom?: number
  /** cât acoperă UI-ul ecranului peste hartă (sus / jos, px), ca traseul încadrat să rămână vizibil */
  insets?: { top: number; bottom: number }
}>(), { selectedId: null, route: null, routeApproximate: false, me: null, zoom: 15, insets: () => ({ top: 70, bottom: 70 }) })

const emit = defineEmits<{ select: [id: string | null] }>()

const el = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
let markerLayer: L.LayerGroup | null = null
let routeLayer: L.Polyline | null = null
let meLayer: L.Marker | null = null

function icon(m: MapMarker, selected: boolean) {
  return L.divIcon({
    className: '',
    html: `<div class="ax-pin ax-pin--${m.kind}${selected ? ' ax-pin--sel' : ''}">${m.label ?? ''}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

function drawMarkers() {
  if (!map.value) return
  markerLayer?.clearLayers()
  markerLayer ??= L.layerGroup().addTo(map.value)
  for (const m of props.markers) {
    const sel = m.id === props.selectedId
    const mk = L.marker([m.lat, m.lng], { icon: icon(m, sel), zIndexOffset: sel ? 1000 : 0, keyboard: false })
    mk.on('click', () => emit('select', m.id))
    markerLayer.addLayer(mk)
  }
}

function drawRoute() {
  if (!map.value) return
  routeLayer?.remove()
  routeLayer = null
  if (props.route && props.route.length > 1) {
    routeLayer = L.polyline(props.route, props.routeApproximate
      ? { color: '#111', weight: 4, dashArray: '2 8', lineCap: 'round' }
      : { color: '#1D5FD1', weight: 5, opacity: 0.9 }).addTo(map.value)
    map.value.invalidateSize()
    map.value.fitBounds(routeLayer.getBounds(), { paddingTopLeft: [40, props.insets.top], paddingBottomRight: [40, props.insets.bottom], animate: false })
  }
}

function drawMe() {
  if (!map.value) return
  meLayer?.remove()
  meLayer = null
  if (props.me) {
    meLayer = L.marker([props.me.lat, props.me.lng], {
      icon: L.divIcon({ className: '', html: '<div class="ax-me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
      interactive: false, keyboard: false,
    }).addTo(map.value)
  }
}

onMounted(() => {
  if (!el.value) return
  const center = props.me ?? ARAD_CENTER
  map.value = L.map(el.value, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], props.zoom)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
  }).addTo(map.value)
  map.value.on('click', () => emit('select', null))
  // containerul își termină layout-ul după montare (ecran fix, tranziția rutei): Leaflet își recalculează dimensiunea
  setTimeout(() => map.value?.invalidateSize({ pan: false }), 0)
  drawMarkers()
  drawMe()
  drawRoute()
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})

watch(() => [props.markers, props.selectedId], drawMarkers)
watch(() => [props.route, props.routeApproximate], drawRoute)
watch(() => props.me, drawMe)

/** Controalele (+ / − / locația mea) le pune ecranul, în stilul lui. */
function zoomBy(delta: number) { map.value?.setZoom(map.value.getZoom() + delta) }
function flyTo(p: GeoPoint, zoom = 16) { map.value?.flyTo([p.lat, p.lng], zoom, { duration: 0.6 }) }
/** Leaflet trebuie anunțat când containerul își schimbă dimensiunea (sheet, sidebar). */
function invalidate() { map.value?.invalidateSize() }

defineExpose({ zoomBy, flyTo, invalidate })
</script>

<template>
  <div ref="el" class="w-full h-full bg-[#E9E9E2]" role="application" />
</template>

<style>
/* design/final/shared/ui.css: .pin, .me-dot */
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
.leaflet-container { font-family: Inter, system-ui, sans-serif; }
</style>
