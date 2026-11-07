import { client } from './client'
import type { AuthResponse, RegisterRequest, UpdateMeRequest, UserDto } from '@/shared/types/auth'

/** AuthApi din BE (docs/API.md §Auth & utilizator). */
export const authApi = {
  login: (email: string, password: string) => client.post<AuthResponse>('/auth/login', { email, password }, { auth: false }),
  register: (req: RegisterRequest) => client.post<AuthResponse>('/auth/register', req, { auth: false }),
  me: () => client.get<UserDto>('/me'),
  updateMe: (patch: UpdateMeRequest) => client.patch<UserDto>('/me', patch),
}
