<script setup lang="ts">
// T11 · secțiunea „Acțiuni comunitare” din Bilete (S9, design/final `/tickets`): QR mic, acțiunea, data · ora · +puncte și starea
// (Așteaptă validarea pe teren / Prezență confirmată / Respins); atingerea deschide QR-ul mare în sheet. `when` = Viitoare
// (de azi încolo) sau Trecute. Emite `count` ca ecranul să știe dacă are ce arăta (ca ClaimedOffers din T10).
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon, AppSheet } from '@/shared/components'
import QrCode from '@/shared/components/qr/QrCode.vue'
import RegistrationTicket from './RegistrationTicket.vue'
import { useFormat } from '@/shared/composables/useFormat'
import { aradTodayStart, useMyRegistrations } from '@/shared/composables/useCommunity'
import type { RegistrationDto } from '@/shared/types/community'

const props = defineProps<{ when: 'up' | 'past' }>()
const emit = defineEmits<{ count: [n: number] }>()
const { t } = useI18n()
const f = useFormat()
const { items, load } = useMyRegistrations()
onMounted(load)

const shown = computed(() => {
  const today = aradTodayStart(f.todayIso())
  return items.value.filter((r) => (new Date(r.actionStartAt).getTime() >= today) === (props.when === 'up'))
})
const open = ref<RegistrationDto | null>(null)
const sheet = computed({ get: () => open.value != null, set: (v: boolean) => { if (!v) open.value = null } })
watch(() => shown.value.length, (n) => emit('count', n), { immediate: true })
const tone = (r: RegistrationDto) => (r.status === 'CONFIRMED' ? 'bg-green text-white' : r.status === 'NO_SHOW' ? 'bg-bad-soft text-bad' : 'bg-soft text-muted')
</script>

<template>
  <template v-if="shown.length">
    <h3 class="text-[16px] font-semibold mt-3.5 mb-2">{{ t('community.tickets.title') }}</h3>
    <button v-for="r in shown" :key="r.id" type="button" class="w-full bg-white rounded-[16px] p-3.5 mb-2.5 flex items-center gap-3.5 text-left" @click="open = r">
      <QrCode :value="r.code" :size="56" class="shrink-0" />
      <span class="min-w-0 flex-1">
        <b class="block text-[15.5px] leading-tight">{{ r.actionTitle }}</b>
        <span class="block text-[13px] text-muted">{{ f.dateTime(r.actionStartAt) }} · {{ t('community.card.points', { n: r.pointsReward }) }}</span>
        <span class="inline-flex items-center gap-1 h-[22px] px-2 mt-1.5 rounded-full text-[11.5px] font-semibold" :class="tone(r)">
          <AppIcon v-if="r.status === 'CONFIRMED'" name="check_circle" :size="14" />
          {{ r.status === 'CONFIRMED' ? t('community.card.confirmed', { n: r.pointsReward }) : r.status === 'NO_SHOW' ? t('community.status.NO_SHOW') : t('community.tickets.pending') }}
        </span>
      </span>
      <AppIcon name="qr_code_2" class="text-muted shrink-0" />
    </button>

    <AppSheet v-model:open="sheet" :title="t('community.ticket.title')">
      <RegistrationTicket v-if="open" :registration="open" />
    </AppSheet>
  </template>
</template>
