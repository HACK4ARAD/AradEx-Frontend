import { client } from './client'
import type {
  AuthResponse, OtpRegisterRequest, OtpRequestResponse, OtpVerifyResponse, RegisterRequest, UpdateMeRequest, UserDto,
} from '@/shared/types/auth'

/** AuthApi din BE (docs/API.md §Auth & utilizator). */
export const authApi = {
  login: (email: string, password: string) => client.post<AuthResponse>('/auth/login', { email, password }, { auth: false }),
  register: (req: RegisterRequest) => client.post<AuthResponse>('/auth/register', req, { auth: false }),
  /** T21: conturile personale (telefon + cod OTP) */
  otpRequest: (phone: string) => client.post<OtpRequestResponse>('/auth/otp/request', { phone }, { auth: false }),
  otpVerify: (phone: string, code: string) => client.post<OtpVerifyResponse>('/auth/otp/verify', { phone, code }, { auth: false }),
  otpRegister: (req: OtpRegisterRequest) => client.post<AuthResponse>('/auth/otp/register', req, { auth: false }),
  me: () => client.get<UserDto>('/me'),
  updateMe: (patch: UpdateMeRequest) => client.patch<UserDto>('/me', patch),
}
