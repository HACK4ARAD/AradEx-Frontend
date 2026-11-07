import { client } from './client'
import type { MediaDto } from '@/shared/types/media'

/** MediaApi din BE (docs/API.md §Poze): încărcarea din panou (Primărie, Admin). Pozele de pe alte site-uri le copiază BE-ul singur în S3. */
export const mediaApi = {
  upload: (file: File | Blob, name = 'poza') => {
    const form = new FormData()
    form.append('file', file, file instanceof File ? file.name : name)
    return client.post<MediaDto>('/city/media', form)
  },
}

/** O poză e „externă” dacă e pe alt site (nu e servită de noi din `/media/`); acestea se pot copia în S3. */
export const isExternalImage = (url?: string | null) => !!url && /^https?:\/\//.test(url) && !url.includes('/api/v1/media/')
