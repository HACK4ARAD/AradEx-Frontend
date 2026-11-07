// T13 · docs/API.md §AI: itinerariile salvate. POST /itineraries (public; cu login e legat de cont), GET /itineraries/{shareCode}
// (după id doar proprietarul), POST /itineraries/{shareCode}/save (cu login: îl leagă de cont sau face o copie), GET /me/itineraries.
import { client } from './client'
import type { ItineraryDto } from '@/shared/types/plan'

export const itinerariesApi = {
  save: (body: ItineraryDto) => client.post<ItineraryDto>('/itineraries', body),
  get: (idOrShareCode: string | number) => client.get<ItineraryDto>(`/itineraries/${encodeURIComponent(String(idOrShareCode))}`),
  saveToMine: (shareCode: string) => client.post<ItineraryDto>(`/itineraries/${encodeURIComponent(shareCode)}/save`),
  mine: () => client.get<ItineraryDto[]>('/me/itineraries'),
}
