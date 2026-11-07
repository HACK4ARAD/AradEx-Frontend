import { Capacitor } from '@capacitor/core'
import type { Ui } from '@/shared/composables/useAuthForm'

/**
 * Care aplicație rulează: `mobile` (aplicația completă, iOS/Android) sau `web` (site-ul de prezentare + panourile).
 * Se alege o singură dată, la pornire, și nu apare în URL.
 */
export type AppKind = 'mobile' | 'web'

const APP_KEY = 'ax.app'

type AppStorage = Pick<Storage, 'getItem' | 'setItem'>

function isApp(v: unknown): v is AppKind {
  return v === 'mobile' || v === 'web'
}

/**
 * Nativ (Capacitor) → mereu mobile. Altfel `?preview=mobile` (doar încărcarea asta), apoi `?app=mobile|web`, care câștigă și se ține minte (test în browser, dev),
 * apoi valoarea ținută minte, apoi web.
 */
export function selectApp(opts: { native: boolean; search: string; storage?: AppStorage }): AppKind {
  if (opts.native) return 'mobile'
  const params = new URLSearchParams(opts.search)
  // previzualizare din panourile web (tab nou): aplicația mobilă doar pentru încărcarea asta, fără să se țină minte
  if (params.get('preview') === 'mobile') return 'mobile'
  const forced = params.get('app')
  if (isApp(forced)) {
    try { opts.storage?.setItem(APP_KEY, forced) } catch { /* storage blocat: alegerea ține doar sesiunea asta */ }
    return forced
  }
  try {
    const saved = opts.storage?.getItem(APP_KEY)
    if (isApp(saved)) return saved
  } catch { /* storage blocat */ }
  return 'web'
}

let chosen: AppKind | undefined

/** Aplicația curentă, calculată la primul apel. */
export function currentApp(): AppKind {
  if (!chosen) {
    let storage: AppStorage | undefined
    try { storage = window.localStorage } catch { storage = undefined }
    chosen = selectApp({ native: Capacitor.isNativePlatform(), search: window.location.search, storage })
  }
  return chosen
}

/** Codul folosit de useAuthForm (`homeFor`, `landingFor`). */
export function uiOf(app: AppKind): Ui {
  return app === 'mobile' ? 'm' : 'w'
}

/** Link spre un ecran al aplicației mobile, deschis din panourile web într-un tab nou (`?preview=mobile`, nu se ține minte). */
export function mobilePreviewHref(path: string): string {
  return path + (path.includes('?') ? '&' : '?') + 'preview=mobile'
}
