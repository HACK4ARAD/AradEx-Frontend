import { client } from './client'
import type { StopArrivalsDto, TransitRouteDto, TransitStopDto, TransitVehiclesDto } from '@/shared/types/transit'

/**
 * TransitApi din BE (docs/API.md §Transport public, T22) — public, fără cont. Date: CTP Arad / Telelink.
 * Fără token (`auth: false`): un token expirat nu trebuie să delogheze pe cineva din cauza unui rând auxiliar.
 */
const pub = { auth: false } as const
export const transitApi = {
  stops: () => client.get<TransitStopDto[]>('/transit/stops', pub),
  routes: () => client.get<TransitRouteDto[]>('/transit/routes', pub),
  vehicles: () => client.get<TransitVehiclesDto>('/transit/vehicles', pub),
  arrivals: (stopId: number) => client.get<StopArrivalsDto>(`/transit/stops/${stopId}/arrivals`, pub),
  nearest: (lat: number, lng: number) =>
    client.get<StopArrivalsDto>('/transit/nearest', { ...pub, query: { lat: lat.toFixed(6), lng: lng.toFixed(6) } }),
}
