<script setup lang="ts">
// T23 · plata pe web (`/checkout`, ca S5 din aplicație / „Plată demonstrativă” din design/final W6): comanda, e-mailul pentru bilete,
// plata (Stripe în modul de test cu Payment Element, sau demonstrativă: card salvat / nou) și „Plătește”. Logica e comună cu aplicația (`useCheckout`).
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { AppIcon, EmptyState } from '@/shared/components'
import { useEventFormat } from '@/shared/composables/useEvents'
import { useCheckout } from '@/shared/composables/useTicketOrder'

const { t } = useI18n()
const router = useRouter()
const fmt = useEventFormat()
const { order: o, email, method, paying, total, lines, pay, mode, prepareError, prepare, setCardEl, cardReady } = useCheckout()
</script>

<template>
  <div class="max-w-[560px] mx-auto">
    <router-link v-if="o" :to="`/events/${o.event.id}/tickets`" class="inline-flex items-center gap-1 text-muted text-[14px] mb-3 no-underline"><AppIcon name="arrow_back" :size="18" />{{ t('tickets.pick.title') }}</router-link>
    <h1 class="text-[28px] leading-[1.1] tracking-[-0.03em] font-semibold m-0 mb-4">{{ mode === 'STRIPE' ? t('tickets.checkout.stripeTitle') : t('tickets.checkout.drawerTitle') }}</h1>

    <EmptyState v-if="!o" icon="shopping_cart" :title="t('tickets.checkout.emptyTitle')" :text="t('tickets.checkout.emptyText')"
      :action="t('tickets.mine.find')" @action="router.push('/events')" />
    <form v-else class="bg-white border border-line rounded-[16px] p-[18px]" novalidate @submit.prevent="pay">
      <div class="text-[12px] tracking-[.07em] uppercase font-bold text-muted">{{ t('tickets.checkout.yourOrder') }}</div>
      <b class="block text-[16px] mt-1.5">{{ o.event.title }}</b>
      <div class="text-muted text-[14px] mt-0.5">{{ fmt.dateTime(o.event.startAt) }} · {{ o.event.locationName }}</div>
      <div class="rounded-[12px] bg-soft px-3.5 py-3 mt-3.5">
        <div v-for="l in lines" :key="l.label" class="flex justify-between text-[14px] mb-1.5"><span>{{ l.qty }} × {{ l.label }}</span><span>{{ fmt.money(l.qty * l.price) }}</span></div>
        <div class="flex justify-between font-bold text-[15px] border-t border-line pt-2"><span>{{ t('tickets.total') }}</span><span>{{ fmt.money(total) }}</span></div>
      </div>

      <label class="block text-[13px] font-semibold mt-4 mb-1.5" for="pay-email">{{ t('tickets.checkout.email') }}</label>
      <input id="pay-email" v-model="email" type="email" autocomplete="email" inputmode="email" placeholder="nume@exemplu.ro"
        class="w-full h-10 px-3 rounded-[10px] border border-line bg-white outline-none text-[14px] focus:border-ink focus:shadow-[0_0_0_3px_rgba(17,17,17,.08)]">
      <p class="text-muted text-[12.5px] mt-1.5 mb-0">{{ t('tickets.checkout.emailHint') }}</p>

      <div class="text-[13px] font-semibold mt-4 mb-1">{{ t('tickets.checkout.payWith') }}</div>
      <div v-if="prepareError" class="rounded-[12px] bg-bad-soft text-bad px-3.5 py-3 text-[13.5px] flex items-center gap-3">
        <span class="flex-1">{{ prepareError }}</span>
        <button type="button" class="h-8 px-3 rounded-[9px] bg-white border border-line text-ink font-semibold shrink-0" @click="prepare">{{ t('common.retry') }}</button>
      </div>
      <div v-else-if="!mode" class="h-[120px] rounded-[12px] bg-soft animate-pulse" aria-busy="true" />
      <!-- Stripe (modul de test): Payment Element-ul se montează aici -->
      <template v-else-if="mode === 'STRIPE'">
        <div :ref="setCardEl" class="min-h-[120px] pt-1" data-test="stripe-card" />
        <p class="text-muted text-[12.5px] mt-2 mb-0">{{ t('tickets.checkout.stripeTestNote') }}</p>
      </template>
      <div v-else role="radiogroup" :aria-label="t('tickets.checkout.payWith')">
        <button v-for="m in (['saved', 'new'] as const)" :key="m" type="button" role="radio" :aria-checked="method === m"
          class="flex items-center gap-2.5 w-full py-[9px] border-b border-line last:border-b-0 text-[14px] text-left" @click="method = m">
          <AppIcon :name="m === 'saved' ? 'credit_card' : 'add_card'" :size="18" class="text-muted" />
          <span class="flex-1">{{ m === 'saved' ? t('tickets.checkout.savedCard') : t('tickets.checkout.newCard') }}</span>
          <AppIcon :name="method === m ? 'radio_button_checked' : 'radio_button_unchecked'" :size="20" />
        </button>
      </div>

      <button type="submit" class="w-full min-h-12 mt-[18px] rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60" :disabled="paying || !mode || (mode === 'STRIPE' && !cardReady)">
        <AppIcon :name="paying ? 'progress_activity' : 'lock'" :size="20" :class="paying ? 'animate-spin' : ''" />{{ t('tickets.checkout.pay', { total: fmt.money(total) }) }}
      </button>
      <p v-if="mode !== 'STRIPE'" class="text-muted text-[12px] mt-2 mb-0">{{ t('tickets.checkout.drawerNote') }}</p>
    </form>
  </div>
</template>
