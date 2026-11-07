/**
 * T25 · Stripe.js (scriptul oficial de pe js.stripe.com, fără pachet npm — ca Google Maps), încărcat o singură dată, doar pe
 * pagina de plată și doar când plata cu cardul e pornită. Tipurile de mai jos sunt doar partea din Stripe.js pe care o folosim.
 * Cheia publică (`pk_test_…`) vine de la backend (`GET /payments/config`); cheia secretă nu ajunge niciodată în aplicație.
 */
export const STRIPE_JS = 'https://js.stripe.com/v3/'

export interface StripeError { type?: string; code?: string; message?: string }
export interface StripePaymentIntent { id: string; status: string }
export interface StripeElement { mount(el: HTMLElement): void; destroy(): void; on(event: 'ready' | 'change' | 'loaderror', cb: (e: { complete?: boolean; error?: StripeError }) => void): void }
export interface StripeElements { create(type: 'payment', options?: Record<string, unknown>): StripeElement; submit(): Promise<{ error?: StripeError }> }
export interface StripeInstance {
  elements(options: Record<string, unknown>): StripeElements
  confirmPayment(options: { elements: StripeElements; redirect: 'if_required'; confirmParams?: Record<string, unknown> }):
    Promise<{ error?: StripeError; paymentIntent?: StripePaymentIntent }>
}
type StripeFactory = (key: string, options?: Record<string, unknown>) => StripeInstance

let loading: Promise<StripeFactory> | null = null

export function loadStripeJs(): Promise<StripeFactory> {
  const w = window as unknown as { Stripe?: StripeFactory }
  if (w.Stripe) return Promise.resolve(w.Stripe)
  loading ??= new Promise<StripeFactory>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = STRIPE_JS
    s.async = true
    s.onload = () => (w.Stripe ? resolve(w.Stripe) : reject(new Error('Stripe.js did not load')))
    s.onerror = () => { loading = null; reject(new Error('Stripe.js could not load')) }
    document.head.append(s)
  })
  return loading
}

/** Aspectul formularului de card, ca restul aplicației (Clean Ink): negru, colțuri rotunjite, Inter. */
export const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: { colorPrimary: '#111111', colorText: '#111111', colorDanger: '#B3261E', borderRadius: '12px', fontFamily: 'Inter, system-ui, sans-serif' },
}

/** Rezultatul plății cu cardul, cum îl folosește checkout-ul. */
export type CardResult = { ok: true; paymentIntentId: string } | { ok: false; message?: string }

/** Cardurile de test Stripe pe care le arătăm în aplicație (mod test: niciun ban real). */
export const TEST_CARD = '4242 4242 4242 4242'
