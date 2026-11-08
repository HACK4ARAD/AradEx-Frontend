<script setup lang="ts">
// Harta fără cheie Google (aplicația), cu MapLibre GL (BSD): aceleași dale gri Esri ca rezerva Leaflet, pinii `.ax-pin` ca
// markere HTML, liniile și traseul ca straturi. Spre deosebire de Leaflet, se rotește: cu două degete, din busola ecranului
// (`setBearing`) sau în modul „în direcția de mers”. Anunță rotirea (`bearing`) ca ecranul să arate busola. Fără WebGL → `failed`
// (MapView trece pe Leaflet).
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { LngLatBounds, Map as MlMap, Marker, setWorkerUrl, type GeoJSONSource, type LineLayerSpecification, type MapMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { GeoPoint } from '@/shared/types/common'
import { ARAD_CENTER } from '@/shared/composables/useGeo'
import { LINE_OPACITY, LINE_WEIGHT, fitInsets, meElement, pinElement, setMeHeading, type MapEmits, type MapProps } from './types'

setWorkerUrl(workerUrl)

const props = withDefaults(defineProps<MapProps>(),
  { selectedId: null, route: null, routeApproximate: false, me: null, center: null, zoom: 15, insets: () => ({ top: 70, bottom: 70 }) })
const emit = defineEmits<MapEmits & { failed: []; bearing: [deg: number] }>()

const el = ref<HTMLDivElement | null>(null)
const map = shallowRef<MlMap | null>(null)
let ready = false
let pins: Marker[] = []
let meMarker: Marker | null = null

/**
 * Zoom-ul vine în convenția Leaflet / Google (dale de 256 px). MapLibre numără zoom-ul pe dale de 512 px: același oraș la
 * același „zoom 16” ar apărea de două ori mai aproape (și neclar, peste dalele maxime Esri). Convertim la intrare și la ieșire.
 */
const toMl = (z: number) => z - 1
const TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
const EMPTY = { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection
/** [lat, lng] → [lng, lat] (MapLibre) */
const ll = (p: [number, number]): [number, number] => [p[1], p[0]]

function setData(id: string, fc: GeoJSON.FeatureCollection) {
  (map.value?.getSource(id) as GeoJSONSource | undefined)?.setData(fc)
}

/** Liniile straturilor (transport, parcări; mersul pe jos punctat), sub traseu. */
function drawLines() {
  if (!ready) return
  const feats = (props.lines ?? []).map((l) => ({
    type: 'Feature' as const,
    properties: { color: l.color, weight: l.weight ?? LINE_WEIGHT, opacity: l.opacity ?? LINE_OPACITY, dash: !!l.dash },
    geometry: { type: 'LineString' as const, coordinates: l.path.map(ll) },
  }))
  setData('lines', { type: 'FeatureCollection', features: feats })
}

function drawMarkers() {
  if (!ready || !map.value) return
  for (const m of pins) m.remove()
  pins = props.markers.map((m) => {
    const sel = m.id === props.selectedId
    const box = document.createElement('div')
    box.className = 'ax-pin-box ax-ml-box'
    box.style.zIndex = sel ? '3' : '2'
    box.append(pinElement(m, sel))
    box.addEventListener('click', (e) => { e.stopPropagation(); emit('select', m.id) })
    return new Marker({ element: box, anchor: 'center' }).setLngLat([m.lng, m.lat]).addTo(map.value!)
  })
}

function bounds(points: [number, number][]) {
  const b = new LngLatBounds()
  for (const p of points) b.extend(ll(p))
  return b
}
function fitTo(points: [number, number][]) {
  if (!map.value) return
  map.value.resize()
  const pad = fitInsets(props.insets, map.value.getContainer().clientHeight)
  map.value.fitBounds(bounds(points), { padding: { top: pad.top, bottom: pad.bottom, left: 40, right: 40 }, animate: false, maxZoom: toMl(16), bearing: map.value.getBearing() })
}

function drawRoute() {
  if (!ready) return
  const r = props.route && props.route.length > 1 ? props.route : null
  setData('route', r ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { approx: props.routeApproximate }, geometry: { type: 'LineString', coordinates: r.map(ll) } }] } : EMPTY)
  if (r) fitTo(r)
}

function drawFit() {
  if (!ready || (props.route && props.route.length > 1) || !props.fit || props.fit.length < 2) return
  fitTo(props.fit)
}

/** Punctul tău: creat o dată, apoi doar mutat; rotit „cu harta” (`rotationAlignment: 'map'`), deci săgeata arată direcția reală. */
function drawMe() {
  if (!map.value) return
  if (!props.me) { meMarker?.remove(); meMarker = null; return }
  if (!meMarker) meMarker = new Marker({ element: meElement(props.meHeading ?? null), anchor: 'center', rotationAlignment: 'map' })
    .setLngLat([props.me.lng, props.me.lat]).addTo(map.value)
  else meMarker.setLngLat([props.me.lng, props.me.lat])
  setMeHeading(meMarker.getElement(), props.meHeading ?? null)
}

