<script setup lang="ts">
// T08 · harta cu Google Maps (Maps JavaScript API). Pinii sunt AdvancedMarkerElement cu aceleași elemente `.ax-pin`
// ca rezerva Leaflet; traseul (OSRM) e o polilinie. Dacă scriptul Google nu se încarcă, anunță `failed` (MapView trece pe Leaflet).
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { GeoPoint } from '@/shared/types/common'
import { ARAD_CENTER } from '@/shared/composables/useGeo'
import { GOOGLE_MAP_ID, loadGoogleMaps, markGoogleUnavailable, onGoogleUnavailable } from '@/shared/composables/useGoogleMaps'
import { LINE_OPACITY, LINE_WEIGHT, fitInsets, meElement, pinElement, type MapProps } from './types'

const props = withDefaults(defineProps<MapProps>(),
  { selectedId: null, route: null, routeApproximate: false, me: null, center: null, zoom: 15, insets: () => ({ top: 70, bottom: 70 }) })
const emit = defineEmits<{ select: [id: string | null]; failed: [] }>()

const el = ref<HTMLDivElement | null>(null)
const map = shallowRef<google.maps.Map | null>(null)
let Marker: typeof google.maps.marker.AdvancedMarkerElement | null = null
let markers: google.maps.marker.AdvancedMarkerElement[] = []
let routeLine: google.maps.Polyline | null = null
let transitLines: google.maps.Polyline[] = []
let meMarker: google.maps.marker.AdvancedMarkerElement | null = null

/** Liniile straturilor (transport, parcări), sub traseul ales (zIndex mai mic). */
function drawLines() {
  if (!map.value) return
  for (const l of transitLines) l.setMap(null)
  transitLines = (props.lines ?? []).map((l) => new google.maps.Polyline(l.dash
    // punctată (mersul pe jos, T19): puncte rotunde repetate, ca dashArray „1 8” din Leaflet
    ? { map: map.value, path: l.path.map(([lat, lng]) => ({ lat, lng })), strokeOpacity: 0, clickable: false, zIndex: 2,
        icons: [{ icon: { path: google.maps.SymbolPath.CIRCLE, scale: (l.weight ?? LINE_WEIGHT) / 2, strokeOpacity: 0, fillColor: l.color, fillOpacity: l.opacity ?? 1 }, offset: '0', repeat: '9px' }] }
    : { map: map.value, path: l.path.map(([lat, lng]) => ({ lat, lng })), strokeColor: l.color, strokeWeight: l.weight ?? LINE_WEIGHT, strokeOpacity: l.opacity ?? LINE_OPACITY, clickable: false, zIndex: 1 }))
}

function drawMarkers() {
  if (!map.value || !Marker) return
  for (const m of markers) m.map = null
  markers = props.markers.map((m) => {
    const sel = m.id === props.selectedId
    const mk = new Marker!({ map: map.value, position: { lat: m.lat, lng: m.lng }, content: pinElement(m, sel), zIndex: sel ? 1000 : 1, gmpClickable: true })
    mk.addEventListener('gmp-click', () => emit('select', m.id))
    return mk
  })
}

function drawRoute() {
  if (!map.value) return
  routeLine?.setMap(null)
  routeLine = null
  if (!props.route || props.route.length < 2) return
  const path = props.route.map(([lat, lng]) => ({ lat, lng }))
  routeLine = new google.maps.Polyline(props.routeApproximate
    ? { path, map: map.value, strokeOpacity: 0, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: '#111', scale: 3 }, offset: '0', repeat: '12px' }], zIndex: 10 }
    : { path, map: map.value, strokeColor: '#1D5FD1', strokeWeight: 5, strokeOpacity: 0.9, zIndex: 10 })
  const bounds = new google.maps.LatLngBounds()
  path.forEach((p) => bounds.extend(p))
  const pad = fitInsets(props.insets, el.value?.clientHeight ?? 0)
  map.value.fitBounds(bounds, { top: pad.top, bottom: pad.bottom, left: 40, right: 40 })
}

/** Încadrează punctele din `fit` (doar când nu e un traseu, care se încadrează singur). */
function drawFit() {
  if (!map.value || (props.route && props.route.length > 1) || !props.fit || props.fit.length < 2) return
  const bounds = new google.maps.LatLngBounds()
  props.fit.forEach(([lat, lng]) => bounds.extend({ lat, lng }))
  const pad = fitInsets(props.insets, el.value?.clientHeight ?? 0)
  map.value.fitBounds(bounds, { top: pad.top, bottom: pad.bottom, left: 40, right: 40 })
}

function drawMe() {
  if (!map.value || !Marker) return
  if (meMarker) meMarker.map = null
  meMarker = props.me ? new Marker({ map: map.value, position: props.me, content: meElement(), zIndex: 900 }) : null
}

/** Cât așteptăm primele dale ale hărții; peste atât (rețea, cheie refuzată fără semnal) trecem pe Leaflet. */
const TILES_TIMEOUT_MS = 10000
let stopWatching: (() => void) | null = null
let tilesTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  stopWatching = onGoogleUnavailable(() => emit('failed'))
  try {
    await loadGoogleMaps()
    const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary
    ;({ AdvancedMarkerElement: Marker } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary)
    if (!el.value) return
    const center = props.center ?? props.me ?? ARAD_CENTER
    map.value = new Map(el.value, {
      center, zoom: props.zoom, mapId: GOOGLE_MAP_ID,
      disableDefaultUI: true, clickableIcons: false, gestureHandling: 'greedy',
    })
    map.value.addListener('click', () => emit('select', null))
    tilesTimer = setTimeout(() => markGoogleUnavailable(), TILES_TIMEOUT_MS)
    google.maps.event.addListenerOnce(map.value, 'tilesloaded', () => { if (tilesTimer) clearTimeout(tilesTimer); tilesTimer = null })
    drawLines()
    drawMarkers()
    drawMe()
    drawRoute()
    drawFit()
  } catch {
    emit('failed')
  }
})

onBeforeUnmount(() => {
  stopWatching?.()
  if (tilesTimer) clearTimeout(tilesTimer)
  for (const m of markers) m.map = null
  routeLine?.setMap(null)
  for (const l of transitLines) l.setMap(null)
  if (meMarker) meMarker.map = null
  map.value = null
})

watch(() => [props.markers, props.selectedId], drawMarkers)
watch(() => props.lines, drawLines)
watch(() => [props.route, props.routeApproximate], drawRoute)
watch(() => props.me, drawMe)
watch(() => props.fit, drawFit)

function zoomBy(delta: number) { const z = map.value?.getZoom(); if (map.value && z != null) map.value.setZoom(z + delta) }
function flyTo(p: GeoPoint, zoom = 16) { map.value?.panTo(p); map.value?.setZoom(zoom) }
function invalidate() { /* Google Maps își urmărește singur dimensiunea containerului */ }

defineExpose({ zoomBy, flyTo, invalidate })
</script>

<template>
  <div ref="el" class="w-full h-full bg-[#E9E9E2]" role="application" />
</template>
