/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_DEMO?: string
  /** Ce build rulează (vite.config.ts, după mod): `web` (implicit) sau `mobile`. */
  readonly VITE_APP: 'web' | 'mobile'
}
