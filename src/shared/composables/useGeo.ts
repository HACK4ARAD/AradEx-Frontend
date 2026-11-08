import { getCurrentScope, onScopeDispose, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import type { GeoPoint } from '@/shared/types/common'

/** Centrul Aradului (Piața Avram Iancu) — poziția implicită când nu avem GPS. */
export const ARAD_CENTER: GeoPoint = { lat: 46.1866, lng: 21.3123 }

/** Sub atâția metri poziția e „exactă” și nu mai așteptăm alte citiri. */
export const GOOD_ACCURACY_M = 25
/** Cât timp mai ascultăm GPS-ul după prima citire, ca să prindem una mai precisă. */
export const REFINE_MS = 15_000
/** Ultima poziție bună e refolosită de ecranele deschise după ea (harta pornește direct pe tine), cât e mai nouă de atât. */
export const LAST_FIX_MS = 15 * 60_000
/** Poziția „rapidă” (ultima știută de telefon / browser, din rețea sau GPS) acceptată ca primă citire: cât de veche poate fi. */
export const QUICK_MAX_AGE_MS = 10 * 60_000
export const QUICK_TIMEOUT_MS = 4_000
/** Urmărirea continuă (harta deschisă): citiri GPS de cel mult 2 s, ca punctul să țină pasul când mergi / ești în mașină. */
export const TRACK_MAX_AGE_MS = 2_000
/** Cât urmărim, o citire mai imprecisă de atât nu mută un punct bun (salturile de la rețea, în clădiri). */
export const TRACK_MAX_ACCURACY_M = 80
/** Peste viteza asta (m/s, ~3 km/h) direcția GPS e de încredere: săgeata punctului arată încotro mergi. */
export const MOVING_MPS = 0.8

type Fix = { point: GeoPoint; accuracy: number | null; at: number }
let lastFix: Fix | null = null
/** doar pentru teste */
export function resetLastFix() { lastFix = null }

/** O citire, în forma comună browserului și pluginului nativ. */
type Reading = { coords: { latitude: number; longitude: number; accuracy: number; heading?: number | null; speed?: number | null } }
type Source = {
  /** permisiunea, cerută înainte de cronometru (cât omul se uită la fereastra sistemului nu trebuie să expire cererea);
   *  `prompt` = browserul încă întreabă: așteptăm mai mult */
  prepare: () => Promise<'granted' | 'denied' | 'prompt'>
  watch: (ok: (p: Reading) => void, err: (code: 'denied' | 'unavailable') => void, opts: PositionOptions) => Promise<() => void>
  /** poziția știută deja de telefon / browser (fără să aștepte GPS-ul): arată imediat un punct, GPS-ul îl rafinează după */
  quick: (ok: (p: Reading) => void) => void
  /** permisiunea e deja dată (fără să întrebe): pentru pornirea în fundal la deschiderea aplicației */
  granted: () => Promise<boolean>
}
/** cât așteptăm o poziție cât browserul încă îți cere permisiunea */
export const PROMPT_WAIT_MS = 60_000

/** În aplicație (Android / iOS): GPS-ul nativ prin `@capacitor/geolocation` — cere permisiunea sistemului; în WebView-ul
 *  Android `navigator.geolocation` e nesigur (nu cere permisiunea, rămâne fără răspuns). */
const nativeSource: Source = {
  async prepare() {
    const { Geolocation } = await import('@capacitor/geolocation')
    let perm = await Geolocation.checkPermissions().catch(() => null)
    if (perm && perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
      perm = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] }).catch(() => null)
    }
    return perm && perm.location !== 'granted' && perm.coarseLocation !== 'granted' ? 'denied' : 'granted'
  },
  quick(ok) {
    void import('@capacitor/geolocation').then(({ Geolocation }) =>
      Geolocation.getCurrentPosition({ enableHighAccuracy: false, maximumAge: QUICK_MAX_AGE_MS, timeout: QUICK_TIMEOUT_MS }).then(ok)).catch(() => {})
  },
  async granted() {
    const { Geolocation } = await import('@capacitor/geolocation')
    const p = await Geolocation.checkPermissions().catch(() => null)
    return !!p && (p.location === 'granted' || p.coarseLocation === 'granted')
  },
  async watch(ok, err, opts) {
    const { Geolocation } = await import('@capacitor/geolocation')
    let id: string | null = null
    let stopped = false
    try {
      id = await Geolocation.watchPosition(opts, (p, e) => {
        if (p) ok(p)
        else if (e) err(/denied|permission/i.test(String(e.message ?? e)) ? 'denied' : 'unavailable')
      })
    } catch (e) {
      err(/denied|permission/i.test(String((e as Error)?.message ?? e)) ? 'denied' : 'unavailable')
    }
    return () => { if (!stopped && id) { stopped = true; void Geolocation.clearWatch({ id }) } }
  },
}

