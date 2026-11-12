import type { RouteLocationNormalized } from 'vue-router'

/**
 * SEO pentru site (doar build-ul web): titlul, descrierea, `canonical`, `robots` și Open Graph, pe rută. Doar paginile publice
 * de mai jos se indexează (sunt pre-generate ca HTML la build, `scripts/prerender.mjs`, care scrie și `sitemap.xml`; `public/sitemap.xml`
 * rămâne doar ca rezervă când pre-generarea nu rulează);
 * login-ul, panourile și contul primesc `noindex`. Numele apare și cu spațiu („Arad Experience”), cum îl caută oamenii.
 * Paginile publice ale evenimentelor și obiectivelor (/evenimente, /obiective + detaliile) se indexează și ele: listele au
 * titlul de aici, detaliile își pun titlul, descrierea, canonical-ul, poza și JSON-LD după ce se încarcă (`setPageSeo`).
 */
export const SITE = 'https://aradexperience.site'

export const SEO_PAGES: Record<string, { path: string; title: string; description: string }> = {
  'w-landing': {
    path: '/',
    title: 'Arad Experience · evenimente, bilete, ghid audio și transport în Arad',
    description: 'AradExperience (Arad Experience) e aplicația orașului Arad: evenimente și bilete, ghid audio la obiective, transport în comun live, oferte locale și o comunitate în care faptele bune aduc puncte.',
  },
  'w-community': {
    path: '/community',
    title: 'Comunitate · Arad Experience',
    description: 'Acțiunile comunitare din Arad (plantări, curățenie, donare de sânge) și clasamentul localnicilor care strâng puncte în AradExperience.',
  },
  'w-privacy': {
    path: '/privacy',
    title: 'Confidențialitate · Arad Experience',
    description: 'Ce date folosește AradExperience, de ce și cum le poți controla.',
  },
  'w-terms': {
    path: '/terms',
    title: 'Termeni și condiții · Arad Experience',
    description: 'Regulile de folosire a aplicației AradExperience.',
  },
  'w-pub-events': {
    path: '/evenimente',
    title: 'Evenimente în Arad · Arad Experience',
    description: 'Ce e de făcut în Arad: concerte, teatru, expoziții, târguri și evenimente pentru familie, cu data, locul și prețul fiecăruia.',
  },
  'w-pub-sights': {
    path: '/obiective',
    title: 'Obiective turistice în Arad · Arad Experience',
    description: 'Obiective turistice din Arad: Cetatea Aradului, Palatul Cultural, muzee, parcuri și locuri în natură, multe cu ghid audio în aplicație.',
  },
}

/** Detaliile publice (un eveniment, un obiectiv): se indexează, dar titlul, descrierea și restul le pune pagina după încărcare. */
export const SEO_DETAIL_ROUTES = ['w-pub-event', 'w-pub-sight']

const DEFAULT_IMAGE = `${SITE}/og-image.png`

function meta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function canonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!href) { el?.remove(); return }
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

/** JSON-LD-ul paginii (`script[data-seo]`), înlocuit la fiecare navigare; `null` îl scoate. Cel din index.html (site-ul) rămâne. */
export function setJsonLd(data: object | null) {
  document.head.querySelectorAll('script[type="application/ld+json"][data-seo]').forEach((el) => el.remove())
  if (!data) return
  const el = document.createElement('script')
  el.type = 'application/ld+json'
  el.setAttribute('data-seo', '')
  el.textContent = JSON.stringify(data).replace(/</g, '\\u003c')
  document.head.appendChild(el)
}

/** Titlul, descrierea, canonical-ul, Open Graph (cu poza) și, opțional, JSON-LD ale unei pagini publice. */
export function setPageSeo(p: { title: string; description: string; path: string; image?: string; jsonLd?: object | null }) {
  const url = SITE + p.path
  document.title = p.title
  meta('name', 'robots', 'index, follow')
  meta('name', 'description', p.description)
  meta('property', 'og:title', p.title)
  meta('property', 'og:description', p.description)
  meta('property', 'og:url', url)
  meta('property', 'og:image', p.image ?? DEFAULT_IMAGE)
  meta('name', 'twitter:title', p.title)
  meta('name', 'twitter:description', p.description)
  meta('name', 'twitter:image', p.image ?? DEFAULT_IMAGE)
  canonical(url)
  if (p.jsonLd !== undefined) setJsonLd(p.jsonLd)
}

/** O pagină care nu trebuie indexată (de ex. evenimentul nu există sau e un eveniment demo). */
export function setNoindex() {
  meta('name', 'robots', 'noindex')
  canonical(null)
  setJsonLd(null)
}

/** După fiecare navigare: paginile publice își pun titlul și descrierea; detaliile publice așteaptă datele; restul `noindex`. */
export function applySeo(to: Pick<RouteLocationNormalized, 'name'>) {
  setJsonLd(null)
  const name = String(to.name)
  if (SEO_DETAIL_ROUTES.includes(name)) {
    meta('name', 'robots', 'index, follow')
    canonical(null)
    return
  }
  const page = SEO_PAGES[name]
  if (!page) {
    meta('name', 'robots', 'noindex')
    canonical(null)
    return
  }
  setPageSeo({ title: page.title, description: page.description, path: page.path })
}
