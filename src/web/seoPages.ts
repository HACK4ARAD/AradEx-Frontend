// SEO pentru paginile publice ale evenimentelor și obiectivelor (/evenimente, /obiective): slug-uri, adrese canonice,
// rezumatul pentru descriere și JSON-LD (schema.org) pentru Google. Funcții pure (testate în seoPages.test.ts); punerea
// lor în <head> e în seo.ts (`setPageSeo`, `setJsonLd`).
import { SITE } from '@/web/seo'
import type { EventDto } from '@/shared/types/events'
import type { PlaceDto, PlaceType } from '@/shared/types/places'

/** „Cetatea Aradului — Bastionul Sf. Ștefan” → „cetatea-aradului-bastionul-sf-stefan” (fără diacritice, max. ~80 de caractere). */
export function slugify(text: string): string {
  const s = (text ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (s.length <= 80) return s
  const cut = s.slice(0, 80)
  return (cut.includes('-') ? cut.slice(0, cut.lastIndexOf('-')) : cut).replace(/-+$/, '')
}

export const eventPath = (e: { id: number; title: string }) => `/evenimente/${e.id}/${slugify(e.title)}`
export const placePath = (p: { id: number; name: string }) => `/obiective/${p.id}/${slugify(p.name)}`

/** Pozele din API sunt deseori relative (`/img/...`): pentru Open Graph și JSON-LD trebuie adresa completă. */
export function absoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return url.startsWith('/') ? SITE + url : `${SITE}/${url}`
}

/** Primele ~`max` caractere dintr-un text (pe un singur rând), tăiate la un cuvânt, cu „…” dacă a fost tăiat. */
export function excerpt(text: string | undefined, max = 155): string {
  const s = (text ?? '').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  return (cut.includes(' ') ? cut.slice(0, cut.lastIndexOf(' ')) : cut).replace(/[\s,.;:–-]+$/, '') + '…'
}

export type JsonLd = Record<string, unknown>

const address = (street?: string): JsonLd => ({
  '@type': 'PostalAddress', ...(street ? { streetAddress: street } : {}), addressLocality: 'Arad', addressRegion: 'Arad', addressCountry: 'RO',
})
const geo = (lat: number, lng: number): JsonLd => ({ '@type': 'GeoCoordinates', latitude: lat, longitude: lng })

/** Un eveniment → `Event` (schema.org): loc, adresă, coordonate, poză, organizator și prețul (RON) sau „intrare liberă”. */
export function eventJsonLd(e: EventDto): JsonLd {
  const url = SITE + eventPath(e)
  const price = e.priceAdult ?? e.priceFrom
  const image = absoluteUrl(e.imageUrl)
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    url,
    startDate: e.startAt,
    ...(e.endAt ? { endDate: e.endAt } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: e.locationName, address: address(e.address), geo: geo(e.lat, e.lng) },
    ...(image ? { image: [image] } : {}),
    description: excerpt(e.description, 500),
    organizer: { '@type': 'Organization', name: e.organizerName },
    ...(e.ticketType === 'FREE'
      ? { isAccessibleForFree: true }
      : price != null
        ? { offers: { '@type': 'Offer', price: price.toFixed(2), priceCurrency: 'RON', availability: 'https://schema.org/InStock', url: e.externalUrl ?? url } }
        : {}),
  }
}

const PLACE_SCHEMA: Partial<Record<PlaceType, string>> = { MUSEUM: 'Museum', PARK: 'Park' }

/** Un obiectiv → `TouristAttraction` (sau `Museum` / `Park`), cu adresă, coordonate, poză și descriere. */
export function placeJsonLd(p: PlaceDto): JsonLd {
  const image = absoluteUrl(p.imageUrl)
  return {
    '@context': 'https://schema.org',
    '@type': PLACE_SCHEMA[p.type] ?? 'TouristAttraction',
    name: p.name,
    url: SITE + placePath(p),
    description: excerpt(p.description, 500),
    address: address(p.address),
    geo: geo(p.lat, p.lng),
    ...(image ? { image } : {}),
    isAccessibleForFree: p.type === 'PARK' || p.type === 'NATURE' || p.exteriorOnly || undefined,
  }
}

/** O listă (paginile /evenimente, /obiective) → `ItemList` cu adresele canonice ale elementelor. */
export function itemListJsonLd(name: string, items: { path: string; name: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + x.path, name: x.name })),
  }
}
