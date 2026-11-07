import { distanceKm } from '@/shared/composables/useDirections'
import type { BikeStation } from '@/shared/data/bikes/bikes'
import type { ParkingSpot } from '@/shared/data/parking/parking'
import type { GeoPoint } from '@/shared/types/common'
import type { TransitArrivalDto, TransitPatternDto, TransitRouteDto, TransitStopDto } from '@/shared/types/transit'

/**
 * T19 · planul de drum din tab-ul Transport (design/final `planTrip`), pe rețeaua reală CTP Arad (T22: liniile, variantele și
 * stațiile din `/transit/routes` + `/transit/stops`) în locul tramvaielor statice din prototip, plus autobuzele.
 * Funcții pure (testate): variantele cu tramvai / autobuz (pe jos → linie → pe jos), pe jos, cu bicicleta (stațiile bike sharing)
 * și cu mașina (parcarea cu plată cea mai apropiată de destinație). Plecările vin live din `/transit/stops/{id}/arrivals`;
 * durata de mers în vehicul e estimată din lungimea traseului (CTP nu publică timpii între stații).
 */

/** Factorul de ocol față de linia dreaptă (străzile nu merg drept) și vitezele medii. */
export const DETOUR = 1.2
export const WALK_KMH = 5
export const BIKE_KMH = 15
export const CAR_KMH = 25
/** viteza comercială a vehiculelor CTP între stații + oprirea în fiecare stație */
export const RIDE_KMH = 20
export const DWELL_MIN = 0.5
/** cât mergi pe jos până la o stație / de la ultima stație (km) */
export const BOARD_KM = 0.8
export const ALIGHT_KM = 0.8
/** așteptarea presupusă când sursa live nu răspunde */
export const DEFAULT_WAIT_MIN = 5
/** o variantă cu transport se arată doar dacă nu e cu mult mai lentă decât mersul pe jos (design: +12 min) */
export const TRANSIT_SLACK_MIN = 12
/** deblocarea / returnarea bicicletei, căutarea locului de parcare */
export const BIKE_DOCK_MIN = 2
export const PARK_SEARCH_MIN = 3

export const walkMinutes = (km: number) => Math.max(1, Math.round((km / WALK_KMH) * 60))
const walkKm = (a: GeoPoint, b: GeoPoint) => distanceKm(a, b) * DETOUR

/** Destinația planului: un obiectiv, o stație, un eveniment, o firmă sau un reper din sugestii. */
export interface Dest extends GeoPoint {
  /** cheia din `?to=`: `place:3`, `stop:120`, `event:5`, `offer:7`, `poi:gara` */
  key: string
  name: string
  /** subtitlul („Gară CFR”, „Muzeu”, „Stație CTP”) */
  type: string
  icon: string
}

export interface TransitOption {
  kind: 'transit'
  route: TransitRouteDto
  pattern: TransitPatternDto
  /** pozițiile în `pattern.stopIds` */
  boardIdx: number
  alightIdx: number
  board: TransitStopDto
  alight: TransitStopDto
  /** stațiile parcurse, inclusiv urcarea și coborârea */
  stops: TransitStopDto[]
  /** traseul vehiculului între cele două stații, [lat, lng] */
  path: [number, number][]
  walk1Min: number
  walk2Min: number
  rideMin: number
  /** minute până pleacă vehiculul din stația de urcare (de acum); null = fără date live */
  departMin: number | null
  /** cât aștepți în stație după ce ajungi; estimat când `departMin` e null */
  waitMin: number
  total: number
}
export interface WalkOption { kind: 'walk'; km: number; total: number }
export interface BikeOption { kind: 'bike'; from: BikeStation; to: BikeStation; walk1Min: number; rideMin: number; walk2Min: number; km: number; total: number }
export interface CarOption { kind: 'car'; km: number; driveMin: number; parking: ParkingSpot | null; walkKm: number; walkMin: number; total: number }
export type TripOption = TransitOption | WalkOption | BikeOption | CarOption

