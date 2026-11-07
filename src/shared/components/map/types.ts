import type { GeoPoint } from '@/shared/types/common'

/** Un pin pe hartă (T08); `stop` / `vehicle` = transportul public (T22). */
export interface MapMarker {
  id: string
  lat: number
  lng: number
  kind: 'event' | 'place' | 'offer' | 'action' | 'stop' | 'vehicle'
  /** text mic în pin (de ex. numărul opririi din itinerar sau linia tramvaiului) */
  label?: string
}

/** O linie desenată sub pini (traseele transportului public, T22): puncte [lat, lng] și culoarea `#rrggbb`. */
export interface MapLine {
  id: string
  path: [number, number][]
  color: string
}

/** Proprietățile comune ale hărții (Google Maps sau rezerva Leaflet). */
export interface MapProps {
  markers: MapMarker[]
  selectedId?: string | null
  /** linii subțiri sub pini (stratul „Transport”) */
  lines?: MapLine[]
  /** traseul de desenat, puncte [lat, lng] */
  route?: [number, number][] | null
  /** traseul e o estimare (linie dreaptă): se desenează punctat */
  routeApproximate?: boolean
  me?: GeoPoint | null
  /** centrul inițial (implicit: `me`, altfel centrul Aradului), de ex. pinul firmei pe pagina ei */
  center?: GeoPoint | null
  zoom?: number
  /** cât acoperă UI-ul ecranului peste hartă (sus / jos, px), ca traseul încadrat să rămână vizibil */
  insets?: { top: number; bottom: number }
}

/** Ce poate cere ecranul hărții (controalele + / − / locația mea le desenează ecranul). */
export interface MapApi {
  zoomBy: (delta: number) => void
  flyTo: (p: GeoPoint, zoom?: number) => void
  invalidate: () => void
}

/** Stilurile pinilor, comune ambelor hărți (design/final/shared/ui.css: .pin, .me-dot). */
export function pinElement(m: MapMarker, selected: boolean): HTMLDivElement {
  const el = document.createElement('div')
  el.className = `ax-pin ax-pin--${m.kind}${selected ? ' ax-pin--sel' : ''}`
  el.textContent = m.label ?? ''
  return el
}

export function meElement(): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'ax-me'
  return el
}

/**
 * Încadrarea traseului: UI-ul ecranului acoperă sus / jos `insets` px; pe ecrane scurte le micșorăm proporțional,
 * ca traseul să aibă cel puțin 20% din înălțimea hărții (altfel zoom-ul calculat iese aiurea și nu se vede nici start, nici destinația).
 */
export function fitInsets(insets: { top: number; bottom: number }, height: number): { top: number; bottom: number } {
  const max = height * 0.8
  const sum = insets.top + insets.bottom
  if (!height || sum <= max) return insets
  const k = max / sum
  return { top: Math.floor(insets.top * k), bottom: Math.floor(insets.bottom * k) }
}
