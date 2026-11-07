import { ref, shallowRef, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { eventsApi } from '@/shared/api/events'
import { placesApi } from '@/shared/api/places'
import { offersApi } from '@/shared/api/offers'
import { businessApi } from '@/shared/api/business'
import { communityApi } from '@/shared/api/community'
import { periodRange, useEventFormat } from '@/shared/composables/useEvents'

/**
 * T08 · pinii hărții: evenimentele din perioadă, obiectivele, firmele cu oferte (ofertele n-au coordonate, firmele da)
 * și acțiunile comunitare. Fiecare sursă se încarcă separat: dacă una pică, celelalte apar oricum.
 */
export type MapKind = 'event' | 'place' | 'offer' | 'action'
export type MapPeriod = 'today' | 'weekend' | 'week'

export interface MapItem {
  /** `kind:id` (ofertele: `offer:<businessId>`) — același format ca `?to=` */
  key: string
  kind: MapKind
  lat: number
  lng: number
  title: string
  sub: string
  imageUrl?: string
  /** ruta din aplicație spre detaliu */
  href: string
  /** obiectivele cu ghid virtual; la „Toate” apar doar ele (altfel sutele de obiective importate acoperă harta) */
  featured?: boolean
}

const TARGET = /^(event|place|offer|action):\d+$/

/** `?to=place:3` → `place:3`; orice altceva → null. */
export function parseTarget(q: unknown): string | null {
  return typeof q === 'string' && TARGET.test(q) ? q : null
}

/**
 * Filtrul de tip; ținta (`?to=`) rămâne pe hartă chiar dacă tipul ei e ascuns.
 * La „Toate”, dintre obiective apar doar cele cu ghid (`featured`); filtrul „Obiective” le arată pe toate.
 */
export function filterItems(items: MapItem[], kind: 'all' | MapKind, keep?: string | null): MapItem[] {
  return items.filter((i) => i.key === keep
    || (kind === 'all' ? i.kind !== 'place' || i.featured !== false : i.kind === kind))
}

export function useMapData(period: Ref<MapPeriod>) {
  const { t } = useI18n()
  const fmt = useEventFormat()
  const events = shallowRef<MapItem[]>([])
  const others = shallowRef<MapItem[]>([])
  const items = shallowRef<MapItem[]>([])
  const loading = ref(false)

  function merge() {
    items.value = [...events.value, ...others.value]
  }

  async function loadEvents() {
    try {
      const page = await eventsApi.list({ ...periodRange(period.value), size: 100 })
      events.value = page.content.filter((e) => e.lat != null && e.lng != null).map((e) => ({
        key: `event:${e.id}`, kind: 'event' as const, lat: e.lat, lng: e.lng, title: e.title,
        sub: `${fmt.when(e)} · ${e.locationName}`, imageUrl: e.imageUrl, href: `/events/${e.id}`,
      }))
    } catch { events.value = [] }
  }

  async function loadOthers() {
    const out: MapItem[] = []
    const [places, offers, actions] = await Promise.allSettled([placesApi.list(), offersApi.list(), communityApi.actions(true)])
    if (places.status === 'fulfilled') {
      for (const p of places.value) {
        out.push({ key: `place:${p.id}`, kind: 'place', lat: p.lat, lng: p.lng, title: p.name,
          sub: p.guidePointsCount ? t('map.guide', { n: p.guidePointsCount }) : t(`places.type.${p.type}`), imageUrl: p.imageUrl, href: `/places/${p.id}`,
          featured: p.guidePointsCount > 0 })
      }
    }
    if (offers.status === 'fulfilled') {
      const byBusiness = new Map<number, number>()
      for (const o of offers.value) byBusiness.set(o.businessId, (byBusiness.get(o.businessId) ?? 0) + 1)
      const pages = await Promise.allSettled([...byBusiness.keys()].map((id) => businessApi.page(id)))
      for (const r of pages) {
        if (r.status !== 'fulfilled') continue
        const b = r.value.business
        if (b.lat == null || b.lng == null) continue
        out.push({ key: `offer:${b.id}`, kind: 'offer', lat: b.lat, lng: b.lng, title: b.name,
          sub: t('map.offers', byBusiness.get(b.id) ?? 0), imageUrl: b.imageUrl, href: `/businesses/${b.id}` })
      }
    }
    if (actions.status === 'fulfilled') {
      for (const a of actions.value) {
        out.push({ key: `action:${a.id}`, kind: 'action', lat: a.lat, lng: a.lng, title: a.title,
          sub: `${fmt.dateTime(a.startAt)} · +${a.pointsReward} ${t('map.points')}`, imageUrl: a.imageUrl, href: `/community/actions/${a.id}` })
      }
    }
    others.value = out
  }

  async function load() {
    loading.value = true
    await Promise.all([loadEvents(), loadOthers()])
    merge()
    loading.value = false
  }

  watch(period, async () => { await loadEvents(); merge() })

  return { items, loading, load }
}
