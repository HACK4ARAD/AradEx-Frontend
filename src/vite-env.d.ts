/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_DEMO?: string
  /** T08: cheia de browser Google Maps (Maps JavaScript API); fără ea harta folosește rezerva Leaflet */
  readonly VITE_GOOGLE_MAPS_KEY?: string
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string
  /** Ce build rulează (vite.config.ts, după mod): `web` (implicit) sau `mobile`. */
  readonly VITE_APP: 'web' | 'mobile'
}
