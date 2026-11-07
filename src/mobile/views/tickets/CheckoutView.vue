<script setup lang="ts">
// T07 · S5 Plată — design/final `/checkout`: comanda, e-mailul pentru bilete, metoda (card salvat / nou), plată demonstrativă.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState } from '@/shared/components'
import { ticketsApi } from '@/shared/api/tickets'
import { useEventFormat } from '@/shared/composables/useEvents'
import { cacheTicket, orderTotal, useTicketErrors } from '@/shared/composables/useTickets'
import { useBack } from '@/shared/composables/useBack'
import { useAuthStore } from '@/shared/stores/auth'
import { useTicketOrderStore } from '@/shared/stores/ticketOrder'
import { useUiStore } from '@/shared/stores/ui'

const router = useRouter()
const { t } = useI18n()
const fmt = useEventFormat()
const auth = useAuthStore()
const ui = useUiStore()
const store = useTicketOrderStore()
const errorText = useTicketErrors()
const o = computed(() => store.order)
const back = useBack(o.value ? `/events/${o.value.event.id}/tickets` : '/')
const email = ref(auth.user?.email ?? '')
const method = ref<'saved' | 'new'>('saved')
const paying = ref(false)
const total = computed(() => (o.value ? orderTotal(o.value.adult, o.value.child, o.value.event.priceAdult, o.value.event.priceChild) : 0))
const lines = computed(() => !o.value ? [] : [
  { label: t('tickets.adult'), qty: o.value.adult, price: o.value.event.priceAdult ?? 0 },
  { label: t('tickets.childShort'), qty: o.value.child, price: o.value.event.priceChild ?? 0 },
].filter((l) => l.qty > 0))

async function pay() {
  if (!o.value || paying.value) return
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) { ui.toast(t('tickets.checkout.badEmail'), 'error'); return }
  paying.value = true
  try {
    const ticket = await ticketsApi.buy(o.value.event.id, { qtyAdult: o.value.adult, qtyChild: o.value.child, email: email.value.trim() })
    if (auth.user) cacheTicket(auth.user.id, ticket)
    store.clear()
    await router.replace(`/confirm/${ticket.code}`)
  } catch (err) {
    ui.toast(errorText(err), 'error')
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-1 -ml-2.5 pt-2 mb-3.5">
    <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="flex-1 text-[24px] font-semibold tracking-[-0.03em] m-0">{{ t('tickets.checkout.title') }}</h1>
  </div>
  <EmptyState v-if="!o" icon="shopping_cart" :title="t('tickets.checkout.emptyTitle')" :text="t('tickets.checkout.emptyText')" />
  <form v-else novalidate @submit.prevent="pay">
    <div class="bg-white rounded-[20px] border border-line shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] p-4">
      <div class="text-[12px] tracking-[.07em] uppercase font-bold text-muted">{{ t('tickets.checkout.yourOrder') }}</div>
      <h3 class="text-[17px] font-semibold mt-1.5 mb-1">{{ o.event.title }}</h3>
      <p class="text-muted text-[14px] m-0">{{ fmt.dateTime(o.event.startAt) }}<br>{{ o.event.locationName }}</p>
      <div class="h-px bg-line my-3" />
      <div v-for="l in lines" :key="l.label" class="flex justify-between text-[15px] mb-1.5"><span>{{ l.qty }} × {{ l.label }}</span><span>{{ fmt.money(l.qty * l.price) }}</span></div>
      <div class="flex justify-between font-bold text-[16px]"><span>{{ t('tickets.total') }}</span><span>{{ fmt.money(total) }}</span></div>
    </div>

    <label class="block text-[13px] font-semibold mt-5 mb-2" for="pay-email">{{ t('tickets.checkout.email') }}</label>
    <input id="pay-email" v-model="email" type="email" autocomplete="email" inputmode="email" placeholder="nume@exemplu.ro"
      class="w-full h-[54px] px-4 rounded-[16px] border border-line bg-white outline-none text-[16px] focus:border-ink focus:shadow-[0_0_0_3px_rgba(17,17,17,.08)]">
    <p class="text-muted text-[13px] mt-1.5 mb-0">{{ t('tickets.checkout.emailHint') }}</p>

    <div class="text-[13px] font-semibold mt-[18px] mb-2">{{ t('tickets.checkout.payWith') }}</div>
    <div class="flex flex-col gap-2.5" role="radiogroup" :aria-label="t('tickets.checkout.payWith')">
      <button v-for="m in (['saved', 'new'] as const)" :key="m" type="button" role="radio" :aria-checked="method === m"
        class="flex items-center justify-between gap-3 w-full min-h-[60px] px-[18px] py-2.5 rounded-[16px] bg-white text-left"
        :class="method === m ? 'border-2 border-ink px-[17px]' : 'border border-line'" @click="method = m">
        <span class="flex items-center gap-2.5"><AppIcon :name="m === 'saved' ? 'credit_card' : 'add_card'" />{{ m === 'saved' ? t('tickets.checkout.savedCard') : t('tickets.checkout.newCard') }}</span>
        <span class="w-[22px] h-[22px] rounded-full shrink-0" :class="method === m ? 'border-[7px] border-ink' : 'border-[1.5px] border-[#8C8C86]'" />
      </button>
    </div>
    <p class="text-muted text-[12.5px] leading-[1.5] mt-4">{{ t('tickets.checkout.demoNote') }}</p>
    <div class="h-[110px]" />

    <div class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-40 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-line flex">
      <button type="submit" class="flex-1 min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60" :disabled="paying">
        <AppIcon name="lock" :size="18" />{{ t('tickets.checkout.pay', { total: fmt.money(total) }) }}
      </button>
    </div>
  </form>
</template>
