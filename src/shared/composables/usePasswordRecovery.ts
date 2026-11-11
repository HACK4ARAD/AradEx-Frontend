import { ref } from 'vue'
import { authApi } from '@/shared/api/auth'
import { ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import { isEmail, newPasswordError, normalizeRecoveryCode } from '@/shared/composables/useAuthForm'
import { isNotLiveError } from '@/shared/composables/useAuthMode'
import type { UserDto } from '@/shared/types/auth'

/**
 * „Am uitat parola”: e-mailul contului + codul de recuperare (primit la crearea contului) + o parolă nouă. Reușita conectează
 * utilizatorul și aduce un cod de recuperare NOU (cel vechi s-a consumat), pe care ecranul îl arată înainte să meargă mai departe.
 * Erorile sunt chei i18n, afișate de componentă; la 429 apare în toast `detail`-ul din ProblemDetail.
 */
export function usePasswordRecovery(initialEmail = '') {
  const auth = useAuthStore()
  const ui = useUiStore()
  const email = ref(initialEmail)
  const recoveryCode = ref('')
  const password = ref('')
  const error = ref('')
  const busy = ref(false)

  async function recover(): Promise<{ user: UserDto; recoveryCode: string | null } | null> {
    if (busy.value) return null
    if (!isEmail(email.value)) { error.value = 'auth.errors.email'; return null }
    const code = normalizeRecoveryCode(recoveryCode.value)
    if (!code) { error.value = 'auth.recover.errors.codeFormat'; return null }
    const pw = newPasswordError(password.value)
    if (pw) { error.value = pw; return null }
    error.value = ''
    busy.value = true
    try {
      const res = await authApi.recoverPassword({ email: email.value.trim(), recoveryCode: code, password: password.value })
      return { user: auth.acceptSession(res), recoveryCode: res.recoveryCode ?? null }
    } catch (e) {
      if (!(e instanceof ApiError)) error.value = 'auth.errors.generic'
      else if (e.status === 0) error.value = 'auth.errors.network'
      else if (e.status === 401) error.value = 'auth.recover.errors.invalid'
      else if (isNotLiveError(e)) error.value = 'auth.demoOnly.text'
      else if (e.status === 403) error.value = 'auth.errors.disabled'
      else if (e.status === 429) ui.toast(e.message, 'error') // prea multe încercări: textul serverului
      else if (e.status === 400) error.value = 'auth.errors.validation'
      else error.value = 'auth.errors.generic'
      return null
    } finally {
      busy.value = false
    }
  }

  return { email, recoveryCode, password, error, busy, recover }
}
