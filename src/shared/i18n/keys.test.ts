import { describe, expect, it } from 'vitest'
import { loadMessages } from './index'

// Două greșeli pe care testul de chei identice RO/EN/HU nu le vede (9 nov: eticheta parolei arăta „auth.password”):
// 1 · o cheie scrisă de două ori în același obiect JSON — a doua o înlocuiește pe prima fără nicio eroare;
// 2 · o cheie folosită în cod cu t('…') care nu duce la un text (lipsește sau e un grup de texte).

const rawFiles = import.meta.glob<string>('./*/*.json', { eager: true, query: '?raw', import: 'default' })
const sources = import.meta.glob<string>(['/src/**/*.{vue,ts}', '!/src/**/*.test.ts'], { eager: true, query: '?raw', import: 'default' })

/** Cheile duplicate dintr-un text JSON, cu calea lor (ex. „password”, „errors.code”). */
function duplicateKeys(text: string): string[] {
  const dups: string[] = []
  let i = 0
  const ws = () => { while (/\s/.test(text[i] ?? '')) i++ }
  const str = (): string => {
    let out = ''
    i++ // ghilimeaua de deschidere
    while (text[i] !== '"') {
      if (text[i] === '\\') { out += text[i] + text[i + 1]; i += 2 } else out += text[i++]
    }
    i++
    return out
  }
  const value = (path: string): void => {
    ws()
    const c = text[i]
    if (c === '{') {
      i++
      const seen = new Set<string>()
      ws()
      if (text[i] === '}') { i++; return }
      for (;;) {
        ws()
        const k = str()
        const full = path ? `${path}.${k}` : k
        if (seen.has(k)) dups.push(full)
        seen.add(k)
        ws(); i++ // :
        value(full)
        ws()
        if (text[i++] === '}') return
      }
    } else if (c === '[') {
      i++
      ws()
      if (text[i] === ']') { i++; return }
      for (;;) { value(path); ws(); if (text[i++] === ']') return }
    } else if (c === '"') str()
    else while (i < text.length && !/[,}\]\s]/.test(text[i])) i++
  }
  value('')
  return dups
}

function lookup(tree: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined), tree)
}

describe('i18n: keys that resolve to a text', () => {
  it('no JSON text file repeats a key in the same object', () => {
    const found = Object.entries(rawFiles).flatMap(([path, text]) => duplicateKeys(text).map((k) => `${path}: ${k}`))
    expect(found).toEqual([])
  })

  it("every literal t('…') key used in the code is a text in Romanian, English and Hungarian", () => {
    const keys = new Set<string>()
    for (const text of Object.values(sources)) {
      for (const m of text.matchAll(/\bt\(\s*['"]([a-z][\w-]*(?:\.[\w-]+)+)['"]/g)) keys.add(m[1])
    }
    expect(keys.size).toBeGreaterThan(100) // regex-ul chiar găsește cheile
    const missing: string[] = []
    for (const locale of ['ro', 'en', 'hu'] as const) {
      const messages = loadMessages(locale)
      for (const key of keys) if (typeof lookup(messages, key) !== 'string') missing.push(`${locale}: ${key}`)
    }
    expect(missing).toEqual([])
  })

  it('the duplicate-key check catches a repeated key (the 9 Nov bug)', () => {
    expect(duplicateKeys('{ "password": "Parola", "x": { "a": 1 }, "password": { "title": "T" } }')).toEqual(['password'])
    expect(duplicateKeys('{ "a": { "b": 1, "c": [1, { "d": 2, "d": 3 }] } }')).toEqual(['a.c.d'])
  })
})
