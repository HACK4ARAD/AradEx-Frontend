import type { OfferCategory, OfferCreate, OfferDto, OfferSummary } from '@/shared/types/offers'

/** Formularul unei oferte în panoul firmei (T10). Datele sunt zile (YYYY-MM-DD) în ora Aradului; gol = implicit. */
export interface OfferForm {
  title: string
  description: string
  discountLabel: string
  category: OfferCategory | ''   // '' = din tipul firmei
  localProduct: boolean
  validFrom: string
  validUntil: string             // '' = permanentă
  pointsPrice: string            // <input type="number"> poate da și număr la runtime — `num()` le acceptă pe amândouă
  imageUrl: string
  paused: boolean                // DRAFT
}
export type OfferFormErrors = Partial<Record<keyof OfferForm, string>>

export const OFFER_CATEGORIES: OfferCategory[] = ['CAFE', 'RESTAURANT', 'LOCAL', 'EVENT', 'OTHER']

export function emptyOfferForm(today: string): OfferForm {
  return { title: '', description: '', discountLabel: '', category: '', localProduct: false, validFrom: today, validUntil: '', pointsPrice: '', imageUrl: '', paused: false }
}

export function fromOffer(o: OfferDto): OfferForm {
  return {
    title: o.title, description: o.description, discountLabel: o.discountLabel, category: o.category, localProduct: o.localProduct,
    validFrom: o.validFrom, validUntil: o.validUntil ?? '', pointsPrice: o.pointsPrice != null ? String(o.pointsPrice) : '', imageUrl: o.imageUrl ?? '', paused: o.status === 'DRAFT',
  }
}

const num = (v: string | number | null | undefined) => {
  const s = String(v ?? '').trim()
  return s === '' ? undefined : Number(s.replace(',', '.'))
}

/** Valorile sunt chei i18n. */
export function validateOfferForm(f: OfferForm): OfferFormErrors {
  const e: OfferFormErrors = {}
  if (!f.title.trim()) e.title = 'offers.form.required'
  if (!f.description.trim()) e.description = 'offers.form.required'
  if (!f.discountLabel.trim()) e.discountLabel = 'offers.form.required'
  if (f.validUntil && f.validFrom && f.validUntil < f.validFrom) e.validUntil = 'offers.form.untilBeforeFrom'
  const p = num(f.pointsPrice)
  if (p !== undefined && (Number.isNaN(p) || !Number.isInteger(p) || p < 1)) e.pointsPrice = 'offers.form.badNumber'
  return e
}

export function toOfferCreate(f: OfferForm): OfferCreate {
  const req: OfferCreate = {
    title: f.title.trim(), description: f.description.trim(), discountLabel: f.discountLabel.trim(), localProduct: f.localProduct,
    status: f.paused ? 'DRAFT' : 'PUBLISHED',
  }
  if (f.category) req.category = f.category
  if (f.validFrom) req.validFrom = f.validFrom
  if (f.validUntil) req.validUntil = f.validUntil
  const p = num(f.pointsPrice)
  if (p !== undefined) req.pointsPrice = p
  if (f.imageUrl.trim()) req.imageUrl = f.imageUrl.trim()
  return req
}

/** Codul scris de mână: majuscule, fără spații (BE îl normalizează la fel). */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/** Insigna de pe card: ofertă (eticheta), eveniment sau „cu puncte” (doar puncte). */
export function offerBadge(o: Pick<OfferSummary, 'category' | 'discountLabel' | 'pointsPrice'>): { kind: 'offer' | 'event' | 'points'; label: string } {
  if (o.category === 'EVENT') return { kind: 'event', label: o.discountLabel }
  if (o.pointsPrice && /^\d+\s*p$/i.test(o.discountLabel)) return { kind: 'points', label: o.discountLabel }
  return { kind: 'offer', label: o.discountLabel }
}
