// Locuri & ghid virtual · T05. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export interface PlaceSummary {
  id: number; name: string; type: string; imageUrl?: string; lat: number; lng: number
  visitMinutes: number; tags: string[]; distanceKm?: number
}
export interface GuidePointDto {
  id: number; position: number; title: string; text: string; imageUrl?: string; audioUrl?: string
  lat?: number; lng?: number; durationSec?: number
}
export interface PlaceDto extends PlaceSummary {
  slug: string; description: string; address: string; openingHours?: string; rating?: number
  parkingHint?: string; imageCredit?: string; exteriorOnly: boolean; guidePoints: GuidePointDto[]
}
