<script setup lang="ts">
// T06 · rândul compact din căutare (S2) — design/final `.evrow`.
import { useEventFormat } from '@/shared/composables/useEvents'
import EventImage from './EventImage.vue'
import TicketBadge from './TicketBadge.vue'
import type { EventSummary } from '@/shared/types/events'

defineProps<{ event: EventSummary; to: string }>()
const fmt = useEventFormat()
</script>

<template>
  <router-link :to="to" class="flex gap-3 w-full py-3 border-b border-line no-underline text-ink">
    <EventImage :src="event.imageUrl" :category="event.category" :emoji-size="28" class="w-[72px] h-[72px] rounded-[14px] shrink-0 overflow-hidden" />
    <div class="min-w-0 flex-1">
      <div class="text-[13px] text-muted">{{ fmt.when(event) }}</div>
      <h3 class="text-[15.5px] leading-[1.25] font-semibold my-0.5">{{ event.title }}</h3>
      <div class="text-muted text-[13px]">{{ event.locationName }}<template v-if="event.distanceKm != null"> · {{ fmt.km(event.distanceKm) }}</template></div>
      <div class="mt-1.5"><TicketBadge :event="event" /></div>
    </div>
  </router-link>
</template>
