import type { MapMarker } from '@/shared/components/map/types'
import data from './bikes.json'

/**
 * Bicicletele de pe hartă (modul „Transport”): stațiile sistemului de bike sharing al Primăriei Arad (amplasamentele din
 * regulament, coordonatele de pe aradbikes.ro: 10 din 22) și punctele de închiriere din OpenStreetMap. Date statice (~2 KB),
 * generate de `scripts/bike-data.mjs`. Disponibilitatea live nu e publică (e în aplicația GloBikes), deci nu o afișăm.
 */
export interface BikeStation {
  id: string
  /** `dock` = stație a sistemului de bike sharing; `rental` = închiriere cu personal (OSM) */
  kind: 'dock' | 'rental'
  name: string
  /** amplasamentul din regulament (doar la stațiile sistemului) */
  address?: string
  lat: number
  lng: number
}

export const BIKE_STATIONS = data.stations as BikeStation[]
/** câte stații are sistemul după regulament (o parte n-au coordonate publice) */
export const BIKE_OFFICIAL_COUNT = data.officialStations

export const bikeKey = (s: Pick<BikeStation, 'id'>) => `bike:${s.id}`

/** Câte un pin verde cu bicicleta (ligatura Material Symbols din eticheta pinului). */
export function bikeMarkers(stations: BikeStation[]): MapMarker[] {
  return stations.map((s) => ({ id: bikeKey(s), lat: s.lat, lng: s.lng, kind: 'bike', label: 'pedal_bike' }))
}

/** Ce stă în spatele unui pin `bike:<id>`; orice alt pin → null. */
export function findBike(id: string | null, stations: BikeStation[]): BikeStation | null {
  if (!id?.startsWith('bike:')) return null
  return stations.find((s) => bikeKey(s) === id) ?? null
}
