import type { ProblemDetail } from '@/shared/types/common'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080/api/v1'
const TOKEN_KEY = 'ax.token'

/** Eroare de API: are status + detail din ProblemDetail (RFC 7807). FE afișează `detail` în toast. */
export class ApiError extends Error {
  status: number
  problem?: ProblemDetail
  constructor(status: number, message: string, problem?: ProblemDetail) {
    super(message)
    this.status = status
    this.problem = problem
  }
}

/**
 * Modul demo (GET /auth/config → `demoOnly`): până la lansare orice cerere care modifică ceva (POST/PUT/PATCH/DELETE, în afară
 * de /auth/**) primește 403 cu exact acest `detail`. Mesajul arătat oamenilor e textul tradus `common.demoReadOnly`.
 */
export const DEMO_READ_ONLY_DETAIL = 'Demo mode: changes are disabled until launch'

function isDemoReadOnly(status: number, problem?: ProblemDetail): boolean {
  return status === 403 && problem?.detail === DEMO_READ_ONLY_DETAIL
}

/** 403 „Demo mode: changes are disabled until launch”: aplicația e doar de vizualizare până la lansare. */
export function isDemoReadOnlyError(e: unknown): boolean {
  return e instanceof ApiError && isDemoReadOnly(e.status, e.problem)
}

/** Traducerea textelor (o înregistrează `shared/i18n` la pornire; clientul nu importă i18n, ca testele să-l poată folosi singur). */
let translate: ((key: string) => string) | null = null
export function setErrorTranslator(fn: (key: string) => string) { translate = fn }

/**
 * Textul unei erori de API (`ApiError.message`, arătat în toast-uri prin `ui.error` și în ecrane): `detail` din ProblemDetail,
 * altfel `title`, altfel „Eroare <status>”; pentru modul demo, textul tradus în limba curentă (niciodată engleza din BE).
 */
export function apiErrorMessage(status: number, problem?: ProblemDetail): string {
  if (isDemoReadOnly(status, problem) && translate) return translate('common.demoReadOnly')
  return problem?.detail || problem?.title || `Eroare ${status}`
}

export const tokenStore = {
  get(): string | null {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set(token: string | null) {
    try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY) } catch { /* privat / blocat */ }
  },
}

/** Apelat de store-ul de auth la 401, ca să facă logout + redirect fără import circular. */
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn }

type Query = Record<string, string | number | boolean | undefined | null>

interface Options { query?: Query; body?: unknown; headers?: Record<string, string>; auth?: boolean }

function buildUrl(path: string, query?: Query): string {
  const url = new URL(BASE.replace(/\/$/, '') + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

async function request<T>(method: string, path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...opts.headers }
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData
  if (opts.body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token && opts.auth !== false) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method, headers, body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
    })
  } catch {
    throw new ApiError(0, 'Nu am putut contacta serverul. Verifică conexiunea.')
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? safeJson(text) : undefined

  if (!res.ok) {
    const problem = data as ProblemDetail | undefined
    // doar pentru cereri trimise cu token (un login greșit nu deloghează sesiunea curentă)
    if (res.status === 401 && headers.Authorization) onUnauthorized?.()
    throw new ApiError(res.status, apiErrorMessage(res.status, problem), problem)
  }
  return data as T
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text) } catch { return text }
}

export const client = {
  get: <T>(path: string, opts?: Options) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: Options) => request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: Options) => request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: Options) => request<T>('PATCH', path, { ...opts, body }),
  delete: <T>(path: string, opts?: Options) => request<T>('DELETE', path, opts),
}
