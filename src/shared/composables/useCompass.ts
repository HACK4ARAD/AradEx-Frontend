import { getCurrentScope, onScopeDispose, ref } from 'vue'

/**
 * Busola telefonului (direcția în care e ținut, grade față de nord), pentru săgeata punctului „tu ești aici” când stai pe loc
 * (GPS-ul dă direcția doar în mers). Android: `deviceorientationabsolute`; iOS: `webkitCompassHeading`, cu permisiunea cerută
 * la o atingere (`start()` se cheamă din butonul „Locația mea”). Fără senzor rămâne `null`. Se oprește singură cu ecranul.
 */
type IosOrientation = DeviceOrientationEvent & { webkitCompassHeading?: number }
type IosPermission = { requestPermission?: () => Promise<'granted' | 'denied'> }

/** Sub atâtea grade o schimbare nu se mai aplică (senzorul tremură; harta nu se redesenează degeaba). */
export const COMPASS_MIN_DELTA = 3

/** Direcția din evenimentul senzorului, corectată cu rotirea ecranului; null dacă evenimentul nu e raportat la nord. */
export function compassHeading(e: { alpha: number | null; absolute?: boolean; webkitCompassHeading?: number }, screenAngle = 0): number | null {
  let h: number | null = null
  if (typeof e.webkitCompassHeading === 'number' && Number.isFinite(e.webkitCompassHeading)) h = e.webkitCompassHeading
  else if (e.absolute && e.alpha != null) h = 360 - e.alpha
  if (h == null) return null
  return (((h + screenAngle) % 360) + 360) % 360
}

/** Diferența unghiulară cea mai scurtă (0–180). */
export function angleDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

export function useCompass() {
  const heading = ref<number | null>(null)
  let on = false

  function onEvent(e: Event) {
    const o = e as IosOrientation
    const angle = typeof screen !== 'undefined' && screen.orientation ? screen.orientation.angle : 0
    const h = compassHeading({ alpha: o.alpha, absolute: o.absolute || e.type === 'deviceorientationabsolute', webkitCompassHeading: o.webkitCompassHeading }, angle)
    if (h == null) return
    if (heading.value == null || angleDelta(h, heading.value) >= COMPASS_MIN_DELTA) heading.value = Math.round(h)
  }

  async function start() {
    if (on || typeof window === 'undefined') return
    const DO = (window as unknown as { DeviceOrientationEvent?: IosPermission }).DeviceOrientationEvent
    if (DO?.requestPermission) {
      try { if ((await DO.requestPermission()) !== 'granted') return } catch { return }
    }
    on = true
    const absolute: boolean = Object.prototype.hasOwnProperty.call(window, 'ondeviceorientationabsolute') || 'ondeviceorientationabsolute' in Window.prototype
    window.addEventListener(absolute ? 'deviceorientationabsolute' : 'deviceorientation', onEvent)
  }
  function stop() {
    if (!on) return
    on = false
    window.removeEventListener('deviceorientationabsolute', onEvent)
    window.removeEventListener('deviceorientation', onEvent)
    heading.value = null
  }
  if (getCurrentScope()) onScopeDispose(stop)
  return { heading, start, stop }
}