export interface TripPlan {
  dest: Dest
  walk: WalkOption
  /** variantele principale (design: cel mult 2 cu transport + pe jos), cea mai rapidă prima */
  options: (TransitOption | WalkOption)[]
  /** cea mai bună variantă cu transport, chiar dacă e prea lentă ca să intre în listă (pentru notă) */
  bestTransit: TransitOption | null
  /** alte moduri: bicicleta (stațiile bike sharing) și mașina (cu parcarea) */
  others: (BikeOption | CarOption)[]
}

/* ---------- geometria liniilor ---------- */

/** Pentru fiecare stație a variantei, indexul punctului din traseu cel mai apropiat (crescător, ca la buclele care revin). */
export function stopPathIndexes(path: [number, number][], stops: GeoPoint[]): number[] {
  const out: number[] = []
  let from = 0
  for (const s of stops) {
    let best = from, bestD = Infinity
    for (let i = from; i < path.length; i++) {
      const d = (path[i][0] - s.lat) ** 2 + (path[i][1] - s.lng) ** 2
      if (d < bestD) { bestD = d; best = i }
    }
    out.push(best)
    from = best
  }
  return out
}

/** Distanța cumulată (km) de la începutul traseului la fiecare punct. */
export function cumulativeKm(path: [number, number][]): number[] {
  const out = [0]
  for (let i = 1; i < path.length; i++) {
    out.push(out[i - 1] + distanceKm({ lat: path[i - 1][0], lng: path[i - 1][1] }, { lat: path[i][0], lng: path[i][1] }))
  }
  return out
}

/** Geometria unei variante, calculată o dată: stațiile, poziția lor pe traseu și distanța cumulată. */
export interface PatternGeo { stops: TransitStopDto[]; idx: number[]; cum: number[] }
const geoCache = new WeakMap<TransitPatternDto, PatternGeo>()
export function patternGeo(p: TransitPatternDto, stopsById: Map<number, TransitStopDto>): PatternGeo {
  const hit = geoCache.get(p)
  if (hit) return hit
  const stops = p.stopIds.map((id) => stopsById.get(id)).filter((s): s is TransitStopDto => !!s)
  const geo = p.path.length >= 2
    ? { stops, idx: stopPathIndexes(p.path, stops), cum: cumulativeKm(p.path) }
    : { stops, idx: stops.map((_, i) => i), cum: cumulativeKm(stops.map((s) => [s.lat, s.lng] as [number, number])) }
  geoCache.set(p, geo)
  return geo
}

/** Km pe traseu între două stații ale variantei (după pozițiile lor în listă). */
export function rideKm(g: PatternGeo, i: number, j: number): number {
  return Math.max(0, g.cum[g.idx[j]] - g.cum[g.idx[i]]) || distanceKm(g.stops[i], g.stops[j])
}

/** Minute în vehicul între stațiile i și j: drumul la viteza comercială + oprirea în stațiile intermediare. */
export function rideMinutes(g: PatternGeo, i: number, j: number): number {
  return Math.max(1, Math.round((rideKm(g, i, j) / RIDE_KMH) * 60 + (j - i - 1) * DWELL_MIN))
}

/** Bucata de traseu dintre două stații, cu capetele exact în stații. */
export function pathBetween(p: TransitPatternDto, g: PatternGeo, i: number, j: number): [number, number][] {
  const a = g.stops[i], b = g.stops[j]
  const inner = p.path.length >= 2 ? p.path.slice(g.idx[i] + 1, g.idx[j]) : g.stops.slice(i + 1, j).map((s) => [s.lat, s.lng] as [number, number])
  return [[a.lat, a.lng], ...inner, [b.lat, b.lng]]
}

/* ---------- variantele ---------- */

/**
 * Pentru fiecare linie, cea mai bună variantă pe jos → urcare → coborâre → pe jos (cu așteptarea presupusă), cele mai rapide primele.
 * Urcarea: o stație la cel mult `BOARD_KM` de plecare; coborârea: după urcare, la cel mult `ALIGHT_KM` de destinație.
 */
