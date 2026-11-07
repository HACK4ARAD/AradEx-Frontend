/**
 * Stripe.js (plata biletelor în modul de test): scriptul oficial `https://js.stripe.com/v3` încărcat o dată, fără pachet npm
 * (ca Google Maps). Doar tipurile de care avem nevoie: Payment Element (card) și `confirmPayment` fără redirect.
 * Cheia publică (`pk_test_…`) vine de la server în răspunsul `POST /events/{id}/tickets/payment`; FE nu ține chei.
 */
export interface StripeElement { mount(el: HTMLElement): void; destroy(): void; on(ev: 'ready' | 'change' | 'loaderror', cb: (e: { complete?: boolean }) => void): void }
export interface StripeElements { create(type: 'payment', opts?: Record<string, unknown>): StripeElement; submit(): Promise<{ error?: { message?: string } }> }
export interface StripeConfirmResult { error?: { message?: string; type?: string }; paymentIntent?: { id: string; status: string } }
export interface StripeInstance {
  elements(opts: { clientSecret: string; locale?: string; appearance?: Record<string, unknown> }): StripeElements
  confirmPayment(opts: { elements: StripeElements; redirect: 'if_required'; confirmParams?: { return_url?: string } }): Promise<StripeConfirmResult>
}
type StripeFactory = (key: string) => StripeInstance

const SRC = 'https://js.stripe.com/v3'
let loading: Promise<StripeFactory> | null = null

export function loadStripe(publishableKey: string): Promise<StripeInstance> {
  const w = window as unknown as { Stripe?: StripeFactory }
  if (w.Stripe) return Promise.resolve(w.Stripe(publishableKey))
  loading ??= new Promise<StripeFactory>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SRC
    s.async = true
    s.onload = () => (w.Stripe ? resolve(w.Stripe) : reject(new Error('Stripe.js did not load')))
    s.onerror = () => { loading = null; reject(new Error('Stripe.js could not load')) }
    document.head.append(s)
  })
  return loading.then((f) => f(publishableKey))
}

/** Aspectul Payment Element în stilul Clean Ink (ink #111, colțuri 12, Inter). */
export const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: { colorPrimary: '#111111', colorText: '#111111', colorDanger: '#B3261E', borderRadius: '12px', fontFamily: 'Inter, system-ui, sans-serif' },
}
