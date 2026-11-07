import { createI18n } from 'vue-i18n'

export type Locale = 'ro' | 'en'
const LOCALE_KEY = 'ax.locale'

/**
 * Textele sunt pe module: `ro/<modul>.json` și `en/<modul>.json` (același nume de fișier = aceeași cheie de top:
 * `ro/events.json` → `t('events.…')`). Fiecare story scrie doar în fișierele modulului lui; un fișier nou se încarcă singur.
 */
type Messages = Record<string, Record<string, unknown>>
const files = import.meta.glob<Record<string, unknown>>('./*/*.json', { eager: true, import: 'default' })

export function loadMessages(locale: Locale): Messages {
  const out: Messages = {}
  for (const [path, content] of Object.entries(files)) {
    const m = path.match(/^\.\/(\w+)\/([\w-]+)\.json$/)
    if (m && m[1] === locale) out[m[2]] = content
  }
  return out
}

function savedLocale(): Locale {
  try { return (localStorage.getItem(LOCALE_KEY) as Locale) || 'ro' } catch { return 'ro' }
}

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale(),
  fallbackLocale: 'ro',
  messages: { ro: loadMessages('ro'), en: loadMessages('en') },
})

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  try { localStorage.setItem(LOCALE_KEY, locale) } catch { /* ignore */ }
  document.documentElement.lang = locale
}
