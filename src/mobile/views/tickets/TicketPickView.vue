<script setup lang="ts">
// T07 · S4 Alege biletele — design/final `/event/:id/tickets`: Adult / Copil cu stepper, nota „nu trebuie printate”, total jos.
// Pentru un eveniment gratuit cu locuri (înscriere) ecranul nu e necesar: S3 înscrie direct.
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import { useEventDetail } from '@/shared/composables/useEventDetail'
import { useEventFormat } from '@/shared/composables/useEvents'
import { orderTotal } from '@/shared/composables/useTickets'
import { useBack } from '@/shared/composables/useBack'
import { useTicketOrderStore } from '@/shared/stores/ticketOrder'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const fmt = useEventFormat()
const store = useTicketOrderStore()
const id = computed(() => Number(route.params.id))
const back = useBack(`/m/events/${id.value}`)
const { event: e, loading, notFound } = useEventDetail(id)
const qty = reactive({ adult: 1, child: 0 })

watch(e, (ev) => {
  if (ev && store.order?.event.id === ev.id) { qty.adult = store.order.adult; qty.child = store.order.child }
}, { immediate: true })

const n = computed(() => qty.adult + qty.child)
const total = computed(() => orderTotal(qty.adult, qty.child, e.value?.priceAdult, e.value?.priceChild))
const left = computed(() => e.value?.spotsLeft ?? null)
const tooMany = computed(() => left.value != null && n.value > left.value)
const ended = computed(() => !!e.value && new Date(e.value.endAt ?? e.value.startAt).getTime() < Date.now())
const types = computed(() => [
  { key: 'adult' as const, label: t('tickets.adult'), price: e.value?.priceAdult },
  ...(e.value?.priceChild != null ? [{ key: 'child' as const, label: t('tickets.child'), price: e.value.priceChild }] : []),
])
function step(k: 'adult' | 'child', d: number) { qty[k] = Math.max(0, Math.min(10, qty[k] + d)) }
function next() {
  if (!e.value || n.value === 0 || tooMany.value) return
  store.set({ event: e.value, adult: qty.adult, child: qty.child })
  router.push('/m/checkout')
}
</script>

<template>
  <div class="flex items-center gap-1 -ml-2.5 pt-2 mb-3.5">
    <button type="button" class="w-11 h-11 rounded-full flex items-center justify-center" :aria-label="t('common.back')" @click="back"><AppIcon name="arrow_back" /></button>
    <h1 class="flex-1 text-[24px] font-semibold tracking-[-0.03em] m-0">{{ t('tickets.pick.title') }}</h1>
  </div>
  <Skeleton v-if="loading && !e" :rows="3" :height="60" />
  <EmptyState v-else-if="notFound || !e" icon="event_busy" :title="t('events.detail.notFound')" />
  <template v-else>
    <p class="text-muted text-[15px] -mt-1 mb-[18px]">{{ e.title }}<br>{{ e.locationName }}</p>
    <div class="text-[13px] font-semibold mb-2">{{ t('tickets.pick.dateTime') }}</div>
    <!-- design/final `.opt.on`: data și ora alese (evenimentele au o singură dată în model) -->
    <div class="flex items-center justify-between gap-3 w-full min-h-[60px] px-[17px] py-[9px] rounded-[16px] bg-white border-2 border-ink mb-[22px]" role="radio" aria-checked="true">
      <span><b class="text-[16px]">{{ fmt.dateTime(e.startAt) }}</b><template v-if="left != null && left > 0 && left <= 5"><br><span class="text-muted text-[13px]">{{ t('tickets.pick.lastSpots', { n: left }) }}</span></template></span>
      <span class="w-[22px] h-[22px] rounded-full border-[7px] border-ink shrink-0" />
    </div>
    <div class="text-[13px] font-semibold mb-1">{{ t('tickets.pick.label') }}</div>
    <div v-for="ty in types" :key="ty.key" class="flex items-center justify-between gap-3 py-3.5 border-b border-line last:border-b-0">
      <div><div class="text-[15.5px] font-semibold">{{ ty.label }}</div><div class="text-[13px] text-muted mt-0.5">{{ fmt.money(ty.price) }}</div></div>
      <div class="flex items-center gap-3.5">
        <button type="button" class="w-11 h-11 rounded-full border border-line bg-white flex items-center justify-center disabled:opacity-40" :aria-label="`${t('tickets.less')} · ${ty.label}`" :disabled="qty[ty.key] === 0" @click="step(ty.key, -1)"><AppIcon name="remove" :size="18" /></button>
        <b class="min-w-3.5 text-center text-[18px]" aria-live="polite">{{ qty[ty.key] }}</b>
        <button type="button" class="w-11 h-11 rounded-full border border-line bg-white flex items-center justify-center disabled:opacity-40" :aria-label="`${t('tickets.more')} · ${ty.label}`" :disabled="qty[ty.key] === 10" @click="step(ty.key, 1)"><AppIcon name="add" :size="18" /></button>
      </div>
    </div>
    <div class="flex gap-2.5 mt-3.5 px-3.5 py-3 rounded-[14px] bg-soft text-muted text-[13.5px] leading-[1.45]"><AppIcon name="smartphone" :size="18" /><span>{{ t('tickets.pick.noPaper') }}</span></div>
    <div v-if="ended" class="flex gap-2.5 mt-2.5 px-3.5 py-3 rounded-[14px] bg-[#FDECE8] text-[#A3270E] text-[13.5px]" role="alert"><AppIcon name="error" :size="18" /><span>{{ t('tickets.pick.ended') }}</span></div>
    <div v-else-if="left === 0" class="flex gap-2.5 mt-2.5 px-3.5 py-3 rounded-[14px] bg-[#FDECE8] text-[#A3270E] text-[13.5px]" role="alert"><AppIcon name="error" :size="18" /><span>{{ t('tickets.pick.soldOut') }}</span></div>
    <div v-else-if="tooMany" class="flex gap-2.5 mt-2.5 px-3.5 py-3 rounded-[14px] bg-[#FDECE8] text-[#A3270E] text-[13.5px]" role="alert"><AppIcon name="error" :size="18" /><span>{{ t('tickets.pick.onlyLeft', { n: left }) }}</span></div>
    <div class="h-[110px]" />

    <div class="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[480px] z-40 px-5 pt-3 pb-[max(30px,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur border-t border-line flex items-center gap-3">
      <div class="shrink-0"><small class="block text-[12px] text-muted">{{ t('tickets.total') }} · {{ t('tickets.count', n) }}</small><b class="text-[18px]">{{ total ? fmt.money(total) : '0 lei' }}</b></div>
      <button type="button" class="flex-1 min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold disabled:opacity-45" :disabled="n === 0 || tooMany || ended || left === 0" @click="next">{{ t('tickets.pick.continue') }}</button>
    </div>
  </template>
</template>
