import { computed, ref, watch, type Ref } from 'vue'
import { cityCommunityApi, communityApi } from '@/shared/api/community'
import { ApiError } from '@/shared/api/client'
import { useUiStore } from '@/shared/stores/ui'
import { bucharestIso, splitBucharest } from '@/shared/composables/useEventForm'
import type {
  ActionCategory, ActionCreate, ActionDto, ActionSummary, CityDashboardDto, ConfirmResultDto, LeaderboardDto, LeaderboardPeriod,
  PointsDto, RegistrationDto,
} from '@/shared/types/community'

/**
 * Comunitate & puncte (T11) — logica comună pentru mobil și web: acțiuni, înscriere / anulare, punctele mele, clasament,
 * panoul Primăriei (confirmare QR / din listă, respingere, acțiuni noi). Erorile API → toast cu `detail`.
 */

// ---------------------------------------------------------------- niveluri (design/final/shared/data.js LEVELS)

export const LEVELS = [
  { key: 'newcomer', min: 0 },
  { key: 'volunteer', min: 150 },
  { key: 'ambassador', min: 500 },
  { key: 'legend', min: 1000 },
] as const

export interface Level { key: (typeof LEVELS)[number]['key']; next?: (typeof LEVELS)[number]; toNext: number; progress: number }

/** Nivelul pentru un sold: numele, următorul nivel, câte puncte mai lipsesc și progresul (0–100). */
export function levelFor(points: number): Level {
  let i = 0
  LEVELS.forEach((l, idx) => { if (points >= l.min) i = idx })
  const cur = LEVELS[i]
  const next = LEVELS[i + 1]
  if (!next) return { key: cur.key, toNext: 0, progress: 100 }
  return { key: cur.key, next, toNext: next.min - points, progress: Math.round(((points - cur.min) / (next.min - cur.min)) * 100) }
}

// ---------------------------------------------------------------- ajutoare de afișare (ora Aradului)

const TZ = 'Europe/Bucharest'
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('ro-RO', { timeZone: TZ, ...o })
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Data din colțul cardului: { dow: 'SÂM', day: '7', mon: 'NOV' }. */
export function dayParts(iso: string) {
  const d = new Date(iso)
  const up = (o: Intl.DateTimeFormatOptions) => fmt(o).format(d).replace('.', '').toUpperCase()
  return { dow: up({ weekday: 'short' }), day: up({ day: 'numeric' }), mon: up({ month: 'short' }) }
}
/** „Noiembrie” (luna curentă, pentru Clasament). */
export const currentMonthLabel = (now = new Date()) => cap(fmt({ month: 'long' }).format(now))
/** Ora curentă la Arad (0–23), pentru salut. */
export const aradHour = (now = new Date()) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(now))
/** Miezul nopții de azi, ora Aradului, ca timestamp (independent de fusul telefonului). */
export const aradTodayStart = (todayIso: string) => new Date(bucharestIso(todayIso, '00:00')).getTime()
/** „Radu M.” → „RM”. */
export const initials = (name?: string) => (name ?? '?').trim().split(/\s+/).map((s) => s.charAt(0)).join('').slice(0, 2).toUpperCase()
/** Indicații în Google Maps (fără cheie), până la harta T08. */
export const directionsUrl = (a: { lat: number; lng: number }) => `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`
/** Rolurile care strâng puncte (au card cu puncte / „locul tău”). */
export const earnsPoints = (role: string | null | undefined) => role === 'LOCAL' || role === 'VISITOR'

/** Acțiunea s-a încheiat (nu mai acceptă înscrieri). */
export const isEnded = (a: Pick<ActionSummary, 'endAt'>, now = Date.now()) => new Date(a.endAt).getTime() <= now
/** Locuri libere. */
export const spotsLeft = (a: Pick<ActionSummary, 'capacity' | 'registeredCount'>) => Math.max(0, a.capacity - a.registeredCount)
/** O înscriere activă (nu anulată / respinsă). */
export const isActiveRegistration = (r?: RegistrationDto) => !!r && (r.status === 'REGISTERED' || r.status === 'CONFIRMED')

