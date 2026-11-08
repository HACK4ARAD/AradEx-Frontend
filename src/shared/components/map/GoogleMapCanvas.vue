<script setup lang="ts">
// T08 · harta cu Google Maps (Maps JavaScript API). Pinii sunt elementele `.ax-pin` (aceleași ca în rezerva Leaflet), puse pe
// hartă cu un OverlayView și centrate exact pe coordonate; traseul (OSRM) e o polilinie. Fără Map ID: doar așa Google aplică
// `styles`, cu care ascundem locurile Google (magazine, restaurante, stații Google…) — pe harta noastră nu se pot apăsa și
// se amestecă cu pinii aplicației. Dacă scriptul Google nu se încarcă, anunță `failed` (MapView trece pe Leaflet).
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { GeoPoint } from '@/shared/types/common'
import { ARAD_CENTER } from '@/shared/composables/useGeo'
import { loadGoogleMaps, markGoogleUnavailable, onGoogleUnavailable } from '@/shared/composables/useGoogleMaps'
import { LINE_OPACITY, LINE_WEIGHT, fitInsets, meElement, pinElement, setMeHeading, type MapEmits, type MapProps } from './types'

const props = withDefaults(defineProps<MapProps>(),
  { selectedId: null, route: null, routeApproximate: false, me: null, center: null, zoom: 15, insets: () => ({ top: 70, bottom: 70 }) })
const emit = defineEmits<MapEmits & { failed: [] }>()

/**
 * Stilul hărții: fără locurile Google (POI — afaceri, atracții, parcuri cu pictograme) și fără stațiile Google de transport
 * (avem stațiile CTP reale în stratul „Transport”); străzile, numele lor și apele rămân.
 */
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station', stylers: [{ visibility: 'off' }] },
]

/** Un element HTML pe hartă, centrat pe coordonată (`map.panes`: `overlayMouseTarget` dacă se poate apăsa). */
interface HtmlMarker { remove(): void; move(p: GeoPoint): void; el: HTMLElement }
let makeMarker: ((pos: GeoPoint, content: HTMLElement, z: number, onClick?: () => void) => HtmlMarker) | null = null

/** Clasa se creează după ce scriptul Google e încărcat (extinde google.maps.OverlayView). */
function overlayFactory(map: google.maps.Map) {
  class Overlay extends google.maps.OverlayView {
    pos: google.maps.LatLng
    box: HTMLDivElement
    clickable: boolean
    constructor(pos: GeoPoint, content: HTMLElement, z: number, onClick?: () => void) {
      super()
      this.pos = new google.maps.LatLng(pos.lat, pos.lng)
      this.clickable = !!onClick
      this.box = document.createElement('div')
      this.box.style.cssText = `position:absolute;transform:translate(-50%,-50%);z-index:${z};${onClick ? 'cursor:pointer;' : 'pointer-events:none;'}`
      this.box.append(content)
      if (onClick) {
        google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.box)
        this.box.addEventListener('click', (e) => { e.stopPropagation(); onClick() })
      }
      this.setMap(map)
    }
    onAdd() {
      const panes = this.getPanes()
      ;(this.clickable ? panes?.overlayMouseTarget : panes?.overlayLayer)?.append(this.box)
    }
    draw() {
      const p = this.getProjection()?.fromLatLngToDivPixel(this.pos)
      if (!p) return
      this.box.style.left = `${p.x}px`
      this.box.style.top = `${p.y}px`
    }
    onRemove() { this.box.remove() }
    remove() { this.setMap(null) }
    move(p: GeoPoint) { this.pos = new google.maps.LatLng(p.lat, p.lng); this.draw() }
    get el() { return this.box }
  }
  return (pos: GeoPoint, content: HTMLElement, z: number, onClick?: () => void): HtmlMarker => new Overlay(pos, content, z, onClick)
}

