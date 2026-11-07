// Comun · T01/T03. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

/** VOLUNTEER: cont creat de Primărie (T18); nu se poate înregistra singur, ca CITY_HALL și ADMIN. */
export type Role = 'VISITOR' | 'LOCAL' | 'BUSINESS' | 'CITY_HALL' | 'ADMIN' | 'VOLUNTEER'
export type Transport = 'WALK' | 'CAR' | 'PUBLIC'

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
}

export interface ProblemDetail {
  type?: string
  title?: string
  status: number
  detail?: string
  instance?: string
  errors?: { field: string; message: string }[]
  /** 429 (T21, coduri OTP): peste câte secunde se poate încerca din nou */
  retryAfterSeconds?: number
}

export interface GeoPoint { lat: number; lng: number }

export interface HealthDto { status: string; time: string; version?: string }
