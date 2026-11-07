<script setup lang="ts">
// T07 · sertarele din W6 / Contul meu (design/final ACT.buy + ACT.showTicket): plata demonstrativă și biletul pe tot ecranul.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet } from '@/shared/components'
import TicketStub from '@/shared/components/tickets/TicketStub.vue'
import { ticketsApi } from '@/shared/api/tickets'
import { useEventFormat } from '@/shared/composables/useEvents'
import { cacheTicket, orderTotal, useTicketErrors } from '@/shared/composables/useTickets'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { EventDto } from '@/shared/types/events'
import type { TicketDto } from '@/shared/types/tickets'

const props = defineProps<{ event?: EventDto; adult?: number; child?: number }>()
const payOpen = defineModel<boolean>('pay', { default: false })
const ticket = defineModel<TicketDto | null>('ticket', { default: null })
const emit = defineEmits<{ bought: [t: TicketDto] }>()
const { t } = useI18n()
const fmt = useEventFormat()
const auth = useAuthStore()
const ui = useUiStore()
const errorText = useTicketErrors()
const email = ref(auth.user?.email ?? '')
const method = ref<'saved' | 'new'>('saved')
const paying = ref(false)
const showTicket = computed({ get: () => !!ticket.value, set: (v: boolean) => { if (!v) ticket.value = null } })
watch(payOpen, (v) => { if (v) email.value = auth.user?.email ?? '' })

const total = computed(() => orderTotal(props.adult ?? 0, props.child ?? 0, props.event?.priceAdult, props.event?.priceChild))
const lines = computed(() => [
  { label: t('tickets.adult'), qty: props.adult ?? 0, price: props.event?.priceAdult ?? 0 },
  { label: t('tickets.childShort'), qty: props.child ?? 0, price: props.event?.priceChild ?? 0 },
].filter((l) => l.qty > 0))

async function pay() {
  if (!props.event || paying.value) return
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) { ui.toast(t('tickets.checkout.badEmail'), 'error'); return }
  paying.value = true
  try {
    const tk = await ticketsApi.buy(props.event.id, { qtyAdult: props.adult ?? 0, qtyChild: props.child ?? 0, email: email.value.trim() })
    if (auth.user) cacheTicket(auth.user.id, tk)
    payOpen.value = false
    ticket.value = tk
    ui.toast(t('tickets.checkout.confirmedToast'), 'success')
    emit('bought', tk)
  } catch (err) {
    ui.toast(errorText(err), 'error')
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <AppSheet v-model:open="payOpen" :title="t('tickets.checkout.drawerTitle')">
    <template v-if="event">
      <div class="text-muted text-[14.5px] -mt-1.5">{{ event.title }} · {{ fmt.dateTime(event.startAt) }}</div>
      <div class="bg-white border border-line rounded-[16px] p-[18px] my-4">
        <div v-for="l in lines" :key="l.label" class="flex justify-between text-[14px] mb-1.5"><span>{{ l.qty }} × {{ l.label }}</span><span>{{ fmt.money(l.qty * l.price) }}</span></div>
        <div class="flex justify-between font-bold border-t border-line pt-2"><span>{{ t('tickets.total') }}</span><span>{{ fmt.money(total) }}</span></div>
      </div>
      <form novalidate @submit.prevent="pay">
        <label class="flex flex-col gap-1.5"><span class="font-semibold text-[13px]">{{ t('tickets.checkout.email') }}</span>
          <input v-model="email" type="email" autocomplete="email" class="h-10 rounded-[10px] border border-line bg-white px-3 outline-none text-[14px] focus:border-ink"></label>
        <div class="flex flex-col gap-1.5 mt-3">
          <span class="font-semibold text-[13px]">{{ t('tickets.checkout.payWith') }}</span>
          <button v-for="m in (['saved', 'new'] as const)" :key="m" type="button" role="radio" :aria-checked="method === m" class="flex items-center gap-2.5 py-[9px] border-b border-line last:border-b-0 text-[13.5px] text-left" @click="method = m">
            <AppIcon :name="m === 'saved' ? 'credit_card' : 'add_card'" :size="18" class="text-muted" />{{ m === 'saved' ? t('tickets.checkout.savedCard') : t('tickets.checkout.newCard') }}
            <span class="flex-1" /><AppIcon :name="method === m ? 'radio_button_checked' : 'radio_button_unchecked'" :size="18" />
          </button>
        </div>
        <button type="submit" class="w-full h-12 mt-[18px] rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60" :disabled="paying">
          <AppIcon name="lock" :size="18" />{{ t('tickets.checkout.pay', { total: fmt.money(total) }) }}
        </button>
        <div class="text-muted text-[12px] mt-2">{{ t('tickets.checkout.drawerNote') }}</div>
      </form>
    </template>
  </AppSheet>

  <AppSheet v-model:open="showTicket" :title="ticket?.ticketType === 'FREE' ? t('tickets.ticket.registration') : t('tickets.ticket.title')">
    <template v-if="ticket">
      <div class="text-muted text-[14.5px] -mt-1.5">{{ ticket.eventTitle }}<br>{{ fmt.when(ticket) }} · {{ ticket.locationName }}</div>
      <TicketStub :ticket="ticket" :qr-size="200" web class="my-4" />
      <div class="flex gap-2 flex-wrap">
        <a :href="ticketsApi.icsUrl(ticket.eventId)" class="h-10 px-4 rounded-[12px] border border-line bg-white font-semibold text-[14px] inline-flex items-center gap-1.5 no-underline text-ink"><AppIcon name="event_available" :size="16" />{{ t('tickets.mine.calendar') }}</a>
        <button type="button" class="h-10 px-4 rounded-[12px] border border-line bg-white font-semibold text-[14px] inline-flex items-center gap-1.5" @click="ui.toast(t('tickets.ticket.sendPhoneSoon'))"><AppIcon name="smartphone" :size="16" />{{ t('tickets.ticket.sendPhone') }}</button>
        <router-link to="/account/tickets" class="h-10 px-4 rounded-[12px] border border-line bg-white font-semibold text-[14px] inline-flex items-center no-underline text-ink" @click="showTicket = false">{{ t('tickets.ticket.account') }}</router-link>
      </div>
    </template>
  </AppSheet>
</template>
