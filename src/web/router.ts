import { createRouter, createWebHistory } from 'vue-router'
import { WEB_LOGINS, webRoutes } from '@/router/web'
import { installGuard } from '@/router/guard'

/** Routerul web-ului (build-ul `npm run build`): prezentarea + panourile. */
export const router = createRouter({
  history: createWebHistory(),
  routes: webRoutes,
  // ancorele prezentării (`/#features`, `/#download`, `/#panels`) derulează la secțiune, sub bara fixă; restul pornește de sus
  scrollBehavior: (to) => (to.hash ? { el: to.hash, top: 80, behavior: 'smooth' } : { top: 0 }),
})

installGuard(router, 'w', WEB_LOGINS)
