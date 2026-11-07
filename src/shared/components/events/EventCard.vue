<script setup lang="ts">
// T06 · cardul mare de eveniment din aplicație (S1, Salvate) — design/final `.evcard`.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import EventImage from './EventImage.vue'
import TicketBadge from './TicketBadge.vue'
import { useEventFormat } from '@/shared/composables/useEvents'
import type { EventSummary } from '@/shared/types/events'

const props = defineProps<{ event: EventSummary; to: string }>()
const emit = defineEmits<{ toggleSave: [] }>()
const { t } = useI18n()
const fmt = useEventFormat()
const live = computed(() => fmt.liveUntil(props.event))
const showPrice = computed(() => props.event.ticketType === 'IN_APP' || (props.event.ticketType === 'EXTERNAL' && !!props.event.priceFrom))
</script>

<template>
  <router-link :to="to" class="block w-full rounded-[22px] overflow-hidden bg-white border border-line shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_rgba(0,0,0,.05)] mb-3.5 no-underline text-ink">
    <EventImage :src="event.imageUrl" :category="event.category" class="h-[210px]">
      <div class="absolute top-3 left-3 flex gap-1.5">
        <span v-if="live" class="inline-flex items-center gap-[5px] text-[13px] font-semibold px-2.5 py-1 rounded-full bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,.12)]">
          <i class="w-2 h-2 rounded-full bg-accent" />{{ t('events.now', { time: live }) }}
        </span>
        <span v-else-if="event.isHot" class="inline-flex items-center gap-[5px] text-[13px] font-bold px-2.5 py-1 rounded-full bg-[#FFC43D] text-[#111]">🔥 {{ t('events.popular') }} · {{ fmt.hotLabel(event) }}</span>
      </div>
      <button type="button" class="absolute top-2.5 right-2.5 w-11 h-11 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center"
        :aria-label="event.saved ? t('events.saved') : t('events.save')" :aria-pressed="!!event.saved" @click.prevent.stop="emit('toggleSave')">
        <AppIcon :name="event.saved ? 'bookmark' : 'bookmark_border'" :fill="!!event.saved" />
      </button>
    </EventImage>
    <div class="px-4 pt-3.5 pb-4 flex flex-col gap-1">
      <div class="text-[14px] text-muted">{{ fmt.when(event) }}</div>
      <h3 class="text-[20px] leading-[1.2] tracking-[-0.02em] font-semibold m-0">{{ event.title }}</h3>
      <div class="text-[14px] text-muted">{{ event.locationName }}<template v-if="event.distanceKm != null"> · {{ fmt.km(event.distanceKm) }}</template></div>
      <div class="flex items-center gap-2 mt-2 flex-wrap">
        <TicketBadge :event="event" />
        <span v-if="showPrice" class="text-muted text-[14px]">{{ fmt.price(event) }}</span>
      </div>
    </div>
  </router-link>
</template>
