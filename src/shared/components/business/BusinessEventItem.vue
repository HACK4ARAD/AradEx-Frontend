<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppIcon } from '@/shared/components'
import { useFormat } from '@/shared/composables/useFormat'
import StatusPill from './StatusPill.vue'
import type { EventDto } from '@/shared/types/events'

/** Un eveniment în panoul firmei (web + mobil): poză, titlu, când, bilete, participanți, stare + Editează/Șterge. */
const props = defineProps<{ event: EventDto; actions?: boolean }>()
defineEmits<{ edit: []; remove: [] }>()
const { t } = useI18n()
const f = useFormat()

const tickets = computed(() => {
  const e = props.event
  if (e.ticketType === 'FREE') return t('business.events.free')
  if (e.ticketType === 'IN_APP') return `${f.money(e.priceFrom)} · ${t('business.events.inApp')}`
  return t('business.events.external')
})
</script>

<template>
  <div class="bg-white rounded-[16px] p-3.5 flex items-center gap-3.5">
    <div class="w-14 h-14 rounded-[12px] bg-soft bg-cover bg-center shrink-0 flex items-center justify-center" :style="event.imageUrl ? { backgroundImage: `url('${event.imageUrl}')` } : {}">
      <AppIcon v-if="!event.imageUrl" name="event" class="text-muted" />
    </div>
    <div class="min-w-0 flex-1">
      <b class="block text-[15px] leading-snug truncate">{{ event.title }}</b>
      <span class="block text-[13px] text-muted truncate">{{ f.dateTime(event.startAt) }} · {{ t(`business.eventCategory.${event.category}`) }}</span>
      <span class="block text-[13px] text-muted truncate">
        {{ tickets }}
        <template v-if="event.capacity"> · {{ t('business.events.spots', { left: event.spotsLeft ?? event.capacity, cap: event.capacity }) }}</template>
        <template v-else-if="event.participantsCount"> · {{ t('business.events.participants', { n: event.participantsCount }) }}</template>
        <template v-if="event.isHot"> · 🔥</template>
      </span>
    </div>
    <div class="flex flex-col items-end gap-2 shrink-0">
      <StatusPill :status="event.status" />
      <div v-if="actions" class="flex gap-1.5">
        <button type="button" class="w-9 h-9 rounded-full border border-line flex items-center justify-center" :aria-label="t('business.edit')" :title="t('business.edit')" @click="$emit('edit')"><AppIcon name="edit" :size="18" /></button>
        <button type="button" class="w-9 h-9 rounded-full border border-line flex items-center justify-center text-bad" :aria-label="t('business.delete')" :title="t('business.delete')" @click="$emit('remove')"><AppIcon name="delete" :size="18" /></button>
      </div>
    </div>
  </div>
</template>
