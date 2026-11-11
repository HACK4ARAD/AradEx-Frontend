import { computed } from 'vue'
import { useDemoLogin } from '@/shared/composables/useDemoLogin'
import type { UserDto } from '@/shared/types/auth'

/** Contul demo de vizitator (seed); parola e parola demo, publică (o arată și scurtăturile de pe login). */
export const VISITOR_DEMO_EMAIL = 'visitor@demo.ro'

/**
 * „Intră ca vizitator” (W0): un clic și ești conectat pe contul demo de vizitator, cu login-ul normal (e-mail + parolă), fără
 * nimic de tastat. Oricâți oameni deodată pe același cont. Erorile sunt chei i18n, afișate de ecran.
 */
export function useVisitorLogin() {
  const d = useDemoLogin('auth.visitor.error')
  const busy = computed(() => d.busy.value !== null)
  const enter = (): Promise<UserDto | null> => d.enter(VISITOR_DEMO_EMAIL)
  return { busy, error: d.error, enter }
}
