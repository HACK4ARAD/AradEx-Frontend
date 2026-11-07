// Plăți · T25. Oglinda DTO-urilor din docs/API.md §Plăți; se schimbă în același PR cu secțiunea din API.md.

/** GET /payments/config — `cardPayments` = biletele se plătesc cu cardul prin Stripe (mod test); altfel plata demonstrativă. */
export interface PaymentConfigDto { cardPayments: boolean; currency: string; testMode: boolean }
