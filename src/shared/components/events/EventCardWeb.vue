<script setup lang="ts">
// T06 · cardul din grid-urile web — design/final `.evc`. Pe site-ul de prezentare (landing, „Acum în Arad”) nu e link;
// în paginile pentru conturile personale (T23: W5 Evenimente, Contul meu › Salvate) primește `to` și, opțional, butonul de salvare.
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/shared/components/ui/AppIcon.vue'
import EventImage from './EventImage.vue'
import { useEventFormat } from '@/shared/composables/useEvents'
import type { EventSummary } from '@/shared/types/events'

const props = defineProps<{ event: EventSummary; small?: boolean; to?: string; saveable?: boolean }>()
const emit = defineEmits<{ toggleSave: [] }>()
const { t } = useI18n()
const fmt = useEventFormat()
const live = computed(() => fmt.liveUntil(props.event))
</script>

<template>
  <component :is="to ? RouterLink : 'article'" :to="to" class="block w-full rounded-[16px] overflow-hidden bg-white border border-line text-ink no-underline"
    :class="to ? 'transition-[transform,box-shadow] duration-150 hover:shadow-[0_8px_24px_rgba(0,0,0,.08)] hover:-translate-y-px' : ''">
    <EventImage :src="event.imageUrl" :category="event.category" :emoji-size="44" :class="small ? 'h-[120px]' : 'h-[150px]'">
      <div class="absolute left-2.5 top-2.5 flex gap-1.5">
        <span v-if="live" class="inline-flex items-center gap-1 text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-white">● {{ t('events.now', { time: live }) }}</span>
        <span v-else-if="event.isHot" class="inline-flex items-center gap-1 text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-[#FFC43D]">🔥 {{ fmt.hotLabel(event) }}</span>
        <span v-else-if="event.ticketType === 'FREE'" class="inline-flex items-center text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-ok-soft text-ok">{{ t('events.free') }}</span>
        <span v-else-if="event.ticketType === 'EXTERNAL'" class="inline-flex items-center text-[12px] font-semibold px-[9px] py-[3px] rounded-full bg-white">{{ t('events.badge.externalShort') }}</span>
      </div>
      <button v-if="saveable" type="button" class="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,.14)] flex items-center justify-center"
        :aria-label="event.saved ? t('events.saved') : t('events.save')" :aria-pressed="!!event.saved" @click.prevent.stop="emit('toggleSave')">
        <AppIcon :name="event.saved ? 'bookmark' : 'bookmark_border'" :fill="!!event.saved" :size="20" />
      </button>
    </EventImage>
    <div class="px-3.5 pt-3 pb-3.5">
      <b class="block text-[15px] leading-[1.3]">{{ event.title }}</b>
      <span class="block text-muted text-[12.5px] mt-[3px]">{{ fmt.when(event) }} · {{ event.locationName }}<template v-if="event.ticketType !== 'FREE'"> · {{ fmt.price(event) }}</template></span>
    </div>
  </component>
</template>
