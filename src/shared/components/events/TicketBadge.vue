<script setup lang="ts">
// T06 · eticheta de intrare de pe card (design/final ticketBadge): gratuit / extern / bilete în aplicație / epuizat / încheiat.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import type { EventDto, EventSummary } from '@/shared/types/events'

const props = defineProps<{ event: EventSummary & Partial<Pick<EventDto, 'capacity' | 'spotsLeft'>> }>()
const { t } = useI18n()
const past = computed(() => new Date(props.event.endAt ?? props.event.startAt).getTime() < Date.now())
const badge = computed(() => {
  const e = props.event
  if (past.value) return { cls: 'bg-soft', icon: '', text: t('events.badge.ended') }
  if (e.ticketType === 'FREE') return { cls: 'bg-soft', icon: 'event_available', text: e.capacity ? t('events.badge.freeRegistration') : t('events.badge.freeNoTicket') }
  if (e.ticketType === 'EXTERNAL') return { cls: 'border border-[#8C8C86]', icon: 'open_in_new', text: t('events.badge.external') }
  if (e.spotsLeft === 0) return { cls: 'bg-ink text-bg font-semibold', icon: '', text: t('events.badge.soldOut') }
  return { cls: 'bg-soft', icon: 'confirmation_number', text: t('events.badge.inApp') }
})
</script>

<template>
  <span class="inline-flex items-center gap-[5px] text-[13px] font-medium leading-[1.3] px-2.5 py-1 rounded-full" :class="badge.cls">
    <AppIcon v-if="badge.icon" :name="badge.icon" :size="16" />{{ badge.text }}
  </span>
</template>
