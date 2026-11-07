// T14 · docs/API.md §Admin (T14): GET /admin/stats, /city/businesses (verify/reject), /admin/{events|offers|actions}, /admin/users.
import { client } from './client'
import type { Page, Role } from '@/shared/types/common'
import type {
  AdminContentDto, AdminStatsDto, AdminUserDto, AdminUserUpdate, CityBusinessCreate, CityBusinessCreated, CityBusinessDto, ContentKind,
} from '@/shared/types/admin'

/** Administrare (`/admin/**`, doar ADMIN). */
export const adminApi = {
  stats: () => client.get<AdminStatsDto>('/admin/stats'),
  content: (kind: ContentKind, q: { status?: string; q?: string; all?: boolean; page?: number; size?: number } = {}) =>
    client.get<Page<AdminContentDto>>(`/admin/${kind}`, { query: q }),
  setStatus: (kind: ContentKind, id: number, status: string) => client.patch<AdminContentDto>(`/admin/${kind}/${id}/status`, { status }),
  users: (q: { role?: Role; q?: string; page?: number; size?: number } = {}) => client.get<Page<AdminUserDto>>('/admin/users', { query: q }),
  updateUser: (id: number, req: AdminUserUpdate) => client.patch<AdminUserDto>(`/admin/users/${id}`, req),
}

/** Firmele partenere în panoul Primăriei (`/city/businesses`, CITY_HALL și ADMIN). */
export const cityBusinessesApi = {
  list: (verified?: boolean) => client.get<CityBusinessDto[]>('/city/businesses', { query: { verified } }),
  create: (req: CityBusinessCreate) => client.post<CityBusinessCreated>('/city/businesses', req),
  verify: (id: number) => client.post<CityBusinessDto>(`/city/businesses/${id}/verify`),
  reject: (id: number, reason?: string) => client.post<void>(`/city/businesses/${id}/reject`, reason ? { reason } : undefined),
}
