import { watch } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { i18n } from '@/shared/i18n'
import type { Role } from '@/shared/types/common'
import type { Ui } from '@/shared/composables/useAuthForm'
import { useAuthStore } from '@/shared/stores/auth'
import { homeFor, landingFor } from '@/shared/composables/useAuthForm'

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

/**
 * Titlul paginii în limba curentă: textul `nav.routes.<numele rutei>` (rutele web) sau `home.routes.<numele rutei>`
 * (rutele aplicației; `home.json` nu intră în build-ul web), altfel `meta.title` (română).
 * Folosit în bara panourilor web și în titlul tab-ului din browser.
 */
export function routeTitle(r: Pick<RouteLocationNormalizedLoaded, 'name' | 'meta'>): string {
  if (r.name) {
    for (const key of [`nav.routes.${String(r.name)}`, `home.routes.${String(r.name)}`]) {
      if (i18n.global.te(key)) return i18n.global.t(key)
    }
  }
  return r.meta.title ?? ''
}

function setDocumentTitle(r: Pick<RouteLocationNormalizedLoaded, 'name' | 'meta'>) {
  const title = routeTitle(r)
  if (title) document.title = `${title} · AradExperience`
}

/**
 * Paginile de login ale unei aplicații: numele rutelor și, doar în aplicația mobilă, login-ul voluntarilor; plus calea
 * ecranului „Parolă nouă”, unde ajunge oricine a intrat cu o parolă temporară (`user.mustChangePassword`).
 */
export interface Logins {
  names: string[]
  volunteer?: string
  passwordChange: string
}

/** Guard-ul comun celor două aplicații: login, roluri, titlul paginii. Fiecare aplicație își dă paginile de login. */
export function installGuard(router: Router, ui: Ui, logins: Logins): void {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.init()
    // parolă temporară (de la Admin): până își alege una nouă, orice pagină duce la „Parolă nouă” (deconectarea e pe ecran);
    // fără obligația asta ecranul n-are rost, deci duce acasă
    if (auth.user?.mustChangePassword) {
      if (to.path !== logins.passwordChange) return { path: logins.passwordChange }
    } else if (auth.user && to.path === logins.passwordChange) return homeFor(auth.user.role, ui)
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
      if (!auth.hasRole(...roles)) return { path: ui === 'm' && auth.user?.role === 'VOLUNTEER' ? '/vol/actions' : '/' }
    }
    // T18: în aplicație, voluntarul are doar cele 3 tab-uri ale lui (/vol/*); restul aplicației nu e pentru el
    if (ui === 'm' && auth.user?.role === 'VOLUNTEER' && !to.path.startsWith('/vol/')) return { path: '/vol/actions' }
    setDocumentTitle(to)
    return true
  })
  // la schimbarea limbii (RO/EN) titlul tab-ului se traduce fără navigare
  watch(i18n.global.locale, () => setDocumentTitle(router.currentRoute.value))
}
