import { computed, ref, watch, type Ref } from 'vue'
import { businessApi } from '@/shared/api/business'
import { useUiStore } from '@/shared/stores/ui'
import type { AnnouncementCreate, AnnouncementDto, BusinessActivityDto, BusinessMeDto, BusinessPageDto, BusinessUpdate, EventCreate } from '@/shared/types/business'
import type { EventDto } from '@/shared/types/events'

/**
 * Panoul firmei (T09) — aceeași logică pentru web (`/w/business/*`) și mobil (`/m/panel`, E5): firma + statistici,
 * evenimentele, anunțurile, activitatea; acțiunile reîncarcă ce s-a schimbat. Erorile → toast cu `detail` (ProblemDetail).
 */
export function useBusinessPanel() {
  const ui = useUiStore()
  const me = ref<BusinessMeDto | null>(null)
  const events = ref<EventDto[]>([])
  const announcements = ref<AnnouncementDto[]>([])
  const activity = ref<BusinessActivityDto['items']>([])
  const loading = ref(true)
  const error = ref<unknown>(null)
  const saving = ref(false)

  const now = () => Date.now()
  /** Evenimentele care nu s-au terminat, cele mai apropiate primele. */
  const upcoming = computed(() => events.value
    .filter((e) => new Date(e.endAt ?? e.startAt).getTime() >= now())
    .sort((a, b) => a.startAt.localeCompare(b.startAt)))
  const past = computed(() => events.value.filter((e) => !upcoming.value.includes(e)))

  async function load() {
    loading.value = true
    error.value = null
    try {
      const [m, ev, an, act] = await Promise.all([businessApi.me(), businessApi.events(), businessApi.announcements(), businessApi.activity()])
      me.value = m
      events.value = ev
      announcements.value = an
      activity.value = act.items
    } catch (e) {
      error.value = e
      ui.error(e)
    } finally {
      loading.value = false
    }
  }

  async function refreshStats() {
    try { me.value = await businessApi.me() } catch { /* statisticile se reîncarcă la următorul load */ }
  }

  /** Rulează o acțiune cu `saving` + toast; întoarce rezultatul sau null la eroare. */
  async function run<T>(fn: () => Promise<T>, okMessage: string): Promise<T | null> {
    saving.value = true
    try {
      const r = await fn()
      ui.toast(okMessage, 'success')
      return r
    } catch (e) {
      ui.error(e)
      return null
    } finally {
      saving.value = false
    }
  }

  async function createEvent(req: EventCreate, okPublished: string, okDraft: string) {
    saving.value = true
    try {
      const ev = await businessApi.createEvent(req)
      events.value = [ev, ...events.value]
      ui.toast(ev.status === 'PUBLISHED' ? okPublished : okDraft, 'success')
      refreshStats()
      return ev
    } catch (e) {
      ui.error(e)
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateEvent(id: number, req: EventCreate, ok: string) {
    const ev = await run(() => businessApi.updateEvent(id, req), ok)
    if (ev) events.value = events.value.map((x) => (x.id === id ? ev : x))
    return ev
  }

  async function deleteEvent(id: number, ok: string) {
    const r = await run(() => businessApi.deleteEvent(id).then(() => true), ok)
    if (r) { events.value = events.value.filter((x) => x.id !== id); refreshStats() }
    return !!r
  }

  async function createAnnouncement(req: AnnouncementCreate, okPublished: string, okDraft: string) {
    saving.value = true
    try {
      const a = await businessApi.createAnnouncement(req)
      announcements.value = [a, ...announcements.value]
      ui.toast(a.status === 'PUBLISHED' ? okPublished : okDraft, 'success')
      return a
    } catch (e) {
      ui.error(e)
      return null
    } finally {
      saving.value = false
    }
  }

  async function deleteAnnouncement(id: number, ok: string) {
    const r = await run(() => businessApi.deleteAnnouncement(id).then(() => true), ok)
    if (r) announcements.value = announcements.value.filter((x) => x.id !== id)
    return !!r
  }

  async function updateProfile(req: BusinessUpdate, ok: string) {
    const b = await run(() => businessApi.updateMe(req), ok)
    if (b && me.value) me.value = { ...me.value, business: b }
    return b
  }

  return {
    me, events, upcoming, past, announcements, activity, loading, error, saving,
    load, createEvent, updateEvent, deleteEvent, createAnnouncement, deleteAnnouncement, updateProfile,
  }
}

/** Pagina publică a unei firme (W15 / mobil). Se reîncarcă când se schimbă `id`. */
export function useBusinessPage(id: Ref<number>) {
  const data = ref<BusinessPageDto | null>(null)
  const loading = ref(true)
  const error = ref<unknown>(null)
  const notFound = ref(false)
  const ui = useUiStore()

  async function load() {
    loading.value = true
    error.value = null
    notFound.value = false
    try {
      data.value = await businessApi.page(id.value)
    } catch (e) {
      data.value = null
      if ((e as { status?: number }).status === 404) notFound.value = true
      else { error.value = e; ui.error(e) }
    } finally {
      loading.value = false
    }
  }
  watch(id, load, { immediate: true })
  return { data, loading, error, notFound, reload: load }
}

/** Link Google Maps cu indicații spre o adresă (fără cheie, deschide aplicația pe telefon). */
export function directionsUrl(lat?: number, lng?: number, address?: string): string | null {
  if (lat != null && lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  if (address) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  return null
}
