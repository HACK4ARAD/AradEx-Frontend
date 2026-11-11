import { describe, expect, it } from 'vitest'
import type { EventDto } from '@/shared/types/events'
import type { PlaceDto } from '@/shared/types/places'
import { absoluteUrl, eventJsonLd, eventPath, excerpt, itemListJsonLd, placeJsonLd, placePath, slugify } from './seoPages'

const event = (patch: Partial<EventDto> = {}): EventDto => ({
  id: 2, title: 'Concert simfonic – „Toamna Muzicală”', category: 'CONCERT', startAt: '2026-11-12T17:00:00Z', endAt: '2026-11-12T19:00:00Z',
  locationName: 'Sala Palatului Cultural', lat: 46.1742, lng: 21.3207, imageUrl: '/img/loc-pc.jpg', ticketType: 'EXTERNAL', priceFrom: 40,
  isHot: true, isDemo: false, participantsCount: 120, organizerName: 'Filarmonica Arad', organizerType: 'EXTERNAL', ratingCount: 0,
  description: 'Lucrări de Max Bruch și Antonín Dvořák.', address: 'Piața George Enescu 1, Arad', savesCount: 19, status: 'PUBLISHED',
  externalUrl: 'https://www.filarmonicaarad.ro/', ...patch,
})
const place = (patch: Partial<PlaceDto> = {}): PlaceDto => ({
  id: 1, name: 'Cetatea Aradului', type: 'ATTRACTION', imageUrl: '/img/loc-ca.jpg', lat: 46.1709, lng: 21.3326, visitMinutes: 60, tags: [],
  guidePointsCount: 5, guideMinutes: 11, exteriorOnly: true, slug: 'cetatea-aradului', description: 'Fortificație în stil Vauban.',
  address: 'Cartier Subcetate, Arad', guidePoints: [], ...patch,
})

describe('slugify', () => {
  it('strips diacritics, punctuation and dashes', () => {
    expect(slugify('Cetatea Aradului — Bastionul Sf. Ștefan')).toBe('cetatea-aradului-bastionul-sf-stefan')
    expect(slugify('Concert simfonic – „Toamna Muzicală”')).toBe('concert-simfonic-toamna-muzicala')
    expect(slugify('  Țară, Înger, Ăla!  ')).toBe('tara-inger-ala')
    expect(slugify('')).toBe('')
  })
  it('keeps long titles under ~80 characters, cut at a word', () => {
    const s = slugify('Un titlu foarte lung '.repeat(10))
    expect(s.length).toBeLessThanOrEqual(80)
    expect(s.endsWith('-')).toBe(false)
  })
  it('builds the canonical paths', () => {
    expect(eventPath({ id: 2, title: 'Târg de Crăciun' })).toBe('/evenimente/2/targ-de-craciun')
    expect(placePath({ id: 1, name: 'Cetatea Aradului' })).toBe('/obiective/1/cetatea-aradului')
  })
})

describe('helpers', () => {
  it('makes API image paths absolute', () => {
    expect(absoluteUrl('/img/loc-ca.jpg')).toBe('https://aradexperience.site/img/loc-ca.jpg')
    expect(absoluteUrl('https://cdn.example.org/a.jpg')).toBe('https://cdn.example.org/a.jpg')
    expect(absoluteUrl(undefined)).toBeUndefined()
  })
  it('cuts the description at a word, around 155 characters', () => {
    const long = 'Cuvânt '.repeat(60)
    const e = excerpt(long)
    expect(e.length).toBeLessThanOrEqual(156)
    expect(e.endsWith('…')).toBe(true)
    expect(excerpt('Scurt.')).toBe('Scurt.')
  })
})

describe('JSON-LD', () => {
  it('a paid event is an Event with place, address, geo, absolute image, organizer and a RON offer', () => {
    const j = eventJsonLd(event())
    expect(j).toMatchObject({
      '@type': 'Event',
      url: 'https://aradexperience.site/evenimente/2/concert-simfonic-toamna-muzicala',
      startDate: '2026-11-12T17:00:00Z',
      endDate: '2026-11-12T19:00:00Z',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place', name: 'Sala Palatului Cultural',
        address: { '@type': 'PostalAddress', streetAddress: 'Piața George Enescu 1, Arad', addressLocality: 'Arad', addressCountry: 'RO' },
        geo: { '@type': 'GeoCoordinates', latitude: 46.1742, longitude: 21.3207 },
      },
      image: ['https://aradexperience.site/img/loc-pc.jpg'],
      organizer: { '@type': 'Organization', name: 'Filarmonica Arad' },
      offers: { '@type': 'Offer', price: '40.00', priceCurrency: 'RON' },
    })
    expect(j.isAccessibleForFree).toBeUndefined()
  })

  it('a free event says isAccessibleForFree and has no offer', () => {
    const j = eventJsonLd(event({ ticketType: 'FREE', priceFrom: undefined, endAt: undefined }))
    expect(j.isAccessibleForFree).toBe(true)
    expect(j.offers).toBeUndefined()
    expect(j.endDate).toBeUndefined()
  })

  it('a place is a TouristAttraction, a museum a Museum, a park a Park', () => {
    expect(placeJsonLd(place())).toMatchObject({
      '@type': 'TouristAttraction',
      url: 'https://aradexperience.site/obiective/1/cetatea-aradului',
      image: 'https://aradexperience.site/img/loc-ca.jpg',
      address: { streetAddress: 'Cartier Subcetate, Arad', addressLocality: 'Arad', addressCountry: 'RO' },
      geo: { '@type': 'GeoCoordinates', latitude: 46.1709, longitude: 21.3326 },
      description: 'Fortificație în stil Vauban.',
    })
    expect(placeJsonLd(place({ type: 'MUSEUM' }))['@type']).toBe('Museum')
    expect(placeJsonLd(place({ type: 'PARK' }))['@type']).toBe('Park')
  })

  it('a list is an ItemList with absolute URLs and positions', () => {
    const j = itemListJsonLd('Evenimente în Arad', [{ path: '/evenimente/2/x', name: 'X' }, { path: '/evenimente/3/y', name: 'Y' }])
    expect(j['@type']).toBe('ItemList')
    expect(j.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, url: 'https://aradexperience.site/evenimente/2/x', name: 'X' },
      { '@type': 'ListItem', position: 2, url: 'https://aradexperience.site/evenimente/3/y', name: 'Y' },
    ])
  })
})
