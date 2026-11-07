import { computed, reactive, ref, shallowRef, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { eventsApi } from '@/shared/api/events'
import { intlLocale, useFormat } from '@/shared/composables/useFormat'
import { useGeo } from '@/shared/composables/useGeo'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { EventCategory, EventDto, EventQuery, EventSummary } from '@/shared/types/events'
import { APP } from '@/shared/app'

const TZ = 'Europe/Bucharest'

/** Emoji + nuanță pentru evenimentele fără poză (ca în design/final: fundal colorat cu emoji). */
export const CATEGORY_STYLE: Record<EventCategory, { emoji: string; tone: string }> = {
  CONCERT: { emoji: '🎻', tone: '#5B4A6B' }, THEATRE: { emoji: '🎭', tone: '#7E3A3A' }, FAMILY: { emoji: '🧸', tone: '#8A6A4F' },
  EXHIBITION: { emoji: '🖼️', tone: '#4E5D6C' }, SPORT: { emoji: '⚽', tone: '#2F5D3A' }, OUTDOOR: { emoji: '🌳', tone: '#4E7258' },
  FAIR: { emoji: '🧺', tone: '#8A5A2B' }, FOOD: { emoji: '🍷', tone: '#6B3A3A' },
}

/** „YYYY-MM-DD” pentru o zi din calendarul Aradului. */
export function isoDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

/**
 * Perioadele din chips (Azi / Weekendul acesta / Următoarele 7 zile) ca interval pentru GET /events. Când intervalul începe azi
 * nu trimitem `from`: BE-ul arată atunci doar ce nu s-a terminat încă (fără spectacolul de dimineață care a trecut).
 */
export function periodRange(period: 'today' | 'weekend' | 'week' | 'all', now = new Date()): { from?: string; to?: string } {
  const today = isoDay(now)
  if (period === 'today') return { to: today }
  if (period === 'week') return { to: isoDay(new Date(now.getTime() + 6 * 86_400_000)) }
  if (period === 'weekend') {
    const noon = new Date(today + 'T12:00:00')
    const dow = noon.getDay() // 0 = duminică, 6 = sâmbătă
    if (dow === 0) return { to: today }
    const sat = new Date(noon.getTime() + (6 - dow) * 86_400_000)
    return { from: dow === 6 ? undefined : isoDay(sat), to: isoDay(new Date(sat.getTime() + 86_400_000)) }
  }
  return {}
}

/** Formatări pentru evenimente, după design/final (whenLabel, priceLabel, „Acum · până la”). */
export function useEventFormat() {
  const f = useFormat()
  const { t } = useI18n()

  const sameDay = (a: string, b?: string) => !b || isoDay(new Date(a)) === isoDay(new Date(b))
  const isToday = (iso: string) => isoDay(new Date(iso)) === isoDay(new Date())

  /** „Azi · 18:00–19:30”, „Sâm., 7 nov. · 11:00”, iar pe mai multe zile „Zilnic, 14 nov. – 27 dec. · 14:00–18:00”. */
  /** `startOnly`: doar ora de început (detaliul pune alături durata: „Sâm., 7 nov. · 11:00 · 50 min”). */
  function when(e: Pick<EventSummary, 'startAt' | 'endAt'>, startOnly = false): string {
    const day = isToday(e.startAt) ? t('events.today') : f.dateTime(e.startAt, false)
    if (!sameDay(e.startAt, e.endAt)) {
      const short = (iso: string) => new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', timeZone: TZ }).format(new Date(iso))
      return `${t('events.daily', { from: short(e.startAt), to: short(e.endAt!) })} · ${f.timeRange(e.startAt)}`
    }
    return `${day} · ${f.timeRange(e.startAt, startOnly ? undefined : e.endAt)}`
  }

  /** „Gratuit”, „40 lei”, „de la 25 lei”, „Pe site-ul organizatorului”. */
  function price(e: Pick<EventDto, 'ticketType' | 'priceFrom'> & Partial<Pick<EventDto, 'priceAdult' | 'priceChild'>>): string {
    if (e.ticketType === 'FREE') return t('events.free')
    if (e.ticketType === 'EXTERNAL') return e.priceFrom ? t('events.priceFrom', { price: f.money(e.priceFrom) }) : t('events.onOrganizerSite')
    if (e.priceAdult != null && e.priceChild != null) return t('events.priceFrom', { price: f.money(Math.min(e.priceAdult, e.priceChild)) })
    if (e.priceAdult != null) return f.money(e.priceAdult)
    return e.priceFrom != null ? t('events.priceFrom', { price: f.money(e.priceFrom) }) : ''
  }

  /** Evenimentul e în desfășurare acum → „Acum · până la 17:00”. */
  function liveUntil(e: Pick<EventSummary, 'startAt' | 'endAt'>, nowMs = Date.now()): string | null {
    if (!e.endAt) return null
    const start = new Date(e.startAt).getTime(), end = new Date(e.endAt).getTime()
    if (nowMs < start || nowMs > end) return null
    if (sameDay(e.startAt, e.endAt)) return f.timeRange(e.endAt)
    // pe mai multe zile (ex. expoziție zilnic 09:00–17:00): „acum” doar între ora de deschidere și cea de închidere a zilei
    const hm = (ms: number) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms))
    const nowHm = hm(nowMs)
    return nowHm >= hm(start) && nowHm <= hm(end) ? f.timeRange(e.endAt) : null
  }

  /** „🔥 Popular · 86 participă” / „26 au salvat”. */
  function hotLabel(e: EventSummary & { savesCount?: number }): string {
    return e.participantsCount >= 50 ? t('events.going', { n: e.participantsCount.toLocaleString(intlLocale()) }) : t('events.savedBy', { n: e.savesCount ?? 20 })
  }

  function durationMin(e: Pick<EventSummary, 'startAt' | 'endAt'>): number | null {
    if (!e.endAt || !sameDay(e.startAt, e.endAt)) return null
    return Math.round((new Date(e.endAt).getTime() - new Date(e.startAt).getTime()) / 60_000)
  }

  return { when, price, liveUntil, hotLabel, durationMin, km: f.km, money: f.money, dateTime: f.dateTime, timeRange: f.timeRange, isToday }
}