/** Pe web (și în teste): geolocația browserului. */
const browserSource: Source = {
  async prepare() {
    try {
      const st = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
      return st?.state === 'denied' ? 'denied' : st?.state === 'prompt' ? 'prompt' : 'granted'
    } catch { return 'granted' } // fără Permissions API (Safari vechi): cererea însăși întreabă
  },
  quick(ok) {
    const geo = typeof navigator === 'undefined' ? undefined : navigator.geolocation
    geo?.getCurrentPosition(ok, () => {}, { enableHighAccuracy: false, maximumAge: QUICK_MAX_AGE_MS, timeout: QUICK_TIMEOUT_MS })
  },
  async granted() {
    try { return (await navigator.permissions?.query({ name: 'geolocation' as PermissionName }))?.state === 'granted' } catch { return false }
  },
  async watch(ok, err, opts) {
    const geo = typeof navigator === 'undefined' ? undefined : navigator.geolocation
    if (!geo) { err('unavailable'); return () => {} }
    const onErr = (e: GeolocationPositionError) => err(e.code === 1 ? 'denied' : 'unavailable')
    if (typeof geo.watchPosition === 'function') {
      const id = geo.watchPosition(ok, onErr, opts)
      return () => geo.clearWatch?.(id)
    }
    geo.getCurrentPosition(ok, onErr, opts)
    return () => {}
  },
}

const isNative = () => { try { return Capacitor.isNativePlatform() } catch { return false } }

/**
 * Poziția utilizatorului: `locate()` cere GPS-ul (doar la o acțiune a omului, nu la încărcare); fără permisiune,
 * fără GPS sau după timeout rămâne pe centrul Aradului cu `isFallback = true`, fără eroare în consolă.
 * Prima citire e adesea aproximativă (rețea / Wi-Fi, sute de metri), mai ales în browserul telefonului: `locate()` se
 * rezolvă la prima citire, dar ascultă GPS-ul încă `REFINE_MS` și mută poziția la fiecare citire mai precisă, până la
 * `GOOD_ACCURACY_M`. Ca punctul să apară imediat, prima citire poate fi poziția deja știută de telefon / browser (≤ 10 min,
 * `quick`), înlocuită apoi de citirile GPS proaspete (`maximumAge: 0`) mai precise.
 * Folosit de hartă (T08), „lângă tine” (T06/T10), transport (T19).
 * În aplicație citirile vin din GPS-ul nativ (`@capacitor/geolocation`, cu permisiunea sistemului), pe web din browser.
 */
