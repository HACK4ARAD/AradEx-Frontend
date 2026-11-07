import { client } from './client'
import type { PaymentConfigDto } from '@/shared/types/payments'

/** PaymentsApi din BE (docs/API.md §Plăți, T25). Plata însăși e în `ticketsApi` (`preparePayment`, `buy` cu `paymentIntentId`). */
export const paymentsApi = {
  config: () => client.get<PaymentConfigDto>('/payments/config'),
}
