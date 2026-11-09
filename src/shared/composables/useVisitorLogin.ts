import { ref } from 'vue'
import { ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/stores/auth'
import { DEMO_PASSWORD } from '@/shared/composables/useAuthForm'
import type { UserDto } from '@/shared/types/auth'

/** Contul demo de vizitator (seed); parola e parola demo, publică (o arată și scurtăturile de pe login). */
export const VISITOR_DEMO_EMAIL = 'visitor@demo.ro'

/**
 * „Intră ca vizitator” (W0): un clic și ești conectat pe contul demo de vizitator, cu login-ul normal (e-mail + parolă), fără
 * nimic de tastat. Oricâți oameni deodată pe același cont. Erorile sunt chei i18n, afișate de ecran.
 */
export function useVisitorLogin() {
  const auth = useAuthStore()
  const busy = ref(false)
  const error = ref('')

  async function enter(): Promise<UserDto | null> {
    if (busy.value) return null
    busy.value = true
    error.value = ''
    try {
      return await auth.login(VISITOR_DEMO_EMAIL, DEMO_PASSWORD)
    } catch (e) {
      error.value = e instanceof ApiError && e.status === 0 ? 'auth.errors.network' : 'auth.visitor.error'
      return null
    } finally {
      busy.value = false
    }
  }

  return { busy, error, enter }
}
