import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import type { AppKind } from './app'
import { mobileRoutes } from './mobile'
import { webRoutes } from './web'

/** Linkurile vechi (`/m/...`, `/w/...`, de exemplu din bookmark-uri) duc la aceeași cale fără prefix. */
function stripPrefix(to: RouteLocationNormalized) {
  const rest = to.params.rest
  const path = '/' + (Array.isArray(rest) ? rest.join('/') : (rest ?? ''))
  return { path, query: to.query, hash: to.hash }
}

const legacy: RouteRecordRaw[] = [
  { path: '/m/:rest(.*)*', redirect: stripPrefix },
  { path: '/w/:rest(.*)*', redirect: stripPrefix },
]

/** Rutele aplicației alese + redirecturile vechi + orice altă cale → `/` (pagina de start a aplicației). */
export function routesFor(app: AppKind): RouteRecordRaw[] {
  return [
    ...(app === 'mobile' ? mobileRoutes : webRoutes),
    ...legacy,
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ]
}
