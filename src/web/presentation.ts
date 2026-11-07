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