/** Apăsare lungă pe ecranul tactil (MapLibre nu are `contextmenu` la atingere): 550 ms fără să miști degetul. */
const LONG_PRESS_MS = 550
let pressTimer: ReturnType<typeof setTimeout> | null = null
let pressStart: { x: number; y: number } | null = null
let longFired = false
function cancelPress() { if (pressTimer) clearTimeout(pressTimer); pressTimer = null; pressStart = null }

onMounted(() => {
  if (!el.value) return
  const center = props.center ?? props.me ?? ARAD_CENTER
  try {
    map.value = new MlMap({
      container: el.value,
      style: {
        version: 8,
        sources: { esri: { type: 'raster', tiles: [TILES], tileSize: 256, maxzoom: 16, attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors' } },
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#E9E9E2' } }, { id: 'esri', type: 'raster', source: 'esri' }],
      },
      center: [center.lng, center.lat], zoom: toMl(props.zoom), maxZoom: toMl(18),
      // rotire cu două degete / click dreapta tras; fără înclinare (pitch), harta rămâne plană
      dragRotate: true, touchPitch: false, maxPitch: 0, pitchWithRotate: false,
      attributionControl: { compact: true },
    })
  } catch {
    emit('failed') // fără WebGL
    return
  }
  const m = map.value
  m.touchZoomRotate.enableRotation()
  m.on('load', () => {
    m.addSource('lines', { type: 'geojson', data: EMPTY })
    m.addSource('route', { type: 'geojson', data: EMPTY })
    const linePaint = (): LineLayerSpecification['paint'] => ({ 'line-color': ['get', 'color'], 'line-width': ['get', 'weight'], 'line-opacity': ['get', 'opacity'] })
    m.addLayer({ id: 'lines', type: 'line', source: 'lines', filter: ['!', ['get', 'dash']], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: linePaint() })
    m.addLayer({ id: 'lines-dash', type: 'line', source: 'lines', filter: ['get', 'dash'], layout: { 'line-cap': 'round' }, paint: { ...linePaint(), 'line-dasharray': [0.2, 2] } })
    m.addLayer({ id: 'route', type: 'line', source: 'route', filter: ['!', ['get', 'approx']], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1D5FD1', 'line-width': 5, 'line-opacity': 0.9 } })
    m.addLayer({ id: 'route-approx', type: 'line', source: 'route', filter: ['get', 'approx'], layout: { 'line-cap': 'round' }, paint: { 'line-color': '#111', 'line-width': 4, 'line-dasharray': [0.5, 2] } })
    ready = true
    drawLines()
    drawMarkers()
    drawMe()
    drawRoute()
    drawFit()
  })
  m.on('error', () => { /* o dală lipsă nu strică harta */ })
  m.on('click', (e: MapMouseEvent) => {
    if (longFired) { longFired = false; return }
    emit('select', null)
    emit('press', { lat: e.lngLat.lat, lng: e.lngLat.lng }, false)
  })
  m.on('contextmenu', (e: MapMouseEvent) => { if (!longFired) emit('press', { lat: e.lngLat.lat, lng: e.lngLat.lng }, true) })
  m.on('dragstart', () => { cancelPress(); emit('interact') })
  m.on('rotate', () => emit('bearing', m.getBearing()))
  m.on('touchstart', (e) => {
    cancelPress()
    longFired = false
    if (e.originalEvent.touches.length !== 1) return
    pressStart = { x: e.point.x, y: e.point.y }
    const at = e.lngLat
    pressTimer = setTimeout(() => { longFired = true; pressTimer = null; emit('press', { lat: at.lat, lng: at.lng }, true) }, LONG_PRESS_MS)
  })
  m.on('touchmove', (e) => { if (pressStart && Math.hypot(e.point.x - pressStart.x, e.point.y - pressStart.y) > 10) cancelPress() })
  m.on('touchend', () => { if (pressTimer) cancelPress() })
  m.on('touchcancel', cancelPress)
  drawMe()
})

onBeforeUnmount(() => {
  cancelPress()
  map.value?.remove()
  map.value = null
  ready = false
})

watch(() => [props.markers, props.selectedId], drawMarkers)
watch(() => props.lines, drawLines)
watch(() => [props.route, props.routeApproximate], drawRoute)
watch(() => [props.me, props.meHeading], drawMe)
watch(() => props.fit, drawFit)

function zoomBy(delta: number) { map.value?.easeTo({ zoom: map.value.getZoom() + delta, duration: 250 }) }
function flyTo(p: GeoPoint, zoom = 16) { map.value?.flyTo({ center: [p.lng, p.lat], zoom: toMl(zoom), duration: 600 }) }
function panTo(p: GeoPoint) { map.value?.easeTo({ center: [p.lng, p.lat], duration: 500 }) }
/** Rotirea hărții (grade, sens orar față de nord); 0 = nordul în sus. */
function setBearing(deg: number, duration = 300) { map.value?.easeTo({ bearing: deg, duration }) }
function invalidate() { map.value?.resize() }

defineExpose({ zoomBy, flyTo, panTo, invalidate, setBearing })
</script>

<template>
  <div ref="el" class="w-full h-full bg-[#E9E9E2]" role="application" />
</template>

<style>
.maplibregl-map { font-family: Inter, system-ui, sans-serif; }
/* cutia pinului (26 × 26) centrează pinii mai mici pe coordonată, ca la Leaflet */
.ax-ml-box { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
</style>
