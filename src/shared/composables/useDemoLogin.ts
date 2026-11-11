import { ref } from 'vue'
import { ApiError } from '@/shared/api/client'
import { useAuthStore } from '@/shared/stores/auth'
import { DEMO_PASSWORD } from '@/shared/composables/useAuthForm'
import type { UserDto } from '@/shared/types/auth'
import type { Role } from '@/shared/types/common'

/** Un cont demo din seed (parola comună `DEMO_PASSWORD`, publică): rolul, adresa și cum arată cardul lui pe ecranul de login. */
export interface DemoAccount {
  role: Exclude<Role, 'VOLUNTEER'>
  email: string
  icon: string
  /** fundalul pătratului cu icon (ca la cardurile panourilor) */
  bg: string
  title: string
  desc: string
}

/** Conturile demo, câte unul pe rol; titlurile și descrierile sunt chei i18n (cele ale panourilor existau deja). */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'VISITOR', email: 'visitor@demo.ro', icon: 'luggage', bg: 'bg-accent', title: 'auth.demo.visitorTitle', desc: 'auth.demo.visitorDesc' },
  { role: 'LOCAL', email: 'local@demo.ro', icon: 'home', bg: 'bg-green', title: 'auth.demo.localTitle', desc: 'auth.demo.localDesc' },
  { role: 'BUSINESS', email: 'firma@demo.ro', icon: 'storefront', bg: 'bg-accent', title: 'auth.panels.businessTitle', desc: 'auth.panels.businessDesc' },
  { role: 'CITY_HALL', email: 'primaria@demo.ro', icon: 'account_balance', bg: 'bg-ink', title: 'auth.panels.cityTitle', desc: 'auth.panels.cityDesc' },
  { role: 'ADMIN', email: 'admin@demo.ro', icon: 'shield_person', bg: 'bg-[#2A2A30]', title: 'auth.panels.adminTitle', desc: 'auth.panels.adminDesc' },
]

export function demoAccount(role: DemoAccount['role']): DemoAccount {
  return DEMO_ACCOUNTS.find((a) => a.role === role)!
}

/**
 * Un clic pe un cont demo: login-ul normal cu adresa lui și parola demo. `busy` = adresa contului în curs (un singur login odată).
 * Erorile sunt chei i18n, afișate de ecran.
 */
export function useDemoLogin(errorKey = 'auth.demo.error') {
  const auth = useAuthStore()
  const busy = ref<string | null>(null)
  const error = ref('')

  async function enter(email: string): Promise<UserDto | null> {
    if (busy.value) return null
    busy.value = email
    error.value = ''
    try {
      return await auth.login(email, DEMO_PASSWORD)
    } catch (e) {
      error.value = e instanceof ApiError && e.status === 0 ? 'auth.errors.network' : errorKey
      return null
    } finally {
      busy.value = null
    }
  }

  return { busy, error, enter }
}