// ---------------------------------------------------------------- localnic / public

export function useActions() {
  const ui = useUiStore()
  const actions = ref<ActionSummary[]>([])
  const loading = ref(true)
  const error = ref<unknown>(null)

  const savingId = ref<number | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      actions.value = await communityApi.actions(true)
    } catch (e) {
      error.value = e
      ui.error(e)
    } finally {
      loading.value = false
    }
  }

  function patch(id: number, fn: (a: ActionSummary) => ActionSummary) {
    actions.value = actions.value.map((a) => (a.id === id ? fn(a) : a))
  }

  /** Înscriere direct din listă (web): întoarce înscrierea sau null la eroare. */
  async function register(id: number): Promise<RegistrationDto | null> {
    savingId.value = id
    try {
      const r = await communityApi.register(id)
      patch(id, (a) => ({ ...a, myRegistration: r, registeredCount: a.registeredCount + 1 }))
      return r
    } catch (e) {
      ui.error(e)
      return null
    } finally {
      savingId.value = null
    }
  }

  async function cancel(id: number): Promise<boolean> {
    savingId.value = id
    try {
      await communityApi.cancel(id)
      patch(id, (a) => ({ ...a, myRegistration: undefined, registeredCount: Math.max(0, a.registeredCount - 1) }))
      return true
    } catch (e) {
      ui.error(e)
      return false
    } finally {
      savingId.value = null
    }
  }
  return { actions, loading, error, savingId, load, register, cancel }
}

export function useAction(id: Ref<number>) {
  const ui = useUiStore()
  const action = ref<ActionDto | null>(null)
  const loading = ref(true)
  const notFound = ref(false)
  const saving = ref(false)

  async function load() {
    loading.value = true
    notFound.value = false
    try {
      action.value = await communityApi.action(id.value)
    } catch (e) {
      action.value = null
      if (e instanceof ApiError && e.status === 404) notFound.value = true
      else ui.error(e)
    } finally {
      loading.value = false
    }
  }

  /** Mă înscriu: întoarce înscrierea (cu codul pentru QR) sau null la eroare. */
  async function register(): Promise<RegistrationDto | null> {
    if (!action.value) return null
    saving.value = true
    try {
      const r = await communityApi.register(action.value.id)
      action.value = { ...action.value, myRegistration: r, registeredCount: action.value.registeredCount + 1 }
      return r
    } catch (e) {
      ui.error(e)
      if (e instanceof ApiError && e.status === 409) void load()   // poate s-a umplut între timp
      return null
    } finally {
      saving.value = false
    }
  }

  async function cancel(): Promise<boolean> {
    if (!action.value) return false
    saving.value = true
    try {
      await communityApi.cancel(action.value.id)
      action.value = { ...action.value, myRegistration: undefined, registeredCount: Math.max(0, action.value.registeredCount - 1) }
      return true
    } catch (e) {
      ui.error(e)
      return false
    } finally {
      saving.value = false
    }
  }

  watch(id, load)
  return { action, loading, notFound, saving, load, register, cancel }
}

export function useMyRegistrations() {
  const ui = useUiStore()
  const items = ref<RegistrationDto[]>([])
  const loading = ref(true)
  async function load() {
    loading.value = true
    try { items.value = await communityApi.myRegistrations() } catch (e) { ui.error(e) } finally { loading.value = false }
  }
  return { items, loading, load }
}

export function usePoints() {
  const ui = useUiStore()
  const points = ref<PointsDto | null>(null)
  const loading = ref(true)
  async function load() {
    loading.value = true
    try { points.value = await communityApi.myPoints() } catch (e) { ui.error(e) } finally { loading.value = false }
  }
  const level = computed(() => levelFor(points.value?.balance ?? 0))
  return { points, level, loading, load }
}

export function useLeaderboard(period: Ref<LeaderboardPeriod>) {
  const ui = useUiStore()
  const board = ref<LeaderboardDto | null>(null)
  const loading = ref(true)
  async function load() {
    loading.value = true
    // la eroare `board` devine null, ca ecranul să arate starea de eroare (nu „nimeni n-a câștigat puncte”)
    try { board.value = await communityApi.leaderboard(period.value) } catch (e) { board.value = null; ui.error(e) } finally { loading.value = false }
  }
  watch(period, load)
  return { board, loading, load }
}

