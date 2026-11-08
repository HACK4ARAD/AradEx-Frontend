import type { GeoPoint } from '@/shared/types/common'

/** Un pin pe hartă (T08); `stop` / `vehicle` = transportul public (T22); `parking` / `bike` = parcările și bicicletele;
 *  `dest` = steagul destinației din harta traseului (T19). */
export interface MapMarker {
  id: string
  lat: number
  lng: number
  kind: 'event' | 'place' | 'offer' | 'action' | 'stop' | 'vehicle' | 'parking' | 'bike' | 'dest'
  /** text mic în pin (de ex. numărul opririi din itinerar sau linia tramvaiului) */
  label?: string
  /** culoarea pinului `#rrggbb` (variabila CSS `--pin`, de ex. zona parcării), unde stilul tipului o folosește */
  color?: string
}

/** O linie desenată sub pini (traseele transportului public, T22; străzile cu parcări): puncte [lat, lng] și culoarea `#rrggbb`. */
export interface MapLine {
  id: string
  path: [number, number][]
  color: string
  /** grosimea (px, implicit LINE_WEIGHT) și opacitatea (implicit LINE_OPACITY) */
  weight?: number
  opacity?: number
  /** punctată (mersul pe jos din harta traseului, T19) */
  dash?: boolean
}

export const LINE_WEIGHT = 3
export const LINE_OPACITY = 0.55

/** Proprietățile comune ale hărții (Google Maps sau rezerva Leaflet). */
export interface MapProps {
  markers: MapMarker[]
  selectedId?: string | null
  /** linii sub pini (straturile „Transport” și „Parcări”) */
  lines?: MapLine[]
  /** traseul de desenat, puncte [lat, lng] */
  route?: [number, number][] | null
  /** traseul e o estimare (linie dreaptă): se desenează punctat */
  routeApproximate?: boolean
  me?: GeoPoint | null
  /** direcția în care mergi / ții telefonul (grade față de nord): săgeata punctului „tu ești aici”; null = doar punctul */
  meHeading?: number | null
  /** centrul inițial (implicit: `me`, altfel centrul Aradului), de ex. pinul firmei pe pagina ei */
  center?: GeoPoint | null
  zoom?: number
  /** cât acoperă UI-ul ecranului peste hartă (sus / jos, px), ca traseul încadrat să rămână vizibil */
  insets?: { top: number; bottom: number }
  /** fără `route`: punctele de încadrat (harta traseului din Transport, T19), cu aceleași `insets` */
  fit?: [number, number][] | null
}

/** Ce poate cere ecranul hărții (controalele + / − / locația mea le desenează ecranul). */
export interface MapApi {
  zoomBy: (delta: number) => void
  flyTo: (p: GeoPoint, zoom?: number) => void
  /** mută centrul fără să schimbe zoom-ul (urmărirea poziției) */
  panTo: (p: GeoPoint) => void
  invalidate: () => void
  /** rotirea hărții (grade față de nord); doar harta MapLibre se rotește, celelalte ignoră */
  setBearing?: (deg: number, duration?: number) => void
}

/** Evenimentele comune ale hărților: pin apăsat, harta trasă de om (oprește urmărirea), apăsare pe hartă (lungă = alege punctul). */
export type MapEmits = {
  select: [id: string | null]
  interact: []
  press: [p: GeoPoint, long: boolean]
  /** harta s-a rotit (grade față de nord; doar MapLibre) */
  bearing: [deg: number]
}

/** Stilurile pinilor, comune ambelor hărți (design/final/shared/ui.css: .pin, .me-dot). */
export function pinElement(m: MapMarker, selected: boolean): HTMLDivElement {
  const el = document.createElement('div')
  el.className = `ax-pin ax-pin--${m.kind}${selected ? ' ax-pin--sel' : ''}`
  el.textContent = m.label ?? ''
  if (m.color) el.style.setProperty('--pin', m.color)
  return el
}

/** Punctul „tu ești aici”, cu săgeata direcției (ascunsă cât nu știm direcția). */
export function meElement(heading: number | null = null): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'ax-me-wrap'
  el.innerHTML = '<div class="ax-me-cone"></div><div class="ax-me"></div>'
  setMeHeading(el, heading)
  return el
}

export function setMeHeading(el: HTMLElement | null | undefined, heading: number | null) {
  const cone = el?.querySelector<HTMLElement>('.ax-me-cone')
  if (!cone) return
  cone.style.display = heading == null ? 'none' : ''
  if (heading != null) cone.style.transform = `rotate(${Math.round(heading)}deg)`
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
