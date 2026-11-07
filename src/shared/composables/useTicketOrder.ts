import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ticketsApi } from '@/shared/api/tickets'
import { ApiError } from '@/shared/api/client'
import { STRIPE_APPEARANCE, loadStripe, type StripeElement, type StripeElements, type StripeInstance } from '@/shared/composables/useStripe'
import { cacheTicket, orderTotal, useTicketErrors } from '@/shared/composables/useTickets'
import { useAuthStore } from '@/shared/stores/auth'
import { useTicketOrderStore } from '@/shared/stores/ticketOrder'
import { useUiStore } from '@/shared/stores/ui'
import type { EventDto } from '@/shared/types/events'
import type { PaymentMode } from '@/shared/types/tickets'

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

/**
 * T07 · plata (S5 / W6): comanda din store, e-mailul pentru bilete, apoi plata și confirmarea. La deschidere serverul spune cum
 * se plătește (`POST /events/{id}/tickets/payment`): **STRIPE** (modul de test) → Payment Element-ul Stripe se montează în
 * `cardEl`, „Plătește” confirmă cardul la Stripe (fără redirect) și biletul se cere cu `paymentIntentId`, verificat de server;
 * **DEMO** (fără chei Stripe) → plata demonstrativă de până acum (card salvat / nou, fără bani).
 */
export function useCheckout() {
  const router = useRouter()
  const { t, locale } = useI18n()
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

  /** null = se pregătește plata; 'STRIPE' / 'DEMO' după răspunsul serverului */
  const mode = ref<PaymentMode | null>(null)
  const prepareError = ref<string | null>(null)
  /** containerul în care se montează Payment Element (view-ul pune `ref="cardEl"`) */
  const cardEl = ref<HTMLElement | null>(null)
  /** ref-ul de template pentru container: `:ref="setCardEl"` */
  const setCardEl = (el: unknown) => { cardEl.value = el instanceof HTMLElement ? el : null }
  const cardReady = ref(false)
  let stripe: StripeInstance | null = null
  let elements: StripeElements | null = null
  let element: StripeElement | null = null

  async function prepare() {
    const o = order.value
    if (!o) return
    mode.value = null
    prepareError.value = null
    cardReady.value = false
    try {
      const p = await ticketsApi.preparePayment(o.event.id, { qtyAdult: o.adult, qtyChild: o.child })
      if (p.mode !== 'STRIPE' || !p.clientSecret || !p.publishableKey) { mode.value = 'DEMO'; return }
      stripe = await loadStripe(p.publishableKey)
      elements = stripe.elements({ clientSecret: p.clientSecret, locale: locale.value === 'en' ? 'en' : 'ro', appearance: STRIPE_APPEARANCE })
      mode.value = 'STRIPE'
      await nextTick()
      element?.destroy()
      element = elements.create('payment', { layout: 'tabs' })
      element.on('ready', () => { cardReady.value = true })
      if (cardEl.value) element.mount(cardEl.value)
    } catch (err) {
      prepareError.value = err instanceof ApiError ? errorText(err) : t('tickets.checkout.stripeLoadError')
    }
  }
  onMounted(prepare)
  onBeforeUnmount(() => { element?.destroy(); element = null })

  async function issue(o: NonNullable<typeof order.value>, paymentIntentId?: string) {
    const ticket = await ticketsApi.buy(o.event.id, { qtyAdult: o.adult, qtyChild: o.child, email: email.value.trim() || undefined, paymentIntentId })
    if (auth.user) cacheTicket(auth.user.id, ticket)
    store.clear()
    await router.replace(`/confirm/${ticket.code}`)
  }

  async function pay() {
    const o = order.value
    if (!o || paying.value || !mode.value) return
    // T21: e-mailul e opțional (conturile cu telefon); dacă e completat, trebuie să fie valid
    if (email.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) { ui.toast(t('tickets.checkout.badEmail'), 'error'); return }
    paying.value = true
    try {
      if (mode.value === 'STRIPE') {
        if (!stripe || !elements) return
        const submitted = await elements.submit()
        if (submitted.error) { ui.toast(submitted.error.message ?? t('tickets.errors.paymentIncomplete'), 'error'); return }
        const res = await stripe.confirmPayment({ elements, redirect: 'if_required', confirmParams: { return_url: window.location.href } })
        if (res.error) { ui.toast(res.error.message ?? t('tickets.errors.paymentIncomplete'), 'error'); return }
        if (res.paymentIntent?.status !== 'succeeded') { ui.toast(t('tickets.errors.paymentIncomplete'), 'error'); return }
        await issue(o, res.paymentIntent.id)
      } else {
        await issue(o)
      }
    } catch (err) {
      ui.toast(errorText(err), 'error')
    } finally {
      paying.value = false
    }
  }
  return { order, email, method, paying, total, lines, pay, mode, prepareError, prepare, setCardEl, cardReady }
}
