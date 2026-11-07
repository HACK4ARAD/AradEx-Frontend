<script setup lang="ts">
// T08 · rezerva hărții, cu Leaflet: se folosește doar când nu există cheia Google Maps (MapView alege).
// Tile-uri gri Esri ca în design/final, pinii ca divIcon cu stilurile `.ax-pin` (comune, din map/types.ts).
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoPoint } from '@/shared/types/common'
import { ARAD_CENTER } from '@/shared/composables/useGeo'
import { fitInsets, type MapMarker, type MapProps } from './types'

const props = withDefaults(defineProps<MapProps>(),
  { selectedId: null, route: null, routeApproximate: false, me: null, center: null, zoom: 15, insets: () => ({ top: 70, bottom: 70 }) })

const emit = defineEmits<{ select: [id: string | null] }>()

const el = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
let markerLayer: L.LayerGroup | null = null
let lineLayer: L.LayerGroup | null = null
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

/** Liniile transportului, subțiri și sub traseul ales (care rămâne deasupra). */
function drawLines() {
  if (!map.value) return
  lineLayer?.clearLayers()
  lineLayer ??= L.layerGroup().addTo(map.value)
  for (const l of props.lines ?? []) {
    L.polyline(l.path, { color: l.color, weight: 3, opacity: 0.55, interactive: false }).addTo(lineLayer)
  }
  routeLayer?.bringToFront()
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
    const pad = fitInsets(props.insets, map.value.getSize().y)
    map.value.fitBounds(routeLayer.getBounds(), { paddingTopLeft: [40, pad.top], paddingBottomRight: [40, pad.bottom], animate: false })
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
  const center = props.center ?? props.me ?? ARAD_CENTER
  map.value = L.map(el.value, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], props.zoom)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
  }).addTo(map.value)
  map.value.on('click', () => emit('select', null))
  // containerul își termină layout-ul după montare (ecran fix, tranziția rutei): Leaflet își recalculează dimensiunea
  setTimeout(() => map.value?.invalidateSize({ pan: false }), 0)
  drawLines()
  drawMarkers()
  drawMe()
  drawRoute()
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})

watch(() => [props.markers, props.selectedId], drawMarkers)
watch(() => props.lines, drawLines)
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
.leaflet-container { font-family: Inter, system-ui, sans-serif; }
</style>
