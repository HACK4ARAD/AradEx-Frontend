import { createI18n } from 'vue-i18n'

export type Locale = 'ro' | 'en'
const LOCALE_KEY = 'ax.locale'

/**
 * Textele sunt pe module: `ro/<modul>.json` și `en/<modul>.json` (același nume de fișier = aceeași cheie de top:
 * `ro/events.json` → `t('events.…')`). Fiecare story scrie doar în fișierele modulului lui; un fișier nou se încarcă singur.
 */
type Messages = Record<string, Record<string, unknown>>
type Files = Record<string, Record<string, unknown>>
// Fiecare build încarcă doar textele lui (VITE_APP și MODE sunt constante la build, deci celelalte glob-uri nu intră în bundle):
// - web: fără modulele care sunt doar în aplicație (chat, home, transport); `plan` intră pentru pagina publică /itinerary/:code;
// - mobil: fără prezentare, Confidențialitate și administrare (site, legal, admin);
// - testele (vitest) au toate textele, ca să poată testa componentele ambelor aplicații.
const webFiles = import.meta.glob<Record<string, unknown>>(['./*/*.json', '!./*/{chat,home,transport}.json'], { eager: true, import: 'default' })
const mobileFiles = import.meta.glob<Record<string, unknown>>(['./*/*.json', '!./*/{site,legal,admin}.json'], { eager: true, import: 'default' })
const allFiles = import.meta.glob<Record<string, unknown>>('./*/*.json', { eager: true, import: 'default' })
const files: Files = import.meta.env.MODE === 'test' ? allFiles : import.meta.env.VITE_APP === 'mobile' ? mobileFiles : webFiles

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
