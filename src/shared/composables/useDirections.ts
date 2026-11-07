import type { GeoPoint } from '@/shared/types/common'

/**
 * T08 · traseul între două puncte: OSRM public (routing.openstreetmap.de), pe jos sau cu mașina, fără cheie.
 * Dacă OSRM nu răspunde, linie dreaptă + estimare la 5 km/h (pe jos) / 30 km/h (mașină), marcată `approximate`, fără eroare.
 */
export type TravelMode = 'foot' | 'car'

export interface Directions {
  /** puncte [lat, lng] pentru Leaflet */
  line: [number, number][]
  durationMin: number
  distanceKm: number
  approximate: boolean
}

const SPEED_KMH: Record<TravelMode, number> = { foot: 5, car: 30 }
const TIMEOUT_MS = 6000

/** Distanța în linie dreaptă (haversine), în km. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function straight(from: GeoPoint, to: GeoPoint, mode: TravelMode): Directions {
  const km = distanceKm(from, to)
  return {
    line: [[from.lat, from.lng], [to.lat, to.lng]],
    durationMin: Math.max(1, Math.round((km / SPEED_KMH[mode]) * 60)),
    distanceKm: Math.round(km * 10) / 10,
    approximate: true,
  }
}

export async function fetchDirections(from: GeoPoint, to: GeoPoint, mode: TravelMode, fetchFn: typeof fetch = fetch): Promise<Directions> {
  const url = `https://routing.openstreetmap.de/routed-${mode}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null
  try {
    const res = await fetchFn(url, ctrl ? { signal: ctrl.signal } : undefined)
    if (!res.ok) return straight(from, to, mode)
    const body = (await res.json()) as { routes?: { duration: number; distance: number; geometry: { coordinates: [number, number][] } }[] }
    const r = body.routes?.[0]
    if (!r || !r.geometry?.coordinates?.length) return straight(from, to, mode)
    return {
      line: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
      durationMin: Math.max(1, Math.round(r.duration / 60)),
      distanceKm: Math.round(r.distance / 100) / 10,
      approximate: false,
    }
  } catch {
    return straight(from, to, mode)
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Indicații în Google Maps (fără cheie): pe telefon deschide aplicația. */
export function googleMapsUrl(to: GeoPoint, mode: TravelMode): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=${mode === 'foot' ? 'walking' : 'driving'}`
}
