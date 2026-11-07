import type { Ui } from '@/shared/composables/useAuthForm'

/**
 * Ce build rulează: `web` (prezentarea + panourile, aradexperience.site) sau `mobile` (aplicația, Capacitor).
 * Vine din modul Vite (`vite build` / `vite build --mode mobile`), deci e fix pentru tot build-ul.
 */
export type AppKind = 'mobile' | 'web'
export const APP: AppKind = import.meta.env.VITE_APP === 'mobile' ? 'mobile' : 'web'
/** Codul folosit de useAuthForm (`homeFor`, `landingFor`). */
export const UI: Ui = APP === 'mobile' ? 'm' : 'w'
