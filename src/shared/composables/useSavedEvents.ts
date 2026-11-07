import { onMounted, ref, shallowRef } from 'vue'
import { eventsApi } from '@/shared/api/events'
import { useSaveEvent } from '@/shared/composables/useEvents'
import { useGeo } from '@/shared/composables/useGeo'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { EventSummary } from '@/shared/types/events'

/**
 * T06 · „Salvate” (Profil › Salvate în aplicație, Contul meu › Salvate pe web): lista din GET /me/saved-events;
 * scoaterea din Salvate o scoate imediat și din listă.
 */
export function useSavedEvents() {
  const ui = useUiStore()
  const auth = useAuthStore()
  const saver = useSaveEvent()
  const geo = useGeo()
  const items = shallowRef<EventSummary[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    if (!auth.isLoggedIn) { loading.value = false; return }
    loading.value = true
    error.value = null
    // toate sunt salvate (dacă BE nu completează `saved`, butonul ar salva din nou în loc să scoată)
    try { items.value = (await eventsApi.saved(geo.near())).map((e) => ({ ...e, saved: e.saved ?? true })) } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      ui.error(err)
    } finally { loading.value = false }
  }
  async function toggle(e: EventSummary) {
    await saver.toggle(e, '/login')
    if (!e.saved) items.value = items.value.filter((x) => x.id !== e.id)
  }
  onMounted(load)
  return { items, loading, error, load, toggle }
}
