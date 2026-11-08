import type { MapLine, MapMarker } from '@/shared/components/map/types'

/**
 * Stratul „Parcări” al hărții: parcările cu plată din Arad (Recons, prin github.com/baditaflorin/arad-parking-data).
 * Datele (`parking.json`) le generează `scripts/parking-data.mjs`; fiecare poziție e o stradă / un tronson / o piață, nu un loc
 * de parcare, iar punctul și traseul sunt ale străzii de referință din OpenStreetMap (locație aproximativă).
 */
export type ParkingZone = 0 | 1 | 2 | 3

export interface ParkingSpot {
  id: string
  /** numele scurt („Str. Horia”) */
  name: string
  /** tronsonul, dacă sursa îl dă („între str. Episcopiei și str. Octavian Goga”) */
  detail?: string
  zone: ParkingZone
  capacity: number | null
  /** durata maximă de staționare (minute); null = sursa nu dă una */
  maxStayMin: number | null
  /** se plătește și duminică 08:00–14:00 (excepția Piața Obor / str. Pădurii / str. Căpitan Ignat) */
  sundayObor?: boolean
  lat: number
  lng: number
  /** traseul străzii de referință, simplificat, puncte [lat, lng] (una sau mai multe bucăți) */
  paths: [number, number][][]
}

export interface ParkingTariff {
  zone: number
  minutes: number
  amount: number
  currency: string
  /** TVA inclus (null = sursa nu spune) */
  vat: boolean | null
  smsCode?: string
}

export interface ParkingData {
  source: string
  retrievedAt: string
  tariffs: { meter: ParkingTariff[]; sms: ParkingTariff[] }
  spots: ParkingSpot[]
}

/** Tariful pe oră afișat pe card: parcometrul (lei) când sursa îl are pentru zonă, altfel SMS-ul (EUR + TVA, cu codul). */
export type HourlyTariff = { via: 'meter' | 'sms'; amount: number; currency: string; vat: boolean | null; smsCode?: string }

/** Culorile zonelor din sursă: 0 verde, 1 roșu, 2 galben, 3 albastru. */
export const ZONE_COLORS: Record<ParkingZone, string> = { 0: '#2E9E4F', 1: '#E03B2F', 2: '#E8A600', 3: '#3A6FE0' }

export function hourlyTariff(data: Pick<ParkingData, 'tariffs'>, zone: number): HourlyTariff | null {
  const hour = (list: ParkingTariff[]) => list.find((t) => t.zone === zone && t.minutes === 60)
  const meter = hour(data.tariffs.meter)
  if (meter) return { via: 'meter', amount: meter.amount, currency: meter.currency, vat: meter.vat }
  const sms = hour(data.tariffs.sms)
  if (sms) return { via: 'sms', amount: sms.amount, currency: sms.currency, vat: sms.vat, smsCode: sms.smsCode }
  return null
}

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * Textul tarifului pe card, din câmpurile sursei: lei prin `money`, altă monedă cu codul ei; „+ TVA” doar când sursa spune
 * că TVA-ul nu e inclus (`vat: false`); parcometru sau SMS cu codul. Ex.: „0,50 EUR + TVA / oră (SMS, cod 101)”.
 */
export function tariffText(h: HourlyTariff, t: Translate, money: (lei: number) => string, num: (n: number) => string): string {
  const price = h.currency === 'RON' ? money(h.amount) : `${num(h.amount)} ${h.currency}`
  const amount = h.vat === false ? t('parking.card.plusVat', { amount: price }) : price
  const via = h.via === 'meter' ? t('parking.card.viaMeter') : h.smsCode ? t('parking.card.viaSms', { code: h.smsCode }) : t('parking.card.viaSmsPlain')
  return t('parking.card.perHour', { amount, via })
}

export const parkingKey =(s: Pick<ParkingSpot, 'id'>) => `parking:${s.id}`

/** Traseele străzilor, colorate pe zonă (sub pini, mai groase decât liniile de transport). */
export function parkingLines(spots: ParkingSpot[]): MapLine[] {
  return spots.flatMap((s) => s.paths.filter((p) => p.length >= 2)
    .map((path, i) => ({ id: `${parkingKey(s)}:${i}`, path, color: ZONE_COLORS[s.zone], weight: 5, opacity: 0.7 })))
}

/** Câte un pin „P” pe stradă, cu marginea în culoarea zonei. */
export function parkingMarkers(spots: ParkingSpot[]): MapMarker[] {
  return spots.map((s) => ({ id: parkingKey(s), lat: s.lat, lng: s.lng, kind: 'parking', label: 'P', color: ZONE_COLORS[s.zone] }))
}

/** Ce stă în spatele unui pin `parking:<id>`; orice alt pin → null. */
export function findParking(id: string | null, spots: ParkingSpot[]): ParkingSpot | null {
  if (!id?.startsWith('parking:')) return null
  return spots.find((s) => parkingKey(s) === id) ?? null
}

let cache: Promise<ParkingData> | null = null
/** Datele sunt statice (~30 KB): se încarcă o singură dată, abia când stratul e pornit prima oară. */
export function loadParking(): Promise<ParkingData> {
  cache ??= import('./parking.json').then((m) => m.default as ParkingData).catch((err) => { cache = null; throw err })
  return cache
}

/* ---------- plata prin SMS (Recons / Tpark) ---------- */

/**
 * Numărul scurt la care se trimite SMS-ul de plată în Arad. Recons nu îl publică pe site; 7420 vine din anunțurile de lansare
 * și din comunicatele Primăriei (panourile din parcări îl afișează) — de aceea cardul îi spune omului să-l verifice pe panou.
 */
export const PARKING_SMS_NUMBER = '7420'

/** O variantă de plată prin SMS pentru o zonă: durata, prețul și codul (ex. zona 1, 60 min, 0,50 EUR + TVA, „101”). */
export type SmsOption = ParkingTariff & { smsCode: string }

/** Variantele SMS ale zonei, de la cea mai scurtă la cea mai lungă (doar cele cu cod în sursă). */
export function smsOptions(data: Pick<ParkingData, 'tariffs'>, zone: number): SmsOption[] {
  return data.tariffs.sms.filter((t): t is SmsOption => t.zone === zone && !!t.smsCode).sort((a, b) => a.minutes - b.minutes)
}

/** Numărul de înmatriculare cum intră în SMS: litere mari, fără spații și cratime („ar 01 abc” → „AR01ABC”). */
export function normalizePlate(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Număr românesc obișnuit: județ + 2 cifre + 3 litere (AR01ABC) sau București cu 2–3 cifre (B123ABC). */
export function isPlate(s: string): boolean {
  return /^(B\d{2,3}|[A-Z]{2}\d{2})[A-Z]{3}$/.test(normalizePlate(s))
}

/** Textul SMS-ului: codul zonei și duratei lipit de numărul de înmatriculare („101AR01ABC”). */
export function smsBody(code: string, plate: string): string {
  return `${code}${normalizePlate(plate)}`
}

/**
 * Legătura care deschide aplicația de mesaje cu numărul și textul completate (omul doar apasă Trimite).
 * iOS vrea `sms:NUMĂR&body=…`, Android (și restul) `sms:NUMĂR?body=…`.
 */
export function smsHref(number: string, body: string, ios: boolean): string {
  return `sms:${number}${ios ? '&' : '?'}body=${encodeURIComponent(body)}`
}
