import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ApiError } from '@/shared/api/client'
import { useTicketOrderStore } from '@/shared/stores/ticketOrder'
import type { EventDto } from '@/shared/types/events'

const toast = vi.fn()
const replace = vi.fn()
const api = { config: vi.fn(), checkout: vi.fn(), confirm: vi.fn(), buy: vi.fn() }

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ replace }) }))
vi.mock('@/shared/stores/ui', () => ({ useUiStore: () => ({ toast }) }))
vi.mock('@/shared/stores/auth', () => ({ useAuthStore: () => ({ user: { id: 7, email: null } }) }))
vi.mock('@/shared/api/payments', () => ({ paymentsApi: {
  config: () => api.config(), checkout: (...a: unknown[]) => api.checkout(...a), confirm: (...a: unknown[]) => api.confirm(...a),
} }))
vi.mock('@/shared/api/tickets', () => ({ ticketsApi: { buy: (...a: unknown[]) => api.buy(...a) } }))

const { cardErrorKey, useCheckout } = await import('./useTicketOrder')

const ev = { id: 22, title: 'Teatru de păpuși', startAt: '2099-11-07T09:00:00Z', locationName: 'Teatrul Clasic', ticketType: 'IN_APP',
  priceAdult: 40, priceChild: 25 } as EventDto
const ticket = { code: 'AX-T22-ABCDEF' }

function setup() {
  let c!: ReturnType<typeof useCheckout>
  mount(defineComponent({ setup() { c = useCheckout(); return () => h('div') } }))
  return c
}

describe('checkout with Stripe (T25)', () => {
  beforeEach(() => {
    sessionStorage.clear(); localStorage.clear(); setActivePinia(createPinia())
    Object.values(api).forEach((f) => f.mockReset()); toast.mockReset(); replace.mockReset()
    useTicketOrderStore().set({ event: ev, adult: 2, child: 1 })
  })

  it('without Stripe keys keeps the demo payment (POST /events/{id}/tickets)', async () => {
    api.config.mockResolvedValue({ enabled: false, currency: 'ron', testMode: true })
    api.buy.mockResolvedValue(ticket)
    const c = setup()
    await flushPromises()
    expect(c.card.state).toBe('off')
    expect(api.checkout).not.toHaveBeenCalled()
    await c.pay()
    expect(api.buy).toHaveBeenCalledWith(22, { qtyAdult: 2, qtyChild: 1, email: undefined })
    expect(replace).toHaveBeenCalledWith('/confirm/AX-T22-ABCDEF')
  })

  it('with Stripe creates the PaymentIntent, pays with the card form, then asks for the ticket', async () => {
    api.config.mockResolvedValue({ enabled: true, publishableKey: 'pk_test_1', currency: 'ron', testMode: true })
    api.checkout.mockResolvedValue({ paymentIntentId: 'pi_1', clientSecret: 'pi_1_secret', amount: 105, currency: 'ron' })
    api.confirm.mockResolvedValue(ticket)
    const c = setup()
    await flushPromises()
    expect(c.card.state).toBe('on')
    expect(api.checkout).toHaveBeenCalledWith(22, { qtyAdult: 2, qtyChild: 1 })
    c.email.value = 'ana@exemplu.ro'
    await c.pay(async () => ({ ok: true as const, paymentIntentId: 'pi_1' }))
    expect(api.confirm).toHaveBeenCalledWith('pi_1', { email: 'ana@exemplu.ro' })
    expect(api.buy).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith('/confirm/AX-T22-ABCDEF')
  })

  it('a declined card shows Stripe\'s message and asks for no ticket', async () => {
    api.config.mockResolvedValue({ enabled: true, publishableKey: 'pk_test_1', currency: 'ron', testMode: true })
    api.checkout.mockResolvedValue({ paymentIntentId: 'pi_1', clientSecret: 's', amount: 105, currency: 'ron' })
    const c = setup()
    await flushPromises()
    await c.pay(async () => ({ ok: false as const, message: 'Your card was declined.' }))
    expect(toast).toHaveBeenCalledWith('Your card was declined.', 'error')
    expect(api.confirm).not.toHaveBeenCalled()
  })

  it('a sold-out order cannot start the card payment', async () => {
    api.config.mockResolvedValue({ enabled: true, publishableKey: 'pk_test_1', currency: 'ron', testMode: true })
    api.checkout.mockRejectedValue(new ApiError(409, 'Sold out', { status: 409, detail: 'Sold out' }))
    const c = setup()
    await flushPromises()
    expect(c.card.state).toBe('error')
    await c.pay(async () => ({ ok: true as const, paymentIntentId: 'pi_1' }))
    expect(api.confirm).not.toHaveBeenCalled()
  })

  it('maps the payment errors to messages', () => {
    expect(cardErrorKey(new ApiError(409, 'x', { status: 409, detail: 'Sold out — payment refunded' }))).toBe('tickets.checkout.stripe.refunded')
    expect(cardErrorKey(new ApiError(409, 'x', { status: 409, detail: 'Payment not completed' }))).toBe('tickets.checkout.stripe.processing')
    expect(cardErrorKey(new ApiError(503, 'x'))).toBe('tickets.checkout.stripe.unavailable')
    expect(cardErrorKey(new ApiError(409, 'x', { status: 409, detail: 'Sold out' }))).toBeNull()
    expect(cardErrorKey(new Error('x'))).toBeNull()
  })
})