export function useGeo() {
  // pornește din ultima poziție bună (alt ecran a găsit-o de curând), altfel din centrul Aradului
  const fresh = lastFix && Date.now() - lastFix.at < LAST_FIX_MS ? lastFix : null
  const position = ref<GeoPoint>(fresh ? { ...fresh.point } : { ...ARAD_CENTER })
  const isFallback = ref(!fresh)
  const loading = ref(false)
  const error = ref<'denied' | 'unavailable' | null>(null)
  /** precizia ultimei poziții, în metri (null = centrul Aradului) */
  const accuracy = ref<number | null>(fresh?.accuracy ?? null)

  let unwatch: (() => void) | null = null
  let stopTimer: ReturnType<typeof setTimeout> | null = null
  let run = 0
  /** cererea în curs: o oprire (sau o cerere nouă) o rezolvă cu poziția știută, ca nimeni să nu aștepte la nesfârșit */
  let finish: (() => void) | null = null

  function stop() {
    run++
    const f = finish
    finish = null
    f?.()
    unwatch?.()
    unwatch = null
    if (stopTimer) clearTimeout(stopTimer)
    stopTimer = null
  }

  function accept(p: Reading) {
    position.value = { lat: p.coords.latitude, lng: p.coords.longitude }
    accuracy.value = Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null
    isFallback.value = false
    error.value = null
    lastFix = { point: { ...position.value }, accuracy: accuracy.value, at: Date.now() }
  }

  function locate(timeoutMs = 10_000): Promise<GeoPoint> {
    stop()
    const mine = run
    loading.value = true
    return new Promise((resolve) => {
      let resolved = false
      let firstTaken = false
      const done = () => {
        if (resolved) return
        resolved = true
        if (finish === done) finish = null
        loading.value = false
        resolve(position.value)
      }
      finish = done
      const onFix = (p: Reading) => {
        if (mine !== run) return
        // prima citire se ia oricum; după aceea doar una mai precisă (sau la fel de precisă, dar mai nouă)
        const better = !firstTaken || accuracy.value == null || p.coords.accuracy <= accuracy.value
        firstTaken = true
        if (better) accept(p)
        done()
        if (accuracy.value != null && accuracy.value <= GOOD_ACCURACY_M) stop()
      }
      const onError = (code: 'denied' | 'unavailable') => {
        if (mine !== run || resolved) return // avem deja o poziție: o eroare târzie nu o strică
        error.value = code
        stop()
      }
      const src = isNative() ? nativeSource : browserSource
      void (async () => {
        // întâi permisiunea (fereastra sistemului / a browserului), abia apoi pornește cronometrul
        const perm = await src.prepare().catch(() => 'granted' as const)
        if (mine !== run) return
        if (perm === 'denied') { onError('denied'); return }
        const wait = perm === 'prompt' ? PROMPT_WAIT_MS : Math.max(REFINE_MS, timeoutMs)
        const opts: PositionOptions = { enableHighAccuracy: true, timeout: perm === 'prompt' ? PROMPT_WAIT_MS : timeoutMs, maximumAge: 0 }
        stopTimer = setTimeout(() => { if (mine !== run) return; if (!resolved) error.value = 'unavailable'; stop() }, wait)
        // poziția știută deja apare imediat (rezolvă cererea); citirile GPS de după o înlocuiesc dacă sunt mai precise
        src.quick((p) => { if (mine === run && !firstTaken) onFix(p) })
        const u = await src.watch(onFix, onError, opts)
        if (mine === run) unwatch = u; else u()
      })().catch(() => onError('unavailable'))
    })
  }

  /** direcția de mers (grade față de nord, 0–360) din GPS, doar când te miști; null = pe loc / necunoscută */
  const heading = ref<number | null>(null)
  /** viteza (m/s) din ultima citire, dacă GPS-ul o dă */
  const speed = ref<number | null>(null)
  /** urmărirea continuă e pornită (`track()`) */
  const tracking = ref(false)
  let untrackFn: (() => void) | null = null
  let trackRun = 0
  let lastTrackAt = 0

  function onTrackFix(p: Reading) {
    const acc = Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null
    // un punct bun și proaspăt nu sare la o citire de rețea mult mai imprecisă
    const good = accuracy.value != null && accuracy.value <= TRACK_MAX_ACCURACY_M && Date.now() - lastTrackAt < 20_000
    if (good && (acc == null || acc > TRACK_MAX_ACCURACY_M)) return
    accept(p)
    lastTrackAt = Date.now()
    const s = p.coords.speed
    speed.value = s != null && Number.isFinite(s) ? s : null
    const h = p.coords.heading
    if (speed.value != null && speed.value >= MOVING_MPS && h != null && Number.isFinite(h)) heading.value = ((h % 360) + 360) % 360
    else if (speed.value != null && speed.value < MOVING_MPS) heading.value = null
  }

  async function startTrack() {
    const mine = ++trackRun
    const src = isNative() ? nativeSource : browserSource
    const perm = await src.prepare().catch(() => 'granted' as const)
    if (mine !== trackRun || !tracking.value) return
    if (perm === 'denied') { error.value = 'denied'; tracking.value = false; return }
    const u = await src.watch((p) => { if (mine === trackRun) onTrackFix(p) }, (code) => { if (mine === trackRun && code === 'denied') { error.value = code; untrack() } },
      { enableHighAccuracy: true, maximumAge: TRACK_MAX_AGE_MS, timeout: 30_000 })
    if (mine === trackRun && tracking.value) untrackFn = u; else u()
  }
  function pauseTrack() { trackRun++; untrackFn?.(); untrackFn = null }
  function onVisibility() {
    if (!tracking.value) return
    if (document.visibilityState === 'hidden') pauseTrack(); else void startTrack()
  }

  /**
   * Urmărirea continuă a poziției, cât harta e deschisă: GPS precis, citiri la ~1–2 s, plus direcția și viteza; pe pauză cât
   * aplicația nu e vizibilă (bateria). Se oprește cu `untrack()` sau singură când ecranul dispare.
   */
  function track() {
    if (tracking.value) return
    tracking.value = true
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility)
    if (typeof document === 'undefined' || document.visibilityState !== 'hidden') void startTrack()
  }
  function untrack() {
    if (!tracking.value) return
    tracking.value = false
    pauseTrack()
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility)
  }
  if (getCurrentScope()) onScopeDispose(() => { untrack(); stop() })

  /** `near` pentru API (`lat,lng`), ex. GET /events?near=46.18,21.31 */
  const near = () => `${position.value.lat.toFixed(5)},${position.value.lng.toFixed(5)}`

  return { position, isFallback, loading, error, accuracy, heading, speed, tracking, locate, stop, near, track, untrack }
}

/**
 * La deschiderea aplicației (mobil și web): dacă locația e deja permisă (fără să întrebe), poziția se caută în fundal, ca harta,
 * Transport și „lângă tine” să pornească direct pe tine. Fără permisiune nu face nimic (fereastra apare abia la o acțiune).
 */
export async function warmUpLocation(): Promise<void> {
  try {
    const src = isNative() ? nativeSource : browserSource
    if (await src.granted()) await useGeo().locate()
  } catch { /* fără locație: ecranele pornesc din centru */ }
}
