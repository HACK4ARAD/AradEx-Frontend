import type { EventCategory, EventCreate, EventDto, TicketType } from '@/shared/types/events'

/** Formularul unui eveniment (T09: firmă; T06 îl poate refolosi pentru Primărie). Data și orele sunt în ora Aradului. */
export interface EventForm {
  title: string
  description: string
  category: EventCategory
  date: string          // YYYY-MM-DD
  start: string         // HH:mm
  end: string           // HH:mm sau ''
  ticketType: TicketType
  priceAdult: string
  priceChild: string
  capacity: string
  externalUrl: string
  imageUrl: string
  locationName: string  // gol = la sediul firmei
  address: string
}

export type EventFormErrors = Partial<Record<keyof EventForm, string>>

export const EVENT_CATEGORIES: EventCategory[] = ['CONCERT', 'THEATRE', 'FAMILY', 'EXHIBITION', 'SPORT', 'OUTDOOR', 'FAIR', 'FOOD']
export const TICKET_TYPES: TicketType[] = ['FREE', 'IN_APP', 'EXTERNAL']

const TZ = 'Europe/Bucharest'

export function emptyEventForm(today: string): EventForm {
  return {
    title: '', description: '', category: 'CONCERT', date: today, start: '19:00', end: '', ticketType: 'FREE',
    priceAdult: '', priceChild: '', capacity: '', externalUrl: '', imageUrl: '', locationName: '', address: '',
  }
}

/** "GMT+2" → "+02:00" pentru o zi dată, în ora Aradului (ține cont de ora de vară). */
function bucharestOffset(date: string, time: string): string {
  const probe = new Date(`${date}T${time}:00Z`)
  const name = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(probe).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+2'
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name)
  if (!m) return '+00:00'
  return `${m[1]}${m[2].padStart(2, '0')}:${m[3] ?? '00'}`
}

/** "2026-11-29" + "16:00" (ora Aradului) → "2026-11-29T16:00:00+02:00" */
export function bucharestIso(date: string, time: string): string {
  return `${date}T${time}:00${bucharestOffset(date, time)}`
}

/** ISO cu offset → { date, time } în ora Aradului (pentru editare). */
export function splitBucharest(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
  return { date, time }
}

export function fromEvent(e: EventDto): EventForm {
  const s = splitBucharest(e.startAt)
  return {
    title: e.title, description: e.description, category: e.category as EventCategory, date: s.date, start: s.time,
    end: e.endAt ? splitBucharest(e.endAt).time : '', ticketType: e.ticketType,
    priceAdult: e.priceAdult != null ? String(e.priceAdult) : '', priceChild: e.priceChild != null ? String(e.priceChild) : '',
    capacity: e.capacity != null ? String(e.capacity) : '', externalUrl: e.externalUrl ?? '', imageUrl: e.imageUrl ?? '',
    locationName: e.locationName ?? '', address: e.address ?? '',
  }
}

/** Câmpurile numerice pot veni ca text sau ca număr (`<input type="number">` cu v-model dă număr). Gol → undefined. */
const num = (v: string | number | null | undefined) => {
  const s = String(v ?? '').trim()
  return s === '' ? undefined : Number(s.replace(',', '.'))
}

/** Regulile formularului (aceleași ca în BE, ca omul să vadă eroarea înainte de trimitere). Valorile sunt chei i18n. */
export function validateEventForm(f: EventForm): EventFormErrors {
  const e: EventFormErrors = {}
  if (!f.title.trim()) e.title = 'business.form.required'
  if (!f.description.trim()) e.description = 'business.form.required'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) e.date = 'business.form.required'
  if (!/^\d{2}:\d{2}$/.test(f.start)) e.start = 'business.form.required'
  if (f.end && /^\d{2}:\d{2}$/.test(f.start) && f.end <= f.start) e.end = 'business.form.endAfterStart'
  const pa = num(f.priceAdult), pc = num(f.priceChild), cap = num(f.capacity)
  if (pa !== undefined && (Number.isNaN(pa) || pa < 0)) e.priceAdult = 'business.form.badNumber'
  if (pc !== undefined && (Number.isNaN(pc) || pc < 0)) e.priceChild = 'business.form.badNumber'
  if (f.ticketType === 'IN_APP' && pa === undefined) e.priceAdult = 'business.form.priceRequired'
  if (cap !== undefined && (Number.isNaN(cap) || !Number.isInteger(cap) || cap < 1)) e.capacity = 'business.form.badNumber'
  if (f.ticketType === 'EXTERNAL' && !/^https?:\/\/.+/.test(f.externalUrl.trim())) e.externalUrl = 'business.form.urlRequired'
  return e
}

/** Formular valid → cererea pentru API. Câmpurile goale nu se trimit; la FREE nu se trimit prețuri. */
export function toEventCreate(f: EventForm): EventCreate {
  const req: EventCreate = {
    title: f.title.trim(), description: f.description.trim(), category: f.category,
    startAt: bucharestIso(f.date, f.start), ticketType: f.ticketType,
  }
  if (f.end) req.endAt = bucharestIso(f.date, f.end)
  if (f.ticketType !== 'FREE') {
    req.priceAdult = num(f.priceAdult)
    req.priceChild = num(f.priceChild)
  }
  if (f.ticketType === 'EXTERNAL') req.externalUrl = f.externalUrl.trim()
  const cap = num(f.capacity)
  if (cap !== undefined) req.capacity = cap
  if (f.imageUrl.trim()) req.imageUrl = f.imageUrl.trim()
  if (f.locationName.trim()) req.locationName = f.locationName.trim()
  if (f.address.trim()) req.address = f.address.trim()
  return req
}
