/**
 * Datele site-ului de prezentare (T20), într-un singur loc.
 * Linkurile de descărcare vin din T15 (Google Play / App Store sau APK-ul de pe site); `null` → butonul arată „În curând”.
 * `CONTACT_EMAIL` gol → rândul de contact nu apare.
 */
export interface DownloadLinks {
  android: string | null
  ios: string | null
}

export const DOWNLOAD_LINKS: DownloadLinks = { android: null, ios: null }

export const CONTACT_EMAIL = ''

/**
 * Linkurile din subsolul site-ului: codul proiectului, hackathonul și sursele oficiale ale datelor (Primăria Arad, Visit
 * Arad, CTP Arad). Ajută și la SEO: site-ul e legat de surse reale și de codul public. Cheile din i18n `site.footer.*`.
 */
export const CODE_URL = 'https://github.com/HACK4ARAD'
export const HACKATHON_URL = 'https://hack4arad.uav.ro/'
export const SOURCE_LINKS = [
  { key: 'cityHall', href: 'https://www.primariaarad.ro/' },
  { key: 'visitArad', href: 'https://www.visitarad.ro/' },
  { key: 'ctp', href: 'https://ctparad.ro/' },
] as const

/** Cele 6 funcții din „Ce poți face” (cheile din i18n `site.features.*`). */
export const FEATURES = [
  { key: 'events', icon: 'confirmation_number' },
  { key: 'guide', icon: 'headphones' },
  { key: 'offers', icon: 'sell' },
  { key: 'community', icon: 'volunteer_activism' },
  { key: 'transport', icon: 'tram' },
  { key: 'ai', icon: 'auto_awesome' },
] as const

/** Rolurile din „Pentru cine” (cheile din i18n `site.roles.*`). */
export const ROLES = [
  { key: 'visitor', icon: 'luggage' },
  { key: 'local', icon: 'home' },
  { key: 'business', icon: 'storefront' },
  { key: 'city', icon: 'account_balance' },
  { key: 'volunteer', icon: 'badge' },
] as const
