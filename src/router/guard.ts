import type { Router } from 'vue-router'
import type { Role } from '@/shared/types/common'
import type { Ui } from '@/shared/composables/useAuthForm'
import { useAuthStore } from '@/shared/stores/auth'
import { landingFor } from '@/shared/composables/useAuthForm'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    roles?: Role[]      // rute protejate: cine are voie (ADMIN are voie peste tot)
    screen?: string     // codul ecranului din design (S3, E1, W2…)
    task?: string       // task-ul din docs/PLAN.md
    hideTabs?: boolean  // mobil: ascunde tab bar-ul (login, checkout, scanner)
  }
}

/** `meta.roles` al unei căi, sau `null` dacă nu e o rută cu nume în aplicația asta (catch-all, redirect vechi). */
export function routeRoles(router: Router, path: string): Role[] | undefined | null {
  const r = router.resolve(path)
  return r.name ? r.meta.roles : null
}

/** Paginile de login ale unei aplicații: numele rutelor și, doar în aplicația mobilă, login-ul voluntarilor. */
export interface Logins {
  names: string[]
  volunteer?: string
}

/** Guard-ul comun celor două aplicații: login, roluri, titlul paginii. Fiecare aplicație își dă paginile de login. */
export function installGuard(router: Router, ui: Ui, logins: Logins): void {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.init()
    // deja conectat → login-ul nu mai are rost: mergi unde voiai (?next=) sau acasă la rolul tău (pentru alt cont: Deconectare)
    if (auth.user && logins.names.includes(String(to.name))) {
      return landingFor(auth.user.role, ui, to.query.next, (p) => routeRoles(router, p))
    }
    const roles = to.meta.roles
    if (roles && roles.length) {
      if (!auth.isLoggedIn) {
        const login = logins.volunteer && roles.includes('VOLUNTEER') ? logins.volunteer : '/login'
        return { path: login, query: { next: to.fullPath } }
      }
      if (!auth.hasRole(...roles)) return { path: '/' }
    }
    if (to.meta.title) document.title = `${to.meta.title} · AradExperience`
    return true
  })
}
