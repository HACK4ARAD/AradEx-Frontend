import { i18n } from '@/shared/i18n'

/**
 * Formatare în limba aplicației (RO / EN): date, bani, distanțe, puncte. Folosit de toate view-urile; nu apela toLocaleString direct.
 * Limba se citește la fiecare apel (reactiv), deci ecranele se reformatează singure când se schimbă RO/EN.
 */
const TZ = 'Europe/Bucharest'

/** Eticheta Intl pentru limba curentă: 'ro-RO', 'en-GB' (zi lună, ora pe 24 h, ca în română) sau 'hu-HU'. */
export function intlLocale(): 'ro-RO' | 'en-GB' | 'hu-HU' {
  const l = i18n.global.locale.value
  return l === 'en' ? 'en-GB' : l === 'hu' ? 'hu-HU' : 'ro-RO'
}
const isEn = () => intlLocale() === 'en-GB'
const isHu = () => intlLocale() === 'hu-HU'

const cache = new Map<string, Intl.DateTimeFormat>()
function dtf(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = intlLocale() + JSON.stringify(opts)
  let f = cache.get(key)
  if (!f) { f = new Intl.DateTimeFormat(intlLocale(), { ...opts, timeZone: TZ }); cache.set(key, f) }
  return f
}
const DAY: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }
const TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false }
const LONG: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

export function useFormat() {
  /** "Sâm., 7 nov. · 11:00" */
  function dateTime(iso: string, withTime = true): string {
    const d = new Date(iso)
    const day = cap(dtf(DAY).format(d))
    return withTime ? `${day} · ${dtf(TIME).format(d)}` : day
  }
  /** "11:00–13:00" */
  function timeRange(startIso: string, endIso?: string): string {
    const a = dtf(TIME).format(new Date(startIso))
    return endIso ? `${a}–${dtf(TIME).format(new Date(endIso))}` : a
  }
  /** "Sâmbătă, 7 noiembrie" */
  function longDate(iso: string): string {
    return cap(dtf(LONG).format(new Date(iso)))
  }
  /** 40 → "40 lei", 0 → "Gratuit" / "Free" */
  function money(value?: number | null): string {
    if (value === undefined || value === null) return ''
    if (value === 0) return isEn() ? 'Free' : isHu() ? 'Ingyenes' : 'Gratuit'
    return `${new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 2 }).format(value)} lei`
  }
  /** 0.44 → "0,4 km" (EN „0.4 km”); 0.08 → "80 m" */
  function km(value?: number | null): string {
    if (value === undefined || value === null) return ''
    if (value < 0.1) return `${Math.round(value * 1000)} m`
    const v = value.toFixed(1)
    return `${isEn() ? v : v.replace('.', ',')} km`
  }
  /** 95 → "1 h 35 min"; 30 → "30 min" */
  function minutes(total: number): string {
    const h = Math.floor(total / 60), m = total % 60
    if (h === 0) return `${m} min`
    return m === 0 ? `${h} h` : `${h} h ${m} min`
  }
  /** 270 → "270 de puncte", 12 → "12 puncte", 1 → "1 punct" (EN: "270 points", "1 point"; HU: „270 pont”, fără plural după număr) */
  function points(n: number): string {
    if (isEn()) return n === 1 ? '1 point' : `${n} points`
    if (isHu()) return `${n} pont`
    if (n === 1) return '1 punct'
    const abs = Math.abs(n)
    return abs >= 20 ? `${n} de puncte` : `${n} puncte`
  }
  /** Ziua de azi în Europe/Bucharest ca "YYYY-MM-DD" */
  function todayIso(): string {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    return p
  }

  return { dateTime, timeRange, longDate, money, km, minutes, points, todayIso }
}
