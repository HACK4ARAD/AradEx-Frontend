import { ref } from 'vue'
import { authApi } from '@/shared/api/auth'
import { ApiError } from '@/shared/api/client'

/**
 * Modul „doar demo” (cât timp AradExperience nu e încă live): GET /auth/config, cerut o singură dată la pornirea aplicației și
 * ținut aici. Dacă cererea eșuează, considerăm `demoOnly = false`: formularele rămân folosibile, iar serverul tot aplică regula
 * (403 „Not live yet”, recunoscut de `isNotLiveError`).
 */

const demoOnly = ref(false)
const loaded = ref(false)
let pending: Promise<boolean> | null = null

/** Textul exact din ProblemDetail-ul 403 pe care BE îl trimite cât timp doar conturile demo pot intra. */
export const NOT_LIVE_DETAIL = 'Not live yet: only the demo accounts can sign in'

export function loadAuthMode(): Promise<boolean> {
  if (!pending) {
    pending = (async () => {
      try {
        const res = await authApi.config()
        demoOnly.value = res?.demoOnly === true
      } catch {
        demoOnly.value = false
      }
      loaded.value = true
      return demoOnly.value
    })()
  }
  return pending
}

/** `demoOnly` (reactiv, comun întregii aplicații) și `loaded`; prima folosire pornește cererea. */
export function useAuthMode() {
  void loadAuthMode()
  return { demoOnly, loaded }
}

/** 403 cu `detail` „Not live yet: …”: contul nu e unul demo, iar aplicația nu e încă live. */
export function isNotLiveError(e: unknown): boolean {
  return e instanceof ApiError && e.status === 403 && (e.problem?.detail ?? e.message) === NOT_LIVE_DETAIL
}