export function transitCandidates(from: GeoPoint, dest: GeoPoint, routes: TransitRouteDto[], stopsById: Map<number, TransitStopDto>): TransitOption[] {
  const best = new Map<number, TransitOption>()
  for (const route of routes) {
    for (const pattern of route.patterns) {
      const g = patternGeo(pattern, stopsById)
      if (g.stops.length < 2) continue
      const dFrom = g.stops.map((s) => walkKm(from, s))
      const dTo = g.stops.map((s) => walkKm(s, dest))
      for (let i = 0; i < g.stops.length - 1; i++) {
        if (dFrom[i] / DETOUR > BOARD_KM) continue
        for (let j = i + 1; j < g.stops.length; j++) {
          if (dTo[j] / DETOUR > ALIGHT_KM || g.stops[j].id === g.stops[i].id) continue
          const walk1Min = walkMinutes(dFrom[i]), walk2Min = walkMinutes(dTo[j]), rideMin = rideMinutes(g, i, j)
          const total = walk1Min + DEFAULT_WAIT_MIN + rideMin + walk2Min
          const prev = best.get(route.id)
          if (prev && prev.total <= total) continue
          best.set(route.id, {
            kind: 'transit', route, pattern, boardIdx: i, alightIdx: j, board: g.stops[i], alight: g.stops[j],
            stops: g.stops.slice(i, j + 1), path: pathBetween(pattern, g, i, j),
            walk1Min, walk2Min, rideMin, departMin: null, waitMin: DEFAULT_WAIT_MIN, total,
          })
        }
      }
    }
  }
  return [...best.values()].sort((a, b) => a.total - b.total)
}

/** câte sosiri dă BE-ul pe stație (docs/API.md): o listă plină poate să nu conțină o linie care pleacă mai târziu */
export const ARRIVALS_LIMIT = 8

/**
 * Pune plecările live peste o variantă: primul vehicul al liniei din stația de urcare pe care îl prinzi (pleacă după ce ajungi
 * pe jos). `live=false` → rămâne estimarea. Live, lista nu e plină și linia nu pleacă de acolo → null (variantă scoasă);
 * lista e plină (stație aglomerată) → rămâne estimarea.
 */
export function withDepartures(o: TransitOption, live: boolean, arrivals: TransitArrivalDto[]): TransitOption | null {
  if (!live) return o
  const next = arrivals
    .filter((a) => a.routeId === o.route.id && a.stopId === o.board.id && a.minutes >= o.walk1Min)
    .sort((a, b) => a.minutes - b.minutes)[0]
  if (!next) return arrivals.length >= ARRIVALS_LIMIT ? o : null
  const waitMin = next.minutes - o.walk1Min
  return { ...o, departMin: next.minutes, waitMin, total: o.walk1Min + waitMin + o.rideMin + o.walk2Min }
}

/** Pe jos, în linie dreaptă cu ocol (OSRM desenează traseul pe hartă). */
export function walkOption(from: GeoPoint, dest: GeoPoint): WalkOption {
  const km = walkKm(from, dest)
  return { kind: 'walk', km, total: walkMinutes(km) }
}

/** Cu bicicleta: cea mai apropiată stație bike sharing de plecare și de destinație (doar stațiile sistemului, unde o și returnezi). */
export function bikeOption(from: GeoPoint, dest: GeoPoint, stations: BikeStation[]): BikeOption | null {
  const docks = stations.filter((s) => s.kind === 'dock')
  const near = (p: GeoPoint) => docks.map((s) => ({ s, km: walkKm(p, s) })).sort((a, b) => a.km - b.km)[0]
  const a = near(from), b = near(dest)
  if (!a || !b || a.s.id === b.s.id || a.km / DETOUR > BOARD_KM || b.km / DETOUR > ALIGHT_KM) return null
  const km = walkKm(a.s, b.s)
  const walk1Min = walkMinutes(a.km), walk2Min = walkMinutes(b.km)
  const rideMin = Math.max(1, Math.round((km / BIKE_KMH) * 60)) + BIKE_DOCK_MIN
  return { kind: 'bike', from: a.s, to: b.s, walk1Min, rideMin, walk2Min, km, total: walk1Min + rideMin + walk2Min }
}

