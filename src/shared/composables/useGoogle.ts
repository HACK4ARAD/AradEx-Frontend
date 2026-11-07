import { ref, watch, type Ref } from 'vue'
import { googleApi } from '@/shared/api/google'
import { i18n } from '@/shared/i18n'
import { intlLocale } from '@/shared/composables/useFormat'
import type { GoogleInfoDto } from '@/shared/types/google'

/** Un Place ID Google: doar litere, cifre, `_` și `-` (aceeași regulă ca în BE, `GooglePlaceIdRequest`). */
export const GOOGLE_PLACE_ID = /^[A-Za-z0-9_-]*$/
/** Pagina Google care explică unde se găsește Place ID-ul unui loc. */
export const PLACE_ID_FINDER = 'https://developers.google.com/maps/documentation/places/web-service/place-id'

/** „4,6” / „4.6” după limbă. */
export function formatRating(r?: number): string {
  return r == null ? '' : new Intl.NumberFormat(intlLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(r)
}

/** „1.240” / „1,240” după limbă. */
export function formatCount(n?: number): string {
  return n == null ? '' : new Intl.NumberFormat(intlLocale()).format(n)
}

type Translate = (key: string, named?: Record<string, unknown>) => string

/**
 * „o părere”, „12 păreri”, „631 de păreri”: în română, de la 20 în sus (și la 100, 1.000 …) se pune „de”
 * (regula: n ≥ 20 și ultimele două cifre 00 sau ≥ 20). În engleză „one rating” / „631 ratings”.
 */
export function ratingsText(t: Translate, n?: number): string {
  const count = n ?? 0
  const key = count === 0 ? 'zero' : count === 1 ? 'one' : count >= 20 && (count % 100 === 0 || count % 100 >= 20) ? 'many' : 'few'
  return t(`google.ratings.${key}`, { n: formatCount(count) })
}

/** Stelele pline pentru un rating (rotunjit la cea mai apropiată stea), ca listă de 5 valori. */
export function starsOf(rating = 0): boolean[] {
  const full = Math.round(Math.max(0, Math.min(5, rating)))
  return [1, 2, 3, 4, 5].map((i) => i <= full)
}

/**
 * Ratingul și recenziile Google ale unui obiectiv / unei firme, în limba aplicației. Orice eroare (404 = nu e pe Google /
 * nelegat / fără cheie, 503 = Google nu răspunde) lasă `info` gol: blocul e ajutător și doar dispare, fără toast.
 */
export function useGoogleInfo(kind: 'place' | 'business', id: Ref<number | null | undefined>) {
  const info = ref<GoogleInfoDto | null>(null)
  const loading = ref(false)
  let seq = 0

  async function load() {
    const target = id.value
    const mine = ++seq
    info.value = null
    if (!target || !Number.isFinite(target)) return
    loading.value = true
    try {
      const locale = String(i18n.global.locale.value)
      const res = kind === 'place' ? await googleApi.place(target, locale) : await googleApi.business(target, locale)
      if (mine === seq) info.value = res
    } catch {
      if (mine === seq) info.value = null
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  watch([id, () => i18n.global.locale.value], load, { immediate: true })
  return { info, loading, reload: load }
}
