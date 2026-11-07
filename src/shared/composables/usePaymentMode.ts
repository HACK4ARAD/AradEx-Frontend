import { ref } from 'vue'
import { paymentsApi } from '@/shared/api/payments'

/** T25: dacă biletele se plătesc cu cardul (Stripe, mod test) sau cu plata demonstrativă; întrebat o dată pe sesiune. */
const cardOn = ref(false)
let asked: Promise<void> | null = null

/** Pentru textele de lângă bilete („Plată demonstrativă” vs „Plată cu cardul, Stripe în mod test”). */
export function usePaymentMode() {
  asked ??= paymentsApi.config()
    .then((c) => { cardOn.value = c.enabled && !!c.publishableKey })
    .catch(() => { asked = null })
  return { cardOn }
}
