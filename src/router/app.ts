import { Capacitor } from '@capacitor/core'
import type { Ui } from '@/shared/composables/useAuthForm'

/**
 * Care aplicație rulează: `mobile` (aplicația completă, iOS/Android) sau `web` (site-ul de prezentare + panourile).
 * Se alege o singură dată, la pornire, și nu apare în URL.
 */
export type AppKind = 'mobile' | 'web'

const APP_KEY = 'ax.app'
/** Alegerea pentru tab-ul curent (sessionStorage): previzualizarea din panouri și linkurile vechi `/m/…` rezistă la refresh. */
const TAB_KEY = 'ax.app.tab'

type AppStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function isApp(v: unknown): v is AppKind {
  return v === 'mobile' || v === 'web'
}

function attempt<T>(fn: () => T): T | undefined {
  try { return fn() } catch { return undefined } // storage blocat (mod privat etc.): alegerea ține doar încărcarea asta
}

/**
 * Ordinea: nativ (Capacitor) → mereu mobile; `?preview=mobile` sau un link vechi `/m/…` → mobile doar pentru tab-ul
 * curent; `?app=mobile|web` → se ține minte (test în browser, dev) și anulează alegerea tab-ului; alegerea tab-ului;
 * valoarea ținută minte; implicit web.
 */
export function selectApp(opts: { native: boolean; search: string; path?: string; storage?: AppStorage; session?: AppStorage }): AppKind {
  if (opts.native) return 'mobile'
  const params = new URLSearchParams(opts.search)
  if (params.get('preview') === 'mobile' || /^\/m(\/|$)/.test(opts.path ?? '')) {
    attempt(() => opts.session?.setItem(TAB_KEY, 'mobile'))
    return 'mobile'
  }
  const forced = params.get('app')
  if (isApp(forced)) {
    attempt(() => opts.storage?.setItem(APP_KEY, forced))
    attempt(() => opts.session?.removeItem(TAB_KEY))
    return forced
  }
  const tab = attempt(() => opts.session?.getItem(TAB_KEY))
  if (isApp(tab)) return tab
  const saved = attempt(() => opts.storage?.getItem(APP_KEY))
  if (isApp(saved)) return saved
  return 'web'
}

let chosen: AppKind | undefined

/** Aplicația curentă, calculată la primul apel. */
export function currentApp(): AppKind {
  if (!chosen) {
    chosen = selectApp({
      native: Capacitor.isNativePlatform(),
      search: window.location.search,
      path: window.location.pathname,
      storage: attempt(() => window.localStorage),
      session: attempt(() => window.sessionStorage),
    })
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
