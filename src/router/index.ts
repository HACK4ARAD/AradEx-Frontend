import { createRouter, createWebHistory } from 'vue-router'
import type { Role } from '@/shared/types/common'
import { useAuthStore } from '@/shared/stores/auth'
import { landingFor } from '@/shared/composables/useAuthForm'
import { currentApp, uiOf } from './app'
import { routesFor } from './routes'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    roles?: Role[]      // rute protejate: cine are voie (ADMIN are voie peste tot)
    screen?: string     // codul ecranului din design (S3, E1, W2…)
    task?: string       // task-ul din docs/PLAN.md
    hideTabs?: boolean  // mobil: ascunde tab bar-ul (login, checkout, scanner)
  }
}

/**
 * Două aplicații din același cod, fără prefix în URL (vezi app.ts): `mobile.ts` (aplicația completă, iOS/Android)
 * și `web.ts` (prezentarea + panourile). Aplicația se alege o dată, la pornire.
 */
const app = currentApp()
const ui = uiOf(app)

export const router = createRouter({
  history: createWebHistory(),
  routes: routesFor(app),
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  // deja conectat → login-ul nu mai are rost: mergi unde voiai (?next=) sau acasă la rolul tău (pentru alt cont: Deconectare)
  if (auth.user && (to.name === 'm-login' || to.name === 'w-login' || to.name === 'm-vol-login')) {
    return landingFor(auth.user.role, ui, to.query.next, (p) => router.resolve(p).meta.roles)
  }
  const roles = to.meta.roles
  if (roles && roles.length) {
    if (!auth.isLoggedIn) {
      const login = roles.includes('VOLUNTEER') ? '/vol/login' : '/login'
      return { path: login, query: { next: to.fullPath } }
    }
    if (!auth.hasRole(...roles)) return { path: '/' }
  }
  if (to.meta.title) document.title = `${to.meta.title} · AradExperience`
  return true
})
