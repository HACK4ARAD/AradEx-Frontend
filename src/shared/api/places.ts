import { client } from './client'
import type { GuidePointDto, GuidePointRequest, PlaceDto, PlaceQuery, PlaceRequest, PlaceSummary } from '@/shared/types/places'

/** PlacesApi + CityPlacesApi din BE (docs/API.md §Locuri & ghid, T05). Editarea: Primăria și Adminul. */
export const placesApi = {
  list: (q: PlaceQuery = {}) => client.get<PlaceSummary[]>('/places', { query: { ...q } }),
  get: (id: number, near?: string) => client.get<PlaceDto>(`/places/${id}`, { query: { near } }),

  create: (req: PlaceRequest) => client.post<PlaceDto>('/city/places', req),
  update: (id: number, req: PlaceRequest) => client.put<PlaceDto>(`/city/places/${id}`, req),
  remove: (id: number) => client.delete<void>(`/city/places/${id}`),
  addGuidePoint: (id: number, req: GuidePointRequest) => client.post<GuidePointDto>(`/city/places/${id}/guide-points`, req),
  updateGuidePoint: (id: number, gpId: number, req: GuidePointRequest) =>
    client.put<GuidePointDto>(`/city/places/${id}/guide-points/${gpId}`, req),
  removeGuidePoint: (id: number, gpId: number) => client.delete<void>(`/city/places/${id}/guide-points/${gpId}`),
}
