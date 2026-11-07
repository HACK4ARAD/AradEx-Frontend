import { client } from './client'
import type { Page } from '@/shared/types/common'
import type { EventCreate, EventDto, EventQuery, EventSummary } from '@/shared/types/events'

/** EventsApi din BE (docs/API.md §Evenimente, T06). */
export const eventsApi = {
  list: (q: EventQuery = {}) => client.get<Page<EventSummary>>('/events', { query: { ...q } }),
  get: (id: number, near?: string) => client.get<EventDto>(`/events/${id}`, { query: { near } }),
  create: (req: EventCreate) => client.post<EventDto>('/events', req),
  update: (id: number, req: EventCreate) => client.put<EventDto>(`/events/${id}`, req),
  remove: (id: number) => client.delete<void>(`/events/${id}`),
  save: (id: number) => client.post<void>(`/events/${id}/save`),
  unsave: (id: number) => client.delete<void>(`/events/${id}/save`),
  saved: (near?: string) => client.get<EventSummary[]>('/me/saved-events', { query: { near } }),
}
