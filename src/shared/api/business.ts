import { client } from './client'
import type {
  AnnouncementCreate, AnnouncementDto, BusinessActivityDto, BusinessDto, BusinessMeDto, BusinessPageDto, BusinessUpdate,
  EventCreate,
} from '@/shared/types/business'
import type { EventDto } from '@/shared/types/events'

/** BusinessApi din BE (docs/API.md §Firme, T09): pagina publică + panoul firmei (`/business/**`, rol BUSINESS). */
export const businessApi = {
  page: (id: number) => client.get<BusinessPageDto>(`/businesses/${id}`),
  me: () => client.get<BusinessMeDto>('/business/me'),
  updateMe: (req: BusinessUpdate) => client.put<BusinessDto>('/business/me', req),
  events: () => client.get<EventDto[]>('/business/events'),
  createEvent: (req: EventCreate) => client.post<EventDto>('/business/events', req),
  updateEvent: (id: number, req: EventCreate) => client.put<EventDto>(`/business/events/${id}`, req),
  deleteEvent: (id: number) => client.delete<void>(`/business/events/${id}`),
  announcements: () => client.get<AnnouncementDto[]>('/business/announcements'),
  createAnnouncement: (req: AnnouncementCreate) => client.post<AnnouncementDto>('/business/announcements', req),
  deleteAnnouncement: (id: number) => client.delete<void>(`/business/announcements/${id}`),
  activity: () => client.get<BusinessActivityDto>('/business/activity'),
}
