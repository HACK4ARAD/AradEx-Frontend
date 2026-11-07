import { onScopeDispose, ref } from 'vue'
import { authApi } from '@/shared/api/auth'
import { ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/stores/auth'
import type { UserDto } from '@/shared/types/auth'

/**
 * T21 · login-ul conturilor personale în aplicația mobilă: telefon → cod OTP → (număr nou) nume + rol.
 * Numerele de demo 0799000xxx nu primesc SMS: codul vine în răspuns (`demoCode`) și aplicația îl arată.
 * Erorile sunt chei i18n (`auth.phone.errors.*`), afișate de componentă.
 */

const E164 = /^\+[1-9]\d{7,14}$/
const ROMANIAN = /^\+40\d{9}$/
const DEMO = /^\+40799000\d{3}$/

/** Aceleași reguli ca în BE (PhoneNumbers): numerele românești în orice formă uzuală → +40…; null dacă nu e valid. */
export function normalizePhone(raw: string): string | null {
  let s = (raw ?? '').replace(/[\s\-.()/]/g, '')
  if (s.startsWith('00')) s = '+' + s.slice(2)
  else if (!s.startsWith('+')) {
    if (s.startsWith('40') && s.length === 11) s = '+' + s
    else if (s.startsWith('0') && s.length === 10) s = '+40' + s.slice(1)
    else if (s.startsWith('7') && s.length === 9) s = '+40' + s
  }
  if (!E164.test(s) || (s.startsWith('+40') && !ROMANIAN.test(s))) return null
  return s
}

export function isDemoPhone(e164: string): boolean {
  return DEMO.test(e164)
}

export type PhoneStep = 'phone' | 'code' | 'profile'

export function usePhoneLogin() {
  const auth = useAuthStore()
  const step = ref<PhoneStep>('phone')
  const phone = ref('')
  const code = ref('')
  const displayName = ref('')
  const role = ref<'VISITOR' | 'LOCAL'>('VISITOR')
  const demoCode = ref<string | null>(null)
  const cooldown = ref(0)
  const error = ref('')
  /** mesaj informativ (cheie i18n), de ex. „ți-am trimis deja un cod” */
  const info = ref('')
  const busy = ref(false)
  let e164 = ''
  let signupToken = ''
  /** coduri greșite pentru codul curent; la 5 serverul îl invalidează, deci cerem altul */
  let wrong = 0
  const MAX_WRONG = 5
  let timer: ReturnType<typeof setInterval> | undefined

  function startCooldown(seconds: number) {
    cooldown.value = Math.max(0, Math.ceil(seconds))
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      cooldown.value = Math.max(0, cooldown.value - 1)
      if (cooldown.value === 0 && timer) { clearInterval(timer); timer = undefined }
    }, 1000)
  }
  onScopeDispose(() => { if (timer) clearInterval(timer) })

  async function run<T>(fn: () => Promise<T>, onError: (e: ApiError) => void): Promise<T | null> {
    error.value = ''
    busy.value = true
    try {
      return await fn()
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 0) error.value = 'auth.errors.network'
        else onError(e)
      } else error.value = 'auth.errors.generic'
      return null
    } finally {
      busy.value = false
    }
  }

  /** Trimite (sau retrimite) codul. */
  async function send() {
    const n = normalizePhone(phone.value)
    if (!n) { error.value = 'auth.phone.errors.phone'; return }
    info.value = ''
    // același număr, cod cerut de curând: îl folosește pe acela (nu „așteaptă”), ca după „Alt număr” sau o revenire
    if (cooldown.value > 0 && n === e164) { error.value = ''; step.value = 'code'; info.value = 'auth.phone.alreadySent'; return }
    const res = await run(() => authApi.otpRequest(n), (e) => {
      if (e.status === 429) { startCooldown(e.problem?.retryAfterSeconds ?? 60); error.value = 'auth.phone.errors.wait' }
      else if (e.status === 503) error.value = 'auth.phone.errors.smsUnavailable'
      else if (e.status === 400 && /cannot receive/i.test(e.message)) error.value = 'auth.phone.errors.cannotReceive'
      else if (e.status === 400) error.value = 'auth.phone.errors.phone'
      else error.value = 'auth.errors.generic'
    })
    if (!res) return
    e164 = n
    wrong = 0
    demoCode.value = res.demoCode ?? null
    code.value = ''
    step.value = 'code'
    // T21 fix: un cod trimis acum câteva secunde (de ex. înainte de logout) e încă bun; serverul nu mai trimite altul
    if (res.alreadySent) info.value = 'auth.phone.alreadySent'
    startCooldown(res.retryAfterSeconds)
  }

  /** Verifică codul: cont existent → utilizatorul (logat); număr nou → null și pasul „profile”. */
  async function verify(): Promise<UserDto | null> {
    const c = code.value.replace(/\D/g, '')
    if (c.length !== 6) { error.value = 'auth.phone.errors.code'; return null }
    const res = await run(() => authApi.otpVerify(e164, c), (e) => {
      if (e.status === 401) {
        wrong += 1
        if (wrong >= MAX_WRONG) { restart(); error.value = 'auth.phone.errors.tooMany' }
        else error.value = 'auth.phone.errors.code'
      } else if (e.status === 429) error.value = 'auth.phone.errors.wait'
      else error.value = 'auth.errors.generic'
    })
    if (!res) return null
    if (res.token && res.user) return auth.acceptSession({ token: res.token, user: res.user })
    signupToken = res.signupToken ?? ''
    step.value = 'profile'
    return null
  }

  /** Contul personal nou, după cod. */
  async function register(): Promise<UserDto | null> {
    const name = displayName.value.trim()
    if (!name) { error.value = 'auth.errors.nameRequired'; return null }
    const res = await run(() => authApi.otpRegister({ signupToken, displayName: name, role: role.value }), (e) => {
      if (e.status === 401) { restart(); error.value = 'auth.phone.errors.expired' }
      else if (e.status === 409) { restart(); error.value = 'auth.phone.errors.taken' }
      else error.value = 'auth.errors.generic'
    })
    return res ? auth.acceptNewAccount(res) : null
  }

  /** Înapoi la număr (alt număr sau token expirat). */
  function restart() {
    step.value = 'phone'
    code.value = ''
    demoCode.value = null
    signupToken = ''
  }

  return { step, phone, code, displayName, role, demoCode, cooldown, error, info, busy, send, verify, register, restart }
}
