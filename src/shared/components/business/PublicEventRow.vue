<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import type { EventSummary } from '@/shared/types/events'

/** Eveniment pe pagina publică a firmei (mobil + web): dată, titlu, preț, 🔥; duce la detaliul evenimentului (T06). */
defineProps<{ event: EventSummary; to: string }>()
const { t } = useI18n()
const f = useFormat()
</script>

<template>
  <router-link :to="to" class="bg-white rounded-[16px] p-3.5 flex items-center gap-3.5 no-underline text-ink">
    <div class="w-14 h-14 rounded-[12px] bg-soft bg-cover bg-center shrink-0 flex items-center justify-center" :style="event.imageUrl ? { backgroundImage: `url('${event.imageUrl}')` } : {}">
      <AppIcon v-if="!event.imageUrl" name="event" class="text-muted" />
    </div>
    <div class="min-w-0 flex-1">
      <b class="block text-[15px] leading-snug">{{ event.title }}</b>
      <span class="block text-[13px] text-muted">
        {{ f.dateTime(event.startAt) }} · {{ event.ticketType === 'FREE' ? t('business.events.free') : f.money(event.priceFrom) }}
        <template v-if="event.isHot"> · 🔥 {{ t('business.events.participants', { n: event.participantsCount }) }}</template>
      </span>
    </div>
    <AppIcon name="chevron_right" class="text-muted shrink-0" />
  </router-link>
</template>
