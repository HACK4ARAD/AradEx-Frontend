import { client } from './client'
import type {
  AuthConfig, AuthResponse, ChangePasswordRequest, ChangePasswordResponse, RecoverPasswordRequest, RecoveryCodeResponse, RegisterRequest, UpdateMeRequest,
  UserDto,
} from '@/shared/types/auth'

/** AuthApi din BE (docs/API.md §Auth & utilizator). */
export const authApi = {
  /** Modul de lucru (public): `demoOnly` cât timp aplicația nu e live */
  config: () => client.get<AuthConfig>('/auth/config', { auth: false }),
  login: (email: string, password: string) => client.post<AuthResponse>('/auth/login', { email, password }, { auth: false }),
  register: (req: RegisterRequest) => client.post<AuthResponse>('/auth/register', req, { auth: false }),
  /** Am uitat parola: e-mail + codul de recuperare + parola nouă → sesiunea și un cod de recuperare nou */
  recoverPassword: (req: RecoverPasswordRequest) => client.post<AuthResponse>('/auth/password/recover', req, { auth: false }),
  me: () => client.get<UserDto>('/me'),
  updateMe: (patch: UpdateMeRequest) => client.patch<UserDto>('/me', patch),
  /** Schimbă parola (și parola temporară de la Admin); parola actuală greșită = 400, nu 401 */
  changePassword: (req: ChangePasswordRequest) => client.post<ChangePasswordResponse>('/me/password', req),
  /** Un cod de recuperare nou, confirmat cu parola; cel vechi nu mai merge */
  newRecoveryCode: (password: string) => client.post<RecoveryCodeResponse>('/me/recovery-code', { password }),
}
