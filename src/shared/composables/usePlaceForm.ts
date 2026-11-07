import type { GuidePointDto, GuidePointRequest, PlaceDto, PlaceRequest, PlaceType } from '@/shared/types/places'

/**
 * Formularele din „Obiective & ghiduri” (W25): câmpurile ca text (cum le scrie omul) ↔ cererile din API.
 * Erorile sunt chei i18n (`places.form.errors.*`), pe câmp. Limitele = cele din PlaceRequest / GuidePointRequest (BE).
 */
export interface PlaceForm {
  name: string; slug: string; type: PlaceType; description: string; address: string
  coords: string; imageUrl: string; imageCredit: string; openingHours: string; visitMinutes: string
  tags: string; rating: string; parkingHint: string; exteriorOnly: boolean
}
export interface GuidePointForm { title: string; text: string; durationSec: string; coords: string }
export type FormErrors = Partial<Record<string, string>>

export function emptyPlaceForm(): PlaceForm {
  return { name: '', slug: '', type: 'ATTRACTION', description: '', address: '', coords: '', imageUrl: '', imageCredit: '',
    openingHours: '', visitMinutes: '60', tags: '', rating: '', parkingHint: '', exteriorOnly: false }
}

export function placeToForm(p: PlaceDto): PlaceForm {
  return {
    name: p.name, slug: p.slug, type: p.type, description: p.description, address: p.address ?? '',
    coords: `${p.lat}, ${p.lng}`, imageUrl: p.imageUrl ?? '', imageCredit: p.imageCredit ?? '', openingHours: p.openingHours ?? '',
    visitMinutes: String(p.visitMinutes), tags: p.tags.join(', '), rating: p.rating != null ? String(p.rating) : '',
    parkingHint: p.parkingHint ?? '', exteriorOnly: p.exteriorOnly,
  }
}

/** „46.1711, 21.3319” (sau cu spațiu / punct și virgulă) → [lat, lng]; null dacă nu e valid. */
export function parseCoords(s: string): [number, number] | null {
  const m = s.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)$/)
  if (!m) return null
  const lat = Number(m[1].replace(',', '.')), lng = Number(m[2].replace(',', '.'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return [lat, lng]
}

const opt = (s: string) => (s.trim() ? s.trim() : undefined)
const num = (s: string) => Number(s.trim().replace(',', '.'))

export function placeFormToRequest(f: PlaceForm): { request?: PlaceRequest; errors: FormErrors } {
  const errors: FormErrors = {}
  if (!f.name.trim()) errors.name = 'required'
  else if (f.name.trim().length > 160) errors.name = 'tooLong'
  if (!f.description.trim()) errors.description = 'required'
  if (f.slug.trim() && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug.trim())) errors.slug = 'slug'
  const coords = parseCoords(f.coords)
  if (!coords) errors.coords = 'coords'
  const minutes = f.visitMinutes.trim() ? num(f.visitMinutes) : 60
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 600) errors.visitMinutes = 'minutes'
  const rating = f.rating.trim() ? num(f.rating) : undefined
  if (rating !== undefined && (!Number.isFinite(rating) || rating < 0 || rating > 5)) errors.rating = 'rating'
  const tags = f.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
  if (tags.length > 12 || tags.some((t) => t.length > 30)) errors.tags = 'tags'
  if (Object.keys(errors).length) return { errors }
  return {
    errors,
    request: {
      name: f.name.trim(), slug: opt(f.slug), type: f.type, description: f.description.trim(), address: opt(f.address),
      lat: coords![0], lng: coords![1], imageUrl: opt(f.imageUrl), imageCredit: opt(f.imageCredit), openingHours: opt(f.openingHours),
      visitMinutes: minutes, tags: [...new Set(tags)], rating, parkingHint: opt(f.parkingHint), exteriorOnly: f.exteriorOnly,
    },
  }
}

export function emptyGuidePointForm(): GuidePointForm {
  return { title: '', text: '', durationSec: '', coords: '' }
}

export function guidePointToForm(g: GuidePointDto): GuidePointForm {
  return { title: g.title, text: g.text, durationSec: g.durationSec ? String(g.durationSec) : '',
    coords: g.lat != null && g.lng != null ? `${g.lat}, ${g.lng}` : '' }
}

/** `position` se trimite separat (mutare sus/jos); fără durată, BE o estimează din text. */
export function guidePointFormToRequest(f: GuidePointForm, position?: number): { request?: GuidePointRequest; errors: FormErrors } {
  const errors: FormErrors = {}
  if (!f.title.trim()) errors.title = 'required'
  else if (f.title.trim().length > 160) errors.title = 'tooLong'
  if (!f.text.trim()) errors.text = 'required'
  else if (f.text.trim().length > 4000) errors.text = 'tooLong'
  const duration = f.durationSec.trim() ? num(f.durationSec) : undefined
  if (duration !== undefined && (!Number.isInteger(duration) || duration < 5 || duration > 1800)) errors.durationSec = 'duration'
  const coords = f.coords.trim() ? parseCoords(f.coords) : undefined
  if (coords === null) errors.coords = 'coords'
  if (Object.keys(errors).length) return { errors }
  return {
    errors,
    request: { position, title: f.title.trim(), text: f.text.trim(), durationSec: duration, lat: coords?.[0], lng: coords?.[1] },
  }
}

/** Păstrează câmpurile din punctul existent pe care formularul nu le arată (poză, audio) la o modificare. */
export function guidePointRequestFrom(g: GuidePointDto, position = g.position): GuidePointRequest {
  return { position, title: g.title, text: g.text, imageUrl: g.imageUrl, audioUrl: g.audioUrl, lat: g.lat, lng: g.lng, durationSec: g.durationSec }
}
