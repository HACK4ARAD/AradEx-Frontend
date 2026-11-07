/**
 * „Adaugă în calendar” pentru evenimentele care țin mai multe zile (expoziții, târguri: ex. 1–30 nov, zilnic 09–17).
 * Fără alegere, Google Calendar ar primi tot intervalul (o lună întreagă, zi și noapte). Așa omul alege ziua și ora la care
 * vine; în calendar intră o vizită de `VISIT_HOURS` ore (cel mult până la închidere). Evenimentele de o zi merg direct.
 * Programul zilnic = ora de început și ora de sfârșit ale evenimentului, în ora Aradului.
 */
import { bucharestIso, splitBucharest } from '@/shared/composables/useEventForm'
import { isoDay } from '@/shared/composables/useEvents'

/** Cât durează vizita pusă în calendar (ore), tăiată la ora de închidere. */
export const VISIT_HOURS = 2
/** Program implicit când sfârșitul e „înaintea” începutului în zi (ex. 18:00 → 02:00): orele de zi. */
const DEFAULT_OPEN = '08:00'
const DEFAULT_CLOSE = '22:00'

export interface CalendarPlan {
  /** prima zi care se mai poate alege (azi, dacă evenimentul a început deja) */
  firstDay: string
  lastDay: string
  /** programul zilnic, „HH:MM” în ora Aradului */
  open: string
  close: string
}

type Timed = { startAt: string; endAt?: string | null }

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** null = evenimentul ține o singură zi (sau s-a încheiat): calendarul primește direct ora lui. */
export function calendarPlan(e: Timed, now = new Date()): CalendarPlan | null {
  if (!e.endAt) return null
  const s = splitBucharest(e.startAt)
  const end = splitBucharest(e.endAt)
  if (s.date === end.date) return null
  const today = isoDay(now)
  const firstDay = s.date > today ? s.date : today
  if (firstDay > end.date) return null
  const daily = toMin(end.time) > toMin(s.time)
  return { firstDay, lastDay: end.date, open: daily ? s.time : DEFAULT_OPEN, close: daily ? end.time : DEFAULT_CLOSE }
}

/** Orele care se pot alege într-o zi: din oră în oră de la deschidere până înainte de închidere; azi, doar cele care urmează. */
export function slotHours(plan: CalendarPlan, day: string, now = new Date()): string[] {
  const open = toMin(plan.open)
  const close = toMin(plan.close)
  const nowMin = day === isoDay(now) ? toMin(splitBucharest(now.toISOString()).time) : -1
  const out: string[] = []
  for (let m = open; m < close; m += 60) if (m > nowMin) out.push(fromMin(m))
  return out
}

/** Intervalul pus în calendar: ziua și ora alese + `VISIT_HOURS` ore, cel mult până la închidere. */
export function calendarSlot(plan: CalendarPlan, day: string, time: string): { startAt: string; endAt: string } {
  const end = Math.min(toMin(time) + VISIT_HOURS * 60, toMin(plan.close))
  return { startAt: bucharestIso(day, time), endAt: bucharestIso(day, fromMin(end)) }
}
