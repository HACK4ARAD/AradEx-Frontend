import { onScopeDispose, ref } from 'vue'
import { authApi } from '@/shared/api/auth'
import { ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import { isEmail, newPasswordError } from '@/shared/composables/useAuthForm'
import type { UserDto } from '@/shared/types/auth'

/**
 * „Am uitat parola”: 1 · adresa → BE trimite pe e-mail un cod de 6 cifre (valabil 15 min) și răspunde mereu 204, deci ecranul
 * spune doar „dacă există un cont…”; 2 · codul + parola nouă → sesiunea (utilizatorul e conectat pe loc).
 * Erorile sunt chei i18n, afișate de componentă; la 429 apare în toast `detail`-ul din ProblemDetail.
 */

export type ResetStep = 'email' | 'code'

/** după un cod trimis, „Retrimite codul” e disponibil peste atâtea secunde (sau cât spune un 429) */
export const RESEND_COOLDOWN_S = 60

export function usePasswordReset(initialEmail = '') {
  const auth = useAuthStore()
  const ui = useUiStore()
  const step = ref<ResetStep>('email')
  const email = ref(initialEmail)
  const code = ref('')
  const password = ref('')
  const error = ref('')
  const busy = ref(false)
  const cooldown = ref(0)
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

  async function run<T>(fn: () => Promise<T>, onError: (e: ApiError) => string): Promise<T | null> {
    error.value = ''
    busy.value = true
    try {
      return await fn()
    } catch (e) {
      if (!(e instanceof ApiError)) error.value = 'auth.errors.generic'
      else if (e.status === 0) error.value = 'auth.errors.network'
      else if (e.status === 429) {
        // prea des: textul serverului, în toast; codul deja trimis rămâne bun
        ui.toast(e.message, 'error')
        startCooldown(e.problem?.retryAfterSeconds ?? RESEND_COOLDOWN_S)
      } else error.value = onError(e)
      return null
    } finally {
      busy.value = false
    }
  }

  /** Cere (sau retrimite) codul. true = 204, pasul „code”. */
  async function send(): Promise<boolean> {
    if (busy.value) return false
    if (!isEmail(email.value)) { error.value = 'auth.errors.email'; return false }
    const addr = email.value.trim()
    const ok = await run(async () => { await authApi.forgotPassword(addr); return true }, (e) => (e.status === 400 ? 'auth.errors.email' : 'auth.errors.generic'))
    if (!ok) return false
    email.value = addr
    step.value = 'code'
    startCooldown(RESEND_COOLDOWN_S)
    return true
  }

  /** Codul + parola nouă: utilizatorul e conectat (sesiunea e acceptată) sau null cu eroarea în `error`. */
  async function reset(): Promise<UserDto | null> {
    if (busy.value) return null
    const c = code.value.replace(/\D/g, '')
    if (c.length !== 6) { error.value = 'auth.forgot.errors.codeFormat'; return null }
    const pw = newPasswordError(password.value)
    if (pw) { error.value = pw; return null }
    const res = await run(() => authApi.resetPassword({ email: email.value.trim(), code: c, password: password.value }), (e) => {
      if (e.status === 401) return 'auth.forgot.errors.code'
      if (e.status === 403) return 'auth.errors.disabled'
      if (e.status === 400) return 'auth.errors.validation'
      return 'auth.errors.generic'
    })
    return res ? auth.acceptSession(res) : null
  }

  /** Înapoi la adresă (altă adresă). */
  function restart() {
    step.value = 'email'
    code.value = ''
    password.value = ''
    error.value = ''
  }

  return { step, email, code, password, error, busy, cooldown, send, reset, restart }
}
