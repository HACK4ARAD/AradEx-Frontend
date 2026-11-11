import { ref } from 'vue'
import { authApi } from '@/shared/api/auth'
import { ApiError, isDemoReadOnlyError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/stores/auth'
import { newPasswordError } from '@/shared/composables/useAuthForm'

/**
 * Securitatea contului conectat: „Schimbă parola” (și ecranul „Parolă nouă” după o parolă temporară) și „Cod de recuperare nou”.
 * Parola greșită vine ca 400 (nu 401, care ar deloga), conturile demo primesc 403. După reușită `user` se reîncarcă din `/me`
 * (`mustChangePassword`, `hasRecoveryCode`). Erorile sunt chei i18n, afișate de componentă.
 */

function errorKey(e: unknown, wrongPassword: string): string {
  if (!(e instanceof ApiError)) return 'auth.errors.generic'
  if (e.status === 0) return 'auth.errors.network'
  if (e.status === 400) return e.problem?.errors?.length ? 'auth.errors.validation' : wrongPassword
  if (isDemoReadOnlyError(e)) return 'common.demoReadOnly'
  if (e.status === 403) return 'auth.passwordChange.errors.demo'
  return 'auth.errors.generic'
}

/** După schimbare: `user` din `/me`; dacă cererea a mers dar `/me` nu, scoatem local doar obligația de schimbare. */
async function refreshUser(auth: ReturnType<typeof useAuthStore>, patch: { mustChangePassword?: boolean; hasRecoveryCode?: boolean }) {
  try {
    await auth.refresh()
  } catch {
    if (auth.user) auth.user = { ...auth.user, ...patch }
  }
}

export function useChangePassword() {
  const auth = useAuthStore()
  const currentPassword = ref('')
  const newPassword = ref('')
  const error = ref('')
  const busy = ref(false)

  /** `{ recoveryCode }` (null dacă n-a venit unul nou) sau null cu eroarea în `error`. */
  async function submit(): Promise<{ recoveryCode: string | null } | null> {
    if (busy.value) return null
    if (!currentPassword.value) { error.value = 'auth.passwordChange.errors.currentRequired'; return null }
    const pw = newPasswordError(newPassword.value)
    if (pw) { error.value = pw; return null }
    error.value = ''
    busy.value = true
    try {
      const res = await authApi.changePassword({ currentPassword: currentPassword.value, newPassword: newPassword.value })
      const recoveryCode = res.recoveryCode ?? null
      await refreshUser(auth, recoveryCode ? { mustChangePassword: false, hasRecoveryCode: true } : { mustChangePassword: false })
      currentPassword.value = ''
      newPassword.value = ''
      return { recoveryCode }
    } catch (e) {
      error.value = errorKey(e, 'auth.passwordChange.errors.wrongCurrent')
      return null
    } finally {
      busy.value = false
    }
  }

  return { currentPassword, newPassword, error, busy, submit }
}

export function useNewRecoveryCode() {
  const auth = useAuthStore()
  const password = ref('')
  const error = ref('')
  const busy = ref(false)

  /** Codul nou sau null cu eroarea în `error`. */
  async function submit(): Promise<string | null> {
    if (busy.value) return null
    if (!password.value) { error.value = 'auth.errors.passwordRequired'; return null }
    error.value = ''
    busy.value = true
    try {
      const { recoveryCode } = await authApi.newRecoveryCode(password.value)
      await refreshUser(auth, { hasRecoveryCode: true })
      password.value = ''
      return recoveryCode
    } catch (e) {
      error.value = errorKey(e, 'auth.passwordChange.errors.wrongPassword')
      return null
    } finally {
      busy.value = false
    }
  }

  return { password, error, busy, submit }
}
