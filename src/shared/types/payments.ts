// Plăți · T25. Oglinda DTO-urilor din docs/API.md §Plăți; se schimbă în același PR cu secțiunea din API.md.

/** GET /payments/config — `enabled` = plata cu cardul prin Stripe (mod test) e pornită; cheia publică doar atunci. */
export interface PaymentConfigDto { enabled: boolean; publishableKey?: string; currency: string; testMode: boolean }

/** POST /events/{id}/tickets/checkout — PaymentIntent-ul Stripe pentru comandă; `amount` în lei. */
export interface CheckoutDto { paymentIntentId: string; clientSecret: string; amount: number; currency: string }

/** POST /payments/{paymentIntentId}/confirm */
export interface PaymentConfirm { email?: string }
