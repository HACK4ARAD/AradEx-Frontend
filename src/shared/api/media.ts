import { client } from './client'
import type { MediaDto, MediaImportDto } from '@/shared/types/media'

/** MediaApi din BE (docs/API.md §Poze): încărcare (Primărie, Admin), copierea pozelor externe în S3. Citirea e un URL public. */
export const mediaApi = {
  upload: (file: File | Blob, name = 'poza') => {
    const form = new FormData()
    form.append('file', file, file instanceof File ? file.name : name)
    return client.post<MediaDto>('/city/media', form)
  },
  importPlaces: (limit = 15) => client.post<MediaImportDto>('/city/media/import-places', undefined, { query: { limit } }),
}

/** O poză e „externă” dacă e pe alt site (nu e servită de noi din `/media/`); acestea se pot copia în S3. */
export const isExternalImage = (url?: string | null) => !!url && /^https?:\/\//.test(url) && !url.includes('/api/v1/media/')