const el = ref<HTMLDivElement | null>(null)
const map = shallowRef<google.maps.Map | null>(null)
let markers: HtmlMarker[] = []
let routeLine: google.maps.Polyline | null = null
let transitLines: google.maps.Polyline[] = []
let meMarker: HtmlMarker | null = null

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
  if (!map.value || !makeMarker) return
  for (const m of markers) m.remove()
  markers = props.markers.map((m) => {
    const sel = m.id === props.selectedId
    return makeMarker!({ lat: m.lat, lng: m.lng }, pinElement(m, sel), sel ? 1000 : 10, () => emit('select', m.id))
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

/** Punctul tău: creat o dată, apoi doar mutat (urmărirea îl actualizează la 1–2 s), cu săgeata direcției. */
function drawMe() {
  if (!map.value || !makeMarker) return
  if (!props.me) { meMarker?.remove(); meMarker = null; return }
  if (meMarker) meMarker.move(props.me)
  else meMarker = makeMarker(props.me, meElement(props.meHeading ?? null), 900)
  setMeHeading(meMarker.el, props.meHeading ?? null)
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
    if (!el.value) return
    const center = props.center ?? props.me ?? ARAD_CENTER
    map.value = new Map(el.value, {
      center, zoom: props.zoom, styles: MAP_STYLES,
      disableDefaultUI: true, clickableIcons: false, gestureHandling: 'greedy',
    })
    makeMarker = overlayFactory(map.value)
    map.value.addListener('click', (e: google.maps.MapMouseEvent) => {
      emit('select', null)
      if (e.latLng) emit('press', { lat: e.latLng.lat(), lng: e.latLng.lng() }, false)
    })
    // apăsare lungă pe telefon / click dreapta: alege punctul (destinație pusă de mână)
    map.value.addListener('contextmenu', (e: google.maps.MapMouseEvent) => { if (e.latLng) emit('press', { lat: e.latLng.lat(), lng: e.latLng.lng() }, true) })
    map.value.addListener('dragstart', () => emit('interact'))
    tilesTimer = setTimeout(() => markGoogleUnavailable(), TILES_TIMEOUT_MS)
    google.maps.event.addListenerOnce(map.value, 'tilesloaded', () => { if (tilesTimer) clearTimeout(tilesTimer); tilesTimer = null })
    drawLines()
    drawMarkers()
    drawMe()
    drawRoute()
    drawFit()
    if (pendingFly) { map.value.setCenter(pendingFly.p); map.value.setZoom(pendingFly.zoom); pendingFly = null }
  } catch {
    emit('failed')
  }
})

onBeforeUnmount(() => {
  stopWatching?.()
  if (tilesTimer) clearTimeout(tilesTimer)
  for (const m of markers) m.remove()
  routeLine?.setMap(null)
  for (const l of transitLines) l.setMap(null)
  meMarker?.remove()
  makeMarker = null
  map.value = null
})

watch(() => [props.markers, props.selectedId], drawMarkers)
watch(() => props.lines, drawLines)
watch(() => [props.route, props.routeApproximate], drawRoute)
watch(() => [props.me, props.meHeading], drawMe)
watch(() => props.fit, drawFit)

function zoomBy(delta: number) { const z = map.value?.getZoom(); if (map.value && z != null) map.value.setZoom(z + delta) }
/** Înainte să fie gata harta (scriptul Google se încarcă): ținem punctul și îl aplicăm la creare. */
let pendingFly: { p: GeoPoint; zoom: number } | null = null
function flyTo(p: GeoPoint, zoom = 16) {
  if (!map.value) { pendingFly = { p, zoom }; return }
  map.value.panTo(p); map.value.setZoom(zoom)
}
function panTo(p: GeoPoint) { if (map.value) map.value.panTo(p); else pendingFly = { p, zoom: props.zoom } }
function invalidate() { /* Google Maps își urmărește singur dimensiunea containerului */ }

defineExpose({ zoomBy, flyTo, panTo, invalidate })
</script>

<template>
  <div ref="el" class="w-full h-full bg-[#E9E9E2]" role="application" />
</template>