/** Link spre Google Maps cu traseul până la eveniment (până vine harta din T08). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/** Link „Adaugă în Google Calendar” (fără login), ca în docs/API.md. */
export function googleCalendarUrl(e: { title: string; startAt: string; endAt?: string; locationName: string; address?: string; description?: string }): string {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const end = e.endAt ?? new Date(new Date(e.startAt).getTime() + 2 * 3_600_000).toISOString()
  const p = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${fmt(e.startAt)}/${fmt(end)}`, location: [e.locationName, e.address].filter(Boolean).join(', '), details: (e.description ?? '').slice(0, 900) })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

/** Lista de evenimente pentru filtrele date (reîncarcă la schimbare), cu `near` din poziția utilizatorului (sau centrul Aradului). */
export function useEventList(query: Ref<EventQuery>) {
  const ui = useUiStore()
  const geo = useGeo()
  const items = shallowRef<EventSummary[]>([])
  const total = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)
  let seq = 0

  async function load() {
    const my = ++seq
    loading.value = true
    error.value = null
    try {
      const page = await eventsApi.list({ near: geo.near(), size: 50, ...query.value })
      if (my !== seq) return
      items.value = page.content
      total.value = page.totalElements
    } catch (err) {
      if (my !== seq) return
      error.value = err instanceof Error ? err.message : String(err)
      ui.error(err)
    } finally {
      if (my === seq) loading.value = false
    }
  }
  watch(query, load, { deep: true, immediate: true })
  watch(geo.position, load)
  return { items, total, loading, error, reload: load, geo }
}

/** Salvează / scoate din Salvate, cu actualizare imediată în UI. Fără cont → login (cu întoarcere aici). */
export function useSaveEvent() {
  const auth = useAuthStore()
  const ui = useUiStore()
  const router = useRouter()
  const { t } = useI18n()
  const busy = ref(new Set<number>())

  async function toggle(e: { id: number; saved?: boolean; savesCount?: number }, loginPath: string): Promise<void> {
    if (!auth.isLoggedIn) {
      ui.toast(t('events.saveLogin'))
      await router.push({ path: loginPath, query: { next: router.currentRoute.value.fullPath } })
      return
    }
    if (busy.value.has(e.id)) return
    busy.value.add(e.id)
    const was = !!e.saved
    e.saved = !was
    if (e.savesCount != null) e.savesCount += was ? -1 : 1
    try {
      if (was) await eventsApi.unsave(e.id)
      else await eventsApi.save(e.id)
      ui.toast(was ? t('events.unsavedToast') : t(APP === 'web' ? 'events.savedToastWeb' : 'events.savedToast'), was ? 'info' : 'success')
    } catch (err) {
      e.saved = was
      if (e.savesCount != null) e.savesCount += was ? 1 : -1
      ui.error(err)
    } finally {
      busy.value.delete(e.id)
    }
  }
  return { toggle, busy: computed(() => busy.value) }
}

/** Filtrele de evenimente (sheet-ul „Filtre” din S1/S2 și coloana din W5), aceleași pe toate ecranele cât timp aplicația e deschisă. */
export interface EventFilters { cats: EventCategory[]; price: '' | 'free' | 'app' | 'ext'; org: '' | 'inst' | 'biz' | 'city'; dist: '' | 'city' | 'county' }
const filters = reactive<EventFilters & { sheetOpen: boolean }>({ cats: [], price: '', org: '', dist: '', sheetOpen: false })

export function useEventFilters() {
  const active = computed(() => filters.cats.length > 0 || !!filters.price || !!filters.org || !!filters.dist)
  function clear() { filters.cats = []; filters.price = ''; filters.org = ''; filters.dist = '' }
  /** Partea de filtre trimisă la GET /events. */
  const query = computed<EventQuery>(() => ({
    category: filters.cats.length ? filters.cats.join(',') : undefined,
    ticketType: { '': undefined, free: 'FREE', app: 'IN_APP', ext: 'EXTERNAL' }[filters.price],
    organizerType: { '': undefined, inst: 'EXTERNAL', biz: 'BUSINESS', city: 'CITY' }[filters.org],
  }))
  /** Distanța se filtrează după ce vine lista (oraș < 10 km de centru, județ ≥ 10 km). */
  function byDistance<T extends { distanceKm?: number }>(list: T[]): T[] {
    if (!filters.dist) return list
    return list.filter((e) => e.distanceKm == null || (filters.dist === 'city' ? e.distanceKm < 10 : e.distanceKm >= 10))
  }
  return { filters, active, clear, query, byDistance }
}
