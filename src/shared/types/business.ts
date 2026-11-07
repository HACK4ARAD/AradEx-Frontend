// Firme · T09. Oglinda DTO-urilor din docs/API.md; se schimbă în același PR cu secțiunea din API.md.

export type BusinessCategory = 'CAFE' | 'RESTAURANT' | 'PRODUCER' | 'WINERY' | 'SHOP' | 'OTHER'

export interface BusinessSummary { id: number; name: string; category: string; verified: boolean; imageUrl?: string }

// T09: BusinessDto (pagina publică), BusinessMeDto + stats, AnnouncementDto, ActivityDto …
