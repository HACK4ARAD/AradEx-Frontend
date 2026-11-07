import { client } from './client'
import type {
  ActionCreate, ActionDto, ActionSummary, CityDashboardDto, ConfirmResultDto, LeaderboardDto, LeaderboardPeriod, PointsDto,
  RegistrationDto, RegistrationStatus,
} from '@/shared/types/community'

/** CommunityApi + PointsApi + CityCommunityApi din BE (docs/API.md §Comunitate & puncte, T11). */
export const communityApi = {
  actions: (upcoming = true) => client.get<ActionSummary[]>('/community/actions', { query: { upcoming } }),
  action: (id: number) => client.get<ActionDto>(`/community/actions/${id}`),
  register: (id: number) => client.post<RegistrationDto>(`/community/actions/${id}/register`),
  cancel: (id: number) => client.delete<void>(`/community/actions/${id}/register`),
  myRegistrations: () => client.get<RegistrationDto[]>('/me/community/registrations'),
  leaderboard: (period: LeaderboardPeriod = 'month') => client.get<LeaderboardDto>('/community/leaderboard', { query: { period } }),
  myPoints: () => client.get<PointsDto>('/me/points'),
}

/** Panoul Primăriei (`/city/**`, CITY_HALL și ADMIN). */
export const cityCommunityApi = {
  dashboard: () => client.get<CityDashboardDto>('/city/dashboard'),
  actions: () => client.get<ActionDto[]>('/city/actions'),
  create: (req: ActionCreate) => client.post<ActionDto>('/city/actions', req),
  update: (id: number, req: ActionCreate) => client.put<ActionDto>(`/city/actions/${id}`, req),
  registrations: (actionId: number, status?: RegistrationStatus) =>
    client.get<RegistrationDto[]>(`/city/actions/${actionId}/registrations`, { query: { status } }),
  confirmCode: (code: string) => client.post<ConfirmResultDto>('/city/registrations/confirm', { code }),
  confirm: (registrationId: number) => client.post<ConfirmResultDto>(`/city/registrations/${registrationId}/confirm`),
  reject: (registrationId: number) => client.post<RegistrationDto>(`/city/registrations/${registrationId}/reject`),
}
