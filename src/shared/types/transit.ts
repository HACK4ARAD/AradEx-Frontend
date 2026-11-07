// T22 · transport public CTP Arad. Oglinda DTO-urilor din docs/API.md §Transport public; se schimbă în același PR cu API.md.

export type TransitMode = 'TRAM' | 'BUS'

/** O stație (un peron). `id` = id-ul Telelink; `routeIds` = liniile care opresc aici, `lines` = numerele lor afișate. */
export interface TransitStopDto {
  id: number; name: string; code?: string; lat: number; lng: number; routeIds: number[]; lines: string[]
}

/** Varianta unei linii: opririle în ordine și traseul `[lat, lng]`. `index` poate fi negativ. */
export interface TransitPatternDto {
  index: number; fromStopId?: number; toStopId?: number; stopIds: number[]; path: [number, number][]
}

/** O linie. `id` = routeId Telelink (NU numărul afișat), `shortName` = „1”, „39b”; culori `#rrggbb`, pot lipsi. */
export interface TransitRouteDto {
  id: number; shortName: string; longName: string; mode: TransitMode; color?: string; textColor?: string
  patterns: TransitPatternDto[]
}

/** Un vehicul. `routeShortName`/`mode`/`color` lipsesc pentru o linie necunoscută; `stale` = poziție mai veche de 120 s. */
export interface TransitVehicleDto {
  id: string; label?: string; routeId: number; routeShortName?: string; mode?: TransitMode; color?: string; headsign?: string
  lat: number; lng: number; heading?: number; delaySeconds?: number; nextStopId?: number; nextStopArrival?: string
  lastUpdated?: string; stale: boolean
}

/** GET /transit/vehicles — `live=false`: sursa nu răspunde, lista e goală. */
export interface TransitVehiclesDto {
  live: boolean; updatedAt?: string; attribution: string; vehicles: TransitVehicleDto[]
}

/** O sosire: `at` = ora estimată (program + întârziere), `minutes` = peste câte minute (0 = acum). */
export interface TransitArrivalDto {
  routeId: number; routeShortName?: string; mode?: TransitMode; color?: string; headsign?: string; stopId: number
  at: string; minutes: number; delaySeconds: number; realtime: boolean
}

/** GET /transit/stops/{id}/arrivals și GET /transit/nearest (`distanceKm` doar aici). `live=false` = fără sosiri, doar liniile. */
export interface StopArrivalsDto {
  stop: TransitStopDto; distanceKm?: number; live: boolean; updatedAt?: string; attribution: string; arrivals: TransitArrivalDto[]
}

/** Marker pentru `MapView` (T08): același format ca markerele hărții, cu `kind` de transport. */
export interface TransitMarker {
  id: string; lat: number; lng: number; kind: 'stop' | 'vehicle'; label: string
}
