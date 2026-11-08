import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { loadMessages } from './index'

type Tree = Record<string, unknown>
function flat(node: Tree, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') flat(v as Tree, key, out)
    else out[key] = String(v)
  }
  return out
}
const placeholders = (s: string) => (s.match(/\{[^}]*\}/g) ?? []).sort()

describe('i18n RO/EN/HU', () => {
  const ro = loadMessages('ro')
  const en = loadMessages('en')
  const hu = loadMessages('hu')

  it('every module has the same keys and placeholders in English as in Romanian', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ro).sort())
    for (const mod of Object.keys(ro)) {
      const r = flat(ro[mod]), e = flat(en[mod])
      expect(Object.keys(e).sort(), mod).toEqual(Object.keys(r).sort())
      for (const k of Object.keys(r)) expect(placeholders(e[k]), `${mod}.${k}`).toEqual(placeholders(r[k]))
    }
  })

  it('every module has the same keys and placeholders in Hungarian as in Romanian', () => {
    expect(Object.keys(hu).sort()).toEqual(Object.keys(ro).sort())
    for (const mod of Object.keys(ro)) {
      const r = flat(ro[mod]), h = flat(hu[mod])
      expect(Object.keys(h).sort(), mod).toEqual(Object.keys(r).sort())
      for (const k of Object.keys(r)) expect(placeholders(h[k]), `${mod}.${k}`).toEqual(placeholders(r[k]))
    }
  })

  it('Hungarian is a real translation, not a copy of Romanian or English', () => {
    for (const mod of Object.keys(ro)) {
      const r = flat(ro[mod]), e = flat(en[mod]), h = flat(hu[mod])
      const keys = Object.keys(r).filter((k) => /[a-zA-ZăâîșțĂÂÎȘȚ]{4,}/.test(r[k]))
      if (keys.length < 5) continue
      const same = keys.filter((k) => h[k] === r[k] || h[k] === e[k])
      // nume proprii, mărci și câteva cuvinte internaționale (Chat, Sport, Park, Google Maps…) pot rămâne la fel
      expect(same.length / keys.length, `${mod}: ${same.slice(0, 5).join(', ')}`).toBeLessThan(0.2)
    }
  })

  it('the modules used by the panels and the app are actually translated (not copies of Romanian)', () => {
    for (const mod of ['business', 'offers', 'events', 'community', 'tickets', 'nav']) {
      const r = flat(ro[mod]), e = flat(en[mod])
      const keys = Object.keys(r).filter((k) => /[a-zA-ZăâîșțĂÂÎȘȚ]{3,}/.test(r[k]))
      const same = keys.filter((k) => e[k] === r[k])
      // câteva cuvinte sunt la fel în ambele limbi (Restaurant, Sport, Total, Calendar…)
      expect(same.length / keys.length, `${mod}: ${same.slice(0, 5).join(', ')}`).toBeLessThan(0.1)
    }
  })

  it('every message compiles (an unescaped @ or | breaks vue-i18n at runtime: write {\'@\'})', () => {
    for (const [lang, msgs] of [['ro', ro], ['en', en], ['hu', hu]] as const) {
      const i18n = createI18n({ legacy: false, locale: lang, messages: { [lang]: msgs }, missingWarn: false, fallbackWarn: false })
      for (const mod of Object.keys(msgs)) {
        for (const k of Object.keys(flat(msgs[mod]))) expect(() => i18n.global.t(`${mod}.${k}`), `${lang} ${mod}.${k}`).not.toThrow()
      }
    }
  })
})