// ---------------------------------------------------------------- Primăria

/** Rezultatul unei scanări / confirmări, pentru cardul „Confirmat · +50 puncte / Deja confirmat / Cod necunoscut”. */
export type ScanResult =
  | { kind: 'ok'; result: ConfirmResultDto }
  | { kind: 'already'; result: ConfirmResultDto }
  | { kind: 'error'; message: string; status: number }

/** Normalizează un cod tastat / scanat: spații scoase, litere mari (`ax-c1-k4n7pa` → `AX-C1-K4N7PA`). */
export function normalizeCode(raw: string): string {
  return raw.trim().replace(/\s+/g, '').toUpperCase()
}

export const CODE_RE = /^AX-[TOC]\d+-[A-HJ-NP-Z2-9]{6}$/

export function useCityCommunity() {
  const ui = useUiStore()
  const actions = ref<ActionDto[]>([])
  const loading = ref(true)
  const saving = ref(false)

  async function loadActions() {
    loading.value = true
    try { actions.value = await cityCommunityApi.actions() } catch (e) { ui.error(e) } finally { loading.value = false }
  }

  /** Confirmă după cod (QR sau tastat). Nu aruncă: întoarce rezultatul pentru card. */
  async function confirmCode(raw: string): Promise<ScanResult> {
    const code = normalizeCode(raw)
    if (!CODE_RE.test(code)) return { kind: 'error', message: '', status: 400 }
    try {
      const r = await cityCommunityApi.confirmCode(code)
      return { kind: r.alreadyConfirmed ? 'already' : 'ok', result: r }
    } catch (e) {
      return { kind: 'error', message: e instanceof Error ? e.message : '', status: e instanceof ApiError ? e.status : 0 }
    }
  }

  async function confirm(id: number): Promise<ConfirmResultDto | null> {
    try { return await cityCommunityApi.confirm(id) } catch (e) { ui.error(e); return null }
  }

  async function reject(id: number): Promise<RegistrationDto | null> {
    try { return await cityCommunityApi.reject(id) } catch (e) { ui.error(e); return null }
  }

  async function save(req: ActionCreate, id?: number): Promise<ActionDto | null> {
    saving.value = true
    try {
      const a = id ? await cityCommunityApi.update(id, req) : await cityCommunityApi.create(req)
      actions.value = id ? actions.value.map((x) => (x.id === id ? a : x)) : [a, ...actions.value]
      return a
    } catch (e) {
      ui.error(e)
      return null
    } finally {
      saving.value = false
    }
  }

  return { actions, loading, saving, loadActions, confirmCode, confirm, reject, save }
}

/** Înscrișii unei acțiuni (Validare). Se reîncarcă când se schimbă acțiunea. */
export function useActionRegistrations(actionId: Ref<number | null>) {
  const ui = useUiStore()
  const items = ref<RegistrationDto[]>([])
  const loading = ref(false)
  async function load() {
    if (!actionId.value) { items.value = []; return }
    loading.value = true
    try { items.value = await cityCommunityApi.registrations(actionId.value) } catch (e) { ui.error(e) } finally { loading.value = false }
  }
  /** Înlocuiește o înscriere după o confirmare / respingere (fără reîncărcare). */
  function replace(r: RegistrationDto) {
    items.value = items.value.map((x) => (x.id === r.id ? { ...x, ...r, user: r.user ?? x.user } : x))
  }
  const counts = computed(() => ({
    registered: items.value.filter((r) => r.status === 'REGISTERED').length,
    confirmed: items.value.filter((r) => r.status === 'CONFIRMED').length,
    noShow: items.value.filter((r) => r.status === 'NO_SHOW').length,
  }))
  watch(actionId, load)
  return { items, loading, counts, load, replace }
}

export function useCityDashboard() {
  const ui = useUiStore()
  const data = ref<CityDashboardDto | null>(null)
  const loading = ref(true)
  async function load() {
    loading.value = true
    try { data.value = await cityCommunityApi.dashboard() } catch (e) { ui.error(e) } finally { loading.value = false }
  }
  return { data, loading, load }
}