/** Cu mașina: drumul + căutarea locului; parcarea cu plată cea mai apropiată de destinație (≤ 600 m), dacă e una. */
export function carOption(from: GeoPoint, dest: GeoPoint, spots: ParkingSpot[]): CarOption {
  const km = distanceKm(from, dest) * 1.35
  const driveMin = Math.max(2, Math.round((km / CAR_KMH) * 60)) + PARK_SEARCH_MIN
  const p = spots.map((s) => ({ s, km: walkKm(s, dest) })).sort((x, y) => x.km - y.km)[0]
  const parking = p && p.km / DETOUR <= 0.6 ? p.s : null
  const walkMin = parking ? walkMinutes(p.km) : 1
  return { kind: 'car', km, driveMin, parking, walkKm: parking ? p.km : 0, walkMin, total: driveMin + walkMin }
}

/**
 * Planul complet (design `planTrip`): cel mult 2 variante cu transport care nu sunt cu mult mai lente decât mersul pe jos,
 * plus pe jos, sortate după durată; apoi bicicleta (dacă e mai rapidă decât mersul) și mașina (peste ~1 km).
 * `transit` = candidații deja trecuți prin `withDepartures` (null-urile scoase).
 */
export function buildPlan(dest: Dest, from: GeoPoint, transit: TransitOption[], bikes: BikeStation[], parking: ParkingSpot[]): TripPlan {
  const walk = walkOption(from, dest)
  const sorted = [...transit].sort((a, b) => a.total - b.total)
  const picked = sorted.filter((o) => o.total < walk.total + TRANSIT_SLACK_MIN).slice(0, 2)
  const options = [...picked, walk].sort((a, b) => a.total - b.total)
  const others: (BikeOption | CarOption)[] = []
  const bike = walk.km > 0.8 ? bikeOption(from, dest, bikes) : null
  if (bike && bike.total < walk.total) others.push(bike)
  if (walk.km > 1) others.push(carOption(from, dest, parking))
  return { dest, walk, options, bestTransit: sorted[0] ?? null, others }
}

/* ---------- stații, plecări, linii ---------- */

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** Numele afișat al unei stații: fără numărul peronului din Telelink („Atrium 2” → „Atrium”, „Gara CFR 1” → „Gara CFR”). */
export function stopLabel(name: string): string {
  return name.replace(/\s+\d$/, '').trim() || name
}

/** Stațiile cele mai apropiate, câte una pe nume (peroanele de vizavi au același nume), până la `maxKm`. */
export function nearbyStops(stops: TransitStopDto[], from: GeoPoint, max = 2, maxKm = 1.5): { stop: TransitStopDto; km: number }[] {
  const seen = new Set<string>()
  const out: { stop: TransitStopDto; km: number }[] = []
  for (const r of stops.map((stop) => ({ stop, km: distanceKm(from, stop) })).sort((a, b) => a.km - b.km)) {
    if (r.km > maxKm || out.length === max) break
    const k = fold(stopLabel(r.stop.name))
    if (seen.has(k)) continue
    seen.add(k)
    out.push(r)
  }
  return out
}

/** Varianta unei linii care trece prin stație (nu ca ultimă oprire); cea mai lungă, dacă sunt mai multe. */
export function patternThrough(route: TransitRouteDto, stopId: number): TransitPatternDto | null {
  return route.patterns
    .filter((p) => { const i = p.stopIds.indexOf(stopId); return i >= 0 && i < p.stopIds.length - 1 })
    .sort((a, b) => b.stopIds.length - a.stopIds.length)[0] ?? null
}

