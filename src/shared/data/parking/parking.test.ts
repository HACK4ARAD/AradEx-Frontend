import { describe, expect, it } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { ZONE_COLORS, findParking, hourlyTariff, loadParking, parkingLines, parkingMarkers, tariffText, type ParkingSpot, type ParkingTariff } from './parking'
import data from './parking.json'
import { useParkingLayer } from '@/shared/composables/useParkingLayer'

const tariff = (zone: number, minutes: number, amount: number, currency: string, smsCode?: string): ParkingTariff =>
  ({ zone, minutes, amount, currency, vat: currency === 'EUR' ? false : null, ...(smsCode ? { smsCode } : {}) })
const tariffs = {
  meter: [tariff(0, 30, 2, 'RON'), tariff(0, 60, 3, 'RON'), tariff(0, 120, 6, 'RON')],
  sms: [tariff(0, 60, 0.6, 'EUR', '105'), tariff(1, 30, 0.3, 'EUR', '305'), tariff(1, 60, 0.5, 'EUR', '101'), tariff(2, 120, 0.65, 'EUR', '202')],
}
const spot = (id: string, zone: ParkingSpot['zone'], paths: [number, number][][]): ParkingSpot =>
  ({ id, name: `Str. ${id}`, zone, capacity: 10, maxStayMin: null, lat: 46.18, lng: 21.31, paths })

describe('hourlyTariff', () => {
  it('uses the parking meter rate (lei) when the zone has one', () => {
    expect(hourlyTariff({ tariffs }, 0)).toEqual({ via: 'meter', amount: 3, currency: 'RON', vat: null })
  })
  it('falls back to the hourly SMS rate (EUR + VAT, with its code) for zones without a meter rate', () => {
    expect(hourlyTariff({ tariffs }, 1)).toEqual({ via: 'sms', amount: 0.5, currency: 'EUR', vat: false, smsCode: '101' })
  })
  it('returns null when the source has no hourly rate for the zone', () => {
    expect(hourlyTariff({ tariffs }, 2)).toBeNull()
    expect(hourlyTariff({ tariffs }, 3)).toBeNull()
  })
  it('finds an hourly rate for every zone that has spots in the real data', () => {
    for (const z of new Set(data.spots.map((s) => s.zone))) expect(hourlyTariff(data, z), `zone ${z}`).not.toBeNull()
  })
})

describe('tariffText', () => {
  const t = (k: string, p?: Record<string, unknown>) => (p ? `${k.split('.').pop()}(${Object.values(p).join('|')})` : k.split('.').pop()!)
  const money = (n: number) => `${n} lei`
  const num = (n: number) => n.toFixed(2).replace('.', ',')
  it('meter in lei: money format, no VAT suffix when the source does not say', () => {
    expect(tariffText({ via: 'meter', amount: 3, currency: 'RON', vat: null }, t, money, num)).toBe('perHour(3 lei|viaMeter)')
  })
  it('SMS in EUR without VAT: currency code, + VAT and the SMS code', () => {
    expect(tariffText({ via: 'sms', amount: 0.5, currency: 'EUR', vat: false, smsCode: '101' }, t, money, num))
      .toBe('perHour(plusVat(0,50 EUR)|viaSms(101))')
  })
  it('uses the fields of the tariff: VAT included → no suffix, no code → plain SMS', () => {
    expect(tariffText({ via: 'sms', amount: 2, currency: 'RON', vat: true }, t, money, num)).toBe('perHour(2 lei|viaSmsPlain)')
  })
})