// ---------------------------------------------------------------- formularul unei acțiuni (web: pagină; previzualizare live)

export const ACTION_CATEGORIES: ActionCategory[] = ['ENVIRONMENT', 'HEALTH', 'SOCIAL', 'CULTURE']
/** Ca în design: puncte 30–100, locuri 20–100 (alegeri rapide; câmpul acceptă și alte valori). */
export const POINT_CHOICES = [30, 50, 60, 80, 100] as const
export const SPOT_CHOICES = [20, 40, 60, 100] as const
/** Pozele cu licență din `public/img` (credit în design/final/shared/data.js). */
export const ACTION_IMAGES = [
  { url: '/img/actiune-plantare-copaci.jpg', credit: 'Foto: U.S. Air Force, Christopher Tam · Domeniu public · Wikimedia Commons' },
  { url: '/img/actiune-curatenie.jpg', credit: 'Foto: David Lally · CC BY-SA 2.0 · Wikimedia Commons' },
  { url: '/img/actiune-donare-sange.jpg', credit: 'Foto: Shixart1985 · CC BY 2.0 · Wikimedia Commons' },
] as const

export interface ActionForm {
  title: string; description: string; category: ActionCategory; organizer: string
  date: string; start: string; end: string
  locationName: string; address: string
  pointsReward: number; capacity: number; imageUrl: string
}
export type ActionFormErrors = Partial<Record<keyof ActionForm, string>>

export function emptyActionForm(today: string): ActionForm {
  return {
    title: '', description: '', category: 'ENVIRONMENT', organizer: '', date: today, start: '09:00', end: '12:00',
    locationName: '', address: '', pointsReward: 50, capacity: 20, imageUrl: '',
  }
}

export function fromAction(a: ActionDto): ActionForm {
  const s = splitBucharest(a.startAt)
  return {
    title: a.title, description: a.description, category: a.category, organizer: a.organizer ?? '', date: s.date, start: s.time,
    end: splitBucharest(a.endAt).time, locationName: a.locationName, address: a.address ?? '',
    pointsReward: a.pointsReward, capacity: a.capacity, imageUrl: a.imageUrl ?? '',
  }
}

/** Regulile din BE (ActionCreate), ca omul să vadă eroarea înainte de trimitere. Valorile sunt chei i18n. */
export function validateActionForm(f: ActionForm, registered = 0): ActionFormErrors {
  const e: ActionFormErrors = {}
  if (!f.title.trim()) e.title = 'community.form.required'
  if (!f.description.trim()) e.description = 'community.form.required'
  if (!f.locationName.trim()) e.locationName = 'community.form.required'
  if (!f.date) e.date = 'community.form.required'
  if (!f.start) e.start = 'community.form.required'
  if (!f.end) e.end = 'community.form.required'
  else if (f.start && f.end <= f.start) e.end = 'community.form.endAfterStart'
  if (!Number.isFinite(f.pointsReward) || f.pointsReward < 10 || f.pointsReward > 200) e.pointsReward = 'community.form.pointsRange'
  if (!Number.isFinite(f.capacity) || f.capacity < 1 || f.capacity > 1000) e.capacity = 'community.form.capacityRange'
  else if (f.capacity < registered) e.capacity = 'community.form.capacityBelowRegistered'
  return e
}

export function toActionCreate(f: ActionForm, status?: ActionCreate['status']): ActionCreate {
  const img = ACTION_IMAGES.find((i) => i.url === f.imageUrl)
  return {
    title: f.title.trim(), description: f.description.trim(), category: f.category,
    organizer: f.organizer.trim() || undefined,
    startAt: bucharestIso(f.date, f.start), endAt: bucharestIso(f.date, f.end),
    locationName: f.locationName.trim(), address: f.address.trim() || undefined,
    pointsReward: Number(f.pointsReward), capacity: Number(f.capacity),
    imageUrl: f.imageUrl || undefined, imageCredit: img?.credit, status,
  }
}
