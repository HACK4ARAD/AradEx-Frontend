import { computed, onBeforeUnmount, ref, type Ref } from 'vue'
import { ApiError } from '@/shared/api/client'
import { cityVolunteersApi, volunteerApi } from '@/shared/api/volunteer'
import { useUiStore } from '@/shared/stores/ui'
import { CODE_RE, normalizeCode } from '@/shared/composables/useCommunity'
import { intlLocale } from '@/shared/composables/useFormat'
import { i18n } from '@/shared/i18n'
import type { ConfirmResultDto, RegistrationDto } from '@/shared/types/community'
import type {
  ChatDto, ChatMessageDto, ChatSummaryDto, CoordinatorDto, VolunteerActionDto, VolunteerCreate, VolunteerDto, VolunteerMeDto, VolunteerUpdate,
} from '@/shared/types/volunteer'

/** T18 · Voluntari: logica ecranelor din aplicație (/vol/*, cu chatul de grup al fiecărei acțiuni) și din panoul Primăriei
 *  (Voluntari, Validare). Primăria nu are mesaje cu voluntarii. */

/** Mesajele de eroare ale BE (engleză, docs/API.md) → cheile `volunteer.errors.*`. */
const KNOWN: [RegExp, string][] = [
  [/^Invalid volunteer code/, 'wrongCode'],
  [/suspended/, 'suspended'],
  [/expired/, 'expired'],
  [/^Too many wrong codes/, 'tooMany'],
  [/not assigned/, 'notAssigned'],
  [/^This code is for another action/, 'otherAction'],
  [/^Scanning opens/, 'locked'],
  [/^This action has ended/, 'ended'],
  [/cancelled/, 'cancelled'],
  [/^Unknown code/, 'unknownCode'],
  [/not assigned to this action/, 'notInChat'],
  [/^Image too large/, 'photoTooLarge'],
  [/^Only JPEG, PNG, WebP or GIF/, 'photoType'],
]
export function volunteerErrorKey(e: unknown): string | null {
  if (e instanceof ApiError) {
    if (e.status === 0) return 'network'
    for (const [re, key] of KNOWN) if (re.test(e.message)) return `volunteer.errors.${key}`
  }
  return null
}

