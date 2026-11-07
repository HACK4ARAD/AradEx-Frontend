import { createRouter, createWebHistory } from 'vue-router'
import { mobileRoutes } from '@/router/mobile'
import { installGuard } from '@/router/guard'

/** Routerul aplicației mobile (build-ul `npm run build:mobile`, împachetat cu Capacitor). */
export const router = createRouter({
  history: createWebHistory(),
  routes: mobileRoutes,
  scrollBehavior: () => ({ top: 0 }),
})

installGuard(router, 'm')
