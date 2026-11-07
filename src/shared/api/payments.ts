import { client } from './client'
import type { CheckoutDto, PaymentConfigDto, PaymentConfirm } from '@/shared/types/payments'
import type { TicketDto, TicketRequest } from '@/shared/types/tickets'

/** PaymentsApi din BE (docs/API.md §Plăți, T25): Stripe în mod test, fără bani reali. */
export const paymentsApi = {
  config: () => client.get<PaymentConfigDto>('/payments/config'),
  checkout: (eventId: number, req: TicketRequest) => client.post<CheckoutDto>(`/events/${eventId}/tickets/checkout`, req),
  confirm: (paymentIntentId: string, req: PaymentConfirm = {}) =>
    client.post<TicketDto>(`/payments/${encodeURIComponent(paymentIntentId)}/confirm`, req),
}
