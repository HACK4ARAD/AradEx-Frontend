<script setup lang="ts">
// T12 · S8: evenimentul recomandat sub răspunsul asistentului (design/final `.evrow` în chenar: poză, când, titlu, loc · preț) → S3.
import EventImage from '@/shared/components/events/EventImage.vue'
import { useEventFormat } from '@/shared/composables/useEvents'
import type { EventDto } from '@/shared/types/events'

defineProps<{ event: EventDto }>()
const fmt = useEventFormat()
</script>

<template>
  <router-link :to="`/events/${event.id}`"
    class="flex gap-3 w-full max-w-[92%] p-2.5 rounded-[18px] border border-line bg-white no-underline text-ink text-left">
    <EventImage :src="event.imageUrl" :category="event.category" :emoji-size="28" class="w-[72px] h-[72px] rounded-[14px] shrink-0 overflow-hidden" />
    <div class="flex-1 min-w-0">
      <div class="text-[13px] text-muted">{{ fmt.when(event) }}</div>
      <h3 class="text-[15.5px] leading-[1.25] my-0.5 font-semibold">{{ event.title }}</h3>
      <div class="text-[13px] text-muted truncate">{{ event.locationName }} · {{ fmt.price(event) }}</div>
    </div>
  </router-link>
</template>
