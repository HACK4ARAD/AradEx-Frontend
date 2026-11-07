import { describe, expect, it } from 'vitest'
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

describe('i18n RO/EN', () => {
  const ro = loadMessages('ro')
  const en = loadMessages('en')

  it('every module has the same keys and placeholders in English as in Romanian', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ro).sort())
    for (const mod of Object.keys(ro)) {
      const r = flat(ro[mod]), e = flat(en[mod])
      expect(Object.keys(e).sort(), mod).toEqual(Object.keys(r).sort())
      for (const k of Object.keys(r)) expect(placeholders(e[k]), `${mod}.${k}`).toEqual(placeholders(r[k]))
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
})
