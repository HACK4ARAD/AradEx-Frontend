import { ref, shallowRef, watch, type Ref } from 'vue'
import { eventsApi } from '@/shared/api/events'
import { ApiError } from '@/shared/api/client'
import { useGeo } from '@/shared/composables/useGeo'
import type { EventDto } from '@/shared/types/events'

/** T06 · detaliul unui eveniment (S3 / W6): încărcare, 404 → `notFound`, distanța de la poziția utilizatorului. */
export function useEventDetail(id: Ref<number>) {
  const geo = useGeo()
  const event = shallowRef<EventDto | null>(null)
  const loading = ref(true)
  const notFound = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    notFound.value = false
    error.value = null
    try {
      event.value = await eventsApi.get(id.value, geo.near())
    } catch (err) {
      event.value = null
      if (err instanceof ApiError && err.status === 404) notFound.value = true
      else error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }
  watch(id, load, { immediate: true })
  return { event, loading, notFound, error, reload: load }
}

/** „Trimite”: meniul nativ de distribuire; dacă nu există sau nu merge (WebView, desktop fără share), linkul se copiază. */
export async function shareLink(title: string, url: string): Promise<'shared' | 'copied' | 'none'> {
  if (navigator.share) {
    try { await navigator.share({ title, url }); return 'shared' } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'none' // omul a închis meniul
    }
  }
  try { await navigator.clipboard.writeText(url); return 'copied' } catch { return 'none' }
}
