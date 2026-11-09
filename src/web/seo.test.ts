import { beforeEach, describe, expect, it } from 'vitest'
import { SEO_PAGES, SITE, applySeo } from './seo'

const head = (sel: string) => document.head.querySelector(sel)

describe('applySeo', () => {
  beforeEach(() => { document.head.innerHTML = ''; document.title = '' })

  it('a public page gets its title, description, canonical and Open Graph, with "Arad Experience" in the title', () => {
    applySeo({ name: 'w-community' })

    expect(document.title).toBe(SEO_PAGES['w-community'].title)
    expect(document.title).toContain('Arad Experience')
    expect(head('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow')
    expect(head('meta[name="description"]')?.getAttribute('content')).toBe(SEO_PAGES['w-community'].description)
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE}/community`)
    expect(head('meta[property="og:url"]')?.getAttribute('content')).toBe(`${SITE}/community`)
  })

  it('login, panels and the account are noindex and lose the canonical; tags are reused, not duplicated', () => {
    applySeo({ name: 'w-landing' })
    applySeo({ name: 'w-landing' })
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)

    applySeo({ name: 'w-login' })
    expect(head('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
    expect(head('link[rel="canonical"]')).toBeNull()
  })

  it('every page in the sitemap is a public SEO page', async () => {
    const { readFileSync } = await import('node:fs')
    const sitemap = readFileSync('public/sitemap.xml', 'utf8')
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort()
    expect(locs).toEqual(Object.values(SEO_PAGES).map((p) => SITE + p.path).sort())
  })
})
