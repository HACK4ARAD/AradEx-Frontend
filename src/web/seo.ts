import type { RouteLocationNormalized } from 'vue-router'

/**
 * SEO pentru site (doar build-ul web): titlul, descrierea, `canonical`, `robots` și Open Graph, pe rută. Doar paginile publice
 * de mai jos se indexează (sunt și în `public/sitemap.xml` și sunt pre-generate ca HTML la build, `scripts/prerender.mjs`);
 * login-ul, panourile și contul primesc `noindex`. Numele apare și cu spațiu („Arad Experience”), cum îl caută oamenii.
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
}

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

/** După fiecare navigare: paginile publice își pun titlul și descrierea; restul nu se indexează. */
export function applySeo(to: Pick<RouteLocationNormalized, 'name'>) {
  const page = SEO_PAGES[String(to.name)]
  if (!page) {
    meta('name', 'robots', 'noindex')
    canonical(null)
    return
  }
  const url = SITE + page.path
  document.title = page.title
  meta('name', 'robots', 'index, follow')
  meta('name', 'description', page.description)
  meta('property', 'og:title', page.title)
  meta('property', 'og:description', page.description)
  meta('property', 'og:url', url)
  meta('name', 'twitter:title', page.title)
  meta('name', 'twitter:description', page.description)
  canonical(url)
}
