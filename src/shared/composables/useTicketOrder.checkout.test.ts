import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const { replace, toast, api, stripe, element, elements } = vi.hoisted(() => {
  const element = { mount: vi.fn(), destroy: vi.fn(), on: vi.fn((ev: string, cb: () => void) => { if (ev === 'ready') cb() }) }
  return {
    replace: vi.fn(), toast: vi.fn(),
    api: { preparePayment: vi.fn(), buy: vi.fn() },
    stripe: { elements: vi.fn(), confirmPayment: vi.fn() },
    element,
    elements: { create: vi.fn(() => element), submit: vi.fn(async () => ({})) },
  }
})

vi.mock('vue-router', () => ({ useRouter: () => ({ replace }) }))
vi.mock('vue-i18n', async (orig) => { const { ref } = await import('vue'); return { ...(await orig<object>()), useI18n: () => ({ t: (k: string) => k, locale: ref('ro') }) } })
vi.mock('@/shared/api/tickets', () => ({ ticketsApi: api }))
vi.mock('@/shared/stores/ui', () => ({ useUiStore: () => ({ toast, error: toast }) }))
vi.mock('@/shared/composables/useStripe', () => ({ loadStripe: vi.fn(async () => stripe), STRIPE_APPEARANCE: {} }))

import { useCheckout } from './useTicketOrder'
import { useTicketOrderStore } from '@/shared/stores/ticketOrder'
import type { EventDto } from '@/shared/types/events'

const ticket = { code: 'AX-T22-ABC234' }
const event = { id: 22, title: 'Teatru', priceAdult: 40, priceChild: 25 } as EventDto
const flush = () => new Promise((r) => setTimeout(r, 0))

function harness() {
  let co!: ReturnType<typeof useCheckout>
  mount(defineComponent({ setup() { co = useCheckout(); return () => h('div', { ref: co.setCardEl as never }) } }))
  return () => co
}

describe('useCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    setActivePinia(createPinia())
    useTicketOrderStore().set({ event, adult: 2, child: 1 })
    stripe.elements.mockReturnValue(elements)
    api.buy.mockResolvedValue(ticket)
  })

  it('without Stripe keys the server says DEMO and the ticket is issued without a payment', async () => {
    api.preparePayment.mockResolvedValue({ mode: 'DEMO', amount: 105 })
    const co = harness()
    await flush(); await nextTick()
    expect(api.preparePayment).toHaveBeenCalledWith(22, { qtyAdult: 2, qtyChild: 1 })
    expect(co().mode.value).toBe('DEMO')
    await co().pay()
    expect(api.buy).toHaveBeenCalledWith(22, { qtyAdult: 2, qtyChild: 1, email: undefined, paymentIntentId: undefined })
    expect(replace).toHaveBeenCalledWith('/confirm/AX-T22-ABC234')
  })

  it('with Stripe it mounts the Payment Element, confirms the card and buys with the PaymentIntent', async () => {
    api.preparePayment.mockResolvedValue({ mode: 'STRIPE', amount: 105, clientSecret: 'pi_1_secret', publishableKey: 'pk_test_1', paymentIntentId: 'pi_1' })
    stripe.confirmPayment.mockResolvedValue({ paymentIntent: { id: 'pi_1', status: 'succeeded' } })
    const co = harness()
    await flush(); await nextTick()
    expect(co().mode.value).toBe('STRIPE')
    expect(stripe.elements).toHaveBeenCalledWith(expect.objectContaining({ clientSecret: 'pi_1_secret', locale: 'ro' }))
    expect(element.mount).toHaveBeenCalled()
    expect(co().cardReady.value).toBe(true)
    await co().pay()
    expect(stripe.confirmPayment).toHaveBeenCalledWith(expect.objectContaining({ redirect: 'if_required' }))
    expect(api.buy).toHaveBeenCalledWith(22, expect.objectContaining({ paymentIntentId: 'pi_1' }))
  })

  it('a declined card shows Stripe\'s message and issues no ticket', async () => {
    api.preparePayment.mockResolvedValue({ mode: 'STRIPE', amount: 105, clientSecret: 's', publishableKey: 'pk_test_1' })
    stripe.confirmPayment.mockResolvedValue({ error: { message: 'Your card was declined.' } })
    const co = harness()
    await flush(); await nextTick()
    await co().pay()
    expect(toast).toHaveBeenCalledWith('Your card was declined.', 'error')
    expect(api.buy).not.toHaveBeenCalled()
  })

  it('if the payment cannot be prepared it shows an error with retry', async () => {
    api.preparePayment.mockRejectedValue(new Error('network'))
    const co = harness()
    await flush()
    expect(co().prepareError.value).toBe('tickets.checkout.stripeLoadError')
    expect(co().mode.value).toBeNull()
  })
})
