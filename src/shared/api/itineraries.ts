// T13 · docs/API.md §AI: itinerariile salvate. POST /itineraries (public; cu login e legat de cont), GET /itineraries/{idOrShareCode}, GET /me/itineraries.
import { client } from './client'
import type { ItineraryDto } from '@/shared/types/plan'

export const itinerariesApi = {
  save: (body: ItineraryDto) => client.post<ItineraryDto>('/itineraries', body),
  get: (idOrShareCode: string | number) => client.get<ItineraryDto>(`/itineraries/${encodeURIComponent(String(idOrShareCode))}`),
  mine: () => client.get<ItineraryDto[]>('/me/itineraries'),
}
