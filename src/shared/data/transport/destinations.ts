/**
 * T19 · sugestiile de destinație din tab-ul Transport (design/final `DESTS`): repere cu coordonate fixe, ca să meargă și când
 * obiectivul lipsește din DB (Gara, Atrium). Cheia din `?to=` e `poi:<id>`; numele și tipul vin din i18n (`transport.poi.<id>`).
 */
export interface Poi { id: string; icon: string; lat: number; lng: number }

export const POIS: Poi[] = [
  { id: 'teatru', icon: 'theater_comedy', lat: 46.1711, lng: 21.3158 },
  { id: 'cetate', icon: 'fort', lat: 46.1709, lng: 21.3326 },
  { id: 'faleza', icon: 'park', lat: 46.1745, lng: 21.3215 },
  { id: 'gara', icon: 'train', lat: 46.189783, lng: 21.324928 },
  { id: 'atrium', icon: 'local_mall', lat: 46.1912, lng: 21.319 },
  { id: 'ceala', icon: 'forest', lat: 46.1579, lng: 21.2734 },
  { id: 'turn', icon: 'water_drop', lat: 46.1697, lng: 21.308 },
]

export const findPoi = (id: string) => POIS.find((p) => p.id === id) ?? null

/** `?to=` acceptat: `place:3`, `stop:120`, `event:5`, `offer:7` (firma), `poi:gara`, `pt:46.18301,21.29502` (punct ales pe hartă). */
const TO = /^(place|stop|event|offer):\d+$|^poi:[a-z]+$|^pt:-?\d{1,2}(\.\d{1,6})?,-?\d{1,3}(\.\d{1,6})?$/
export function parseTo(q: unknown): string | null {
  return typeof q === 'string' && TO.test(q) ? q : null
}

/** Cheia unui punct ales pe hartă (apăsare lungă): `pt:lat,lng` cu 5 zecimale (~1 m). */
export function ptKey(p: { lat: number; lng: number }): string {
  return `pt:${p.lat.toFixed(5)},${p.lng.toFixed(5)}`
}

/** Punctul din `pt:lat,lng`, sau null dacă nu e unul valid. */
export function parsePt(key: string): { lat: number; lng: number } | null {
  if (!key.startsWith('pt:') || !parseTo(key)) return null
  const [lat, lng] = key.slice(3).split(',').map(Number)
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null
}
