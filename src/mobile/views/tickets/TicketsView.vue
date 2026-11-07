<script setup lang="ts">
// T07 · S9 Biletele mele — designul din „AradExperience information architecture” (S9): Viitoare / Trecute; secțiunea
// „Acțiuni, oferte și recompense” (înscrierile la acțiunile comunitare din T11, apoi ofertele revendicate din T10), cu poză,
// firmă, titlu, stare și QR → sheet-ul „Codul tău”; apoi „Bilete cumpărate” (poză, dată, titlu, câte bilete) → S10.
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AppIcon, Skeleton } from '@/shared/components'
import CodeSheet, { type CodeView } from '@/shared/components/tickets/CodeSheet.vue'
import StatusPill from '@/shared/components/tickets/StatusPill.vue'
import EventImage from '@/shared/components/events/EventImage.vue'
import { useMyTickets } from '@/shared/composables/useTickets'
import { useMyRedemptions } from '@/shared/composables/useOffers'
import { aradTodayStart, useMyRegistrations } from '@/shared/composables/useCommunity'
import { communityApi } from '@/shared/api/community'
import { useEventFormat } from '@/shared/composables/useEvents'
import { useFormat } from '@/shared/composables/useFormat'
import { useAuthStore } from '@/shared/stores/auth'
import { useUiStore } from '@/shared/stores/ui'
import type { RedemptionDto } from '@/shared/types/offers'
import type { RegistrationDto } from '@/shared/types/community'
import type { TicketDto } from '@/shared/types/tickets'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const fmt = useEventFormat()
const f = useFormat()
const tab = ref<'up' | 'past'>('up')
const { upcoming, past, loading, offline, error, load } = useMyTickets()
const claims = useMyRedemptions()
const bookings = computed(() => (tab.value === 'up' ? upcoming.value : past.value))
const mine = computed(() => claims.items.value.filter((r) => (tab.value === 'up' ? r.status === 'ISSUED' : r.status !== 'ISSUED')))
/* T11: înscrierile la acțiunile comunitare — Viitoare = de azi încolo (Arad), Trecute = înainte */
const regs = useMyRegistrations()
const myRegs = computed(() => {
  const today = aradTodayStart(f.todayIso())
  return regs.items.value.filter((r) => (new Date(r.actionStartAt).getTime() >= today) === (tab.value === 'up'))
})
const busy = computed(() => loading.value || claims.loading.value || regs.loading.value)
const initials = computed(() => (auth.user?.displayName ?? '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase())
const shown = ref<CodeView | null>(null)

const pill = (r: RedemptionDto) => r.status === 'ISSUED' ? { tone: 'off' as const, label: t('tickets.pill.claimed') }
  : r.status === 'USED' ? { tone: 'no' as const, label: t('tickets.pill.used') } : { tone: 'no' as const, label: t('tickets.pill.cancelled') }
const validity = (r: RedemptionDto) => r.validUntil ? t('tickets.code.validUntil', { d: f.dateTime(r.validUntil + 'T12:00:00Z', false).replace(/^./, (c) => c.toLowerCase()) }) : t('tickets.code.permanent')
function openClaim(r: RedemptionDto) {
  shown.value = { title: r.offerTitle, sub: `${r.businessName} · ${validity(r)}`, code: r.code, pill: r.status === 'ISSUED' ? undefined : pill(r) }
}
const regPill = (r: RegistrationDto) => r.status === 'CONFIRMED' ? { tone: 'ok' as const, label: t('community.tickets.confirmed', { n: r.pointsReward }) }
  : r.status === 'NO_SHOW' ? { tone: 'no' as const, label: t('community.tickets.rejected') } : { tone: 'pending' as const, label: t('community.tickets.pending') }
const leaving = ref(false)
async function leave(r: RegistrationDto) {
  if (leaving.value) return
  leaving.value = true
  try {
    await communityApi.cancel(r.actionId)
    shown.value = null
    await regs.load()
    ui.toast(t('community.action.cancelledToast'), 'success')
  } catch (e) { ui.error(e) } finally { leaving.value = false }
}
function openReg(r: RegistrationDto) {
  shown.value = {
    title: r.actionTitle, sub: `${f.dateTime(r.actionStartAt)} · ${r.locationName}`, code: r.code, note: t('community.tickets.note'), pill: regPill(r),
    action: r.status === 'REGISTERED' ? { label: t('community.tickets.leave'), onClick: () => void leave(r), get busy() { return leaving.value } } : undefined,
  }
}
const count = (tk: TicketDto) => tk.ticketType === 'FREE' ? t('tickets.registration') : t('tickets.count', tk.qtyAdult + tk.qtyChild)
onMounted(async () => { void regs.load(); await load(); if (error.value) ui.toast(error.value, 'error') })
</script>

<template>
  <div class="flex flex-col gap-[18px]">
    <div class="flex items-center justify-between gap-3 mt-2">
      <h1 class="text-[32px] leading-[1.08] font-semibold tracking-[-0.035em] m-0">{{ t('tickets.mine.title') }}</h1>
      <router-link to="/profile" class="w-11 h-11 shrink-0 rounded-full bg-ink text-white text-[17px] font-bold flex items-center justify-center no-underline" :aria-label="t('nav.profile')">{{ initials }}</router-link>
    </div>

    <div class="flex gap-1 p-1 rounded-[16px] bg-soft" role="tablist">
      <button v-for="k in (['up', 'past'] as const)" :key="k" type="button" role="tab" :aria-selected="tab === k" class="flex-1 min-h-11 rounded-xl text-[15px] transition-colors"
        :class="tab === k ? 'bg-white text-ink font-semibold shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'text-muted font-medium'" @click="tab = k">{{ k === 'up' ? t('tickets.mine.upcoming') : t('tickets.mine.past') }}</button>
    </div>

    <!-- Acțiuni, oferte și recompense -->
    <div v-if="mine.length || myRegs.length" class="flex flex-col gap-2.5">
      <div class="text-[14px] font-semibold text-muted">{{ t('tickets.mine.mineSection') }}</div>
      <!-- T11: înscrierile la acțiunile comunitare (prototipul IA: poză, titlu, dată · oră, starea validării) -->
      <button v-for="r in myRegs" :key="'c' + r.id" type="button" class="flex gap-3.5 items-center w-full text-left bg-white rounded-[20px] p-3 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] active:scale-[.98] transition-transform"
        @click="openReg(r)">
        <span class="w-16 h-16 shrink-0 rounded-[14px] bg-green-deep bg-cover bg-center flex items-center justify-center" :style="r.actionImageUrl ? { backgroundImage: `url('${r.actionImageUrl}')` } : undefined">
          <AppIcon v-if="!r.actionImageUrl" name="volunteer_activism" :size="28" class="text-white/95" />
        </span>
        <span class="flex-1 min-w-0 flex flex-col gap-1">
          <span class="text-[13px] text-muted font-medium">{{ f.dateTime(r.actionStartAt) }}</span>
          <span class="text-[16px] font-semibold leading-[1.3]">{{ r.actionTitle }}</span>
          <StatusPill :tone="regPill(r).tone" :label="regPill(r).label" />
        </span>
        <AppIcon name="qr_code_2" :size="24" class="text-muted" />
      </button>
      <button v-for="r in mine" :key="r.id" type="button" class="flex gap-3.5 items-center w-full text-left bg-white rounded-[20px] p-3 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] active:scale-[.98] transition-transform"
        @click="openClaim(r)">
        <span class="w-16 h-16 shrink-0 rounded-[14px] bg-[#8A6A4F] bg-cover bg-center flex items-center justify-center" :style="r.offerImageUrl ? { backgroundImage: `url('${r.offerImageUrl}')` } : undefined">
          <AppIcon v-if="!r.offerImageUrl" name="sell" :size="28" class="text-white/95" />
        </span>
        <span class="flex-1 min-w-0 flex flex-col gap-1">
          <span class="text-[13px] text-muted font-medium">{{ r.businessName }}<template v-if="r.pointsSpent > 0"> · {{ t('offers.claimed.paid', { n: r.pointsSpent }) }}</template></span>
          <span class="text-[16px] font-semibold leading-[1.3]">{{ r.offerTitle }}</span>
          <StatusPill :tone="pill(r).tone" :label="pill(r).label" />
        </span>
        <AppIcon name="qr_code_2" :size="24" class="text-muted" />
      </button>
    </div>

    <div v-if="offline" role="status" class="flex gap-2.5 items-center px-3.5 py-3 rounded-[14px] bg-white border border-line text-[14px] leading-[1.45]"><AppIcon name="wifi_off" :size="20" />{{ t('tickets.mine.offlineShown') }}</div>

    <Skeleton v-if="busy && !bookings.length && !mine.length && !myRegs.length" :rows="2" :height="88" />

    <!-- Bilete cumpărate -->
    <div v-if="bookings.length" class="flex flex-col gap-2.5">
      <div v-if="mine.length || myRegs.length" class="text-[14px] font-semibold text-muted mt-2">{{ t('tickets.mine.bookings') }}</div>
      <router-link v-for="tk in bookings" :key="tk.code" :to="`/tickets/${tk.code}`" class="flex gap-3.5 items-center w-full bg-white rounded-[20px] p-3 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] no-underline text-ink active:scale-[.98] transition-transform">
        <EventImage :src="tk.imageUrl" category="CONCERT" :emoji-size="28" class="w-16 h-16 shrink-0 rounded-[14px] overflow-hidden" />
        <span class="flex-1 min-w-0 flex flex-col gap-[3px]">
          <span class="text-[13px] text-muted font-medium">{{ fmt.dateTime(tk.startAt) }}</span>
          <span class="text-[16px] font-semibold leading-[1.3]">{{ tk.eventTitle }}</span>
          <span class="text-[13px] text-muted">{{ count(tk) }}</span>
        </span>
        <AppIcon name="chevron_right" class="text-muted" />
      </router-link>
    </div>

    <!-- gol -->
    <template v-if="!busy && !bookings.length && !mine.length && !myRegs.length">
      <div v-if="tab === 'up'" class="bg-white rounded-[20px] px-[22px] py-8 flex flex-col items-center text-center gap-2.5">
        <AppIcon name="confirmation_number" :size="36" />
        <div class="text-[19px] font-semibold">{{ t('tickets.mine.emptyUp') }}</div>
        <div class="text-[15px] leading-[1.5] text-muted">{{ t('tickets.mine.emptyText') }}</div>
        <button type="button" class="mt-2 w-full min-h-[52px] rounded-[16px] bg-ink text-white text-[16px] font-semibold" @click="router.push('/')">{{ t('tickets.mine.find') }}</button>
      </div>
      <div v-else class="px-3 py-7 text-center text-[15px] text-muted">{{ t('tickets.mine.emptyPastText') }}</div>
    </template>
  </div>

  <CodeSheet :item="shown" @close="shown = null" />
</template>
