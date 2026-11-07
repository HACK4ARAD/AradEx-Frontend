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

/** `?to=` acceptat: `place:3`, `stop:120`, `event:5`, `offer:7` (firma), `poi:gara`. */
const TO = /^(place|stop|event|offer):\d+$|^poi:[a-z]+$/
export function parseTo(q: unknown): string | null {
  return typeof q === 'string' && TO.test(q) ? q : null
}
