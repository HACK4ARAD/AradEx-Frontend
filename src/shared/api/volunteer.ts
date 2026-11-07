// T18 · docs/API.md §Voluntari: intrarea cu cod (POST /auth/volunteer), aplicația voluntarului (/vol/*) și panoul Primăriei
// (/city/volunteers, /city/coordinators).
import { client } from './client'
import type { AuthResponse } from '@/shared/types/auth'
import type { ConfirmResultDto, RegistrationDto } from '@/shared/types/community'
import type {
  CoordinatorDto, VolunteerActionDto, VolunteerCreate, VolunteerDto, VolunteerMeDto, VolunteerMessageDto, VolunteerUpdate,
} from '@/shared/types/volunteer'

export const volunteerApi = {
  /** Voluntarul (aplicația) */
  login: (code: string) => client.post<AuthResponse>('/auth/volunteer', { code }, { auth: false }),
  me: () => client.get<VolunteerMeDto>('/vol/me'),
  actions: () => client.get<VolunteerActionDto[]>('/vol/actions'),
  scan: (code: string, actionId?: number) => client.post<ConfirmResultDto>('/vol/scan', { code, actionId }),
  scans: () => client.get<RegistrationDto[]>('/vol/scans'),
  messages: () => client.get<VolunteerMessageDto[]>('/vol/messages'),
  send: (text: string) => client.post<VolunteerMessageDto>('/vol/messages', { text }),
}

export const cityVolunteersApi = {
  /** Primăria (panoul web) */
  list: () => client.get<VolunteerDto[]>('/city/volunteers'),
  create: (req: VolunteerCreate) => client.post<VolunteerDto>('/city/volunteers', req),
  update: (id: number, req: VolunteerUpdate) => client.patch<VolunteerDto>(`/city/volunteers/${id}`, req),
  messages: (id: number) => client.get<VolunteerMessageDto[]>(`/city/volunteers/${id}/messages`),
  send: (id: number, text: string) => client.post<VolunteerMessageDto>(`/city/volunteers/${id}/messages`, { text }),
  coordinators: () => client.get<CoordinatorDto[]>('/city/coordinators'),
}