describe('map conversion', () => {
  const spots = [spot('a', 1, [[[46.1, 21.3], [46.2, 21.4]], [[46.3, 21.3]]]), spot('b', 2, [[[46.1, 21.3], [46.11, 21.31], [46.12, 21.32]]])]

  it('turns every street piece with 2+ points into a MapLine coloured by zone', () => {
    expect(parkingLines(spots)).toEqual([
      { id: 'parking:a:0', path: [[46.1, 21.3], [46.2, 21.4]], color: ZONE_COLORS[1], weight: 5, opacity: 0.7 },
      { id: 'parking:b:0', path: [[46.1, 21.3], [46.11, 21.31], [46.12, 21.32]], color: ZONE_COLORS[2], weight: 5, opacity: 0.7 },
    ])
  })
  it('gives each spot one parking pin with the zone colour', () => {
    expect(parkingMarkers(spots)).toEqual([
      { id: 'parking:a', lat: 46.18, lng: 21.31, kind: 'parking', label: 'P', color: ZONE_COLORS[1] },
      { id: 'parking:b', lat: 46.18, lng: 21.31, kind: 'parking', label: 'P', color: ZONE_COLORS[2] },
    ])
  })
  it('finds the spot behind a parking pin and ignores other pins', () => {
    expect(findParking('parking:b', spots)?.name).toBe('Str. b')
    expect(findParking('stop:1', spots)).toBeNull()
    expect(findParking('parking:zzz', spots)).toBeNull()
    expect(findParking(null, spots)).toBeNull()
  })
})

describe('generated data (scripts/parking-data.mjs)', () => {
  it('has only spots with a real point in Arad and at least one street piece', () => {
    expect(data.spots.length).toBeGreaterThan(50)
    for (const s of data.spots) {
      expect(s.lat, s.id).toBeGreaterThan(46.1); expect(s.lat, s.id).toBeLessThan(46.25)
      expect(s.lng, s.id).toBeGreaterThan(21.2); expect(s.lng, s.id).toBeLessThan(21.45)
      expect([0, 1, 2, 3]).toContain(s.zone)
      expect(s.paths.some((p) => p.length >= 2), s.id).toBe(true)
    }
  })
})

describe('useParkingLayer', () => {
  it('shows nothing until switched on, then the pins and lines of the real data', async () => {
    const scope = effectScope()
    const layer = scope.run(() => useParkingLayer())!
    expect(layer.markers.value).toEqual([])
    layer.on.value = true
    await loadParking()
    await nextTick(); await nextTick()
    expect(layer.markers.value).toHaveLength(data.spots.length)
    expect(layer.lines.value.length).toBeGreaterThanOrEqual(data.spots.length)
    expect(layer.find(layer.markers.value[0].id)?.id).toBe(data.spots[0].id)
    layer.on.value = false
    await nextTick()
    expect(layer.markers.value).toEqual([])
    expect(layer.find(`parking:${data.spots[0].id}`)).toBeNull()
    scope.stop()
  })
})

describe('plata prin SMS', () => {
  it('lists the SMS options of a zone, shortest first, only with a code', async () => {
    const { smsOptions } = await import('./parking')
    expect(smsOptions({ tariffs }, 1).map((o) => [o.minutes, o.smsCode])).toEqual([[30, '305'], [60, '101']])
    expect(smsOptions(data, 1).map((o) => o.smsCode)).toEqual(['305', '101', '102'])
    expect(smsOptions(data, 3).map((o) => o.smsCode)).toEqual(['311', '312'])
  })

  it('writes the plate the way the SMS needs it and checks it', async () => {
    const { normalizePlate, isPlate } = await import('./parking')
    expect(normalizePlate(' ar 01-abc ')).toBe('AR01ABC')
    expect(isPlate('AR 01 ABC')).toBe(true)
    expect(isPlate('B 123 XYZ')).toBe(true)
    expect(isPlate('AR1ABC')).toBe(false)
    expect(isPlate('')).toBe(false)
  })

  it('builds the message and the sms: link for Android and iOS', async () => {
    const { smsBody, smsHref, PARKING_SMS_NUMBER } = await import('./parking')
    expect(smsBody('101', 'ar 01 abc')).toBe('101AR01ABC')
    expect(smsHref(PARKING_SMS_NUMBER, '101AR01ABC', false)).toBe('sms:7420?body=101AR01ABC')
    expect(smsHref(PARKING_SMS_NUMBER, '101AR01ABC', true)).toBe('sms:7420&body=101AR01ABC')
  })
})