/** Capătul unei variante (numele ultimei stații). */
export function terminalName(p: TransitPatternDto, stopsById: Map<number, TransitStopDto>): string {
  return stopLabel(stopsById.get(p.stopIds[p.stopIds.length - 1])?.name ?? '')
}

export interface DepartureRow {
  route: TransitRouteDto | null
  routeId: number
  shortName: string
  /** spre ce capăt (din variantă; altfel textul de pe vehicul) */
  to: string
  /** varianta pentru pagina liniei */
  pattern: TransitPatternDto | null
  first: TransitArrivalDto
  then: TransitArrivalDto | null
}

/** Rândurile „Stații lângă tine”: câte unul pe linie și direcție, cu următoarea plecare și cea de după; cele mai apropiate primele. */
export function departureRows(arrivals: TransitArrivalDto[], routes: TransitRouteDto[], stopsById: Map<number, TransitStopDto>, max = 4): DepartureRow[] {
  const byId = new Map(routes.map((r) => [r.id, r]))
  const rows = new Map<string, DepartureRow>()
  for (const a of [...arrivals].sort((x, y) => x.minutes - y.minutes)) {
    const route = byId.get(a.routeId) ?? null
    const pattern = route ? patternThrough(route, a.stopId) : null
    const to = (pattern && terminalName(pattern, stopsById)) || a.headsign || ''
    const key = `${a.routeId}|${fold(to)}`
    const row = rows.get(key)
    if (row) { row.then ??= a; continue }
    rows.set(key, { route, routeId: a.routeId, shortName: a.routeShortName ?? route?.shortName ?? String(a.routeId), to, pattern, first: a, then: null })
  }
  return [...rows.values()].slice(0, max)
}

export interface LineDirection { pattern: TransitPatternDto; from: string; to: string }

/** Direcțiile unei linii pentru pagina ei: cea mai lungă variantă spre fiecare capăt, în ordinea din date. */
export function lineDirections(route: TransitRouteDto, stopsById: Map<number, TransitStopDto>): LineDirection[] {
  const byTo = new Map<string, TransitPatternDto>()
  for (const p of [...route.patterns].sort((a, b) => b.stopIds.length - a.stopIds.length)) {
    const to = fold(terminalName(p, stopsById))
    if (p.stopIds.length >= 2 && !byTo.has(to)) byTo.set(to, p)
  }
  return route.patterns
    .filter((p) => [...byTo.values()].includes(p))
    .map((p) => ({ pattern: p, from: stopLabel(stopsById.get(p.stopIds[0])?.name ?? ''), to: terminalName(p, stopsById) }))
}

/** Culorile insignei unei linii: culoarea CTP (altfel albastrul tramvaiului / grafitul autobuzului) și textul lizibil pe ea. */
export function lineColors(r: Pick<TransitRouteDto, 'color' | 'textColor' | 'mode'> | null | undefined): { bg: string; fg: string } {
  const bg = r?.color ?? (r?.mode === 'BUS' ? '#5C5C5C' : '#1D5FD1')
  const fg = luminance(bg) > 0.55 ? '#111111' : '#FFFFFF'
  // culoarea de text din date doar dacă se citește pe fundal (CTP dă alb și pe galbenul liniilor 3 / 46)
  if (r?.textColor && Math.abs(luminance(r.textColor) - luminance(bg)) > 0.45) return { bg, fg: r.textColor }
  return { bg, fg }
}

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return 0
  const n = parseInt(m[1], 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Parcarea e cu plată acum? L–V 08:00–17:00; duminică 08:00–14:00 doar zona Pieței Obor (Recons). Ora Bucureștiului. */
export function parkingPaidNow(spot: Pick<ParkingSpot, 'sundayObor'>, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const day = get('weekday'), mins = Number(get('hour')) * 60 + Number(get('minute'))
  if (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day)) return mins >= 480 && mins < 1020
  if (day === 'Sun' && spot.sundayObor) return mins >= 480 && mins < 840
  return false
}
