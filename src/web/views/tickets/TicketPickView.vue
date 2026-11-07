<script setup lang="ts">
// T23 · alegerea biletelor pe web (`/events/:id/tickets`, ca S4 din aplicație): card centrat cu evenimentul, data și ora,
// Adult / Copil cu stepper, totalul și „Continuă spre plată”. Logica e comună cu aplicația (`useTicketPick`).
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePaymentMode } from '@/shared/composables/usePaymentMode'
import { AppIcon, EmptyState, Skeleton } from '@/shared/components'
import TicketQtyRows from '@/shared/components/tickets/TicketQtyRows.vue'
import { useEventDetail } from '@/shared/composables/useEventDetail'
import { useEventFormat } from '@/shared/composables/useEvents'
import { useTicketPick } from '@/shared/composables/useTicketOrder'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { cardOn } = usePaymentMode()
const fmt = useEventFormat()
const id = computed(() => Number(route.params.id))
const { event: e, loading, notFound, reload } = useEventDetail(id)
const { qty, n, total, left, tooMany, ended, kinds, blocked, step, commit } = useTicketPick(e)
function next() {
  if (commit()) void router.push('/checkout')
}
const alert = 'flex gap-2 items-start px-3 py-2.5 rounded-[12px] bg-bad-soft text-bad text-[13px] mt-3'
</script>

<template>
  <div class="max-w-[560px] mx-auto">
    <router-link :to="`/events/${id}`" class="inline-flex items-center gap-1 text-muted text-[14px] mb-3 no-underline"><AppIcon name="arrow_back" :size="18" />{{ e?.title ?? t('common.back') }}</router-link>
    <h1 class="text-[28px] leading-[1.1] tracking-[-0.03em] font-semibold m-0 mb-4">{{ t('tickets.pick.title') }}</h1>

    <Skeleton v-if="loading && !e" :rows="2" :height="120" />
    <EmptyState v-else-if="notFound || !e" icon="event_busy" :title="t('events.detail.notFound')"
      :action="notFound ? t('events.detail.breadcrumb') : t('common.retry')" @action="notFound ? router.push('/events') : reload()" />
    <div v-else class="bg-white border border-line rounded-[16px] p-[18px]">
      <b class="block text-[16px]">{{ e.title }}</b>
      <div class="text-muted text-[14px] mt-0.5">{{ e.locationName }}</div>

      <div class="text-[13px] font-semibold mt-4 mb-2">{{ t('tickets.pick.dateTime') }}</div>
      <div class="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[12px] border-2 border-ink" role="radio" aria-checked="true">
        <span><b class="text-[15px]">{{ fmt.dateTime(e.startAt) }}</b><template v-if="left != null && left > 0 && left <= 5"><br><span class="text-muted text-[13px]">{{ t('tickets.pick.lastSpots', { n: left }) }}</span></template></span>
        <span class="w-[18px] h-[18px] rounded-full border-[6px] border-ink shrink-0" />
      </div>

      <div class="text-[13px] font-semibold mt-4 mb-1">{{ t('tickets.pick.label') }}</div>
      <TicketQtyRows :kinds="kinds" :qty="qty" @step="step" />
      <div class="flex justify-between text-[16px] mt-3"><b>{{ t('tickets.total') }} · {{ t('tickets.count', n) }}</b><b>{{ fmt.money(total) }}</b></div>

      <div class="flex gap-2 items-start px-3 py-2.5 rounded-[12px] bg-soft text-muted text-[13px] mt-3"><AppIcon name="smartphone" :size="18" /><span>{{ t('tickets.pick.noPaper') }}</span></div>
      <div v-if="ended" :class="alert" role="alert"><AppIcon name="error" :size="18" /><span>{{ t('tickets.pick.ended') }}</span></div>
      <div v-else-if="left === 0" :class="alert" role="alert"><AppIcon name="error" :size="18" /><span>{{ t('tickets.pick.soldOut') }}</span></div>
      <div v-else-if="tooMany" :class="alert" role="alert"><AppIcon name="error" :size="18" /><span>{{ t('tickets.pick.onlyLeft', { n: left }) }}</span></div>

      <button type="button" class="w-full min-h-12 mt-4 rounded-[14px] bg-ink text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-45" :disabled="blocked" @click="next">
        <AppIcon name="lock" :size="20" />{{ t('tickets.pick.continue') }}
      </button>
      <p class="text-muted text-[12px] text-center mt-2 mb-0">{{ cardOn ? t('tickets.webPayNoteCard') : t('tickets.webPayNote') }}</p>
    </div>
  </div>
</template>
