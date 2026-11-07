<script setup lang="ts">
// T06 · cardul din grid-urile web (W1, W5, Contul meu › Salvate) — design/final `.evc`.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import EventImage from './EventImage.vue'
import { useEventFormat } from '@/shared/composables/useEvents'
import type { EventSummary } from '@/shared/types/events'

const props = defineProps<{ event: EventSummary; small?: boolean }>()
const { t } = useI18n()
const fmt = useEventFormat()
const live = computed(() => fmt.liveUntil(props.event))
</script>

<template>
  <router-link :to="`/events/${event.id}`" class="block w-full rounded-[16px] overflow-hidden bg-white border border-line no-underline text-ink transition hover:shadow-[0_8px_24px_rgba(0,0,0,.08)] hover:-translate-y-px">
    <EventImage :src="event.imageUrl" :category="event.category" :emoji-size="44" :class="small ? 'h-[120px]' : 'h-[150px]'">
      <div class="absolute left-2.5 top-2.5 flex gap-1.5">
        <span v-if="live" class="inline-flex items-center gap-1 text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-white">● {{ t('events.now', { time: live }) }}</span>
        <span v-else-if="event.isHot" class="inline-flex items-center gap-1 text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-[#FFC43D]">🔥 {{ fmt.hotLabel(event) }}</span>
        <span v-else-if="event.ticketType === 'FREE'" class="inline-flex items-center text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-ok-soft text-ok">{{ t('events.free') }}</span>
        <span v-else-if="event.ticketType === 'EXTERNAL'" class="inline-flex items-center text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-white">{{ t('events.badge.externalShort') }}</span>
      </div>
    </EventImage>
    <div class="px-3.5 pt-3 pb-3.5">
      <b class="block text-[15px] leading-[1.3]">{{ event.title }}</b>
      <span class="block text-muted text-[12.5px] mt-[3px]">{{ fmt.when(event) }} · {{ event.locationName }}<template v-if="event.ticketType !== 'FREE'"> · {{ fmt.price(event) }}</template></span>
    </div>
  </router-link>
</template>
