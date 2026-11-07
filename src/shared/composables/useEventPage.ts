import { computed, onMounted, ref, shallowRef, triggerRef, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ticketsApi } from '@/shared/api/tickets'
import { placesApi } from '@/shared/api/places'
import { businessApi } from '@/shared/api/business'
import { shareLink, useEventDetail } from '@/shared/composables/useEventDetail'
import { useSaveEvent } from '@/shared/composables/useEvents'
import { cacheTicket, useMyTickets, useTicketErrors } from '@/shared/composables/useTickets'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { PlaceDto } from '@/shared/types/places'
import type { BusinessDto } from '@/shared/types/business'

/**
 * T06 / T07 · logica paginii de eveniment, comună aplicației (S3) și web-ului (W6): detaliul, obiectivul cu ghid și firma
 * organizatoare, biletul / înscrierea mea la eveniment, „Înscrie-te · gratuit” (direct, fără S4/S5) și „Trimite”.
 */
export function useEventPage(id: Ref<number>) {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const ui = useUiStore()
  const auth = useAuthStore()
  const detail = useEventDetail(id)
  const e = detail.event
  const mine = useMyTickets()
  const errorText = useTicketErrors()
  const joining = ref(false)

  /** Obiectivul legat (T05) pentru „Ghid virtual” și firma organizatoare (T09) pentru „Organizat de …”. */
  const place = shallowRef<PlaceDto | null>(null)
  const biz = shallowRef<BusinessDto | null>(null)
  watch(e, async (ev) => {
    place.value = null
    biz.value = null
    if (ev?.placeId) placesApi.get(ev.placeId).then((p) => { if (p.guidePoints.length) place.value = p }).catch(() => {})
    if (ev?.organizerBusinessId) businessApi.page(ev.organizerBusinessId).then((b) => { biz.value = b.business }).catch(() => {})
  }, { immediate: true })
  onMounted(() => { if (auth.isLoggedIn) void mine.load() })

  /** T07: biletul / înscrierea mea (viitoare) la acest eveniment. */
  const myTicket = computed(() => mine.upcoming.value.find((x) => x.eventId === id.value) ?? null)
  const ended = computed(() => !!e.value && new Date(e.value.endAt ?? e.value.startAt).getTime() < Date.now())

  /** T07: „Înscrie-te · gratuit” — înscriere directă, apoi confirmarea. Fără cont → login cu întoarcere aici. */
  async function joinFree() {
    if (!e.value || joining.value) return
    if (!auth.user) { await router.push({ path: '/login', query: { next: route.fullPath } }); return }
    joining.value = true
    try {
      const tk = await ticketsApi.buy(e.value.id, { qtyAdult: 1, qtyChild: 0, email: auth.user.email })
      cacheTicket(auth.user.id, tk)
      await router.push(`/confirm/${tk.code}`)
    } catch (err) {
      ui.toast(errorText(err), 'error')
    } finally {
      joining.value = false
    }
  }

  /** Salvează / scoate din Salvate; detaliul e un `shallowRef`, deci redesenăm explicit după schimbarea lui `saved`. */
  const saver = useSaveEvent()
  function toggleSave() {
    if (!e.value) return
    const done = saver.toggle(e.value, '/login')
    triggerRef(e)
    void done.finally(() => triggerRef(e))
  }

  async function share() {
    if (!e.value) return
    const r = await shareLink(e.value.title, window.location.href)
    if (r === 'copied') ui.toast(t('events.detail.shareCopied'))
  }

  return { ...detail, place, biz, myTicket, ended, joining, joinFree, toggleSave, share }
}
