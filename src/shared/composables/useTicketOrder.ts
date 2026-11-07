import { computed, reactive, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ticketsApi } from '@/shared/api/tickets'
import { cacheTicket, orderTotal, useTicketErrors } from '@/shared/composables/useTickets'
import { useAuthStore } from '@/shared/stores/auth'
import { useTicketOrderStore } from '@/shared/stores/ticketOrder'
import { useUiStore } from '@/shared/stores/ui'
import type { EventDto } from '@/shared/types/events'

export type TicketKind = 'adult' | 'child'
/** Câte bilete de un fel se pot alege într-o comandă. */
export const MAX_QTY = 10

/**
 * T07 · alegerea biletelor (S4 în aplicație, W6 pe web: pagina `/events/:id/tickets` și caseta de bilete din detaliu):
 * Adult / Copil cu stepper, totalul, locurile rămase. `commit()` pune comanda în store (→ `/checkout`).
 */
export function useTicketPick(e: Ref<EventDto | null>) {
  const store = useTicketOrderStore()
  const qty = reactive<Record<TicketKind, number>>({ adult: 1, child: 0 })

  // dacă omul se întoarce din plată, păstrăm ce alesese
  watch(() => e.value?.id, () => {
    const ev = e.value
    if (ev && store.order?.event.id === ev.id) { qty.adult = store.order.adult; qty.child = store.order.child }
  }, { immediate: true })

  const n = computed(() => qty.adult + qty.child)
  const total = computed(() => orderTotal(qty.adult, qty.child, e.value?.priceAdult, e.value?.priceChild))
  const left = computed(() => e.value?.spotsLeft ?? null)
  const tooMany = computed(() => left.value != null && n.value > left.value)
  const ended = computed(() => !!e.value && new Date(e.value.endAt ?? e.value.startAt).getTime() < Date.now())
  /** Felurile de bilete: Adult mereu, Copil doar dacă evenimentul are preț pentru copii. */
  const kinds = computed(() => [
    { key: 'adult' as const, price: e.value?.priceAdult },
    ...(e.value?.priceChild != null ? [{ key: 'child' as const, price: e.value.priceChild }] : []),
  ])
  const blocked = computed(() => n.value === 0 || tooMany.value || ended.value || left.value === 0)

  function step(k: TicketKind, d: number) { qty[k] = Math.max(0, Math.min(MAX_QTY, qty[k] + d)) }
  /** Salvează comanda pentru pasul de plată; `false` dacă nu se poate continua. */
  function commit(): boolean {
    if (!e.value || n.value === 0 || tooMany.value) return false
    store.set({ event: e.value, adult: qty.adult, child: qty.child })
    return true
  }
  return { qty, n, total, left, tooMany, ended, kinds, blocked, step, commit }
}

/** T07 · plata demonstrativă (S5 / W6): comanda din store, e-mailul pentru bilete, metoda, apoi POST și confirmarea. */
export function useCheckout() {
  const router = useRouter()
  const { t } = useI18n()
  const auth = useAuthStore()
  const ui = useUiStore()
  const store = useTicketOrderStore()
  const errorText = useTicketErrors()
  const order = computed(() => store.order)
  const email = ref(auth.user?.email ?? '')
  const method = ref<'saved' | 'new'>('saved')
  const paying = ref(false)
  const total = computed(() => (order.value ? orderTotal(order.value.adult, order.value.child, order.value.event.priceAdult, order.value.event.priceChild) : 0))
  const lines = computed(() => !order.value ? [] : [
    { label: t('tickets.adult'), qty: order.value.adult, price: order.value.event.priceAdult ?? 0 },
    { label: t('tickets.childShort'), qty: order.value.child, price: order.value.event.priceChild ?? 0 },
  ].filter((l) => l.qty > 0))

  async function pay() {
    const o = order.value
    if (!o || paying.value) return
    // T21: e-mailul e opțional (conturile cu telefon); dacă e completat, trebuie să fie valid
    if (email.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) { ui.toast(t('tickets.checkout.badEmail'), 'error'); return }
    paying.value = true
    try {
      const ticket = await ticketsApi.buy(o.event.id, { qtyAdult: o.adult, qtyChild: o.child, email: email.value.trim() || undefined })
      if (auth.user) cacheTicket(auth.user.id, ticket)
      store.clear()
      await router.replace(`/confirm/${ticket.code}`)
    } catch (err) {
      ui.toast(errorText(err), 'error')
    } finally {
      paying.value = false
    }
  }
  return { order, email, method, paying, total, lines, pay }
}
