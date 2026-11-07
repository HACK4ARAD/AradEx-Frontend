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

export const parkingKey = (s: Pick<ParkingSpot, 'id'>) => `parking:${s.id}`

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