const TZ = 'Europe/Bucharest'
const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
/** Ora unui mesaj, ca în design: „azi, 17:02”, „ieri, 17:40”, altfel „Sâm., 7 nov. · 17:02” (ora Aradului). */
export function messageTime(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const time = new Intl.DateTimeFormat(intlLocale(), { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
  const yesterday = new Date(now.getTime() - 864e5)
  if (dayKey(d) === dayKey(now)) return i18n.global.t('volunteer.time.today', { time })
  if (dayKey(d) === dayKey(yesterday)) return i18n.global.t('volunteer.time.yesterday', { time })
  const day = new Intl.DateTimeFormat(intlLocale(), { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(d)
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`
}

// ---------------------------------------------------------------- aplicația voluntarului

/** „Acțiunile tale”: antetul (coordonator, contoare) + acțiunile alocate. */
export function useVolunteerHome() {
  const ui = useUiStore()
  const me = ref<VolunteerMeDto | null>(null)
  const actions = ref<VolunteerActionDto[]>([])
  const loading = ref(true)
  const failed = ref(false)
  async function load() {
    loading.value = true
    failed.value = false
    try {
      ;[me.value, actions.value] = await Promise.all([volunteerApi.me(), volunteerApi.actions()])
      volunteerUnread.value = me.value.unreadMessages
    } catch (e) {
      failed.value = true
      ui.error(e)
    } finally {
      loading.value = false
    }
  }
  return { me, actions, loading, failed, load }
}

/** Rezultatul unei scanări de voluntar, pentru cardul de sub scanner. */
export type VolScanResult =
  | { kind: 'ok' | 'already'; result: ConfirmResultDto }
  | { kind: 'error'; key: string; params?: Record<string, string>; message?: string }

/** Ecranul „Scanează”: acțiunea aleasă, scanarea / codul tastat, rezultatul și ultimele confirmări. */
export function useVolunteerScan(actions: Ref<VolunteerActionDto[]>, initial?: number) {
  const ui = useUiStore()
  const selectedId = ref<number | null>(initial ?? null)
  const selected = computed(() => actions.value.find((a) => a.id === selectedId.value)
    ?? actions.value.find((a) => a.state === 'OPEN') ?? actions.value[0] ?? null)
  const result = ref<VolScanResult | null>(null)
  const busy = ref(false)
  const recent = ref<RegistrationDto[]>([])

  async function loadRecent() {
    try { recent.value = await volunteerApi.scans() } catch (e) { ui.error(e) }
  }

  async function scan(raw: string): Promise<VolScanResult> {
    const code = normalizeCode(raw)
    if (!CODE_RE.test(code) || !code.startsWith('AX-C')) {
      result.value = { kind: 'error', key: 'volunteer.errors.invalidCode' }
      return result.value
    }
    busy.value = true
    try {
      const r = await volunteerApi.scan(code, selected.value?.id)
      result.value = { kind: r.alreadyConfirmed ? 'already' : 'ok', result: r }
      if (!r.alreadyConfirmed) {
        actions.value = actions.value.map((a) => (a.id === r.actionId ? { ...a, confirmed: a.confirmed + 1, confirmedByMe: a.confirmedByMe + 1 } : a))
        void loadRecent()
      }
    } catch (e) {
      const key = volunteerErrorKey(e)
      const other = e instanceof ApiError && /^This code is for another action: (.+)$/.exec(e.message)
      result.value = key
        ? { kind: 'error', key, params: other ? { title: other[1] } : undefined }
        : { kind: 'error', key: 'volunteer.errors.generic', message: e instanceof Error ? e.message : undefined }
    } finally {
      busy.value = false
    }
    return result.value
  }

  return { selectedId, selected, result, busy, recent, loadRecent, scan }
}

/** Lista „Mesaje”: un chat de grup pe fiecare acțiune alocată (cele cu mesaje noi întâi). */
export function useVolunteerChats() {
  const ui = useUiStore()
  const items = ref<ChatSummaryDto[]>([])
  const loading = ref(true)
  async function load() {
    loading.value = true
    try {
      items.value = await volunteerApi.chats()
      volunteerUnread.value = items.value.reduce((s, c) => s + c.unread, 0)
    } catch (e) { ui.error(e) } finally { loading.value = false }
  }
  return { items, loading, load }
}

/**
 * Chatul de grup al unei acțiuni: membrii și mesajele; se reîmprospătează singur la 8 secunde cât e deschis (fără WebSocket).
 * Un mesaj trimis apare imediat; o poză se urcă întâi (S3), apoi apare ca mesaj.
 */
export function useActionChat(actionId: Ref<number>) {
  const ui = useUiStore()
  const chat = ref<ChatDto | null>(null)
  const loading = ref(true)
  const sending = ref(false)
  const failed = ref<string | null>(null)
  let timer: number | undefined

  async function load(silent = false) {
    if (!silent) loading.value = true
    try {
      chat.value = await volunteerApi.chat(actionId.value)
      failed.value = null
    } catch (e) {
      if (!silent) { failed.value = volunteerErrorKey(e) ?? 'volunteer.errors.generic'; ui.error(e) }
    } finally {
      loading.value = false
    }
  }
  function append(m: ChatMessageDto) {
    if (chat.value && !chat.value.messages.some((x) => x.id === m.id)) chat.value = { ...chat.value, messages: [...chat.value.messages, m] }
  }
  async function send(text: string): Promise<boolean> {
    const clean = text.trim()
    if (!clean || sending.value) return false
    sending.value = true
    try { append(await volunteerApi.post(actionId.value, clean)); return true } catch (e) { ui.error(e); return false } finally { sending.value = false }
  }
  async function sendPhoto(file: File, caption?: string): Promise<boolean> {
    if (sending.value) return false
    sending.value = true
    try {
      append(await volunteerApi.postPhoto(actionId.value, file, caption?.trim() || undefined))
      return true
    } catch (e) {
      const key = volunteerErrorKey(e)
      if (key && key.includes('photo')) ui.toast(i18n.global.t(key), 'error'); else ui.error(e)
      return false
    } finally {
      sending.value = false
    }
  }
  function start() {
    void load()
    timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(true) }, 8000)
  }
  onBeforeUnmount(() => window.clearInterval(timer))
  return { chat, loading, sending, failed, load, send, sendPhoto, start }
}

/** Mesajele noi din chaturile voluntarului (punctul de pe tab-ul Mesaje). */
export const volunteerUnread = ref(0)
export async function refreshVolunteerUnread() {
  try { volunteerUnread.value = (await volunteerApi.me()).unreadMessages } catch { /* doar punctul de pe tab */ }
}

// ---------------------------------------------------------------- panoul Primăriei

/** Telefonul pentru afișare: numerele românești `+40741222333` → `0741 222 333` (ca în design); celelalte rămân E.164. */
export function formatPhone(e164?: string): string {
  if (!e164) return ''
  const m = /^\+40(\d{3})(\d{3})(\d{3})$/.exec(e164)
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164
}

/** Voluntarii (Voluntari, Validare, Acțiuni comunitare): lista, contul nou, alocarea, suspendarea. */
export function useCityVolunteers() {
  const ui = useUiStore()
  const items = ref<VolunteerDto[]>([])
  const loading = ref(true)
  const saving = ref(false)
  async function load() {
    loading.value = true
    try { items.value = await cityVolunteersApi.list() } catch (e) { ui.error(e) } finally { loading.value = false }
  }
  function put(v: VolunteerDto) {
    const i = items.value.findIndex((x) => x.id === v.id)
    items.value = i >= 0 ? items.value.map((x) => (x.id === v.id ? v : x)) : [v, ...items.value]
  }
  async function create(req: VolunteerCreate): Promise<VolunteerDto | null> {
    saving.value = true
    try { const v = await cityVolunteersApi.create(req); put(v); return v } catch (e) { ui.error(e); return null } finally { saving.value = false }
  }
  async function update(id: number, req: VolunteerUpdate): Promise<VolunteerDto | null> {
    saving.value = true
    try { const v = await cityVolunteersApi.update(id, req); put(v); return v } catch (e) { ui.error(e); return null } finally { saving.value = false }
  }
  return { items, loading, saving, load, create, update, put }
}

export function useCoordinators() {
  const items = ref<CoordinatorDto[]>([])
  async function load() {
    try { items.value = await cityVolunteersApi.coordinators() } catch { items.value = [] }
  }
  return { items, load }
}

/** Formularul „Voluntar nou”: valorile ca text, validarea înainte de trimitere (aceleași reguli ca VolunteerCreate din BE). */
export interface VolunteerForm { name: string; phone: string; email: string; coordinatorId: number | null; actionIds: number[]; oneTime: boolean }
export const emptyVolunteerForm = (): VolunteerForm => ({ name: '', phone: '', email: '', coordinatorId: null, actionIds: [], oneTime: false })
/** Cheile din `volunteer.form.errors` pe câmp; gol = valid. */
export function validateVolunteerForm(f: VolunteerForm): Record<string, string> {
  const e: Record<string, string> = {}
  if (!f.name.trim()) e.name = 'name'
  const digits = f.phone.replace(/[^\d+]/g, '')
  if (!/^(\+?40|0)?7\d{8}$/.test(digits.replace(/^\+/, '').replace(/^0040/, '40')) && !/^\+[1-9]\d{7,14}$/.test(digits)) e.phone = 'phone'
  if (f.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = 'email'
  return e
}
export const toCreate = (f: VolunteerForm): VolunteerCreate => ({
  name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || undefined, coordinatorId: f.coordinatorId ?? undefined,
  actionIds: f.actionIds, oneTime: f.oneTime,
})
