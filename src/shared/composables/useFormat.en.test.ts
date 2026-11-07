import { afterEach, describe, expect, it } from 'vitest'
import { i18n } from '@/shared/i18n'
import { intlLocale, useFormat } from './useFormat'

describe('useFormat follows the language', () => {
  afterEach(() => { i18n.global.locale.value = 'ro' })

  it('formats dates, money, distance and points in English', () => {
    i18n.global.locale.value = 'en'
    const f = useFormat()
    expect(intlLocale()).toBe('en-GB')
    expect(f.dateTime('2026-11-13T17:30:00Z')).toBe('Fri 13 Nov · 19:30')
    expect(f.money(0)).toBe('Free')
    expect(f.money(1240)).toBe('1,240 lei')
    expect(f.km(0.44)).toBe('0.4 km')
    expect(f.points(1)).toBe('1 point')
    expect(f.points(270)).toBe('270 points')
  })

  it('switching back to Romanian restores the Romanian formats', () => {
    i18n.global.locale.value = 'en'
    i18n.global.locale.value = 'ro'
    const f = useFormat()
    expect(f.money(0)).toBe('Gratuit')
    expect(f.km(0.44)).toBe('0,4 km')
    expect(f.dateTime('2026-11-13T17:30:00Z', false)).toMatch(/^Vin/)
  })
})
