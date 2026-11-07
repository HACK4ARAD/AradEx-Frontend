// T17 · docs/API.md §Google — ratingul și recenziile Google (Places API New), prin backend. Câmpurile lipsă nu vin în JSON.

export interface GoogleReviewDto {
  author: string
  /** Profilul autorului pe Google (atribuirea cerută de Google: numele, cu link când există). */
  authorUrl?: string
  authorPhotoUrl?: string
  rating: number
  text: string
  /** Textul Google, deja în limba cerută („acum o lună”). */
  relativeTime?: string
}

export interface GoogleInfoDto {
  rating?: number
  userRatingCount?: number
  reviews: GoogleReviewDto[]
  mapsUrl: string
  attribution: 'Powered by Google'
}

/** Panouri (Primărie, firmă): legătura cu Google; `info` lipsește dacă nu e legat, nu e cheie sau e o problemă (`problem`). */
export interface GoogleLinkDto {
  googlePlaceId?: string
  configured: boolean
  info?: GoogleInfoDto
  /** De ce lipsește `info` deși e legat: Google nu cunoaște ID-ul sau nu răspunde acum. */
  problem?: 'INVALID_ID' | 'UNAVAILABLE'
}

export interface GooglePlaceIdRequest { googlePlaceId: string | null }
