/**
 * T14 · Administrare și firme partenere (panourile web `/admin/*` și `/city/partners`). Regulile pure (filtre, validarea formularului,
 * starea următoare la moderare, rolurile permise) sunt exportate separat și testate în `useAdmin.test.ts`.
 * Erorile de API → toast cu `detail` (ProblemDetail), mesajele cunoscute traduse prin `adminErrorKey`.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminApi, cityBusinessesApi } from '@/shared/api'
import { ApiError, isDemoReadOnlyError } from '@/shared/api/client'
import { isDemoAccount } from '@/shared/composables/useAuthForm'
import { useUiStore } from '@/shared/stores/ui'
import type { BusinessCategory } from '@/shared/types/business'
import type { Role } from '@/shared/types/common'
import type {
  AdminContentDto, AdminStatsDto, AdminUserDto, AdminUserUpdate, CityBusinessCreate, CityBusinessCreated, CityBusinessDto, ContentKind,
} from '@/shared/types/admin'

// ---------------------------------------------------------------- reguli pure

export type PartnerFilter = 'all' | 'verify' | 'active' | 'rejected'

/** „De verificat” = neverificate și nerespinse; „Respinse” = neverificate cu respingere (inclusiv suspendate). */
export function partnerFilter(list: CityBusinessDto[], f: PartnerFilter): CityBusinessDto[] {
  switch (f) {
    case 'verify': return list.filter((b) => !b.verified && !b.rejectedAt)
    case 'active': return list.filter((b) => b.verified)
    case 'rejected': return list.filter((b) => !b.verified && !!b.rejectedAt)
    default: return list
  }
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = ['CAFE', 'RESTAURANT', 'PRODUCER', 'WINERY', 'SHOP', 'OTHER']

export interface PartnerForm { name: string; category: BusinessCategory; address: string; contactName: string; email: string; phone: string }
export type PartnerFormErrors = Partial<Record<keyof PartnerForm, string>>

export const emptyPartnerForm = (): PartnerForm => ({ name: '', category: 'CAFE', address: '', contactName: '', email: '', phone: '' })

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Aceleași reguli ca `CityBusinessCreate` din BE; valorile sunt chei i18n. */
export function validatePartnerForm(f: PartnerForm): PartnerFormErrors {
  const e: PartnerFormErrors = {}
  if (!f.name.trim()) e.name = 'admin.partners.form.errName'
  if (!f.address.trim()) e.address = 'admin.partners.form.errAddress'
  if (!f.contactName.trim()) e.contactName = 'admin.partners.form.errContact'
  if (!EMAIL.test(f.email.trim())) e.email = 'admin.partners.form.errEmail'
  return e
}

export function toPartnerCreate(f: PartnerForm): CityBusinessCreate {
  return {
    name: f.name.trim(), category: f.category, address: f.address.trim(), contactName: f.contactName.trim(),
    email: f.email.trim().toLowerCase(), phone: f.phone.trim() || undefined,
  }
}

/**
 * Butonul de moderare: publicat → ascuns, altfel → publicat. Acțiunile n-au HIDDEN: „ascunde” le trece înapoi în ciornă
 * (nu mai apar în aplicație, dar înscrierile rămân); cele încheiate (DONE) sau anulate nu se mai publică de aici.
 */
export function nextStatus(kind: ContentKind, status: string): string | null {
  if (status === 'PUBLISHED') return kind === 'actions' ? 'DRAFT' : 'HIDDEN'
  if (kind === 'actions' && (status === 'DONE' || status === 'CANCELLED')) return null
  return 'PUBLISHED'
}

/** Rolurile pe care Adminul le poate da din „Utilizatori” (firmele se gestionează din „Firme partenere”, voluntarii din T18). */
export const ASSIGNABLE_ROLES: Role[] = ['VISITOR', 'LOCAL', 'CITY_HALL', 'ADMIN']

export function canChangeRole(u: Pick<AdminUserDto, 'role' | 'id'>, meId?: number): boolean {
  return u.role !== 'BUSINESS' && u.role !== 'VOLUNTEER' && u.id !== meId
}

/** „+25”, „-10”, „25” → număr întreg ≠ 0 în ±100000; altfel null. */
export function parsePointsAdjust(raw: string | number): number | null {
  const s = String(raw).trim().replace(/\s/g, '')
  if (!/^[+-]?\d+$/.test(s)) return null
  const n = Number(s)
  return n !== 0 && Math.abs(n) <= 100000 ? n : null
}

export function totalUsers(s: Pick<AdminStatsDto, 'usersByRole'>): number {
  return Object.values(s.usersByRole).reduce((a, b) => a + b, 0)
}

/**
 * „Parolă temporară” (pentru cine și-a pierdut și parola, și codul de recuperare): de ce nu se poate pentru contul ăsta
 * (cheie i18n, afișată lângă butonul dezactivat) sau null. Aceleași reguli ca în BE: nu pentru administratori (403),
 * voluntari (intră cu codul de la Primărie), conturi fără e-mail și conturile demo (400).
 */
export function temporaryPasswordBlock(u: Pick<AdminUserDto, 'role' | 'email'>): string | null {
  if (u.role === 'ADMIN') return 'admin.users.sheet.temp.noAdmin'
  if (u.role === 'VOLUNTEER') return 'admin.users.sheet.temp.noVolunteer'
  if (!u.email) return 'admin.users.sheet.temp.noEmail'
  if (isDemoAccount(u)) return 'admin.users.sheet.temp.noDemo'
  return null
}

/** Eroarea de la POST /admin/users/{id}/temporary-password → cheie i18n. */
export function temporaryPasswordErrorKey(e: unknown): string {
  if (!(e instanceof ApiError)) return 'admin.users.sheet.temp.failed'
  if (e.status === 0) return 'auth.errors.network'
  if (e.status === 400) return 'admin.users.sheet.temp.notAllowed'
  if (isDemoReadOnlyError(e)) return 'common.demoReadOnly'
  if (e.status === 403) return 'admin.users.sheet.temp.noAdmin'
  if (e.status === 404) return 'admin.users.sheet.temp.notFound'
  return 'admin.users.sheet.temp.failed'
}

const KNOWN_ERRORS: Record<string, string> = {
  'Email already registered': 'admin.errors.emailTaken',
  'You cannot change your own role': 'admin.errors.selfRole',
  'You cannot disable your own account': 'admin.errors.selfDisable',
  'Business accounts are managed in Partner businesses': 'admin.errors.businessRole',
  'Volunteer accounts are created by City Hall': 'admin.errors.volunteerRole',
  insufficient_points: 'admin.errors.insufficientPoints',
}
export function adminErrorKey(e: unknown): string | null {
  return e instanceof Error ? KNOWN_ERRORS[e.message] ?? null : null
}

function useErrorToast() {
  const ui = useUiStore()
  const { t } = useI18n()
  return (e: unknown) => {
    const key = adminErrorKey(e)
    if (key) ui.toast(t(key), 'error')
    else ui.error(e)
  }
}

// ---------------------------------------------------------------- composables

export function useAdminStats() {
  const fail = useErrorToast()
  const stats = ref<AdminStatsDto | null>(null)
  const loading = ref(true)
  async function load() {
    loading.value = true
    try { stats.value = await adminApi.stats() } catch (e) { fail(e) } finally { loading.value = false }
  }
  return { stats, loading, load }
}

export function usePartners() {
  const fail = useErrorToast()
  const list = ref<CityBusinessDto[]>([])
  const loading = ref(true)
  const busy = ref<number | null>(null)
  const saving = ref(false)

  async function load(verified?: boolean) {
    loading.value = true
    try { list.value = await cityBusinessesApi.list(verified) } catch (e) { fail(e) } finally { loading.value = false }
  }
  function replace(b: CityBusinessDto) {
    list.value = list.value.map((x) => (x.id === b.id ? b : x))
  }
  async function verify(id: number): Promise<boolean> {
    busy.value = id
    try { replace(await cityBusinessesApi.verify(id)); return true } catch (e) { fail(e); return false } finally { busy.value = null }
  }
  async function reject(id: number, reason?: string): Promise<boolean> {
    busy.value = id
    try {
      await cityBusinessesApi.reject(id, reason)
      const b = list.value.find((x) => x.id === id)
      if (b) replace({ ...b, verified: false, rejectedAt: new Date().toISOString(), rejectReason: reason, activeOffers: 0, draftOffers: b.draftOffers + b.activeOffers })
      return true
    } catch (e) { fail(e); return false } finally { busy.value = null }
  }
  async function create(req: CityBusinessCreate): Promise<CityBusinessCreated | null> {
    saving.value = true
    try { return await cityBusinessesApi.create(req) } catch (e) { fail(e); return null } finally { saving.value = false }
  }
  return { list, loading, busy, saving, load, verify, reject, create }
}

export function useAdminContent() {
  const fail = useErrorToast()
  const items = ref<AdminContentDto[]>([])
  const total = ref(0)
  const loading = ref(true)
  const busy = ref<number | null>(null)

  async function load(kind: ContentKind, q: { status?: string; q?: string; all?: boolean; page?: number; size?: number } = {}) {
    loading.value = true
    try {
      const page = await adminApi.content(kind, q)
      items.value = page.content
      total.value = page.totalElements
    } catch (e) { fail(e); items.value = []; total.value = 0 } finally { loading.value = false }
  }
  async function setStatus(kind: ContentKind, id: number, status: string): Promise<AdminContentDto | null> {
    busy.value = id
    try {
      const row = await adminApi.setStatus(kind, id, status)
      items.value = items.value.map((x) => (x.id === id ? row : x))
      return row
    } catch (e) { fail(e); return null } finally { busy.value = null }
  }
  return { items, total, loading, busy, load, setStatus }
}

export function useAdminUsers() {
  const fail = useErrorToast()
  const items = ref<AdminUserDto[]>([])
  const total = ref(0)
  const loading = ref(true)
  const saving = ref(false)

  async function load(q: { role?: Role; q?: string; page?: number; size?: number } = {}) {
    loading.value = true
    try {
      const page = await adminApi.users(q)
      items.value = page.content
      total.value = page.totalElements
    } catch (e) { fail(e); items.value = []; total.value = 0 } finally { loading.value = false }
  }
  async function update(id: number, req: AdminUserUpdate): Promise<AdminUserDto | null> {
    saving.value = true
    try {
      const u = await adminApi.updateUser(id, req)
      items.value = items.value.map((x) => (x.id === id ? u : x))
      return u
    } catch (e) { fail(e); return null } finally { saving.value = false }
  }
  return { items, total, loading, saving, load, update }
}

/** Parola temporară a unui cont (o vede doar Adminul, o singură dată). Fără i18n aici: eroarea e o cheie, afișată de ecran. */
export function useTemporaryPassword() {
  const busy = ref(false)
  const error = ref('')
  async function generate(id: number): Promise<string | null> {
    if (busy.value) return null
    busy.value = true
    error.value = ''
    try {
      return (await adminApi.temporaryPassword(id)).temporaryPassword
    } catch (e) {
      error.value = temporaryPasswordErrorKey(e)
      return null
    } finally {
      busy.value = false
    }
  }
  return { busy, error, generate }
}
