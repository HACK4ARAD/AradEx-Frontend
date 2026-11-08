<script setup lang="ts">
// T08 · rezerva hărții, cu Leaflet: se folosește doar când nu există cheia Google Maps (MapView alege).
// Tile-uri gri Esri ca în design/final, pinii ca divIcon cu stilurile `.ax-pin` (comune, din map/types.ts).
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoPoint } from '@/shared/types/common'
import { ARAD_CENTER } from '@/shared/composables/useGeo'
import { LINE_OPACITY, LINE_WEIGHT, fitInsets, meElement, pinElement, setMeHeading, type MapEmits, type MapMarker, type MapProps } from './types'

const props = withDefaults(defineProps<MapProps>(),
  { selectedId: null, route: null, routeApproximate: false, me: null, center: null, zoom: 15, insets: () => ({ top: 70, bottom: 70 }) })

const emit = defineEmits<MapEmits>()

const el = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
let markerLayer: L.LayerGroup | null = null
let lineLayer: L.LayerGroup | null = null
let routeLayer: L.Polyline | null = null
let meLayer: L.Marker | null = null

function icon(m: MapMarker, selected: boolean) {
  return L.divIcon({
    // pinii au mărimi diferite (stație 18, parcare 22, restul 26 px): cutia de 26 px îi centrează pe coordonată
    className: 'ax-pin-box',
    html: pinElement(m, selected),
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

/** Liniile straturilor (transport, parcări), sub traseul ales (care rămâne deasupra). */
function drawLines() {
  if (!map.value) return
  lineLayer?.clearLayers()
  lineLayer ??= L.layerGroup().addTo(map.value)
  for (const l of props.lines ?? []) {
    L.polyline(l.path, {
      color: l.color, weight: l.weight ?? LINE_WEIGHT, opacity: l.opacity ?? LINE_OPACITY, interactive: false,
      ...(l.dash ? { dashArray: '1 8', lineCap: 'round' as const } : {}),
    }).addTo(lineLayer)
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

/** Încadrează punctele din `fit` (doar când nu e un traseu, care se încadrează singur). */
function drawFit() {
  if (!map.value || (props.route && props.route.length > 1) || !props.fit || props.fit.length < 2) return
  map.value.invalidateSize()
  const pad = fitInsets(props.insets, map.value.getSize().y)
  map.value.fitBounds(L.latLngBounds(props.fit), { paddingTopLeft: [40, pad.top], paddingBottomRight: [40, pad.bottom], animate: false })
}

/** Punctul tău: creat o dată, apoi doar mutat (urmărirea îl actualizează la 1–2 s), cu săgeata direcției. */
function drawMe() {
  if (!map.value) return
  if (!props.me) { meLayer?.remove(); meLayer = null; return }
  if (meLayer) meLayer.setLatLng([props.me.lat, props.me.lng])
  else {
    meLayer = L.marker([props.me.lat, props.me.lng], {
      icon: L.divIcon({ className: '', html: meElement(props.meHeading ?? null), iconSize: [18, 18], iconAnchor: [9, 9] }),
      interactive: false, keyboard: false, zIndexOffset: 900,
    }).addTo(map.value)
  }
  setMeHeading(meLayer.getElement(), props.meHeading ?? null)
}

onMounted(() => {
  if (!el.value) return
  const center = props.center ?? props.me ?? ARAD_CENTER
  map.value = L.map(el.value, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], props.zoom)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
  }).addTo(map.value)
  map.value.on('click', (e: L.LeafletMouseEvent) => { emit('select', null); emit('press', { lat: e.latlng.lat, lng: e.latlng.lng }, false) })
  // apăsare lungă pe telefon / click dreapta: alege punctul (destinație pusă de mână)
  map.value.on('contextmenu', (e: L.LeafletMouseEvent) => emit('press', { lat: e.latlng.lat, lng: e.latlng.lng }, true))
  map.value.on('dragstart', () => emit('interact'))
  // containerul își termină layout-ul după montare (ecran fix, tranziția rutei): Leaflet își recalculează dimensiunea
  setTimeout(() => map.value?.invalidateSize({ pan: false }), 0)
  drawLines()
  drawMarkers()
  drawMe()
  drawRoute()
  drawFit()
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})

watch(() => [props.markers, props.selectedId], drawMarkers)
watch(() => props.lines, drawLines)
watch(() => [props.route, props.routeApproximate], drawRoute)
watch(() => [props.me, props.meHeading], drawMe)
watch(() => props.fit, drawFit)

/** Controalele (+ / − / locația mea) le pune ecranul, în stilul lui. */
function zoomBy(delta: number) { map.value?.setZoom(map.value.getZoom() + delta) }
function flyTo(p: GeoPoint, zoom = 16) { map.value?.flyTo([p.lat, p.lng], zoom, { duration: 0.6 }) }
function panTo(p: GeoPoint) { map.value?.panTo([p.lat, p.lng], { animate: true, duration: 0.5 }) }
/** Leaflet trebuie anunțat când containerul își schimbă dimensiunea (sheet, sidebar). */
function invalidate() { map.value?.invalidateSize() }

defineExpose({ zoomBy, flyTo, panTo, invalidate })
</script>

<template>
  <div ref="el" class="w-full h-full bg-[#E9E9E2]" role="application" />
</template>

<style>
.leaflet-container { font-family: Inter, system-ui, sans-serif; }
</style>
