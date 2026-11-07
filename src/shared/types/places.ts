// Locuri & ghid virtual · T05. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export type PlaceType = 'ATTRACTION' | 'MUSEUM' | 'VENUE' | 'WINERY' | 'NATURE' | 'PARK' | 'RESTAURANT' | 'CAFE'

/** `distanceKm` doar când cererea are `near`; `guidePointsCount` + `guideMinutes` = „Ghid · N puncte · M min”; `exteriorOnly` = „doar exterior”. */
export interface PlaceSummary {
  id: number; name: string; type: PlaceType; imageUrl?: string; lat: number; lng: number
  visitMinutes: number; tags: string[]; distanceKm?: number; guidePointsCount: number; guideMinutes: number; exteriorOnly: boolean
}
export interface GuidePointDto {
  id: number; position: number; title: string; text: string; imageUrl?: string; audioUrl?: string
  lat?: number; lng?: number; durationSec?: number
}
export interface PlaceDto extends PlaceSummary {
  slug: string; description: string; address?: string; openingHours?: string; rating?: number
  parkingHint?: string; imageCredit?: string; guidePoints: GuidePointDto[]
}

/** GET /places — `near` = "lat,lng", `tags` = csv (potrivire pe oricare). */
export interface PlaceQuery { type?: PlaceType; q?: string; near?: string; tags?: string }

/** POST / PUT /city/places — PlaceDto fără id, câmpuri calculate și guidePoints. `slug` lipsă = generat din nume. */
export interface PlaceRequest {
  name: string; slug?: string; type: PlaceType; description: string; address?: string; lat: number; lng: number
  imageUrl?: string; imageCredit?: string; openingHours?: string; visitMinutes?: number; tags?: string[]
  rating?: number; parkingHint?: string; exteriorOnly: boolean
}

/** POST / PUT /city/places/{id}/guide-points — `position` lipsă = la final; la PUT, o poziție ocupată face schimb. */
export interface GuidePointRequest {
  position?: number; title: string; text: string; imageUrl?: string; audioUrl?: string
  lat?: number; lng?: number; durationSec?: number
}
