import { describe, expect, it } from 'vitest'
import {
  emptyGuidePointForm, emptyPlaceForm, guidePointFormToRequest, parseCoords, placeFormToRequest, placeToForm,
} from './usePlaceForm'
import type { PlaceDto } from '@/shared/types/places'

const cetatea: PlaceDto = {
  id: 1, name: 'Cetatea Aradului', type: 'ATTRACTION', lat: 46.1711, lng: 21.3319, visitMinutes: 60, tags: ['istorie', 'familie'],
  guidePointsCount: 0, guideMinutes: 0, exteriorOnly: true, slug: 'cetatea-aradului', description: 'Fortificație Vauban.', guidePoints: [],
}

describe('usePlaceForm', () => {
  it('parses coordinates with dot or comma decimals', () => {
    expect(parseCoords('46.1711, 21.3319')).toEqual([46.1711, 21.3319])
    expect(parseCoords('46,1711; 21,3319')).toEqual([46.1711, 21.3319])
    expect(parseCoords('46.17 21.33')).toEqual([46.17, 21.33])
    expect(parseCoords('100, 21')).toBeNull()
    expect(parseCoords('Arad')).toBeNull()
  })

  it('round-trips a place through the form', () => {
    const { request, errors } = placeFormToRequest(placeToForm(cetatea))
    expect(errors).toEqual({})
    expect(request).toMatchObject({ name: 'Cetatea Aradului', slug: 'cetatea-aradului', lat: 46.1711, lng: 21.3319, visitMinutes: 60,
      tags: ['istorie', 'familie'], exteriorOnly: true })
    expect(request?.rating).toBeUndefined()
  })

  it('flags the fields the backend would reject', () => {
    const f = { ...emptyPlaceForm(), slug: 'Cu Spatii', coords: 'x', visitMinutes: '2', rating: '7' }
    const { request, errors } = placeFormToRequest(f)
    expect(request).toBeUndefined()
    expect(errors).toEqual({ name: 'required', description: 'required', slug: 'slug', coords: 'coords', visitMinutes: 'minutes', rating: 'rating' })
  })

  it('normalizes tags (lower case, no duplicates) and empty optionals', () => {
    const f = { ...emptyPlaceForm(), name: ' Muzeu ', description: 'd', coords: '46.18, 21.31', tags: 'Muzee, istorie, muzee,', address: '  ' }
    const { request } = placeFormToRequest(f)
    expect(request?.tags).toEqual(['muzee', 'istorie'])
    expect(request?.name).toBe('Muzeu')
    expect(request?.address).toBeUndefined()
  })

  it('guide point: needs title + text, duration and coordinates are optional', () => {
    expect(guidePointFormToRequest(emptyGuidePointForm()).errors).toEqual({ title: 'required', text: 'required' })
    const ok = guidePointFormToRequest({ title: 'Intrarea', text: 'Bun venit.', durationSec: '', coords: '' }, 2)
    expect(ok.request).toEqual({ position: 2, title: 'Intrarea', text: 'Bun venit.', durationSec: undefined, lat: undefined, lng: undefined })
    expect(guidePointFormToRequest({ title: 'a', text: 'b', durationSec: '3', coords: 'nu' }).errors).toEqual({ durationSec: 'duration', coords: 'coords' })
  })
})
