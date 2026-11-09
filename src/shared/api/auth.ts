import { client } from './client'
import type { AuthResponse, RegisterRequest, ResetPasswordRequest, UpdateMeRequest, UserDto } from '@/shared/types/auth'

/** AuthApi din BE (docs/API.md §Auth & utilizator). */
export const authApi = {
  login: (email: string, password: string) => client.post<AuthResponse>('/auth/login', { email, password }, { auth: false }),
  register: (req: RegisterRequest) => client.post<AuthResponse>('/auth/register', req, { auth: false }),
  /** Am uitat parola: codul de 6 cifre pleacă pe e-mail; 204 mereu, ca să nu se afle ce adrese au cont */
  forgotPassword: (email: string) => client.post<void>('/auth/password/forgot', { email }, { auth: false }),
  /** Parola nouă cu codul din e-mail; răspunsul e sesiunea (utilizatorul e conectat) */
  resetPassword: (req: ResetPasswordRequest) => client.post<AuthResponse>('/auth/password/reset', req, { auth: false }),
  me: () => client.get<UserDto>('/me'),
  updateMe: (patch: UpdateMeRequest) => client.patch<UserDto>('/me', patch),
}
