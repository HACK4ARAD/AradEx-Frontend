// T18 · docs/API.md §Voluntari: intrarea cu cod (POST /auth/volunteer), aplicația voluntarului (/vol/*, cu chatul de grup al
// fiecărei acțiuni) și panoul Primăriei (/city/volunteers, /city/coordinators; fără mesaje).
import { client } from './client'
import type { AuthResponse } from '@/shared/types/auth'
import type { ConfirmResultDto, RegistrationDto } from '@/shared/types/community'
import type {
  ChatDto, ChatMessageDto, ChatSummaryDto, CoordinatorDto, VolunteerActionDto, VolunteerCreate, VolunteerDto, VolunteerMeDto, VolunteerUpdate,
} from '@/shared/types/volunteer'

export const volunteerApi = {
  /** Voluntarul (aplicația) */
  login: (code: string) => client.post<AuthResponse>('/auth/volunteer', { code }, { auth: false }),
  me: () => client.get<VolunteerMeDto>('/vol/me'),
  actions: () => client.get<VolunteerActionDto[]>('/vol/actions'),
  scan: (code: string, actionId?: number) => client.post<ConfirmResultDto>('/vol/scan', { code, actionId }),
  scans: () => client.get<RegistrationDto[]>('/vol/scans'),
  /** Chatul de grup al fiecărei acțiuni (doar voluntarii ei; Primăria nu e în chat) */
  chats: () => client.get<ChatSummaryDto[]>('/vol/chats'),
  chat: (actionId: number) => client.get<ChatDto>(`/vol/actions/${actionId}/chat`),
  post: (actionId: number, text: string) => client.post<ChatMessageDto>(`/vol/actions/${actionId}/chat`, { text }),
  postPhoto: (actionId: number, file: File | Blob, text?: string) => {
    const form = new FormData()
    form.append('file', file, file instanceof File ? file.name : 'poza.jpg')
    return client.post<ChatMessageDto>(`/vol/actions/${actionId}/chat/photo`, form, { query: { text } })
  },
}

export const cityVolunteersApi = {
  /** Primăria (panoul web) */
  list: () => client.get<VolunteerDto[]>('/city/volunteers'),
  create: (req: VolunteerCreate) => client.post<VolunteerDto>('/city/volunteers', req),
  update: (id: number, req: VolunteerUpdate) => client.patch<VolunteerDto>(`/city/volunteers/${id}`, req),
  coordinators: () => client.get<CoordinatorDto[]>('/city/coordinators'),
}
