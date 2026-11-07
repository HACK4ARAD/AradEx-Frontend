import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { aiApi } from '@/shared/api/ai'
import { itinerariesApi } from '@/shared/api/itineraries'
import { useFormat } from '@/shared/composables/useFormat'
import { useUiStore } from '@/shared/stores/ui'
import type { Transport } from '@/shared/types/common'
import type { ItineraryDto, ItineraryRequest } from '@/shared/types/plan'

/**
 * T13 · E1 planificatorul: formularul (cât timp, când, de la ce oră, cum te deplasezi, interese, „Altceva?”) → cererea
 * POST /ai/itinerary, apoi salvarea imediată (POST /itineraries) ca itinerariul să aibă `id` și link de trimis.
 */
export const TIME_OPTIONS = ['3h', 'half', 'day', '2d'] as const
export type TimeOption = (typeof TIME_OPTIONS)[number]

/** „de la 10:00”: un tap trece la ora următoare din listă. */
export const START_TIMES = ['09:00', '10:00', '11:00', '14:00'] as const

export const TRANSPORTS: { id: Transport; icon: string }[] = [
  { id: 'WALK', icon: 'directions_walk' },
  { id: 'CAR', icon: 'directions_car' },
  { id: 'PUBLIC', icon: 'tram' },
]

/** Interesele trimise serverului (id-uri stabile în engleză; eticheta: `plan.form.interest.<id>`). */
export const INTERESTS = ['history', 'wine', 'museums', 'nature', 'family', 'food', 'art'] as const
export type Interest = (typeof INTERESTS)[number]

export interface PlanForm {
  time: TimeOption
  /** YYYY-MM-DD */
  date: string
  startTime: string
  transport: Transport
  interests: Interest[]
  text: string
}

/** „3 ore” → 3 h, „Jumătate de zi” → 4 h, „O zi” → 8 h, „2 zile” → days 2. */
export function buildRequest(form: PlanForm, locale: string): ItineraryRequest {
  const req: ItineraryRequest = {
    date: form.date,
    startTime: form.startTime,
    transport: form.transport,
    interests: INTERESTS.filter((i) => form.interests.includes(i)),
    locale: locale === 'en' ? 'en' : 'ro',
  }
  if (form.time === '2d') req.days = 2
  else { req.hours = form.time === '3h' ? 3 : form.time === 'half' ? 4 : 8; req.days = 1 }
  const text = form.text.trim()
  if (text) req.freeText = text.slice(0, 500)
  return req
}

/** Ziua următoare: '2026-11-07' → '2026-11-08' (calcul pe calendar, fără fus orar). */
export function nextDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function nextStartTime(current: string): string {
  const i = START_TIMES.indexOf(current as (typeof START_TIMES)[number])
  return START_TIMES[(i + 1) % START_TIMES.length]
}

export function usePlanner() {
  const { locale } = useI18n()
  const ui = useUiStore()
  const f = useFormat()
  const today = f.todayIso()

  const form = reactive<PlanForm>({ time: 'half', date: today, startTime: '10:00', transport: 'WALK', interests: ['history', 'food'], text: '' })
  const generating = ref(false)

  /** Ziua de azi și ziua următoare („Sâm., 7 nov.”). */
  const dayOptions = computed(() => [today, nextDay(today)].map((iso) => ({ iso, label: f.dateTime(`${iso}T12:00:00Z`, false) })))

  function toggleInterest(i: Interest) {
    const k = form.interests.indexOf(i)
    if (k >= 0) form.interests.splice(k, 1)
    else form.interests.push(i)
  }
  function cycleStart() { form.startTime = nextStartTime(form.startTime) }

  /** Generează și salvează; întoarce itinerariul salvat (cu `id`) sau null după o eroare (toast, formularul rămâne). */
  async function generate(): Promise<ItineraryDto | null> {
    if (generating.value) return null
    generating.value = true
    try {
      const draft = await aiApi.itinerary(buildRequest(form, locale.value))
      return await itinerariesApi.save(draft)
    } catch (e) {
      ui.error(e)
      return null
    } finally {
      generating.value = false
    }
  }

  return { form, generating, dayOptions, toggleInterest, cycleStart, generate }
}
