<script setup lang="ts">
/**
 * T25 · formularul de card Stripe (Payment Element) pentru plata biletelor, în mod test. Se montează când are `clientSecret`
 * (PaymentIntent-ul creat de backend); `confirm()` (expus părintelui) trimite plata la Stripe fără redirect și întoarce
 * rezultatul. Cardurile de test (ex. 4242 4242 4242 4242) sunt scrise sub formular.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { STRIPE_APPEARANCE, TEST_CARD, loadStripeJs, type CardResult, type StripeElement, type StripeElements, type StripeInstance } from '@/shared/composables/useStripe'

const props = defineProps<{ publishableKey: string; clientSecret: string }>()
const emit = defineEmits<{ ready: []; failed: [message: string] }>()
const { t, locale } = useI18n()
const el = ref<HTMLDivElement | null>(null)
const state = ref<'loading' | 'ready' | 'error'>('loading')

let stripe: StripeInstance | null = null
let elements: StripeElements | null = null
let payment: StripeElement | null = null

onMounted(async () => {
  try {
    const Stripe = await loadStripeJs()
    stripe = Stripe(props.publishableKey, { locale: locale.value === 'en' ? 'en' : 'ro' })
    elements = stripe.elements({ clientSecret: props.clientSecret, appearance: STRIPE_APPEARANCE, locale: locale.value === 'en' ? 'en' : 'ro' })
    payment = elements.create('payment', { layout: 'tabs' })
    payment.on('ready', () => { state.value = 'ready'; emit('ready') })
    // cheie publică greșită, rețea blocată etc.: Stripe nu mai trimite `ready`, deci arătăm eroarea în loc de „se încarcă”
    payment.on('loaderror', () => { state.value = 'error'; emit('failed', t('tickets.checkout.stripe.loadError')) })
    if (el.value) payment.mount(el.value)
  } catch {
    state.value = 'error'
    emit('failed', t('tickets.checkout.stripe.loadError'))
  }
})

onBeforeUnmount(() => payment?.destroy())

/** Trimite plata la Stripe (3-D Secure apare peste pagină, dacă banca de test o cere). */
async function confirm(): Promise<CardResult> {
  if (!stripe || !elements || state.value !== 'ready') return { ok: false, message: t('tickets.checkout.stripe.notReady') }
  // PaymentIntent-ul e doar pentru card: fără metode cu redirect, deci nu se pleacă de pe pagină
  const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
  if (error) return { ok: false, message: error.message }
  if (!paymentIntent) return { ok: false }
  return { ok: true, paymentIntentId: paymentIntent.id }
}

defineExpose({ confirm })
</script>

<template>
  <div>
    <div v-show="state !== 'error'" ref="el" class="min-h-[120px]" data-test="stripe-element" />
    <div v-if="state === 'loading'" class="text-muted text-[13px] flex items-center gap-2 py-2"><AppIcon name="progress_activity" :size="18" class="animate-spin" />{{ t('tickets.checkout.stripe.loading') }}</div>
    <div v-else-if="state === 'error'" class="text-bad text-[13px] py-2">{{ t('tickets.checkout.stripe.loadError') }}</div>
    <p class="mt-3 mb-0 rounded-[12px] bg-soft px-3 py-2.5 text-[12.5px] text-muted leading-[1.5]" data-test="stripe-test-note">
      <AppIcon name="science" :size="16" class="align-[-3px] mr-1" />{{ t('tickets.checkout.stripe.testNote', { card: TEST_CARD }) }}
    </p>
  </div>
</template>
