import { client } from './client'
import type { GoogleInfoDto, GoogleLinkDto } from '@/shared/types/google'

/**
 * GoogleApi din BE (docs/API.md §Google, T17). Cheia Google stă doar în backend. Rutele publice merg fără token
 * (`auth: false`): un token expirat nu trebuie să delogheze pe cineva din cauza unui bloc auxiliar.
 * 404 = nu e pe Google / nelegat / fără cheie, 503 = Google nu răspunde acum → blocul se ascunde.
 */
const pub = { auth: false } as const
const lang = (locale: string) => (locale.startsWith('en') ? 'en' : 'ro')

export const googleApi = {
  place: (id: number, locale = 'ro') => client.get<GoogleInfoDto>(`/places/${id}/google`, { ...pub, query: { lang: lang(locale) } }),
  business: (id: number, locale = 'ro') => client.get<GoogleInfoDto>(`/businesses/${id}/google`, { ...pub, query: { lang: lang(locale) } }),
  /** Primăria: legătura unui obiectiv cu Google. */
  placeLink: (id: number) => client.get<GoogleLinkDto>(`/city/places/${id}/google`),
  setPlaceLink: (id: number, googlePlaceId: string | null) => client.put<GoogleLinkDto>(`/city/places/${id}/google`, { googlePlaceId }),
  /** Firma: legătura firmei mele cu Google. */
  myLink: () => client.get<GoogleLinkDto>('/business/me/google'),
  setMyLink: (googlePlaceId: string | null) => client.put<GoogleLinkDto>('/business/me/google', { googlePlaceId }),
}
